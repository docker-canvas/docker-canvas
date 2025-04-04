import React, { memo, useState } from 'react';
import { Position } from 'reactflow';
import { NetworkData, NetworkDriver, NetworkType } from '../types/network';
import './Network.css';

/**
 * Network 속성 인터페이스
 * ReactFlow 노드 컴포넌트에 필요한 속성을 정의합니다.
 */
interface NetworkProps {
  data: NetworkData;   // 네트워크 데이터
  selected: boolean;   // 노드 선택 상태
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
 * - 노드 배치 규칙에 따라 다른 배치 방식 적용
 *   - ingress: 컨테이너 집합 위에 배치
 *   - gwbridge: 노드 위, 컨테이너 아래 배치
 */
const Network: React.FC<NetworkProps> = ({ data, selected }) => {
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

  // 네트워크의 높이는 유형에 따라 다르게 설정
  const getNetworkHeight = () => {
    // Ingress 또는 External 네트워크는 더 얇게
    if (data.name === 'ingress' || data.type === 'external') {
      return 40;
    }
    
    // GWBridge 네트워크는 중간 높이
    if (data.driver === 'gwbridge' || data.name.includes('gwbridge')) {
      return 60;
    }
    
    // 기본 높이
    return 80;
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
        height: `${getNetworkHeight()}px`,
        background: networkTypeStyles.background,
        borderColor: networkTypeStyles.borderColor,
        color: 'white',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 네트워크 내용 */}
      <div className="flex justify-between items-center content">
        {/* 네트워크 이름 & 드라이버 */}
        <div className="flex flex-col">
          <div className="network-name text-sm font-bold truncate" title={data.name}>
            {data.name}
          </div>
          <div className="text-xs text-gray-200">
            {data.driver}
          </div>
        </div>
        
        {/* 네트워크 범위 */}
        <div className="label text-xs">
          {data.scope}
        </div>
      </div>
      
      {/* 호버 시 표시되는 상세 정보 */}
      {isHovered && (
        <div className="hover-info bg-gray-800 bg-opacity-80 absolute inset-0 flex flex-col items-center justify-center p-4 transition-opacity duration-200">
          <h3 className="text-md font-bold mb-1">{data.name}</h3>
          <div className="text-xs mb-1">Driver: {data.driver}</div>
          <div className="text-xs mb-1">Scope: {data.scope}</div>
          
          {/* 인터페이스 정보 (있을 경우) */}
          {data.interfaces && data.interfaces.length > 0 && (
            <div className="text-xs">
              <div>인터페이스:</div>
              {data.interfaces.map((iface, idx) => (
                <div key={idx} className="text-xs text-gray-300">
                  {iface.name}: {iface.ipAddress}
                </div>
              ))}
            </div>
          )}
          
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

// memo를 사용하여 불필요한 리렌더링 방지
export default memo(Network);