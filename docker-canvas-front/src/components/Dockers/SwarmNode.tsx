import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeData, NodeRole } from '../types/node';
import './SwarmNode.css';

/**
 * SwarmNode 속성 인터페이스
 * ReactFlow 노드 컴포넌트에 필요한 속성을 정의합니다.
 */
export interface SwarmNodeProps {
  data: NodeData;     // 노드 데이터
  selected?: boolean;  // 노드 선택 상태 (선택적 속성으로 변경)
}

/**
 * SwarmNode 컴포넌트
 * 
 * Docker Swarm의 노드(Manager 또는 Worker)를 시각적으로 표현하는 컴포넌트입니다.
 * 
 * 특징:
 * - 노드 역할(Manager/Worker)에 따라 다른 스타일 적용
 * - 노드에 배치된 컨테이너를 시각적으로 표시
 * - 연결 핸들(Handle)을 통해 다른 노드와 연결 가능
 * - 노드 호스트명 및 상태 정보 표시
 * - 모든 정보 직접 표시 (호버 기능 제거)
 * - 상단 핸들로 컨테이너 연결, 하단 핸들로 네트워크 연결
 */
const SwarmNode: React.FC<SwarmNodeProps> = ({ data, selected = false }) => { // 기본값 추가
  // 상세 정보 표시 상태 관리 (추가)
  const [showDetails, setShowDetails] = useState(false);
  
  // 노드 역할에 따른 스타일 계산
  const getRoleStyles = (role: NodeRole) => {
    // Manager는 더 진한 색상, Worker는 더 연한 색상
    if (role === 'Manager') {
      return {
        background: '#1E3A5F',
        borderColor: '#0F2847'
      };
    }
    return {
      background: '#2D5F5D',
      borderColor: '#1E4240'
    };
  };

  // 노드 상태에 따른 상태 표시기 스타일
  const getStatusIndicatorStyle = () => {
    switch (data.status) {
      case 'ready':
        return 'bg-green-500';
      case 'down':
        return 'bg-red-500';
      case 'disconnected':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const nodeHeight = 400;
  
  // 노드 역할에 따른 스타일
  const roleStyles = getRoleStyles(data.role);

  // 노드가 가지고 있는 컨테이너 수
  const containerCount = data.containers.length;
  
  // 노드 너비 (고정값, CSS 스타일과 일치해야 함)
  const nodeWidth = 400; // 예시 값, 실제 스타일에 맞게 조정 필요
  
  // 상단 핸들 렌더링 - GWBridge 연결용 핸들 추가
  const renderTopHandles = () => {
    return (
      <Handle
        type="source"
        position={Position.Top}
        id="gwbridge-out"
        style={{ 
          background: '#90CDF4', 
          width: '8px', 
          height: '8px',
          left: '50%' // 중앙 정렬
        }}
      />
    );
  };

  // 하단 핸들은 필요 없음
  const renderBottomHandles = () => {
    return null;
  };
  
  
  // 라벨 정보 렌더링 함수
  const renderLabels = () => {
    if (!data.labels || Object.keys(data.labels).length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4">
        <div className="text-sm font-bold mb-2">라벨:</div>
        <div className="flex flex-wrap">
          {Object.entries(data.labels).map(([key, value], index) => (
            <div key={index} className="text-xs bg-blue-700 rounded px-1 py-0.5 mr-1 mb-1">
              {key}: {value}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div
      className={`
        swarm-node
        p-4 rounded-lg shadow-md border-2 transition-all
        ${selected ? 'selected' : ''}
        ${data.role === 'Manager' ? 'manager' : 'worker'}
      `}
      style={{
        height: `${nodeHeight}px`,
        background: roleStyles.background,
        borderColor: roleStyles.borderColor,
        color: 'white',
        overflow: 'auto', // 내용이 넘칠 경우 스크롤 표시로 변경
        position: 'relative' // 타입 표시를 위한 상대 위치 설정
      }}
    >
      {/* 동적으로 계산된 핸들 렌더링 */}
      {renderTopHandles()}
      {renderBottomHandles()}

      {/* 노드 내용 */}
      <div className="flex flex-col content" style={{ height: '100%' }}>
        {/* 헤더 섹션 */}
        <div className="mb-4">
          {/* 호스트명 */}
          <div className="hostname font-bold text-xl mb-2">{data.hostname}</div>
          
          {/* 상태 및 역할 정보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className={`status-indicator ${getStatusIndicatorStyle()}`}></span>
              <span className="ml-1">{data.status || 'Unknown'}</span>
            </div>
            <span className="label">{data.role}</span>
          </div>
        </div>
        
        
        {/* 라벨 정보 */}
        {renderLabels()}
        
        {/* 컴포넌트 타입 표시 - 오른쪽 아래에 위치 */}
        <div className="absolute bottom-2 right-2 text-xs text-white bg-black bg-opacity-40 px-1 py-0.5 rounded">
          {data.role}
        </div>
      </div>

    </div>
  );
};

// memo를 사용하여 불필요한 리렌더링 방지
export default memo(SwarmNode);