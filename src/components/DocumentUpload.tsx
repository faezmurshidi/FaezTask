'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { electronAPI } from '@/lib/electronAPI';

interface DocumentUploadProps {
  projectPath: string;
  onUploadComplete: () => void;
  onClose: () => void;
}

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'converting' | 'success' | 'error';
  progress: number;
  error?: string;
  convertedName?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ projectPath, onUploadComplete, onClose }) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  // Supported file types
  const supportedTypes = {
    'text/markdown': ['.md', '.markdown'],
    'text/plain': ['.txt'],
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
    'text/html': ['.html', '.htm'],
    'application/rtf': ['.rtf']
  };

  const getAllowedExtensions = () => {
    return Object.values(supportedTypes).flat();
  };

  const isFileSupported = (file: File) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return getAllowedExtensions().includes(extension);
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setIsDragActive(false);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejectedNames = rejectedFiles.map(f => f.file.name).join(', ');
      alert(`Some files were rejected: ${rejectedNames}. Please upload supported file types.`);
    }

    // Process accepted files
    const newUploadFiles: UploadFile[] = acceptedFiles
      .filter(isFileSupported)
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: 'pending',
        progress: 0
      }));

    if (newUploadFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...newUploadFiles]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: supportedTypes,
    multiple: true,
    maxSize: 50 * 1024 * 1024 // 50MB max file size
  });

  const uploadFile = async (uploadFile: UploadFile) => {
    const { id, file } = uploadFile;
    
    try {
      // Update status to uploading
      setUploadFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'uploading', progress: 10 } : f
      ));

      // Determine if conversion is needed
      const isMarkdown = file.type === 'text/markdown' || 
                        file.name.endsWith('.md') || 
                        file.name.endsWith('.markdown');

      let finalFileName = file.name;
      let finalContent = '';

      if (isMarkdown) {
        // Direct markdown upload
        finalContent = await file.text();
        setUploadFiles(prev => prev.map(f => 
          f.id === id ? { ...f, progress: 70 } : f
        ));
      } else {
        // Need conversion - update status
        setUploadFiles(prev => prev.map(f => 
          f.id === id ? { ...f, status: 'converting', progress: 40 } : f
        ));

        // Use the document converter for all non-markdown files
        try {
          // Create temporary file for conversion
          const tempDir = `${projectPath}/.taskmaster/temp`;
          await electronAPI.createDirectory(tempDir);
          
          const tempFilePath = `${tempDir}/${file.name}`;
          
          // Handle different file types
          if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            // Text files - write directly
            const textContent = await file.text();
            await electronAPI.writeFile(tempFilePath, textContent);
          } else {
            // Binary files (PDF, DOCX) - convert to base64 and write
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const base64 = btoa(String.fromCharCode(...uint8Array));
            
            // Write as binary using a new handler
            const result = await electronAPI.writeBinaryFile(tempFilePath, base64);
            if (!result.success) {
              throw new Error('Failed to write temporary file');
            }
          }

          setUploadFiles(prev => prev.map(f => 
            f.id === id ? { ...f, progress: 50 } : f
          ));

          // Convert document using the document converter
          const conversionResult = await electronAPI.convertDocument(tempFilePath, `${projectPath}/.taskmaster/docs`);
          
          if (!conversionResult.success) {
            throw new Error(`Conversion failed: ${conversionResult.error}`);
          }

          // Clean up temp file
          await electronAPI.deleteFile(tempFilePath);
          
          // Read the converted content to get the final result
          const convertedContent = await electronAPI.readFile(conversionResult.outputPath!);
          if (convertedContent.success) {
            finalContent = convertedContent.content!;
            finalFileName = conversionResult.outputPath!.split('/').pop() || file.name.replace(/\.[^.]+$/, '.md');
          } else {
            throw new Error('Failed to read converted file');
          }
          
        } catch (conversionError) {
          console.warn('Document conversion failed, using fallback:', conversionError);
          
          // Fallback for unsupported files or conversion errors
          if (file.type === 'text/plain') {
            finalContent = await file.text();
            finalFileName = file.name.replace(/\.(txt)$/i, '.md');
          } else {
            finalContent = `# ${file.name}

This document was uploaded but could not be automatically converted to markdown.

**Original filename:** ${file.name}
**File type:** ${file.type}
**File size:** ${(file.size / 1024).toFixed(1)} KB
**Upload date:** ${new Date().toLocaleString()}
**Conversion error:** ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}

> **Note:** You may need to manually convert this document to markdown format.
`;
            finalFileName = file.name.replace(/\.[^.]+$/, '.md');
          }
        }

        setUploadFiles(prev => prev.map(f => 
          f.id === id ? { ...f, progress: 60, convertedName: finalFileName } : f
        ));
      }

      // Save to .taskmaster/docs
      const docsPath = `${projectPath}/.taskmaster/docs`;
      const filePath = `${docsPath}/${finalFileName}`;

      setUploadFiles(prev => prev.map(f => 
        f.id === id ? { ...f, progress: 80 } : f
      ));

      // Write file
      const result = await electronAPI.writeFile(filePath, finalContent);
      
      if (result.success) {
        setUploadFiles(prev => prev.map(f => 
          f.id === id ? { ...f, status: 'success', progress: 100 } : f
        ));
      } else {
        throw new Error(result.error || 'Failed to save file');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadFiles(prev => prev.map(f => 
        f.id === id ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : f
      ));
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    
    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    // Check if all uploads completed successfully
    const allCompleted = uploadFiles.every(f => f.status === 'success' || f.status === 'error');
    const hasSuccessful = uploadFiles.some(f => f.status === 'success');
    
    if (allCompleted && hasSuccessful) {
      setTimeout(() => {
        onUploadComplete();
        onClose();
      }, 1000);
    }
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setUploadFiles([]);
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'uploading':
      case 'converting':
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = (file: UploadFile) => {
    switch (file.status) {
      case 'pending':
        return 'Ready to upload';
      case 'uploading':
        return 'Uploading...';
      case 'converting':
        return 'Converting to markdown...';
      case 'success':
        return file.convertedName ? `Saved as ${file.convertedName}` : 'Upload complete';
      case 'error':
        return file.error || 'Upload failed';
      default:
        return '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const pendingCount = uploadFiles.filter(f => f.status === 'pending').length;
  const successCount = uploadFiles.filter(f => f.status === 'success').length;
  const errorCount = uploadFiles.filter(f => f.status === 'error').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-6 flex-1 overflow-y-auto">
          {uploadFiles.length === 0 ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragActive || dropzoneActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg text-gray-600 mb-2">
                {isDragActive || dropzoneActive ? 'Drop files here...' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              
              <div className="text-xs text-gray-400">
                <p className="mb-2">Supported formats:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {getAllowedExtensions().map(ext => (
                    <span key={ext} className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {ext}
                    </span>
                  ))}
                </div>
                <p className="mt-2">Maximum file size: 50MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uploadFiles.map((file) => (
                  <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {getStatusIcon(file.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.file.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.file.size)}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className={`text-xs ${
                          file.status === 'error' ? 'text-red-600' : 
                          file.status === 'success' ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {getStatusText(file)}
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      {(file.status === 'uploading' || file.status === 'converting') && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {file.status === 'pending' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add More Files */}
              <div
                {...getRootProps()}
                className="border border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                <input {...getInputProps()} />
                <p className="text-sm text-gray-600">
                  + Add more files
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {uploadFiles.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                {pendingCount > 0 && <span>{pendingCount} pending</span>}
                {successCount > 0 && <span className="text-green-600 ml-2">{successCount} uploaded</span>}
                {errorCount > 0 && <span className="text-red-600 ml-2">{errorCount} failed</span>}
              </div>
              
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={uploadAllFiles}
                disabled={pendingCount === 0}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  pendingCount > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Upload {pendingCount > 0 ? `${pendingCount} File${pendingCount > 1 ? 's' : ''}` : 'Files'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload; 