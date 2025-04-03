import React, { useState, useEffect } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  useReactFlow,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import ToolBar from './ToolBar';
import nodeTypes from '../types/nodeType'
import { SwarmNode, NodeData } from '../types/node';

/**
 * Canvas 컴포넌트
 * 
 * ReactFlow를 사용하여 Docker Swarm 인프라를 시각화하는 메인 캔버스입니다.
 * 
 * 주요 기능:
 * - Docker Swarm 노드 표시 및 관리
 * - 노드 간 연결(엣지) 표시
 * - 캔버스 확대/축소, 이동 기능
 * - 캔버스 초기화 기능
 */
const Canvas: React.FC = () => {
  // ReactFlow 노드와 엣지 상태 관리
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeMode, setActiveMode] = useState('hand');
  
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  // 샘플 노드 데이터 (실제로는 API에서 가져올 예정)
  const sampleNodes: NodeData[] = [
    {
      id: 'node-1',
      hostname: 'swarm-manager-01',
      role: 'Manager',
      networkInterfaces: [
        { name: 'eth0', address: '192.168.1.10' }
      ],
      status: 'Ready',
      containerCount: 3,
    },
    {
      id: 'node-2',
      hostname: 'swarm-worker-01',
      role: 'Worker',
      networkInterfaces: [
        { name: 'eth0', address: '192.168.1.11' }
      ],
      status: 'Ready',
      containerCount: 5,
    },
    {
      id: 'node-3',
      hostname: 'swarm-worker-02',
      role: 'Worker',
      networkInterfaces: [
        { name: 'eth0', address: '192.168.1.12' }
      ],
      status: 'Down',
      containerCount: 1,
    }
  ];
  
  // 노드 배치 함수 (컨테이너 수에 따라 너비를 계산하고, 노드 간 겹침 없이 배치)
  const layoutNodes = (nodeData: NodeData[]): Node[] => {
    const horizontalGap = 100; // 노드 간 수평 간격
    const baseY = 100; // 기본 Y 좌표
    
    let currentX = 50; // 시작 X 좌표
    
    return nodeData.map((node, index) => {
      // 컨테이너 수에 따른 노드 너비 계산
      const nodeWidth = Math.max(200, 200 + (node.containerCount - 1) * 20);
      
      // 현재 노드의 X 좌표 계산
      const xPos = currentX;
      
      // 다음 노드의 시작 X 좌표 업데이트 (현재 노드 너비 + 간격)
      currentX += nodeWidth + horizontalGap;
      
      // 노드 생성
      return {
        id: node.id,
        type: 'swarmNode',
        position: { x: xPos, y: baseY },
        data: node,
      };
    });
  };
  
  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    // 샘플 노드 데이터로 노드 생성 및 레이아웃 적용
    const layoutedNodes = layoutNodes(sampleNodes);
    setNodes(layoutedNodes);
    
    
    // 노드가 모두 보이도록 뷰 조정
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  }, [fitView]);
  
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
    // 노드 재배치
    const layoutedNodes = layoutNodes(sampleNodes);
    setNodes(layoutedNodes);
    
    // 뷰 리셋
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  };

  return (
    <div className="w-full h-screen relative">
      <ToolBar 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onPanMode={handlePanMode}
        onRefresh={handleRefresh}
        activeMode={activeMode}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Controls showInteractive={false} />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default Canvas;