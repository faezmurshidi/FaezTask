'use client';

import React from 'react';
import { ImprovedTerminal } from './Terminal';

const TerminalTest: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-2xl font-bold mb-4">Terminal Test</h1>
        <ImprovedTerminal 
          className="w-full"
          cwd={process.cwd()}
        />
      </div>
    </div>
  );
};

export default TerminalTest;