import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { NetworkData, NetworkDriver, NetworkType, ContainerHandleInfo } from '../types/network';
import './Network.css';

/**
 * Network 속성 인터페이스
 * ReactFlow 노드 컴포넌트에 필요한 속성을 정의합니다.
 */
export interface NetworkProps {
  data: NetworkData;    // 네트워크 데이터
  selected?: boolean;   // 노드 선택 상태 (선택적 속성)
}

/**
 * Network 컴포넌트
 * 
 * Docker 네트워크를 시각적으로 표현하는 컴포넌트입니다.
 * 
 * 특징:
 * - 네트워크 유형(external, docker)에 따라 다른 스타일 적용
 * - 네트워크 드라이버(overlay, gwbridge 등)에 따라 다른 스타일 적용
 * - 네트워크 이름 및 기본 정보 표시
 * - 호버 시 상세 정보 표시
 * - 동적으로 계산된 핸들 위치로 수직 연결 보장
 * - Overlay 네트워크는 컨테이너 핸들과 연결될 수 있는 하단 핸들 제공
 */
const Network: React.FC<NetworkProps> = ({ data, selected = false }) => {
  // 호버 상태 관리
  const [isHovered, setIsHovered] = useState(false);
  
  // 네트워크 유형에 따른 스타일 계산
  const getNetworkTypeStyles = (type: NetworkType, driver: NetworkDriver) => {
    // External 네트워크
    if (type === 'external') {
      return {
        background: '#6B46C1',
        borderColor: '#553C9A'
      };
    }
    
    // Docker 내부 네트워크
    if (type === 'docker') {
      // Ingress 네트워크
      if (data.name === 'ingress') {
        return {
          background: '#ED8936',
          borderColor: '#C05621'
        };
      }
      
      // GWBridge 네트워크
      if (driver === 'gwbridge' || data.name.includes('gwbridge')) {
        return {
          background: '#4299E1',
          borderColor: '#2B6CB0'
        };
      }
      
      // 기타 Docker 네트워크
      return {
        background: '#38B2AC',
        borderColor: '#2C7A7B'
      };
    }
    
    // 기본 스타일
    return {
      background: '#718096',
      borderColor: '#4A5568'
    };
  };

  // 네트워크 유형에 따른 스타일
  const networkTypeStyles = getNetworkTypeStyles(data.type, data.driver);
  
  // 네트워크 유형별 CSS 클래스 계산
  const getNetworkTypeClass = () => {
    if (data.type === 'external') return 'external';
    if (data.name === 'ingress') return 'ingress';
    if (data.driver === 'gwbridge' || data.name.includes('gwbridge')) return 'gwbridge';
    return 'docker';
  };
  
  // 연결 유형에 따른 핸들 렌더링
  const renderHandles = () => {
    // GWBridge 네트워크인 경우
    if (data.driver === 'gwbridge' || data.name.includes('gwbridge')) {
      // 컨테이너 핸들 정보가 있는 경우 해당 위치에 개별 핸들 생성
      if (data.containerHandles && data.containerHandles.length > 0) {
        // 상단 핸들들 (각 컨테이너에 대응)
        const topHandles = data.containerHandles.map((handleInfo, index) => (
          <Handle
            key={`container-handle-${index}`}
            type="target"
            position={Position.Top}
            id={`handle-${handleInfo.containerId}`}
            style={{ 
              background: '#63B3ED', 
              width: '8px', 
              height: '8px',
              left: `${handleInfo.xPosition * 100}%` // 상대적 위치를 백분율로 변환
            }}
          />
        ));
        
        // 하단 핸들 (노드 연결용) - 단일 핸들
        const bottomHandle = (
          <Handle
            key="gwbridge-out"
            type="source"
            position={Position.Bottom}
            id="gwbridge-out"
            style={{ 
              background: '#63B3ED', 
              width: '8px', 
              height: '8px',
              left: '50%' 
            }}
          />
        );
        
        return [...topHandles, bottomHandle];
      }
      
      // 기본 핸들 (정보가 없는 경우)
      return [
        <Handle
          key="gwbridge-in"
          type="target"
          position={Position.Top}
          id="gwbridge-in"
          style={{ 
            background: '#63B3ED', 
            width: '8px', 
            height: '8px',
            left: '50%'  // 중앙에 위치
          }}
        />,
        <Handle
          key="gwbridge-out"
          type="source"
          position={Position.Bottom}
          id="gwbridge-out"
          style={{ 
            background: '#63B3ED', 
            width: '8px', 
            height: '8px',
            left: '50%' 
          }}
        />
      ];
    }
    
    // External 네트워크인 경우 - 상단에만 핸들
    if (data.type === 'external') {
      return (
        <Handle
          type="target"
          position={Position.Top}
          id="external-in"
          style={{ 
            background: '#9F7AEA', 
            width: '8px', 
            height: '8px',
            left: '50%' 
          }}
        />
      );
    }
    
    // Ingress 네트워크인 경우
    if (data.name === 'ingress') {
      return (
        <Handle
          type="source"
          position={Position.Bottom}
          id="ingress-out-0"
          style={{ 
            background: '#F6AD55', 
            width: '8px', 
            height: '8px',
            left: '50%'  // 중앙에 위치
          }}
        />
      );
    }
    
    // Overlay 네트워크인 경우 (Ingress 제외)
    if (data.driver === 'overlay' && data.name !== 'ingress') {
      // 연결된 컨테이너 핸들 정보가 있는 경우
      if (data.containerHandles && data.containerHandles.length > 0) {
        return data.containerHandles.map((handleInfo, index) => (
          <Handle
            key={`container-handle-${index}`}
            type="source"
            position={Position.Bottom}
            id={`overlay-out-${handleInfo.containerId}`}
            style={{ 
              background: '#4FD1C5', 
              width: '8px', 
              height: '8px',
              left: `${handleInfo.xPosition * 100}%` // 상대적 위치를 백분율로 변환
            }}
          />
        ));
      }
      
      // 기본 핸들 (정보가 없는 경우) - 중앙에 하나
      return (
        <Handle
          type="source"
          position={Position.Bottom}
          id="overlay-out"
          style={{ 
            background: '#4FD1C5', 
            width: '8px', 
            height: '8px',
            left: '50%' 
          }}
        />
      );
    }
    
    // 기본 핸들 (일반 네트워크)
    return (
      <Handle
        type="target"
        position={Position.Top}
        id="network-in"
        style={{ 
          background: '#4FD1C5', 
          width: '8px', 
          height: '8px',
          left: '50%' 
        }}
      />
    );
  };

  return (
    <div
      className={`
        network-node
        p-3 rounded-lg shadow-md border-2 transition-all
        ${selected ? 'selected' : ''}
        ${getNetworkTypeClass()}
      `}
      style={{
        background: networkTypeStyles.background,
        borderColor: networkTypeStyles.borderColor,
        color: 'white',
        position: 'relative', // 타입 표시를 위한 상대 위치 설정
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 동적으로 계산된 핸들 렌더링 */}
      {renderHandles()}
      
      {/* 네트워크 타입 표시 (오른쪽 아래) */}
      <div className="absolute bottom-1 right-2 text-xs text-white bg-black bg-opacity-40 px-1 py-0.5 rounded">
        { data.name }
      </div>
      
      {/* 호버 시 표시되는 상세 정보 (Container 스타일과 통일) */}
      {isHovered && (
        <div className="absolute z-50 bg-gray-800 bg-opacity-90 text-white p-3 rounded shadow-lg"
          style={{ 
            width: '200px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            top: '100%',
            marginTop: '5px'
          }}>
          <div className="font-bold mb-1">{data.name}</div>
          <div className="text-xs text-gray-300 mb-1">타입: {data.type}</div>
          <div className="text-xs mb-1">드라이버: {data.driver}</div>
          <div className="text-xs mb-1">범위: {data.scope}</div>
          
          {/* 인터페이스 정보 (있을 경우) */}
          {data.interfaces && data.interfaces.length > 0 && (
            <div className="mt-1">
              <div className="text-xs font-semibold">인터페이스:</div>
              {data.interfaces.map((iface, idx) => (
                <div key={idx} className="text-xs text-gray-300 ml-1">
                  {iface.name}: {iface.ipAddress}
                  {iface.subnet && ` (${iface.subnet})`}
                </div>
              ))}
            </div>
          )}
          
          {/* 연결된 컨테이너 정보 (있을 경우) */}
          {data.containerHandles && data.containerHandles.length > 0 && (
            <div className="mt-1">
              <div className="text-xs font-semibold">연결된 컨테이너:</div>
              <div className="text-xs text-gray-300 ml-1">
                {data.containerHandles.length}개 연결됨
              </div>
            </div>
          )}
          
          {/* 추가 속성 (있을 경우) */}
          <div className="mt-1 flex flex-wrap">
            {data.attachable && (
              <span className="text-xs bg-blue-700 rounded px-1 mr-1 mb-1">Attachable</span>
            )}
            {data.internal && (
              <span className="text-xs bg-blue-700 rounded px-1 mr-1 mb-1">Internal</span>
            )}
          </div>
          
          {/* 생성 일시 (있을 경우) */}
          {data.createdAt && (
            <div className="text-xs mt-1 text-gray-300">
              생성: {new Date(data.createdAt).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(Network);