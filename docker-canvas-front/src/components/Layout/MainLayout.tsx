import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import Canvas from '../Canvas/Canvas';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen w-full">
      <header className="bg-gray-800 text-white p-4 shadow-md z-10">
        <h1 className="text-xl font-bold">Docker & Swarm 인프라 시각화</h1>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <ReactFlowProvider>
          <Canvas />
        </ReactFlowProvider>
        {children}
      </main>
      
      <footer className="bg-gray-100 p-2 text-center text-sm text-gray-600 border-t">
        <p>Docker Infrastructure Visualization Tool</p>
      </footer>
    </div>
  );
};

export default MainLayout;