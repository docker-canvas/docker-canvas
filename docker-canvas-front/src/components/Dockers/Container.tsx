import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
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
 * - 상단 핸들을 통해 Overlay 네트워크와 연결
 * - 하단 핸들을 통해 GWBridge 네트워크와 연결
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
  
  // 컨테이너가 연결되는 네트워크 타입 분류
  const overlayNetworks = data.networks.filter(network => network.driver === 'overlay');
  const bridgeNetworks = data.networks.filter(network => network.driver === 'bridge' || network.driver === 'gwbridge');
  
  // 상단 핸들 (Overlay 네트워크 연결용)
  const renderTopHandles = () => {
    if (overlayNetworks.length === 0) return null;
    
    return overlayNetworks.map((network, index) => {
      // 컴포넌트 너비에 맞게 핸들 위치 계산 (space-around 방식)
      const spacing = 120 / (overlayNetworks.length + 1);
      const position = spacing * (index + 1);
      
      // 핸들 위치가 설정되어 있으면 해당 위치 사용, 아니면 계산된 위치 사용
      const handlePosition = data.handlePositions?.overlayIn?.[network.name];
      const leftPosition = handlePosition 
        ? `${handlePosition * 100}%` 
        : `${position}px`;
      
      return (
        <Handle
          key={`overlay-${index}`}
          type="target"
          position={Position.Top}
          id={`overlay-in-${network.name}`}
          style={{ 
            background: '#4299E1', 
            width: '8px', 
            height: '8px',
            left: leftPosition
          }}
        />
      );
    });
  };
  
  // 하단 핸들 (Bridge/GWBridge 연결용)
  const renderBottomHandles = () => {
    // 항상 중앙에 핸들 하나 제공
    return (
      <Handle
        key="gwbridge-out"
        type="source"
        position={Position.Bottom}
        id="gwbridge-out"
        style={{ 
          background: '#4299E1', 
          width: '8px', 
          height: '8px',
          left: '50%'  // 중앙에 위치
        }}
      />
    );
  };

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
        height: '80px', // layoutCalculator.ts의 containerHeight와 일치시킴
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovered(true)}  // 마우스 진입 시 호버 상태 true
      onMouseLeave={() => setIsHovered(false)} // 마우스 이탈 시 호버 상태 false
    >
      {/* 네트워크 연결을 위한 핸들 */}
      {renderTopHandles()}
      {renderBottomHandles()}

      {/* 컴포넌트 타입 표시와 상태 표시 (오른쪽에 통합) */}
      <div className="absolute bottom-1 right-1 text-xs bg-gray-800 bg-opacity-80 px-2 py-1 rounded-md flex items-center" style={{ fontSize: '0.7rem' }}>
        <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${getStatusColor()}`}></span>
        <span className="font-medium text-white">{data.serviceName}</span>
      </div>
      
      {/* 호버 시 표시되는 상세 정보 */}
      {isHovered && (
        <div className="container-hover-info absolute z-50 bg-gray-800 bg-opacity-90 text-white p-3 rounded shadow-lg" 
          style={{ 
            width: '200px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            top: '100%',
            marginTop: '5px'
          }}>
          <div className="font-bold mb-1">{data.serviceName}</div>
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