import React, { useState } from 'react';
import { ContainerData, ContainerNetwork } from '../types/container';
import './Container.css';

/**
 * Container 속성 인터페이스
 * 컨테이너 컴포넌트에 필요한 속성을 정의합니다.
 */
interface ContainerProps {
  data: ContainerData;    // 컨테이너 데이터
  isSelected?: boolean;   // 선택 상태 (선택적)
}

/**
 * Container 컴포넌트
 * 
 * Docker 컨테이너를 시각적으로 표현하는 컴포넌트입니다.
 * 
 * 특징:
 * - 도커 시그니처 색상(파란색)으로 스타일링
 * - 컨테이너 상태에 따라 다른 상태 표시기 적용
 * - 호버 시 상세 정보 표시
 * - 가로로 배치되도록 설계
 */
const Container: React.FC<ContainerProps> = ({ data, isSelected = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  // 컨테이너 상태에 따른 스타일 계산
  const getStatusColor = () => {
    switch (data.status) {
      case 'running':
        return 'bg-green-500';
      case 'stopped':
      case 'exited':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 컨테이너 ID를 짧게 표시 (처음 12자리만)
  const shortId = data.id.substring(0, 12);

  return (
    <div 
      className={`
        container-item py-1 px-2 rounded-md border transition-all
        ${isSelected ? 'border-blue-400 shadow-lg' : 'border-blue-700'}
      `}
      style={{
        backgroundColor: '#099CEC', // Docker 시그니처 파란색
        color: 'white',
        width: '120px', // 고정 너비로 가로 배치 용이하게
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 컨테이너 기본 정보 */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold truncate" title={data.name} style={{ maxWidth: '90px' }}>
          {data.name}
        </div>
        <div className={`status-indicator ml-1 w-2 h-2 rounded-full ${getStatusColor()}`}></div>
      </div>
      
      {/* 호버 시 표시되는 상세 정보 */}
      {isHovered && (
        <div className="container-hover-info absolute z-10 bg-gray-800 bg-opacity-90 text-white p-3 rounded shadow-lg" 
          style={{ 
            width: '200px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            top: '100%',
            marginTop: '5px'
          }}>
          <div className="font-bold mb-1">{data.name}</div>
          <div className="text-xs text-gray-300 mb-1">{data.image}</div>
          <div className="text-xs mb-1">ID: {shortId}</div>
          
          <div className="flex items-center my-1">
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${getStatusColor()}`}></span>
            <span className="text-xs">{data.status}</span>
          </div>
          
          {/* 네트워크 정보 */}
          {data.networks && data.networks.length > 0 && (
            <div className="mt-1">
              <div className="text-xs font-semibold">네트워크:</div>
              {data.networks.map((network, index) => (
                <div key={index} className="text-xs text-gray-300 ml-1">
                  {network.name} ({network.driver})
                  {network.ipAddress && ` - ${network.ipAddress}`}
                </div>
              ))}
            </div>
          )}
          
          {/* 포트 매핑 정보 */}
          {data.ports && data.ports.length > 0 && (
            <div className="mt-1">
              <div className="text-xs font-semibold">포트:</div>
              <div className="flex flex-wrap">
                {data.ports.map((port, index) => (
                  <span 
                    key={index} 
                    className="text-xs bg-blue-700 rounded px-1 mr-1 mb-1"
                  >
                    {port.external}:{port.internal}/{port.protocol}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Container;