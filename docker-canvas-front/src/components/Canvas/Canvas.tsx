import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Container from '../DockerComponents/Container';
import Network from '../DockerComponents/Network';
import HostMachine from '../DockerComponents/HostMachine';
import ToolBar from './ToolBar';
import { DockerApiService } from '../../services/api';
import { DockerContainer, DockerNetwork, HostMachine as HostMachineType } from '../../types/docker.types';

// 노드 타입 등록
const nodeTypes: NodeTypes = {
  container: Container,
  network: Network,
  host: HostMachine,
};

interface CanvasProps {
  className?: string;
}

const Canvas: React.FC<CanvasProps> = ({ className }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState('hand');
  
  const { zoomIn, zoomOut } = useReactFlow();

  // 데이터 로드 및 노드/엣지 생성
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 실제 API 호출 대신 더미 데이터 사용 (API 연결 전)
      // 실제 구현 시에는 아래 코드로 대체
      // const infra = await DockerApiService.getInfrastructure();
      
      const generatedNodes: Node[] = [];
      const generatedEdges: Edge[] = [];
      
      // 외부 네트워크 노드 (하단)
      const externalNetworkNode: Node = {
        id: 'external-network',
        type: 'network',
        data: { 
          network: { 
            id: 'external-network',
            name: 'External Network',
            driver: 'bridge',
            scope: 'global',
            containers: []
          },
          isExternal: true 
        },
        position: { x: 400, y: 700 },
      };
      generatedNodes.push(externalNetworkNode);
      
      // 상단 mynet 네트워크 노드
      const myNetNode: Node = {
        id: 'mynet',
        type: 'network',
        data: { 
          network: { 
            id: 'mynet',
            name: 'mynet',
            driver: 'overlay',
            scope: 'swarm',
            containers: []
          } 
        },
        position: { x: 400, y: 50 },
      };
      generatedNodes.push(myNetNode);
      
      // 중간 네트워크 노드
      const gwBridgeNode1: Node = {
        id: 'gwbridge-1',
        type: 'network',
        data: { 
          network: { 
            id: 'gwbridge-1',
            name: 'gwbridge',
            driver: 'bridge',
            scope: 'local',
            containers: []
          } 
        },
        position: { x: 200, y: 280 },
      };
      generatedNodes.push(gwBridgeNode1);
      
      const gwBridgeNode2: Node = {
        id: 'gwbridge-2',
        type: 'network',
        data: { 
          network: { 
            id: 'gwbridge-2',
            name: 'gwbridge',
            driver: 'bridge',
            scope: 'local',
            containers: []
          } 
        },
        position: { x: 600, y: 280 },
      };
      generatedNodes.push(gwBridgeNode2);
      
      // 호스트 머신 노드
      const hostNode1: Node = {
        id: 'host-1',
        type: 'host',
        data: { 
          host: { 
            id: 'host-1',
            name: 'Host Machine 1',
            networks: ['gwbridge-1'],
            containers: []
          } 
        },
        position: { x: 200, y: 450 },
      };
      generatedNodes.push(hostNode1);
      
      const hostNode2: Node = {
        id: 'host-2',
        type: 'host',
        data: { 
          host: { 
            id: 'host-2',
            name: 'Host Machine 2',
            networks: ['gwbridge-2'],
            containers: []
          } 
        },
        position: { x: 600, y: 450 },
      };
      generatedNodes.push(hostNode2);
      
      // 컨테이너 노드 (왼쪽 호스트)
      for (let i = 0; i < 4; i++) {
        const containerNode: Node = {
          id: `container-left-${i}`,
          type: 'container',
          data: { 
            container: { 
              id: `container-left-${i}`,
              name: `Container ${i+1}`,
              status: 'running',
              image: 'nginx:latest',
              networkInterfaces: ['mynet']
            } 
          },
          position: { x: 100 + i * 80, y: 180 },
        };
        generatedNodes.push(containerNode);
        
        // 컨테이너와 mynet 연결
        generatedEdges.push({
          id: `edge-mynet-container-left-${i}`,
          source: 'mynet',
          target: `container-left-${i}`,
          type: 'default',
        });
      }
      
      // 컨테이너 노드 (오른쪽 호스트)
      for (let i = 0; i < 4; i++) {
        const containerNode: Node = {
          id: `container-right-${i}`,
          type: 'container',
          data: { 
            container: { 
              id: `container-right-${i}`,
              name: `Container ${i+5}`,
              status: 'running',
              image: 'nginx:latest',
              networkInterfaces: ['mynet']
            } 
          },
          position: { x: 500 + i * 80, y: 180 },
        };
        generatedNodes.push(containerNode);
        
        // 컨테이너와 mynet 연결
        generatedEdges.push({
          id: `edge-mynet-container-right-${i}`,
          source: 'mynet',
          target: `container-right-${i}`,
          type: 'default',
        });
      }
      
      // gwbridge와 호스트 연결
      generatedEdges.push({
        id: 'edge-gwbridge1-host1',
        source: 'gwbridge-1',
        target: 'host-1',
        type: 'default',
      });
      
      generatedEdges.push({
        id: 'edge-gwbridge2-host2',
        source: 'gwbridge-2',
        target: 'host-2',
        type: 'default',
      });
      
      // 호스트와 외부 네트워크 연결
      generatedEdges.push({
        id: 'edge-host1-external',
        source: 'host-1',
        target: 'external-network',
        type: 'default',
      });
      
      generatedEdges.push({
        id: 'edge-host2-external',
        source: 'host-2',
        target: 'external-network',
        type: 'default',
      });
      
      setNodes(generatedNodes);
      setEdges(generatedEdges);
    } catch (error) {
      console.error('Error loading infrastructure data:', error);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);
  
  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // 화면 모드 변경 핸들러
  const handlePanMode = useCallback(() => {
    setActiveMode('hand');
  }, []);
  
  // 줌 인 핸들러
  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);
  
  // 줌 아웃 핸들러
  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);
  
  return (
    <div className={`w-full h-screen ${className}`}>
      {loading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-xl">Loading infrastructure data...</div>
        </div>
      ) : (
        <>
          <ToolBar 
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onPanMode={handlePanMode}
            activeMode={activeMode}
          />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          >
            <Controls showInteractive={false} />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
        </>
      )}
    </div>
  );
};

export default Canvas;