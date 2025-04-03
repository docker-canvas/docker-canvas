import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import Canvas from './components/Canvas/Canvas';
import './index.css';

function App() {
  return (
    <div className="App">
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">Docker & Swarm 인프라 시각화</h1>
      </header>
      
      <main className="flex-1 overflow-hidden h-screen">
        <ReactFlowProvider>
          <Canvas />
        </ReactFlowProvider>
      </main>
      
      <footer className="bg-gray-100 p-2 text-center text-sm text-gray-600 border-t fixed bottom-0 w-full">
        <p>Docker Infrastructure Visualization Tool</p>
      </footer>
    </div>
  );
}

export default App;