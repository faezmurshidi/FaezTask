'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ImprovedTerminalProps {
  cwd?: string;
  className?: string;
  onClose?: () => void;
}

const ImprovedTerminal: React.FC<ImprovedTerminalProps> = ({
  cwd,
  className = '',
  onClose
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any | null>(null);
  const fitAddonRef = useRef<any | null>(null);
  const [terminalId, setTerminalId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const cleanupCallbacks = useRef<(() => void)[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const initTerminal = async () => {
      if (!isClient || !terminalRef.current || xtermRef.current) return;

      try {
        setStatus('loading');
        setError(null);

        // Dynamic imports to avoid SSR issues
        const [
          { Terminal: XTerm },
          { FitAddon },
          { WebLinksAddon }
        ] = await Promise.all([
          import('@xterm/xterm'),
          import('@xterm/addon-fit'),
          import('@xterm/addon-web-links')
        ]);

        // Create xterm instance with enhanced configuration
        const xterm = new XTerm({
          theme: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            cursor: '#d4d4d4',
            black: '#000000',
            red: '#cd3131',
            green: '#0dbc79',
            yellow: '#e5e510',
            blue: '#2472c8',
            magenta: '#bc3fbc',
            cyan: '#11a8cd',
            white: '#e5e5e5',
            brightBlack: '#666666',
            brightRed: '#f14c4c',
            brightGreen: '#23d18b',
            brightYellow: '#f5f543',
            brightBlue: '#3b8eea',
            brightMagenta: '#d670d6',
            brightCyan: '#29b8db',
            brightWhite: '#e5e5e5'
          },
          fontFamily: '"Cascadia Code", "Consolas", "Monaco", "SF Mono", monospace',
          fontSize: 14,
          fontWeight: 'normal',
          fontWeightBold: 'bold',
          lineHeight: 1.2,
          cursorBlink: true,
          cursorStyle: 'block',
          convertEol: true,
          scrollback: 10000,
          allowProposedApi: true,
          allowTransparency: false,
          altClickMovesCursor: true,
          macOptionIsMeta: true,
          rightClickSelectsWord: true,
          windowsMode: false,
          smoothScrollDuration: 0,
          scrollSensitivity: 3,
          tabStopWidth: 4
        });

        // Add addons
        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        xterm.loadAddon(fitAddon);
        xterm.loadAddon(webLinksAddon);

        // Open terminal
        xterm.open(terminalRef.current);
        fitAddon.fit();

        // Store references
        xtermRef.current = xterm;
        fitAddonRef.current = fitAddon;

        // Check for Electron API
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI?.terminal) {
          throw new Error('Terminal API not available');
        }

        // Create backend terminal with node-pty
        const dims = fitAddon.proposeDimensions();
        const result = await electronAPI.terminal.create({
          cwd: cwd || process.cwd(),
          cols: dims?.cols || 80,
          rows: dims?.rows || 24
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create terminal');
        }

        setTerminalId(result.terminalId);
        
        // Setup listeners
        await electronAPI.terminal.setupListeners(result.terminalId);

        // Handle input from xterm
        const inputHandler = xterm.onData((data: string) => {
          electronAPI.terminal.sendInput(result.terminalId, data);
        });
        cleanupCallbacks.current.push(() => inputHandler.dispose());

        // Handle output from backend
        const outputCleanup = electronAPI.terminal.onOutput(result.terminalId, (data: string) => {
          xterm.write(data);
        });
        cleanupCallbacks.current.push(outputCleanup);

        // Handle terminal exit
        const exitCleanup = electronAPI.terminal.onExit(result.terminalId, (code: number, signal: string) => {
          xterm.write(`\r\n\x1b[31mProcess exited with code ${code}\x1b[0m\r\n`);
          setIsConnected(false);
          setStatus('disconnected');
        });
        cleanupCallbacks.current.push(exitCleanup);

        // Handle resize
        const handleResize = async () => {
          if (!fitAddon || !result.terminalId) return;
          
          fitAddon.fit();
          const dims = fitAddon.proposeDimensions();
          if (dims) {
            await electronAPI.terminal.resize(result.terminalId, dims.cols, dims.rows);
          }
        };

        // Setup resize observer for container
        const resizeObserver = new ResizeObserver(() => {
          handleResize();
        });
        
        if (terminalRef.current) {
          resizeObserver.observe(terminalRef.current);
        }
        
        cleanupCallbacks.current.push(() => resizeObserver.disconnect());

        // Also handle window resize
        window.addEventListener('resize', handleResize);
        cleanupCallbacks.current.push(() => window.removeEventListener('resize', handleResize));

        // Set connected state
        setIsConnected(true);
        setStatus('connected');
        
        // Welcome message
        xterm.write('\x1b[32mTerminal connected successfully!\x1b[0m\r\n');

      } catch (error) {
        console.error('Terminal initialization error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setStatus('error');
        
        if (xtermRef.current) {
          xtermRef.current.write('\x1b[31mTerminal initialization failed: ' + 
            (error instanceof Error ? error.message : 'Unknown error') + '\x1b[0m\r\n');
        }
      }
    };

    initTerminal();

    return () => {
      // Cleanup
      cleanupCallbacks.current.forEach(cleanup => cleanup());
      cleanupCallbacks.current = [];
      
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }

      // Close backend terminal
      if (terminalId && (window as any).electronAPI?.terminal) {
        (window as any).electronAPI.terminal.close(terminalId);
      }
    };
  }, [cwd, isClient]);

  const handleClose = async () => {
    if (terminalId && (window as any).electronAPI?.terminal) {
      await (window as any).electronAPI.terminal.close(terminalId);
    }
    onClose?.();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-400';
      case 'loading': return 'bg-yellow-400';
      case 'disconnected': return 'bg-red-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'loading': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  // Show loading state while hydrating
  if (!isClient) {
    return (
      <div className={`terminal-container border border-gray-600 rounded-lg overflow-hidden ${className}`}>
        <div className="terminal-header bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Terminal</span>
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" title="Loading" />
          </div>
        </div>
        <div className="terminal-content flex items-center justify-center" style={{ height: '400px', backgroundColor: '#1e1e1e' }}>
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Initializing Terminal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`terminal-container border border-gray-600 rounded-lg overflow-hidden ${className}`}>
      <div className="terminal-header bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Terminal</span>
          {terminalId && (
            <span className="text-xs text-gray-400">#{terminalId}</span>
          )}
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} 
               title={getStatusText()} />
          {status === 'loading' && (
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-400" title={error}>
              ⚠️
            </span>
          )}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
            title="Close Terminal"
          >
            ×
          </button>
        </div>
      </div>
      <div
        ref={terminalRef}
        className="terminal-content"
        style={{ 
          height: '400px',
          backgroundColor: '#1e1e1e'
        }}
      />
    </div>
  );
};

export default ImprovedTerminal;