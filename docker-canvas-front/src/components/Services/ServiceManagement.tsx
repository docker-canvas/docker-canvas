import React, { useState } from 'react';
import ServiceCreate from './ServiceCreate';

/**
 * 서비스 관리 컴포넌트
 * 
 * 서비스 생성, 삭제, 관리 기능을 제공하는 메인 컴포넌트입니다.
 * 사용자는 다양한 서비스 관리 옵션 중에서 선택할 수 있습니다.
 */
const ServiceManagement: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  // 현재 선택된 관리 옵션 (create, delete, manage)
  const [activeOption, setActiveOption] = useState<string | null>(null);

  // 관리 옵션이 변경될 때 호출되는 함수
  const handleOptionChange = (option: string) => {
    setActiveOption(option);
  };

  // 컴포넌트가 닫혀있으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
        {/* 헤더 및 닫기 버튼 */}
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold">Docker 서비스 관리</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeOption === 'create' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleOptionChange('create')}
          >
            서비스 생성
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeOption === 'delete' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleOptionChange('delete')}
          >
            서비스 삭제
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeOption === 'manage' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleOptionChange('manage')}
          >
            서비스 관리
          </button>
        </div>

        {/* 선택된 관리 옵션에 따른 컨텐츠 렌더링 */}
        <div className="p-6">
          {activeOption === 'create' && <ServiceCreate onClose={onClose} />}
          {activeOption === 'delete' && <div>서비스 삭제 기능 구현 예정</div>}
          {activeOption === 'manage' && <div>서비스 관리 기능 구현 예정</div>}
          {!activeOption && (
            <div className="text-center text-gray-500 py-8">
              위의 탭에서 원하는 서비스 관리 옵션을 선택하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceManagement;