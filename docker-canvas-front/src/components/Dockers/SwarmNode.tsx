import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeData, NodeRole } from '../types/node';
import Container from './Container';
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
 * - 노드에 배치된 컨테이너를 시각적으로 표시
 * - 연결 핸들(Handle)을 통해 다른 노드와 연결 가능
 * - 노드 호스트명 및 상태 정보 표시
 * - 호버 시 간결한 핵심 정보(호스트명, 상태, 역할) 표시
 */
const SwarmNode: React.FC<SwarmNodeProps> = ({ data, selected }) => {
  // 호버 상태 관리
  const [isHovered, setIsHovered] = useState(false);
  // 상세 정보 표시 상태 관리 (추가)
  const [showDetails, setShowDetails] = useState(false);
  
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

  // 컨테이너 수에 따른 노드 너비 계산 (최소 250px, 컨테이너당 50px 추가)
  // 컨테이너가 많을 경우 최대 너비 제한
  const nodeWidth = Math.min(
    600, // 최대 너비
    Math.max(250, 250 + (data.containers.length) * 50) // 최소 너비 및 컨테이너 수에 따른 증가
  );
  
  // 노드 높이 계산 (기본 높이 + 컨테이너 표시 영역)
  // 컨테이너가 많을 경우 스크롤이 생기도록 최대 높이 제한
  const nodeHeight = Math.min(
    400, // 최대 높이
    200 + (Math.ceil(data.containers.length / 2) * 70) // 기본 높이 + 컨테이너 행 수 * 행 높이
  );
  
  // 노드 역할에 따른 스타일
  const roleStyles = getRoleStyles(data.role);

  // 상세 정보 토글 핸들러
  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    setShowDetails(!showDetails);
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
      <div className="flex flex-col content" style={{ height: '100%' }}>
        {/* 헤더 영역 */}
        <div className="flex justify-between items-center mb-3">
          {/* 호스트명 */}
          <h3 className="text-lg font-bold">{data.hostname}</h3>
          
          {/* 상태 표시 */}
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusIndicatorStyle()}`}></span>
            <span className="text-sm">{data.status || 'Unknown'}</span>
          </div>
        </div>

        {/* 역할 및 정보 표시 */}
        <div className="flex justify-between items-center mb-3">
          <div className="mb-2 text-sm">
            <span className="bg-opacity-30 bg-white px-2 py-1 rounded label">
              {data.role}
            </span>
          </div>
          
          {/* 상세 정보 토글 버튼 */}
          <button 
            onClick={toggleDetails}
            className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-2 py-1 transition-colors"
          >
            {showDetails ? '요약 보기' : '상세 정보'}
          </button>
        </div>

        
        {/* 호버 시 보여줄 정보 (간략한 요약) */}
        {isHovered && !showDetails && (
          <div className="hover-info bg-gray-800 bg-opacity-80 absolute inset-0 flex flex-col items-center justify-center p-4 transition-opacity duration-200">
            <h3 className="text-xl font-bold mb-2">{data.hostname}</h3>
            <div className="flex items-center mb-2">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusIndicatorStyle()}`}></span>
              <span>{data.status || 'Unknown'}</span>
            </div>
            <div className="text-lg mb-2">역할: {data.role}</div>
            <div className="text-lg">컨테이너: {data.containers.length}개</div>
          </div>
        )}
      </div>
    </div>
  );
};

// memo를 사용하여 불필요한 리렌더링 방지
export default memo(SwarmNode);