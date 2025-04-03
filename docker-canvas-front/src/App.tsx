import React, { useState } from 'react';
import MainLayout from './components/Layout/MainLayout';
import './index.css';

/**
 * App 컴포넌트
 * 
 * 애플리케이션의 루트 컴포넌트로, 전체 앱의 상태를 관리하고
 * 메인 레이아웃을 렌더링합니다.
 * 
 * 현재는 최소한의 기능만 포함하고 있으며, 필요에 따라 추가 기능을
 * 점진적으로 구현할 예정입니다.
 */
const App: React.FC = () => {
  // 테스트 모드 상태 (실제 API 사용 여부)
  const [useTestMode, setUseTestMode] = useState(true);

  // 테스트 모드 토글 핸들러
  const toggleTestMode = () => {
    setUseTestMode(!useTestMode);
  };

  return (
    <div className="App">
      <MainLayout>
        {/* 추가 콘텐츠가 필요한 경우 여기에 배치 */}
      </MainLayout>
      
      {/* 테스트 모드 토글 버튼 (우측 하단에 고정) */}
      <div className="fixed bottom-16 right-4 flex items-center bg-white p-2 rounded-lg shadow-md z-30">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={useTestMode}
            onChange={toggleTestMode}
          />
          <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-2 text-sm font-medium">테스트 모드</span>
        </label>
      </div>
    </div>
  );
};

export default App;