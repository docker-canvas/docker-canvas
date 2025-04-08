import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * 애플리케이션 진입점
 * 
 * React 애플리케이션의 루트 엘리먼트를 생성하고
 * App 컴포넌트를 렌더링합니다.
 * 
 * App 컴포넌트 내부에 DockerProvider가 이미 포함되어 있으므로
 * 여기서는 별도의 Context 설정이 필요하지 않습니다.
 */
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);