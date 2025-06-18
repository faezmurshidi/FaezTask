'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled to avoid xterm issues
const SimpleTerminal = dynamic(() => import('../../components/Terminal/SimpleTerminal'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="text-gray-400 text-center">Loading terminal...</div>
    </div>
  )
});

export default function TerminalPage() {
  const [terminals, setTerminals] = useState<{ id: string; cwd?: string }[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Only add initial terminal on client side
    if (typeof window !== 'undefined') {
      setTerminals([{ id: '1', cwd: process.cwd() }]);
    }
  }, []);

  const addTerminal = () => {
    if (typeof window !== 'undefined') {
      const newId = (terminals.length + 1).toString();
      setTerminals(prev => [...prev, { id: newId, cwd: process.cwd() }]);
    }
  };

  const removeTerminal = (id: string) => {
    setTerminals(prev => prev.filter(t => t.id !== id));
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-full mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Integrated Terminal</h1>
          </div>
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">Loading terminal...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Integrated Terminal</h1>
          <button
            onClick={addTerminal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + New Terminal
          </button>
        </div>

        <div className="space-y-6">
          {terminals.map((terminal) => (
            <div key={terminal.id} className="bg-gray-800 rounded-lg p-1">
              <SimpleTerminal
                cwd={terminal.cwd}
                onClose={() => removeTerminal(terminal.id)}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {terminals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No terminals open</div>
            <button
              onClick={addTerminal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Open Terminal
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 