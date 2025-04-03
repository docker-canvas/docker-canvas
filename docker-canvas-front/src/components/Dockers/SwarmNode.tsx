import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeData, NodeRole } from '../types/node';
import './SwarmNode.css';

/**
 * SwarmNode 속성 인터페이스
 * ReactFlow 노드 컴포넌트에 필요한 속성을 정의합니다.
 */
interface SwarmNodeProps {
  data: NodeData;     // 노드 데이터
  selected: boolean;  // 노드 선택 상태
}

/**
 * SwarmNode 컴포넌트
 * 
 * Docker Swarm의 노드(Manager 또는 Worker)를 시각적으로 표현하는 컴포넌트입니다.
 * 
 * 특징:
 * - 노드 역할(Manager/Worker)에 따라 다른 스타일 적용
 * - 노드에 배치된 컨테이너 수에 비례하여 너비가 조정됨
 * - 연결 핸들(Handle)을 통해 다른 노드와 연결 가능
 * - 노드 호스트명 및 상태 정보 표시
 */
const SwarmNode: React.FC<SwarmNodeProps> = ({ data, selected }) => {
  // 노드 역할에 따른 스타일 계산
  const getRoleStyles = (role: NodeRole) => {
    // Manager는 더 진한 색상, Worker는 더 연한 색상
    if (role === 'Manager') {
      return {
        background: '#1a4f72',
        borderColor: '#0c2e44'
      };
    }
    return {
      background: '#3182ce',
      borderColor: '#2c5282'
    };
  };

  // 노드 상태에 따른 상태 표시기 스타일
  const getStatusIndicatorStyle = () => {
    switch (data.status) {
      case 'Ready':
        return 'bg-green-500';
      case 'Down':
        return 'bg-red-500';
      case 'Disconnected':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 컨테이너 수에 따른 노드 너비 계산 (최소 200px, 컨테이너당 20px 추가)
  const nodeWidth = Math.max(200, 200 + (data.containerCount - 1) * 20);
  // 노드 높이를 고정값으로 설정
  const nodeHeight = 180; // 모든 노드에 동일한 높이 적용
  
  // 노드 역할에 따른 스타일
  const roleStyles = getRoleStyles(data.role);

  return (
    <div
      className={`
        swarm-node
        p-4 rounded-lg shadow-md border-2 transition-all
        ${selected ? 'selected' : ''}
        ${data.role === 'Manager' ? 'manager' : 'worker'}
      `}
      style={{
        width: `${nodeWidth}px`,
        height: `${nodeHeight}px`,
        background: roleStyles.background,
        borderColor: roleStyles.borderColor,
        color: 'white',
        overflow: 'hidden' // 내용이 넘칠 경우 숨김 처리
      }}
    >

      {/* 노드 내용 */}
      <div className="flex flex-col content" style={{ height: 'calc(100% - 16px)' }}>
        {/* 노드 헤더 */}
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-lg hostname">{data.hostname}</div>
          <div className="flex items-center">
            <span className={`status-indicator ${getStatusIndicatorStyle()}`}></span>
            <span className="text-sm">{data.status || 'Unknown'}</span>
          </div>
        </div>

        {/* 역할 표시 */}
        <div className="mb-2 text-sm">
          <span className="label">
            {data.role}
          </span>
        </div>

        {/* 네트워크 인터페이스 정보 */}
        <div className="text-sm text-gray-100 mt-2 network-info overflow-auto" style={{ maxHeight: '70px' }}>
          <div className="flex flex-col">
            {data.networkInterfaces.map((iface, index) => (
              <div key={index} className="text-xs">
                {iface.name}: {iface.address}
              </div>
            ))}
          </div>
        </div>

        {/* 컨테이너 수 표시 */}
        <div className="mt-auto text-xs text-right">
          컨테이너: {data.containerCount}개
        </div>
      </div>

    </div>
  );
};

// memo를 사용하여 불필요한 리렌더링 방지
export default memo(SwarmNode);