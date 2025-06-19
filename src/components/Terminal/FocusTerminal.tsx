'use client';

import React, { useEffect, useRef, useState } from 'react';

interface FocusTerminalProps {
  cwd?: string;
  className?: string;
}

// Beautiful ASCII welcome message for Claude Code terminal
const displayWelcomeMessage = (xterm: any) => {
  const messages = [
    '\x1b[2J\x1b[H', // Clear screen and move cursor to top
    '',
    '\x1b[36m╭─────────────────────────────────────────────────────────────────────────────╮\x1b[0m',
    '\x1b[36m│\x1b[0m                                                                         \x1b[36m│\x1b[0m',
    '\x1b[36m│\x1b[0m  \x1b[38;5;39m██████\x1b[0m  \x1b[38;5;75m██\x1b[0m       \x1b[38;5;111m█████\x1b[0m  \x1b[38;5;147m██\x1b[0m   \x1b[38;5;183m██\x1b[0m \x1b[38;5;219m██████\x1b[0m  \x1b[38;5;255m███████\x1b[0m                     \x1b[36m│\x1b[0m',
    '\x1b[36m│\x1b[0m \x1b[38;5;39m██\x1b[0m      \x1b[38;5;75m██\x1b[0m      \x1b[38;5;111m██\x1b[0m   \x1b[38;5;147m██\x1b[0m \x1b[38;5;183m██\x1b[0m   \x1b[38;5;219m██\x1b[0m \x1b[38;5;255m██\x1b[0m   \x1b[38;5;39m██\x1b[0m \x1b[38;5;75m██\x1b[0m                          \x1b[36m│\x1b[0m',
    '\x1b[36m│\x1b[0m \x1b[38;5;39m██\x1b[0m      \x1b[38;5;75m██\x1b[0m      \x1b[38;5;111m██████\x1b[0m  \x1b[38;5;147m██\x1b[0m   \x1b[38;5;183m██\x1b[0m \x1b[38;5;219m██\x1b[0m   \x1b[38;5;255m██\x1b[0m \x1b[38;5;39m█████\x1b[0m                       \x1b[36m│\x1b[0m',
    '\x1b[36m│\x1b[0m \x1b[38;5;39m██\x1b[0m      \x1b[38;5;75m██\x1b[0m      \x1b[38;5;111m██\x1b[0m   \x1b[38;5;147m██\x1b[0m \x1b[38;5;183m██\x1b[0m   \x1b[38;5;219m██\x1b[0m \x1b[38;5;255m██\x1b[0m   \x1b[38;5;39m██\x1b[0m \x1b[38;5;75m██\x1b[0m                          \x1b[36m│\x1b[0m',
    '\x1b[36m│\x1b[0m  \x1b[38;5;39m██████\x1b[0m  \x1b[38;5;75m███████\x1b[0m \x1b[38;5;111m██\x1b[0m   \x1b[38;5;147m██\x1b[0m  \x1b[38;5;183m█████\x1b[0m  \x1b[38;5;219m██████\x1b[0m  \x1b[38;5;255m███████\x1b[0m                     \x1b[36m│\x1b[0m',
    '\x1b[36m│\x1b[0m                                                                         \x1b[36m│\x1b[0m',
    '\x1b[36m│\x1b[0m                   \x1b[38;5;226m🤖 AI-Powered Development Terminal\x1b[0m                    \x1b[36m│\x1b[0m',
    '\x1b[36m│\x1b[0m                                                                         \x1b[36m│\x1b[0m',
    '\x1b[36m╰─────────────────────────────────────────────────────────────────────────────╯\x1b[0m',
    '',
    '\x1b[32m🚀 Welcome to Claude Code Terminal!\x1b[0m',
    '\x1b[90mThis terminal is integrated with Task-Master CLI for AI-powered project management.\x1b[0m',
    '',
    '\x1b[33m╭─ Task-Master Integration ─────────────────────────────────────────────────────╮\x1b[0m',
    '\x1b[33m│\x1b[0m \x1b[36mQuick Start Commands:\x1b[0m                                                     \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m                                                                           \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m   \x1b[32mtm list\x1b[0m              - List all tasks in current project              \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m   \x1b[32mtm next\x1b[0m              - Show next recommended task to work on          \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m   \x1b[32mtm show <id>\x1b[0m         - Display detailed task information              \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m   \x1b[32mtm set-status\x1b[0m        - Update task status (pending/in-progress/done)  \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m                                                                           \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m \x1b[36mProject Setup:\x1b[0m                                                          \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m   \x1b[32mtm init\x1b[0m              - Initialize new Task-Master project             \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m   \x1b[32mtm models --setup\x1b[0m    - Configure AI models (first time setup)         \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m   \x1b[32mtm parse-prd\x1b[0m         - Generate tasks from PRD document               \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m                                                                           \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m \x1b[36mAdvanced Features:\x1b[0m                                                      \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m   \x1b[32mtm expand --id=<id>\x1b[0m  - Break down complex tasks into subtasks          \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m   \x1b[32mtm research\x1b[0m          - AI-powered research with project context        \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m   \x1b[32mtm add-task\x1b[0m          - Add new tasks using AI assistance              \x1b[33m│\x1b[0m',
    '\x1b[33m│\x1b[0m                                                                           \x1b[33m│\x1b[0m',
    '\x1b[33m╰───────────────────────────────────────────────────────────────────────────────╯\x1b[0m',
    '',
    '\x1b[35m💡 Pro Tips:\x1b[0m',
    '\x1b[90m   • Use \x1b[32mtm -h\x1b[90m for complete command reference\x1b[0m',
    '\x1b[90m   • Claude Code understands Task-Master workflow and can help with commands\x1b[0m',
    '\x1b[90m   • Tasks are stored in .taskmaster/ directory in your project root\x1b[0m',
    '\x1b[90m   • Terminal auto-syncs with your current project directory\x1b[0m',
    '',
    '\x1b[36m🔗 Integration Features:\x1b[0m',
    '\x1b[90m   ✓ Real-time task updates in Kanban board\x1b[0m',
    '\x1b[90m   ✓ Git integration for commit tracking\x1b[0m',
    '\x1b[90m   ✓ AI-powered task breakdown and analysis\x1b[0m',
    '\x1b[90m   ✓ Cross-platform development workflow\x1b[0m',
    '',
    '\x1b[38;5;208m────────────────────────────────────────────────────────────────────────────────\x1b[0m',
    ''
  ];

  messages.forEach((message, index) => {
    setTimeout(() => {
      xterm.write(message + '\r\n');
    }, index * 50); // Animate the message line by line
  });
};

