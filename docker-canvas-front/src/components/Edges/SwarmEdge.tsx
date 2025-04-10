// src/components/Edges/SwarmEdge.tsx
// VXLAN 타입만 라벨을 표시하도록 수정

import React from 'react';
import { 
  EdgeProps, 
  getStraightPath, 
  EdgeLabelRenderer 
} from 'reactflow';

/**
 * 엣지 타입 정의
 * 각 연결 타입에 따라 다른 스타일을 적용합니다.
 */
export type SwarmEdgeType = 'default' | 'vxlan';

/**
 * SwarmEdge 컴포넌트
 * 
 * Docker Swarm의 다양한 연결을 표현하는 엣지 컴포넌트입니다.
 * 데이터의 edgeType 속성에 따라 다른 스타일을 적용합니다.
 * 
 * 엣지 타입:
 * - default: 일반 네트워크 연결 (실선, 회색)
 * - vxlan: VXLAN 가상 연결 (붉은색 점선) - 라벨 표시
 * - ingress: Ingress 네트워크 연결 (주황색 실선)
 * 
 * 모든 엣지는 요구사항에 맞게 수직 직선으로만 연결됩니다.
 */
const SwarmEdge: React.FC<EdgeProps> = ({ 
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}) => {
  // 수직 직선 경로 계산
  const [path, centerX, centerY] = getStraightPath({
    sourceX,
    sourceY,
    targetX, 
    targetY
  });

  
  // 엣지 타입에 따른 스타일 계산
  const getEdgeStyle = () => {
    // 기본 타입 (default) - 검정/회색 실선 (컨테이너-오버레이 연결용)
    let edgeStyle = {
      stroke: '#333', // 좀 더 진한 검정에 가까운 색상으로 변경
      strokeWidth: 2,
      ...style,
    };
  
    // 타입별 스타일 적용
    switch (data?.edgeType) {
      case 'vxlan':
        // VXLAN 타입 - 붉은색 점선 (노드-오버레이 연결용)
        edgeStyle = {
          ...edgeStyle,
          stroke: '#E53E3E', // 붉은색
          strokeDasharray: '5, 5', // 점선 패턴
        };
        break;
      
      case 'ingress':
        // Ingress 타입 - 주황색 실선 (GWBridge-오버레이 연결용)
        edgeStyle = {
          ...edgeStyle,
          stroke: '#ED8936', // 주황색
        };
        break;
      
      default:
        // 기본 타입 - 검정/회색 실선 유지 (컨테이너-오버레이 연결용)
        break;
    }
    
    // 선택 상태인 경우 강조 스타일 적용
    if (selected) {
      edgeStyle.strokeWidth = 3;
      
      // 타입별로 다른 강조 색상 적용
      if (data?.edgeType === 'vxlan') {
        edgeStyle.stroke = '#C53030'; // 더 진한 붉은색
      } else if (data?.edgeType === 'ingress') {
        edgeStyle.stroke = '#C05621'; // 더 진한 주황색
      } else {
        edgeStyle.stroke = '#000'; // 기본 타입은 검은색으로 강조
      }
    }
    
    return edgeStyle;
  };


  // 호버 효과를 위한 상태
  const [isHovered, setIsHovered] = React.useState(false);
  
  // 최종 스타일 계산
  const edgeStyle = getEdgeStyle();
  
  // 호버 시 스타일 변경
  if (isHovered) {
    edgeStyle.strokeWidth = 3;
    
    // 타입별로 다른 색상 적용
    if (data?.edgeType === 'vxlan') {
      edgeStyle.stroke = '#C53030'; // 더 진한 붉은색
    } else if (data?.edgeType === 'ingress') {
      edgeStyle.stroke = '#C05621'; // A' 접 싙긐탅ㅎ색
    } else {
      edgeStyle.stroke = '#000'; // 일반 타입은 검은색
    }
  }

  // 라벨 스타일 계산
  const getLabelStyle = () => {
    return {
      position: 'absolute',
      transform: `translate(-50%, -50%) translate(${centerX}px,${centerY}px)`,
      fontSize: 12,
      pointerEvents: 'all',
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
      padding: '2px 4px',
      borderRadius: 4,
      color: data?.edgeType === 'vxlan' ? '#C53030' : '#000',
    } as React.CSSProperties;
  };

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={path}
        style={edgeStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
      {/* VXLAN 타입의 엣지만 라벨 표시 */}
      {data?.edgeType === 'vxlan' && data?.label && (
        <EdgeLabelRenderer>
          <div
            style={getLabelStyle()}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default SwarmEdge;