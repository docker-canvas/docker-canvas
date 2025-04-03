import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import Canvas from '../Canvas/Canvas';
import Sidebar from './Sidebar';

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
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
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
    </div>
  );
};

export default MainLayout;