const FocusTerminal: React.FC<FocusTerminalProps> = ({
  cwd,
  className = ''
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any | null>(null);
  const fitAddonRef = useRef<any | null>(null);
  const [terminalId, setTerminalId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const cleanupCallbacks = useRef<(() => void)[]>([]);

  useEffect(() => {
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

        // Create xterm instance with simple configuration
        const xterm = new XTerm({
          theme: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            cursor: '#d4d4d4'
          },
          fontFamily: '"Cascadia Code", "Consolas", "Monaco", monospace',
          fontSize: 13,
          cursorBlink: true,
          convertEol: true,
          scrollback: 1000
        });

        // Add addons
        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        xterm.loadAddon(fitAddon);
        xterm.loadAddon(webLinksAddon);

        // Open terminal
        xterm.open(terminalRef.current);
        
        // Store references
        xtermRef.current = xterm;
        fitAddonRef.current = fitAddon;

        // Fit terminal to container
        setTimeout(() => {
          fitAddon.fit();
        }, 100);

        // Check for Electron API
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI?.terminal) {
          xterm.write('\x1b[33mTerminal API not available (running in browser mode)\x1b[0m\r\n');
          return;
        }

        // Create backend terminal
        const result = await electronAPI.terminal.create({
          cwd: cwd || process.cwd(),
          cols: xterm.cols,
          rows: xterm.rows
        });

        if (!result.success) {
          xterm.write('\x1b[31mFailed to create terminal: ' + result.error + '\x1b[0m\r\n');
          return;
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
        const exitCleanup = electronAPI.terminal.onExit(result.terminalId, (code: number) => {
          xterm.write(`\r\n\x1b[31mProcess exited with code ${code}\x1b[0m\r\n`);
          setIsConnected(false);
        });
        cleanupCallbacks.current.push(exitCleanup);

        // Handle resize with debouncing
        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            if (!fitAddon || !result.terminalId || !xtermRef.current) return;
            
            try {
              fitAddon.fit();
              electronAPI.terminal.resize(result.terminalId, xtermRef.current.cols, xtermRef.current.rows);
            } catch (error) {
              console.warn('Terminal resize error:', error);
            }
          }, 100);
        };

        // Setup resize observer for container
        const resizeObserver = new ResizeObserver(handleResize);
        if (terminalRef.current) {
          resizeObserver.observe(terminalRef.current);
        }
        cleanupCallbacks.current.push(() => {
          clearTimeout(resizeTimeout);
          resizeObserver.disconnect();
        });

        // Window resize
        window.addEventListener('resize', handleResize);
        cleanupCallbacks.current.push(() => window.removeEventListener('resize', handleResize));

        // Set connected state
        setIsConnected(true);
        
        // Display beautiful welcome message
        setTimeout(() => {
          displayWelcomeMessage(xterm);
        }, 500);

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

  if (!isClient) {
    return (
      <div className={`bg-gray-900 border border-gray-700 ${className}`}>
        <div className="p-4 text-center text-gray-400">
          <div className="animate-pulse">Loading terminal...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-gray-300 rounded-xl shadow-lg flex flex-col overflow-hidden ${className}`}>
      {/* Enhanced header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-gray-300">Claude Code Terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-gray-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
      
      {/* Terminal content - full height minus header */}
      <div className="flex-1 min-h-0 bg-gray-900">
        <div
          ref={terminalRef}
          className="w-full h-full"
          style={{ backgroundColor: '#1e1e1e' }}
        />
      </div>
    </div>
  );
};

export default FocusTerminal;