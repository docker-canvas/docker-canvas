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
  // 마우스 위치 상태 추가
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 마우스 위치 업데이트 함수
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

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
  
  // 호버 UI를 body에 직접 추가하는 코드
  React.useEffect(() => {
    // 호버 상태가 아니면 아무것도 하지 않음
    if (!isHovered) return;
    
    // 툴팁 요소 생성
    const tooltip = document.createElement('div');
    tooltip.className = 'container-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${mousePosition.x + 15}px`; // 커서 위치에서 약간 오른쪽
    tooltip.style.top = `${mousePosition.y}px`;
    tooltip.style.backgroundColor = 'rgba(26, 32, 44, 0.95)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '10px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.25)';
    tooltip.style.zIndex = '10000'; // 매우 높은 z-index
    tooltip.style.width = '200px';
    tooltip.style.maxHeight = '300px';
    tooltip.style.overflow = 'auto';
    
    // 툴팁 내용 설정
    tooltip.innerHTML = `
      <div class="font-bold mb-1">${data.serviceName || 'Container'}</div>
      <div class="text-xs text-gray-300 mb-1">${data.image}</div>
      <div class="text-xs mb-1">ID: ${shortId}</div>
      
      <div class="flex items-center my-1">
        <span class="inline-block w-2 h-2 rounded-full mr-1 ${getStatusColor()}"></span>
        <span class="text-xs">${data.status}</span>
      </div>
      
      ${data.networks && data.networks.length > 0 ? `
        <div class="mt-1">
          <div class="text-xs font-semibold">네트워크:</div>
          ${data.networks.map((network, index) => `
            <div class="text-xs text-gray-300 ml-1">
              ${network.name} (${network.driver})
              ${network.ipAddress ? ` - ${network.ipAddress}` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.ports && data.ports.length > 0 ? `
        <div class="mt-1">
          <div class="text-xs font-semibold">포트:</div>
          <div class="flex flex-wrap">
            ${data.ports.map((port, index) => `
              <span class="text-xs bg-blue-700 rounded px-1 mr-1 mb-1">
                ${port.external}:${port.internal}/${port.protocol}
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
    
    // body에 툴팁 추가
    document.body.appendChild(tooltip);
    
    // 클린업 함수: 컴포넌트 언마운트 시 툴팁 제거
    return () => {
      document.body.removeChild(tooltip);
    };
  }, [isHovered, mousePosition, data]);

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
      onMouseMove={handleMouseMove} // 마우스 이동 이벤트 추가
    >
      {/* 네트워크 연결을 위한 핸들 */}
      {renderTopHandles()}

      {/* 컴포넌트 타입 표시와 상태 표시 (오른쪽에 통합) */}
      <div className="absolute bottom-1 right-1 text-xs bg-gray-800 bg-opacity-80 px-2 py-1 rounded-md flex items-center" style={{ fontSize: '0.7rem' }}>
        <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${getStatusColor()}`}></span>
        <span className="font-medium text-white">{data.serviceName}</span>
      </div>
    </div>
  );
};

export default Container;