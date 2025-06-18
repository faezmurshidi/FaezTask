'use client';

import React, { useState } from 'react';
import { SimpleTerminal } from '../../components/Terminal';

export default function TerminalPage() {
  const [terminals, setTerminals] = useState<{ id: string; cwd?: string }[]>([
    { id: '1', cwd: process.cwd() }
  ]);

  const addTerminal = () => {
    const newId = (terminals.length + 1).toString();
    setTerminals(prev => [...prev, { id: newId, cwd: process.cwd() }]);
  };

  const removeTerminal = (id: string) => {
    setTerminals(prev => prev.filter(t => t.id !== id));
  };

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