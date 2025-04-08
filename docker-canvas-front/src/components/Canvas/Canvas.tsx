import React, { useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ToolBar from './ToolBar';
import nodeTypes from '../types/nodeType';
import edgeTypes from '../types/edgeType';
import { sampleNodes, sampleNetworks } from '../data/sampleData';
import { generateLayout } from './layoutEngine';
import { useStreamDockerEvents } from '../data/api_events'
import { useDockerAPI } from '../data/api_others';
import { simpleSampleNetworks, simpleSampleNodes } from '../data/simpleSampleData';

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
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeMode, setActiveMode] = useState('hand');
  const { eventData, loading, error } = useStreamDockerEvents('http://localhost:3001/docker/events');
  const { taskData, nodeData, networkData, serviceData } = useDockerAPI('init');
  
  // ResizeObserver 오류 방지를 위한 초기화 상태 추가
  const [initialized, setInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    // ResizeObserver 오류 방지를 위한 지연 초기화
    const timer = setTimeout(() => {
      // 레이아웃 엔진을 사용하여 노드와 엣지 생성
      const { nodes: layoutedNodes, edges: layoutedEdges } = generateLayout(sampleNodes, sampleNetworks);
      // const { nodes: layoutedNodes, edges: layoutedEdges } = generateLayout(simpleSampleNodes, simpleSampleNetworks);
      
      // 노드와 엣지 설정
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      
      setInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [setNodes, setEdges]);
  
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
    console.log(taskData);
    console.log(nodeData);
    console.log(networkData);
    console.log(serviceData);
    // 레이아웃 엔진을 사용하여 노드와 엣지 재생성
    const { nodes: layoutedNodes, edges: layoutedEdges } = generateLayout(sampleNodes, sampleNetworks);
    
    
    // 노드와 엣지 업데이트
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    // 뷰 리셋
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  };

  return (
    <div className="w-full h-screen relative" ref={containerRef}>
      {/* 툴바 컴포넌트 - 줌인/줌아웃, 패닝 모드, 새로고침 기능 제공 */}
      <ToolBar 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onPanMode={handlePanMode}
        onRefresh={handleRefresh}
        activeMode={activeMode}
      />
      
      {/* ReactFlow 캔버스 래퍼 */}
      <div className="react-flow-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={false}  // 노드 드래그 비활성화 (레이아웃 유지)
          fitView={false}         // 초기 fitView 비활성화, useEffect에서 수동으로 호출
          minZoom={0.1}           // 최소 줌 레벨
          maxZoom={2}             // 최대 줌 레벨
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          connectOnClick={false}  // 클릭으로 연결 비활성화
        >
          {/* 기본 컨트롤 패널 (줌, 패닝 등) */}
          <Controls showInteractive={false} />
          
          {/* 배경 그리드 패턴 */}
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default Canvas;