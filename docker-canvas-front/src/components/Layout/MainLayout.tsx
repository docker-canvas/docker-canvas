import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import Canvas from '../Canvas/Canvas';
import Sidebar from './Sidebar';
import { useDockerContext } from '../../context/DockerContext';

interface MainLayoutProps {
  children?: React.ReactNode;
}

/**
 * MainLayout 컴포넌트
 * 
 * 애플리케이션의 전체 레이아웃을 구성합니다:
 * - 헤더: 타이틀 및 기본 정보 표시
 * - 사이드바: 메뉴 및 옵션 제공
 * - 메인 영역: 캔버스 및 기타 컨텐츠 표시
 * - 푸터: 애플리케이션 정보
 * 
 * 주요 변경 사항:
 * - DockerContext에서 테스트 모드 상태 가져오기
 * - 테스트 모드 토글 버튼 추가 (App.tsx에서 이동)
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // DockerContext에서 테스트 모드 상태 및 설정 함수 가져오기
  const { useTestData, setUseTestData, refreshData } = useDockerContext();

  // 테스트 모드 토글 핸들러
  const toggleTestMode = () => {
    setUseTestData(!useTestData);
    // 모드 변경 후 데이터 새로고침
    setTimeout(() => refreshData(), 0);
  };

  return (
    <div className="flex flex-col h-screen w-full">
      {/* 헤더 */}
      <header className="bg-gray-800 text-white p-4 shadow-md z-10">
        <h1 className="text-xl font-bold">Docker & Swarm 인프라 시각화</h1>
      </header>
      
      {/* 메인 콘텐츠 영역 - 사이드바와 캔버스 포함 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 */}
        <Sidebar className="h-full" />
        
        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-hidden">
          <ReactFlowProvider>
            <Canvas />
          </ReactFlowProvider>
          {children}
        </main>
      </div>
      
      {/* 푸터 */}
      <footer className="bg-gray-100 p-2 text-center text-sm text-gray-600 border-t">
        <p>Docker Infrastructure Visualization Tool</p>
      </footer>

      {/* 테스트 모드 토글 버튼 (우측 하단에 고정) */}
      <div className="fixed bottom-16 right-4 flex items-center bg-white p-2 rounded-lg shadow-md z-30">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={useTestData}
            onChange={toggleTestMode}
          />
          <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-2 text-sm font-medium">테스트 모드</span>
        </label>
      </div>
    </div>
  );
};

export default MainLayout;