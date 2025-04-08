import React, { useState } from 'react';
import MainLayout from './components/Layout/MainLayout';
import { DockerProvider } from './context/DockerContext';
import './index.css';

/**
 * App 컴포넌트
 * 
 * 애플리케이션의 루트 컴포넌트로, 전체 앱의 상태를 관리하고
 * 메인 레이아웃을 렌더링합니다.
 * 
 * 주요 변경 사항:
 * - Docker 인프라 데이터를 관리하는 DockerProvider 추가
 * - 테스트 모드 상태를 DockerContext로 이동
 */
const App: React.FC = () => {
  return (
    <div className="App">
      {/* Docker 인프라 데이터를 관리하는 Context Provider */}
      <DockerProvider>
        <MainLayout>
        </MainLayout>
      </DockerProvider>
    </div>
  );
};

export default App;