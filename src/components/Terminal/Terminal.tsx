'use client';

import React, { useEffect, useRef } from 'react';

// Dynamic import component for xterm to avoid SSR issues
const TerminalComponent = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadTerminal = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Terminal } = await import('@xterm/xterm');
        const { FitAddon } = await import('@xterm/addon-fit');
        
        if (!mounted || !terminalRef.current) return;

        // Initialize terminal
        xtermRef.current = new Terminal({
          cursorBlink: true,
          theme: {
            background: '#1a1a1a',
            foreground: '#ffffff',
            cursor: '#ffffff'
          }
        });

        fitAddonRef.current = new FitAddon();
        xtermRef.current.loadAddon(fitAddonRef.current);
        xtermRef.current.open(terminalRef.current);
        fitAddonRef.current.fit();

        // Check if electronAPI is available
        if (typeof window !== 'undefined' && window.electronAPI) {
          // Spawn PTY
          window.electronAPI.spawnPty({ 
            cols: xtermRef.current.cols, 
            rows: xtermRef.current.rows 
          });

          // Handle data from PTY
          window.electronAPI.onPtyData((data: string) => {
            if (xtermRef.current) {
              xtermRef.current.write(data);
            }
          });

          // Send user input to PTY
          xtermRef.current.onData((data: string) => {
            if (window.electronAPI) {
              window.electronAPI.sendPtyInput(data);
            }
          });

          // Handle resize
          const resizeObserver = new ResizeObserver(() => {
            if (fitAddonRef.current && xtermRef.current && window.electronAPI) {
              fitAddonRef.current.fit();
              window.electronAPI.resizePty({ 
                cols: xtermRef.current.cols, 
                rows: xtermRef.current.rows 
              });
            }
          });

          if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
          }

          // Handle PTY exit
          window.electronAPI.onPtyExit(() => {
            if (xtermRef.current) {
              xtermRef.current.write('\r\n\r\nTerminal session ended.\r\n');
            }
          });

          // Cleanup function
          return () => {
            resizeObserver.disconnect();
            if (xtermRef.current) {
              xtermRef.current.dispose();
            }
            // Clean up IPC listeners
            if (window.electronAPI && window.electronAPI.removeAllListeners) {
              window.electronAPI.removeAllListeners('pty:data');
              window.electronAPI.removeAllListeners('pty:exit');
            }
          };
        } else {
          // Fallback for web-only mode
          if (xtermRef.current) {
            xtermRef.current.write('Terminal not available in web mode.\r\n');
          }
        }

      } catch (error) {
        console.error('Failed to load terminal:', error);
        if (terminalRef.current) {
          terminalRef.current.innerHTML = `
            <div style="color: red; padding: 20px;">
              Failed to load terminal: ${error instanceof Error ? error.message : 'Unknown error'}
            </div>
          `;
        }
      }
    };

    loadTerminal();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div 
      ref={terminalRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: '#1a1a1a'
      }} 
    />
  );
};

export default TerminalComponent; 