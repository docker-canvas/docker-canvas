import React from 'react';

interface ToolBarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanMode: () => void;
  onRefresh: () => void;
  activeMode: string;
}

const ToolBar: React.FC<ToolBarProps> = ({ onZoomIn, onZoomOut, onPanMode, onRefresh, activeMode }) => {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-full shadow-md flex items-center px-2 py-1 border border-gray-200">
      <button
        className={`p-2 mx-1 rounded-full transition-colors ${
          activeMode === 'hand' ? 'bg-gray-200' : 'hover:bg-gray-100'
        }`}
        title="Pan Mode"
        onClick={onPanMode}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 11v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5" />
          <path d="M7 11V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v8" />
          <path d="M13 11V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6" />
        </svg>
      </button>
      
      <button
        className={`p-2 mx-1 rounded-full transition-colors hover:bg-gray-100`}
        title="Zoom In"
        onClick={onZoomIn}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>
      
      <button
        className={`p-2 mx-1 rounded-full transition-colors hover:bg-gray-100`}
        title="Zoom Out"
        onClick={onZoomOut}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>
      
      <button
        className={`p-2 mx-1 rounded-full transition-colors hover:bg-gray-100`}
        title="Refresh"
        onClick={onRefresh}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 2v6h-6"></path>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
          <path d="M3 22v-6h6"></path>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
        </svg>
      </button>
    </div>
  );
};

export default ToolBar;