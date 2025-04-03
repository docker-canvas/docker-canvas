import React, { memo, useState } from 'react';  // useState 추가
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
 * - 호버 시 간결한 핵심 정보(호스트명, 상태, 역할) 표시
 */
const SwarmNode: React.FC<SwarmNodeProps> = ({ data, selected }) => {
  // 호버 상태 관리 추가
  const [isHovered, setIsHovered] = useState(false);
  
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
      onMouseEnter={() => setIsHovered(true)}  // 마우스 진입 시 호버 상태 true
      onMouseLeave={() => setIsHovered(false)} // 마우스 이탈 시 호버 상태 false
    >

      {/* 노드 내용 */}
      <div className="flex flex-col content" style={{ height: 'calc(100% - 16px)' }}>
    

        {/* 역할 표시 */}
        <div className="mb-2 text-sm">
          <span className="label">
            {data.role}
          </span>
        </div>

        {/* 호버 시 보여줄 정보 */}
        {isHovered && (
          <div className="hover-info bg-gray-800 bg-opacity-80 absolute inset-0 flex flex-col items-center justify-center p-4 transition-opacity duration-200">
            <h3 className="text-xl font-bold mb-2">{data.hostname}</h3>
            <div className="flex items-center mb-2">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusIndicatorStyle()}`}></span>
              <span>{data.status || 'Unknown'}</span>
            </div>
            <div className="text-lg">역할: {data.role}</div>
          </div>
        )}
      </div>

    </div>
  );
};

// memo를 사용하여 불필요한 리렌더링 방지
export default memo(SwarmNode);