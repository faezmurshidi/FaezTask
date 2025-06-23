'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { electronAPI } from '@/lib/electronAPI';
import DocumentUpload from './DocumentUpload';
import { useToast } from '@/components/Toast';

// Import highlight.js CSS for syntax highlighting
import 'highlight.js/styles/github.css';

interface Document {
  id: string;
  name: string;
  path: string;
  type: 'markdown' | 'folder';
  size: number;
  lastModified: Date;
  content?: string;
}

interface FileEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  mtime: string;
  path: string;
}

interface KnowledgeBaseProps {
  projectPath: string;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ projectPath }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [renameDocument, setRenameDocument] = useState<Document | null>(null);
  const [newDocumentName, setNewDocumentName] = useState('');
  
  const { showToast } = useToast();

  // Load documents from .taskmaster/docs
  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      if (electronAPI.isElectron()) {
        const docsPath = `${projectPath}/.taskmaster/docs`;
        
        // Check if docs directory exists, create if it doesn't
        const dirExists = await electronAPI.pathExists(docsPath);
        if (!dirExists) {
          await electronAPI.createDirectory(docsPath);
          setDocuments([]);
          return;
        }

        // Read directory contents
        const result = await electronAPI.readDirectory(docsPath);
        if (!result.success) {
          throw new Error(result.error || 'Failed to read documents directory');
        }

        // Process files and create document objects
        const docs: Document[] = [];
        for (const item of result.files || []) {
          if (item.isDirectory) {
            docs.push({
              id: item.name,
              name: item.name,
              path: `${docsPath}/${item.name}`,
              type: 'folder',
              size: 0,
              lastModified: new Date(item.mtime || Date.now())
            });
          } else if (item.name.endsWith('.md') || item.name.endsWith('.markdown')) {
            const doc: Document = {
              id: item.name,
              name: item.name,
              path: `${docsPath}/${item.name}`,
              type: 'markdown',
              size: item.size || 0,
              lastModified: new Date(item.mtime || Date.now())
            };
            
            // Load content for search functionality (async, don't block UI)
            electronAPI.readFile(doc.path).then(contentResult => {
              if (contentResult.success && contentResult.content) {
                doc.content = contentResult.content;
                // Update documents state with content
                setDocuments(prevDocs => 
                  prevDocs.map(d => d.id === doc.id ? { ...d, content: contentResult.content } : d)
                );
              }
            }).catch(err => {
              console.warn(`Failed to preload content for ${doc.name}:`, err);
            });
            
            docs.push(doc);
          }
        }

        setDocuments(docs.sort((a, b) => {
          // Folders first, then files, then by name
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        }));
        
        // Show success toast if documents were loaded
        if (docs.length > 0) {
          showToast({
            type: 'success',
            title: `Loaded ${docs.length} document${docs.length === 1 ? '' : 's'}`
          });
        }
      } else {
        const errorMsg = 'Knowledge Base requires Electron environment to access local files';
        setError(errorMsg);
        showToast({
          type: 'error',
          title: 'Environment Error',
          message: errorMsg
        });
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMsg);
      showToast({
        type: 'error',
        title: 'Loading Error',
        message: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  // Load document content
  const loadDocumentContent = async (document: Document) => {
    if (document.type === 'folder') return;

    try {
      const result = await electronAPI.readFile(document.path);
      if (result.success && result.content) {
        setSelectedDocument({
          ...document,
          content: result.content
        });
        setError(null); // Clear any previous errors
      } else {
        const errorMsg = `Failed to load document: ${document.name}`;
        setError(errorMsg);
        showToast({
          type: 'error',
          title: 'Document Load Error',
          message: errorMsg
        });
      }
    } catch (err) {
      console.error('Error loading document content:', err);
      const errorMsg = `Error reading document: ${document.name}`;
      setError(errorMsg);
      showToast({
        type: 'error',
        title: 'File Read Error',
        message: errorMsg
      });
    }
  };

  // Enhanced search functionality - searches both filename and content
  const filteredDocuments = documents.filter(doc => {
    const query = searchQuery.toLowerCase();
    
    // Search in filename
    if (doc.name.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in content if available
    if (doc.content && doc.content.toLowerCase().includes(query)) {
      return true;
    }
    
    return false;
  });

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Document management handlers
  const handleRenameDocument = (doc: Document) => {
    setRenameDocument(doc);
    setNewDocumentName(doc.name.replace(/\.md$/, ''));
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      if (electronAPI.isElectron()) {
        // Delete the file
        const result = await electronAPI.deleteFile(doc.path);
        if (result.success) {
          // Remove from state
          setDocuments(prev => prev.filter(d => d.id !== doc.id));
          
          // Clear selected document if it was the deleted one
          if (selectedDocument?.id === doc.id) {
            setSelectedDocument(null);
          }
          
          showToast({
            type: 'success',
            title: 'Document Deleted',
            message: `"${doc.name}" has been successfully deleted`
          });
        } else {
          const errorMsg = `Failed to delete document: ${result.error}`;
          setError(errorMsg);
          showToast({
            type: 'error',
            title: 'Delete Failed',
            message: errorMsg
          });
        }
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      const errorMsg = `Error deleting document: ${doc.name}`;
      setError(errorMsg);
      showToast({
        type: 'error',
        title: 'Delete Error',
        message: errorMsg
      });
    }
  };

  const handleConfirmRename = async () => {
    if (!renameDocument || !newDocumentName.trim()) return;

    const newFileName = newDocumentName.endsWith('.md') ? newDocumentName : `${newDocumentName}.md`;
    const newPath = renameDocument.path.replace(renameDocument.name, newFileName);

    try {
      if (electronAPI.isElectron()) {
        // Rename the file
        const result = await electronAPI.renameFile(renameDocument.path, newPath);
        if (result.success) {
          // Update state
          const updatedDoc = {
            ...renameDocument,
            name: newFileName,
            path: newPath,
            id: newFileName
          };
          
          setDocuments(prev => prev.map(d => d.id === renameDocument.id ? updatedDoc : d));
          
          // Update selected document if it was the renamed one
          if (selectedDocument?.id === renameDocument.id) {
            setSelectedDocument(updatedDoc);
          }
          
          setRenameDocument(null);
          setNewDocumentName('');
          
          showToast({
            type: 'success',
            title: 'Document Renamed',
            message: `"${renameDocument.name}" renamed to "${newFileName}"`
          });
        } else {
          const errorMsg = `Failed to rename document: ${result.error}`;
          setError(errorMsg);
          showToast({
            type: 'error',
            title: 'Rename Failed',
            message: errorMsg
          });
        }
      }
    } catch (err) {
      console.error('Error renaming document:', err);
      const errorMsg = `Error renaming document: ${renameDocument.name}`;
      setError(errorMsg);
      showToast({
        type: 'error',
        title: 'Rename Error',
        message: errorMsg
      });
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [projectPath]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">Error Loading Knowledge Base</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
          <button
            onClick={loadDocuments}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar - Document List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📚 Knowledge Base</h2>
            <button
              onClick={() => setShowUpload(true)}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search documents and content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {searchQuery && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <span className="text-xs text-gray-400 bg-white px-1">
                  {filteredDocuments.length} found
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto">
          {filteredDocuments.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No documents match your search' : 'No documents found'}
              <div className="mt-2 text-sm text-gray-400">
                Upload documents to get started
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => doc.type === 'markdown' && loadDocumentContent(doc)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDocument?.id === doc.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {doc.type === 'folder' ? (
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(doc.size)}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(doc.lastModified)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Document Actions */}
                    {doc.type === 'markdown' && (
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameDocument(doc);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Rename document"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete document"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Document Viewer */}
      <div className="flex-1 flex flex-col">
        {selectedDocument ? (
          <>
            {/* Document Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedDocument.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatFileSize(selectedDocument.size)} • Modified {formatDate(selectedDocument.lastModified)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="p-6 max-w-4xl mx-auto">
                {selectedDocument.content ? (
                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        // Custom components for better styling
                        h1: ({ children }) => (
                          <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-gray-700 mb-4 leading-relaxed">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-gray-700 leading-relaxed">
                            {children}
                          </li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children, className, ...props }: any) => {
                          const inline = !className?.includes('language-');
                          return inline ? (
                            <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => (
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                            {children}
                          </pre>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border border-gray-300">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left font-semibold text-gray-900">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-gray-300 px-4 py-2 text-gray-700">
                            {children}
                          </td>
                        ),
                        a: ({ children, href }) => (
                          <a 
                            href={href} 
                            className="text-blue-600 hover:text-blue-800 underline"
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {selectedDocument.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Loading document content...</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Knowledge Base</h3>
              <p className="text-gray-500 mb-4">Select a document from the sidebar to view its content</p>
              <button
                onClick={() => setShowUpload(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Upload Your First Document
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <DocumentUpload
          projectPath={projectPath}
          onUploadComplete={() => {
            loadDocuments();
            setShowUpload(false);
            showToast({
              type: 'success',
              title: 'Upload Complete',
              message: 'Documents have been successfully uploaded'
            });
          }}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* Rename Document Modal */}
      {renameDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rename Document
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Name
              </label>
              <input
                type="text"
                value={newDocumentName}
                onChange={(e) => setNewDocumentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new document name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmRename();
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                .md extension will be added automatically if not provided
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRenameDocument(null);
                  setNewDocumentName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRename}
                disabled={!newDocumentName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase; 