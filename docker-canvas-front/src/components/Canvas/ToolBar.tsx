// 기존 ToolBar에 서비스 관리 버튼 추가하기
const ToolBar: React.FC<{
  onPanMode: () => void;
  onRefresh: () => void;
  onServiceManage: () => void; // 서비스 관리 함수 추가
  activeMode: string;
}> = ({ onPanMode, onRefresh, onServiceManage, activeMode }) => {
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
      

      {/* 서비스 관리 버튼 추가 */}
      <button
        className={`p-2 mx-1 rounded-full transition-colors hover:bg-gray-100`}
        title="Service Management"
        onClick={onServiceManage}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
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