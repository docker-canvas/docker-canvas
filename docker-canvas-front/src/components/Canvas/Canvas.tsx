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
import { NodeData } from '../types/node';
import { ContainerData } from '../types/container';
import Container from '../Dockers/Container';
import SwarmNode from '../Dockers/SwarmNode';

/**
 * Canvas 컴포넌트
 * 
 * ReactFlow를 사용하여 Docker Swarm 인프라를 시각화하는 메인 캔버스입니다.
 * 
 * 주요 기능:
 * - Docker Swarm 노드 표시 및 관리
 * - 각 노드의 위쪽에 컨테이너를 가로로 배치
 * - 노드 간 연결(엣지) 표시
 * - 캔버스 확대/축소, 이동 기능
 * - 캔버스 초기화 기능
 */


const customNodeTypes = {
  swarmNode: SwarmNode,
  container: Container
};

const Canvas: React.FC = () => {
  // ReactFlow 노드와 엣지 상태 관리
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [activeMode, setActiveMode] = useState('hand');
  
  // ResizeObserver 오류 방지를 위한 초기화 상태 추가
  const [initialized, setInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  // 샘플 컨테이너 데이터 (실제로는 API에서 가져올 예정)
  const getSampleContainers = (nodeId: string, count: number): ContainerData[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${nodeId}-container-${i+1}`,
      name: `${nodeId.replace('node-', '')}-container-${i+1}`,
      image: i % 3 === 0 ? 'nginx:latest' : (i % 3 === 1 ? 'redis:alpine' : 'postgres:13'),
      status: i % 4 === 0 ? 'stopped' : 'running',
      networks: [
        {
          name: i % 2 === 0 ? 'bridge' : 'docker_gwbridge',
          driver: i % 2 === 0 ? 'bridge' : 'overlay',
          ipAddress: `172.17.0.${10 + i}`
        },
        // 일부 컨테이너에는 추가 네트워크 연결
        ...(i % 3 === 0 ? [{
          name: 'app-network',
          driver: 'overlay',
          ipAddress: `10.0.0.${i+1}`
        }] : [])
      ],
      ports: i % 2 === 0 ? [
        { internal: 80, external: 8080 + i, protocol: 'tcp' }
      ] : [],
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    }));
  };
  
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
      containers: getSampleContainers('node-1', 5),
      labels: {
        'node.role': 'manager'
      }
    },
    {
      id: 'node-5',
      hostname: 'swarm-manager-01',
      role: 'Manager',
      networkInterfaces: [
        { name: 'eth0', address: '192.168.1.10' }
      ],
      status: 'Ready',
      containers: [],
      labels: {
        'node.role': 'manager'
      }
    },
    {
      id: 'node-2',
      hostname: 'swarm-worker-01',
      role: 'Worker',
      networkInterfaces: [
        { name: 'eth0', address: '192.168.1.11' }
      ],
      status: 'Ready',
      containers: getSampleContainers('node-2', 8),
      labels: {
        'node.role': 'worker'
      }
    },
    {
      id: 'node-3',
      hostname: 'swarm-worker-02',
      role: 'Worker',
      networkInterfaces: [
        { name: 'eth0', address: '192.168.1.12' }
      ],
      status: 'Down',
      containers: getSampleContainers('node-3', 3),
      labels: {
        'node.role': 'worker'
      }
    }
  ];
  
  
  // 컨테이너 간격 및 크기 설정
  const containerWidth = 120; // 컨테이너 너비
  const containerGap = 10;    // 컨테이너 간격
  const containerHeight = 30; // 컨테이너 높이
  const containerTopMargin = 40; // 컨테이너와 노드 사이의 간격
  
  // 노드 및 컨테이너 배치 함수
  const layoutNodesAndContainers = (nodeData: NodeData[]): Node[] => {
    const horizontalGap = 200; // 노드 간 수평 간격
    const baseY = 200; // 노드의 기본 Y 좌표 (컨테이너가 위에 배치되므로 더 아래로)
    
    let currentX = 50; // 시작 X 좌표
    const nodes: Node[] = [];
    
    // 노드 생성
    nodeData.forEach((node, index) => {
      // 컨테이너 수에 따른 노드 너비 계산
      // 컨테이너가 많으면 노드도 그에 비례해 넓어지도록 설정
      const containersWidth = node.containers.length * containerWidth + (node.containers.length - 1) * containerGap;
      const nodeWidth = Math.max(400, containersWidth); // 최소 너비 400px
      
      // 노드 생성 및 추가
      nodes.push({
        id: node.id,
        type: 'swarmNode',
        position: { x: currentX, y: baseY },
        data: node,
        style: { width: nodeWidth } // 노드 너비 설정
      });
      
      // 컨테이너 노드 생성 및 배치
      node.containers.forEach((container, containerIndex) => {
        // 컨테이너 X 위치 계산 (노드 왼쪽 가장자리 + 컨테이너 인덱스 * (너비 + 간격))
        const containerX = currentX + containerIndex * (containerWidth + containerGap);
        // 컨테이너 Y 위치 계산 (노드 Y 위치 - 컨테이너 높이 - 간격)
        const containerY = baseY - containerHeight - containerTopMargin;
        
        // 컨테이너 노드 생성
        const containerId = `container-${node.id}-${containerIndex}`;
        nodes.push({
          id: containerId,
          position: { x: containerX, y: containerY },
          data: container,
          type: 'container', // 컨테이너 노드 타입
          style: {
            width: containerWidth,
            height: containerHeight
          }
        });
      });
      
      // 다음 노드의 시작 X 좌표 업데이트 (현재 노드 너비 + 간격)
      currentX += nodeWidth + horizontalGap;
    });
    
    return nodes;
  };
  
  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    // ResizeObserver 오류 방지를 위한 지연 초기화
    const timer = setTimeout(() => {
      // 노드와 컨테이너 배치
      const layoutedNodes = layoutNodesAndContainers(sampleNodes);
      setNodes(layoutedNodes);
      setInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [setNodes]); // 의존성 배열 수정
  
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
    const layoutedNodes = layoutNodesAndContainers(sampleNodes);
    setNodes(layoutedNodes);
    
    // 뷰 리셋
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  };

  // 컨테이너 노드 렌더링 함수
  const renderContainer = ({ data }: { data: ContainerData }) => {
    return <Container data={data} />;
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
          nodeTypes={customNodeTypes}
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