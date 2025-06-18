'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SimpleTerminalProps {
  cwd?: string;
  className?: string;
  onClose?: () => void;
}

const SimpleTerminal: React.FC<SimpleTerminalProps> = ({
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
  const cleanupCallbacks = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Set client-side flag
    setIsClient(true);
  }, []);

  useEffect(() => {
    const initTerminal = async () => {
      if (!isClient || !terminalRef.current || xtermRef.current) return;

      try {
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

        // Note: xterm CSS will be loaded via global styles in _app.tsx or layout.tsx

        // Create xterm instance with proper configuration
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
          fontFamily: '"Cascadia Code", "Consolas", "Monaco", monospace',
          fontSize: 14,
          cursorBlink: true,
          convertEol: true,
          scrollback: 1000,
          // Critical settings for proper shell integration
          allowProposedApi: true,
          allowTransparency: false,
          altClickMovesCursor: true,
          macOptionIsMeta: true,
          rightClickSelectsWord: false,
          windowsMode: false
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

        // Try to create backend terminal
        const electronAPI = (window as any).electronAPI;
        console.log('ElectronAPI available:', !!electronAPI);
        console.log('Terminal API available:', !!electronAPI?.terminal);
        
        if (electronAPI?.terminal) {
          console.log('Creating terminal with options:', { cwd: cwd || process.cwd(), cols: 80, rows: 24 });
          const result = await electronAPI.terminal.create({
            cwd: cwd || process.cwd(),
            cols: 80,
            rows: 24
          });
          
          console.log('Terminal creation result:', result);

          if (result.success && result.terminalId) {
            setTerminalId(result.terminalId);
            setIsConnected(true);
            console.log('Terminal created successfully with ID:', result.terminalId);

            // Handle input
            const inputHandler = xterm.onData((data: string) => {
              console.log('Sending input to terminal:', data.charCodeAt(0), data);
              electronAPI.terminal.sendInput(result.terminalId, data);
            });
            cleanupCallbacks.current.push(() => inputHandler.dispose());

            // Handle output
            console.log('Setting up output listener for terminal:', result.terminalId);
            const outputCleanup = electronAPI.terminal.onOutput(result.terminalId, (data: string) => {
              console.log('✅ FRONTEND: Received output from terminal:', result.terminalId, 'Data:', JSON.stringify(data));
              xterm.write(data);
            });
            cleanupCallbacks.current.push(outputCleanup);
            console.log('Output listener setup complete for terminal:', result.terminalId);

            // Handle exit
            const exitCleanup = electronAPI.terminal.onExit(result.terminalId, (code: number) => {
              console.log('Terminal exited with code:', code);
              xterm.write(`\r\n\x1b[31mProcess exited with code ${code}\x1b[0m\r\n`);
              setIsConnected(false);
            });
            cleanupCallbacks.current.push(exitCleanup);

            // Handle resize
            const handleResize = () => {
              fitAddon.fit();
              const dims = fitAddon.proposeDimensions();
              if (dims) {
                console.log('Resizing terminal to:', dims);
                electronAPI.terminal.resize(result.terminalId, dims.cols, dims.rows);
              }
            };

            window.addEventListener('resize', handleResize);
            cleanupCallbacks.current.push(() => window.removeEventListener('resize', handleResize));

            xterm.write('\x1b[32mTerminal connected successfully!\x1b[0m\r\n');
            console.log('Terminal setup completed');
          } else {
            console.error('Terminal creation failed:', result);
            xterm.write('\x1b[31mFailed to create terminal backend\x1b[0m\r\n');
          }
        } else {
          console.warn('Terminal API not available');
          xterm.write('\x1b[33mTerminal API not available (running in browser mode)\x1b[0m\r\n');
        }
      } catch (error) {
        console.error('Terminal initialization error:', error);
        if (xtermRef.current) {
          xtermRef.current.write('\x1b[31mTerminal initialization failed\x1b[0m\r\n');
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

  // Show loading state while hydrating
  if (!isClient) {
    return (
      <div className={`terminal-container border border-gray-600 rounded-lg overflow-hidden ${className}`}>
        <div className="terminal-header bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Terminal</span>
            <div className="w-2 h-2 rounded-full bg-yellow-400" title="Loading" />
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
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} 
               title={isConnected ? 'Connected' : 'Disconnected'} />
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
          title="Close Terminal"
        >
          ×
        </button>
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

export default SimpleTerminal; 