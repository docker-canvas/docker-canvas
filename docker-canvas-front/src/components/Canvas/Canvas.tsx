import React, { useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useReactFlow,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ToolBar from './ToolBar';
import nodeTypes from '../types/nodeType';
import { sampleNodes, sampleNetworks } from '../data/sampleData';
import { calculateLayout } from './layoutCalculator';

/**
 * Canvas 컴포넌트
 * 
 * ReactFlow를 사용하여 Docker Swarm 인프라를 시각화하는 메인 캔버스입니다.
 * 
 * 주요 기능:
 * - Docker Swarm 노드 표시 및 관리
 * - 각 노드의 위쪽에 컨테이너를 가로로 배치
 * - 네트워크 요소들을 배치 규칙에 따라 표시
 *   - External Network: 호스트 머신 전체 폭의 길이와 일치되게 상단에 배치
 *   - Ingress Network: 컨테이너 집합 위에 배치, 전체 폭 일치
 *   - GWBridge Network: 노드 위, 컨테이너 아래 배치, 노드 폭과 일치
 * - 노드 간 연결(엣지) 표시
 * - 캔버스 확대/축소, 이동 기능
 * - 캔버스 초기화 기능
 */
const Canvas: React.FC = () => {
  // ReactFlow 노드와 엣지 상태 관리
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [activeMode, setActiveMode] = useState('hand');
  
  // ResizeObserver 오류 방지를 위한 초기화 상태 추가
  const [initialized, setInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    // ResizeObserver 오류 방지를 위한 지연 초기화
    const timer = setTimeout(() => {
      // 레이아웃 계산 함수를 사용하여 노드, 컨테이너, 네트워크 배치
      const layoutedNodes = calculateLayout(sampleNodes, sampleNetworks);
      setNodes(layoutedNodes);
      setInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [setNodes]);
  
  // 초기화 후 fitView 실행
  useEffect(() => {
    if (initialized) {
      const fitTimer = setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 100);
      
      return () => clearTimeout(fitTimer);
    }
  }, [initialized, fitView]);
  
  // 화면 모드 변경 핸들러
  const handlePanMode = () => {
    setActiveMode('hand');
  };
  
  // 줌 인 핸들러
  const handleZoomIn = () => {
    zoomIn();
  };
  
  // 줌 아웃 핸들러
  const handleZoomOut = () => {
    zoomOut();
  };
  
  // 리프레시 핸들러 (노드와 엣지 초기화)
  const handleRefresh = () => {
    // 노드 및 컨테이너 재배치
    const layoutedNodes = calculateLayout(sampleNodes, sampleNetworks);
    setNodes(layoutedNodes);
    
    // 뷰 리셋
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  };

  return (
    <div className="w-full h-screen relative" ref={containerRef}>
      <ToolBar 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onPanMode={handlePanMode}
        onRefresh={handleRefresh}
        activeMode={activeMode}
      />
      <div className="react-flow-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          fitView={false} // 초기 fitView 비활성화, useEffect에서 수동으로 호출
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Controls showInteractive={false} />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default Canvas;