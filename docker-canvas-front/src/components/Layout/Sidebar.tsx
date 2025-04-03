import React, { useState } from 'react';

interface SidebarProps {
  className?: string;
}

/**
 * Sidebar 컴포넌트
 * 
 * 애플리케이션의 좌측에 표시되는 사이드바로, 다양한 메뉴와 옵션을 제공합니다.
 * - 토글 기능: 사이드바를 접고 펼칠 수 있습니다.
 * - 예시 메뉴: 간단한 메뉴 항목을 표시합니다.
 */
const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  // 사이드바 접기/펼치기 상태
  const [collapsed, setCollapsed] = useState(false);
  
  // 사이드바 접기/펼치기 토글 함수
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <div 
      className={`
        bg-gray-800 text-white flex flex-col transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'} 
        ${className}
      `}
    >
      {/* 헤더 및 토글 버튼 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && <h2 className="text-xl font-semibold">메뉴</h2>}
        <button 
          onClick={toggleSidebar}
          className={`p-1 rounded hover:bg-gray-700 ${collapsed ? 'mx-auto' : ''}`}
          title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>
      
      {/* 메뉴 항목들 */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="py-2">
          {/* 대시보드 메뉴 항목 */}
          <li>
            <a 
              href="#" 
              className={`
                flex items-center py-3 px-4 hover:bg-gray-700 transition-colors
                ${collapsed ? 'justify-center' : 'space-x-3'}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              {!collapsed && <span>대시보드</span>}
            </a>
          </li>
          
          {/* 컨테이너 메뉴 항목 */}
          <li>
            <a 
              href="#" 
              className={`
                flex items-center py-3 px-4 hover:bg-gray-700 transition-colors
                ${collapsed ? 'justify-center' : 'space-x-3'}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {!collapsed && <span>컨테이너</span>}
            </a>
          </li>
        </ul>
      </nav>
      
      {/* 푸터 (설정) */}
      <div className="p-4 border-t border-gray-700">
        <a 
          href="#" 
          className={`
            flex items-center hover:bg-gray-700 rounded p-2 transition-colors
            ${collapsed ? 'justify-center' : 'space-x-3'}
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!collapsed && <span>설정</span>}
        </a>
      </div>
    </div>
  );
};

export default Sidebar;