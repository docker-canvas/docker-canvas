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
import InterfaceNode from '../DockerComponents/InterfaceNode';
import ToolBar from './ToolBar';
import { DockerContainer, DockerNetwork, HostMachine as HostMachineType } from '../../types/docker.types';
import { NetworkInterfaceData } from '../DockerComponents/NetworkInterface';

// 노드 타입 등록
const nodeTypes: NodeTypes = {
  'container': Container,
  'network': Network,
  'host': HostMachine,
  'network-interface': InterfaceNode,
};

interface NetworkInterfaceConnectionInfo {
  networkId: string;
  containerId?: string;
  hostId?: string;
  ifaceId: string;
  direction: 'in' | 'out';
}

interface CanvasProps {
  className?: string;
  containers?: DockerContainer[];
  networks?: DockerNetwork[];
  hosts?: HostMachineType[];
  // 테스트 모드 - true일 경우 내부 더미 데이터 사용
  testMode?: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ 
  className, 
  containers = [], 
  networks = [], 
  hosts = [],
  testMode = false
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState('hand');
  
  const { zoomIn, zoomOut } = useReactFlow();
  
  // 레이아웃 관련 상수
  const VIEWPORT_WIDTH = 1200;
  const VIEWPORT_HEIGHT = 800;
  const HOST_WIDTH = 300;
  const HOST_HEIGHT = 200; // 추가: HOST_HEIGHT 정의
  const CONTAINER_WIDTH = 120;
  const CONTAINER_HEIGHT = 120;
  const NETWORK_HEIGHT = 60;
  const VERTICAL_GAP = 120;

  const createInterfaceNode = useCallback((
    id: string,
    type: 'overlay' | 'bridge' | 'host' | 'external' | 'container' | 'gwbridge',
    name: string,
    x: number,
    y: number,
    connectionPoints: {
      top?: boolean,
      bottom?: boolean,
      left?: boolean,
      right?: boolean
    } = { top: true, bottom: true }
  ): Node => {
    return {
      id,
      type: 'network-interface',
      data: {
        interface: {
          id,
          name,
          type,
          connectionPoints
        }
      },
      position: { x, y }
    };
  }, []);

  // 테스트 데이터 생성 함수
  const generateTestData = useCallback(() => {
    // 호스트 머신 생성
    const hosts: HostMachineType[] = [
      {
        id: 'host-1',
        name: 'Host Machine 1',
        role: 'manager', // 추가된 필드
        status: 'Ready', // 추가된 필드
        networks: ['bridge-1', 'mynet'],
        containers: ['1-container-1', '1-container-2']
      },
      {
        id: 'host-2',
        name: 'Host Machine 2',
        role: 'worker', // 추가된 필드
        status: 'Ready', // 추가된 필드
        networks: ['bridge-2', 'mynet'],
        containers: ['2-container-1', '2-container-2']
      }
    ];
    // 네트워크 생성
    const networks: DockerNetwork[] = [
      {
        id: 'mynet',
        name: 'mynet',
        driver: 'overlay',
        scope: 'swarm',
        containers: ['1-container-1', '1-container-2', '2-container-1', '2-container-2']
      },
      {
        id: 'bridge-1',
        name: 'bridge-1',
        driver: 'bridge',
        scope: 'local',
        containers: ['1-container-1', '1-container-2']
      },
      {
        id: 'bridge-2',
        name: 'bridge-2',
        driver: 'bridge',
        scope: 'local',
        containers: ['2-container-1', '2-container-2']
      },
      {
        id: 'external-network',
        name: 'External Network',
        driver: 'bridge',
        scope: 'global',
        containers: []
      }
    ];
    
    // 컨테이너 생성 (ID 형식을 호스트 번호와 일치하도록 수정)
    const containers: DockerContainer[] = [
      {
        id: '1-container-1', // 호스트 1의 컨테이너
        name: 'Container 1',
        status: 'running',
        image: 'nginx:latest',
        networkInterfaces: ['mynet', 'bridge-1']
      },
      {
        id: '1-container-2', // 호스트 1의 컨테이너
        name: 'Container 2',
        status: 'running',
        image: 'postgres:latest',
        networkInterfaces: ['mynet', 'bridge-1']
      },
      {
        id: '2-container-1', // 호스트 2의 컨테이너
        name: 'Container 3',
        status: 'running',
        image: 'redis:latest',
        networkInterfaces: ['mynet', 'bridge-2']
      },
      {
        id: '2-container-2', // 호스트 2의 컨테이너
        name: 'Container 4',
        status: 'running',
        image: 'mysql:latest',
        networkInterfaces: ['mynet', 'bridge-2']
      }
    ];
    
    return { containers, networks, hosts };
  }, []);
  
  // 인터페이스 연결 정보 수집 및 처리
  const collectInterfaceConnections = useCallback((
    allContainers: DockerContainer[],
    allNetworks: DockerNetwork[],
    allHosts: HostMachineType[]
  ): NetworkInterfaceConnectionInfo[] => {
    const connections: NetworkInterfaceConnectionInfo[] = [];
    
    // 컨테이너-네트워크 연결 정보 수집
    allContainers.forEach(container => {
      container.networkInterfaces.forEach(networkName => {
        // 해당 네트워크 찾기
        const network = allNetworks.find(n => n.name === networkName);
        if (network) {
          // 컨테이너가 네트워크에 연결되어 있음을 나타내는 정보 추가
          connections.push({
            networkId: network.id,
            containerId: container.id,
            ifaceId: `${container.id}-if`,
            direction: 'out'
          });
        }
      });
    });
    
    // 호스트-네트워크 연결 정보 수집
    allHosts.forEach(host => {
      host.networks.forEach(networkName => {
        // 해당 네트워크 찾기
        const network = allNetworks.find(n => n.name === networkName);
        if (network) {
          // 호스트가 네트워크에 연결되어 있음을 나타내는 정보 추가
          // 브릿지 네트워크 인터페이스
          connections.push({
            networkId: network.id,
            hostId: host.id,
            ifaceId: `${host.id}-if-bridge`,
            direction: 'in'
          });
          
          // 호스트 외부 네트워크 인터페이스 (예: 인터넷 연결)
          if (network.scope === 'global' || network.driver === 'bridge') {
            connections.push({
              networkId: network.id,
              hostId: host.id,
              ifaceId: `${host.id}-if-host`,
              direction: 'out'
            });
          }
        }
      });
    });
    
    return connections;
  }, []);
  
  // 인터페이스 노드 및 엣지 생성
  const createInterfaceNodesAndEdges = useCallback((
    connections: NetworkInterfaceConnectionInfo[],
    existingNodes: Node[]
  ): { nodes: Node[], edges: Edge[] } => {
    const interfaceNodes: Node[] = [];
    const interfaceEdges: Edge[] = [];
    
    // 이미 생성된 노드들의 ID 맵
    const nodeIdMap = new Map<string, Node>();
    existingNodes.forEach(node => {
      nodeIdMap.set(node.id, node);
    });
    
    // 연결 정보를 기반으로 엣지 생성
    connections.forEach(conn => {
      const sourceNode = conn.containerId 
        ? nodeIdMap.get(conn.containerId)
        : (conn.hostId ? nodeIdMap.get(conn.hostId) : null);
        
      const targetNode = nodeIdMap.get(conn.networkId);
      
      if (sourceNode && targetNode) {
        if (conn.direction === 'out') {
          // 소스(컨테이너/호스트)에서 네트워크로 연결
          interfaceEdges.push({
            id: `edge-${conn.ifaceId}-${conn.networkId}`,
            source: sourceNode.id,
            sourceHandle: `${conn.ifaceId}-out`,
            target: targetNode.id,
            targetHandle: `${conn.networkId}-in`,
            type: 'default',
          });
        } else {
          // 네트워크에서 소스(호스트)로 연결
          interfaceEdges.push({
            id: `edge-${conn.networkId}-${conn.ifaceId}`,
            source: targetNode.id,
            sourceHandle: `${conn.networkId}-out`,
            target: sourceNode.id,
            targetHandle: `${conn.ifaceId}-in`,
            type: 'default',
          });
        }
      }
    });
    
    return { nodes: interfaceNodes, edges: interfaceEdges };
  }, []);

  // 호스트별 컨테이너 분류 함수
  const mapContainersToHosts = useCallback((
    allContainers: DockerContainer[],
    allHosts: HostMachineType[]
  ): Map<string, DockerContainer[]> => {
    const hostContainerMap = new Map<string, DockerContainer[]>();
    
    allContainers.forEach(container => {
      // 컨테이너 ID 형식에서 호스트 번호 추출 (예: '1-container-1' -> 호스트 번호는 1)
      const containerHostId = container.id.split('-')[0];
      const hostId = `host-${containerHostId}`;
      
      if (!hostContainerMap.has(hostId)) {
        hostContainerMap.set(hostId, []);
      }
      const containerList = hostContainerMap.get(hostId);
      if (containerList) {
        containerList.push(container);
      }
    });
    
    return hostContainerMap;
  }, []);

  // 컨테이너별 노드 및 엣지 생성
  const createContainerNodesAndEdges = useCallback((
    allContainers: DockerContainer[],
    allNetworks: DockerNetwork[],
    allHosts: HostMachineType[],
    startX: number,
    hostGap: number
  ): { nodes: Node[], edges: Edge[] } => {
    const calculatedNodes: Node[] = [];
    const calculatedEdges: Edge[] = [];
    
    // 호스트별 컨테이너 매핑
    const hostContainerMap = mapContainersToHosts(allContainers, allHosts);
    
    // 호스트별로 컨테이너 노드 추가
    allHosts.forEach((host, hostIdx) => {
      const hostContainers = hostContainerMap.get(host.id) || [];
      const hostX = startX + hostIdx * (HOST_WIDTH + hostGap);
      
      // 컨테이너 배치를 위한 그리드 계산
      const containerPerRow = 2;
      const containerGap = 20;
      
      hostContainers.forEach((container: DockerContainer, containerIdx: number) => {
        const row = Math.floor(containerIdx / containerPerRow);
        const col = containerIdx % containerPerRow;
        
        // 컨테이너 인터페이스
        const containerInterfaces: NetworkInterfaceData[] = [
          { 
            id: `${container.id}-if`,
            name: `container-if-${containerIdx+1}`,
            type: 'container',
            connectionPoints: { 
              top: false, 
              bottom: true, 
              left: false, 
              right: false 
            }
          }
        ];
        
        // 컨테이너 노드 추가
        calculatedNodes.push({
          id: container.id,
          type: 'container',
          data: { 
            container,
            interfaces: containerInterfaces
          },
          position: { 
            x: hostX - 70 + col * (CONTAINER_WIDTH + containerGap), 
            y: 150 + row * (CONTAINER_HEIGHT + containerGap)
          },
        });
        
        // 컨테이너와 네트워크 연결
        container.networkInterfaces.forEach((networkName: string) => {
          const network = allNetworks.find(n => n.name === networkName);
          if (network) {
            // 컨테이너에서 네트워크로 연결 생성
            calculatedEdges.push({
              id: `edge-${container.id}-${network.id}`,
              source: container.id,
              sourceHandle: `${container.id}-if-out`,
              target: network.id,
              targetHandle: network.driver === 'overlay' ? undefined : undefined,
              type: 'default',
            });
          }
        });
      });
    });
    
    return { nodes: calculatedNodes, edges: calculatedEdges };
  }, [HOST_WIDTH, CONTAINER_WIDTH, CONTAINER_HEIGHT, mapContainersToHosts]);
  
  // 노드 위치 계산을 위한 레이아웃 알고리즘


const calculateLayout = useCallback((
  allContainers: DockerContainer[],
  allNetworks: DockerNetwork[],
  allHosts: HostMachineType[]
): { nodes: Node[], edges: Edge[] } => {
  console.log("Calculating Swarm layout for:", allContainers, allNetworks, allHosts);
  
  const calculatedNodes: Node[] = [];
  const calculatedEdges: Edge[] = [];
  
  // 호스트별 컨테이너 매핑
  const hostContainerMap = mapContainersToHosts(allContainers, allHosts);
  
  // 호스트 수에 따라 간격 조정
  const hostCount = allHosts.length || 1;
  const CONTAINER_PER_ROW = 4; // 행당 컨테이너 수
  
  // 호스트별 폭 계산 (컨테이너 수에 비례)
  const hostWidths = new Map<string, number>();
  allHosts.forEach(host => {
    const containerCount = hostContainerMap.get(host.id)?.length || 0;
    // 최소 폭 또는 컨테이너 수에 비례한 폭 중 큰 값을 사용
    const width = Math.max(HOST_WIDTH, Math.ceil(containerCount / CONTAINER_PER_ROW) * (CONTAINER_WIDTH + 10) + 20);
    hostWidths.set(host.id, width);
  });
  
  // 전체 레이아웃 폭 계산 (모든 호스트 폭 + 간격)
  const totalHostWidth = Array.from(hostWidths.values()).reduce((sum, width) => sum + width, 0);
  const hostGap = Math.min(80, (VIEWPORT_WIDTH - totalHostWidth) / (hostCount + 1));
  const totalWidth = totalHostWidth + (hostCount - 1) * hostGap;
  const startX = (VIEWPORT_WIDTH - totalWidth) / 2;
  
  // 1. ingress 네트워크 (최상단에 배치)
  const ingressNetwork = allNetworks.find(n => n.name === 'ingress');
  if (ingressNetwork) {
    calculatedNodes.push({
      id: ingressNetwork.id,
      type: 'network',
      data: { 
        network: ingressNetwork,
        isOverlay: true,
        hostWidth: totalWidth
      },
      position: { 
        x: VIEWPORT_WIDTH / 2 - totalWidth / 2, 
        y: 50 
      },
      style: { width: totalWidth }
    });
  }
  
  // 2. overlay 네트워크 (ingress 아래에 배치)
  const overlayNetworks = allNetworks.filter(n => n.driver === 'overlay' && n.name !== 'ingress');
  if (overlayNetworks.length > 0) {
    overlayNetworks.forEach((network, idx) => {
      // 오버레이 네트워크용 인터페이스 생성 (호스트마다 하나씩)
      const interfaceNodes: Node[] = [];
      
      // 오버레이 네트워크 노드 추가
      calculatedNodes.push({
        id: network.id,
        type: 'network',
        data: { 
          network,
          isOverlay: true,
          hostWidth: totalWidth
        },
        position: { 
          x: VIEWPORT_WIDTH / 2 - totalWidth / 2, 
          y: ingressNetwork ? 130 : 50 
        },
        style: { width: totalWidth }
      });
      
      // 인터페이스 노드 생성 및 연결
      let currentX = startX;
      allHosts.forEach((host, hostIdx) => {
        const hostWidth = hostWidths.get(host.id) || HOST_WIDTH;
        const ifaceX = currentX + hostWidth / 2;
        const ifaceId = `${network.id}-if-${host.id}`;
        
        // 인터페이스 노드 생성 및 추가
        const interfaceNode = createInterfaceNode(
          ifaceId,
          'overlay',
          'overlay-if',
          ifaceX,
          ingressNetwork ? 180 : 100,
          { top: false, bottom: true }
        );
        
        interfaceNodes.push(interfaceNode);
        calculatedNodes.push(interfaceNode);
        
        // 인터페이스와 오버레이 네트워크 간 엣지 추가
        calculatedEdges.push({
          id: `edge-${network.id}-${ifaceId}`,
          source: network.id,
          target: ifaceId,
          type: 'straight',
        });
        
        currentX += hostWidth + hostGap;
      });
    });
  }
  
  // 3. 호스트, gwbridge 및 컨테이너 배치
  let currentX = startX;
  allHosts.forEach((host, hostIdx) => {
    const hostWidth = hostWidths.get(host.id) || HOST_WIDTH;
    const hostY = 400; // 호스트 위치 (중간)
    
    // 해당 호스트의 컨테이너들
    const hostContainers = hostContainerMap.get(host.id) || [];
    
    // gwbridge 네트워크 배치 (호스트 바로 위에)
    const gwbridgeNetwork = allNetworks.find(n => 
      n.driver === 'bridge' && 
      n.name === 'gwbridge' && 
      n.id.includes(host.id.split('-')[1])
    );
    
    if (gwbridgeNetwork) {
      // gwbridge 네트워크 노드 추가 (호스트와 동일한 폭)
      calculatedNodes.push({
        id: gwbridgeNetwork.id,
        type: 'gwbridge',
        data: { 
          network: gwbridgeNetwork,
          hostWidth: hostWidth
        },
        position: { 
          x: currentX, 
          y: hostY - 80 // 호스트 바로 위에 배치
        },
        style: { width: hostWidth }
      });
      
      // gwbridge와 오버레이 네트워크 연결
      if (overlayNetworks.length > 0) {
        const overlayNetwork = overlayNetworks[0];
        const overlayIfaceId = `${overlayNetwork.id}-if-${host.id}`;
        
        calculatedEdges.push({
          id: `edge-${overlayIfaceId}-${gwbridgeNetwork.id}`,
          source: overlayIfaceId,
          target: gwbridgeNetwork.id,
          type: 'straight',
        });
      }
    }
    
    // 호스트 노드 추가
    calculatedNodes.push({
      id: host.id,
      type: 'host',
      data: { host },
      position: { x: currentX, y: hostY },
      style: { width: hostWidth, height: HOST_HEIGHT }
    });
    
    // 호스트와 gwbridge 네트워크 연결
    if (gwbridgeNetwork) {
      calculatedEdges.push({
        id: `edge-${gwbridgeNetwork.id}-${host.id}`,
        source: gwbridgeNetwork.id,
        target: host.id,
        type: 'straight',
      });
    }
    
    // 컨테이너 배치 (gwbridge 네트워크 아래, 호스트 위)
    const containerPerRow = CONTAINER_PER_ROW; // 컨테이너 행당 갯수
    
    hostContainers.forEach((container, containerIdx) => {
      const row = Math.floor(containerIdx / containerPerRow);
      const col = containerIdx % containerPerRow;
      
      const containerX = currentX + 10 + col * (CONTAINER_WIDTH + 10);
      const containerY = hostY - 150 - (row * (CONTAINER_HEIGHT + 10));
      
      // 컨테이너 노드 추가
      calculatedNodes.push({
        id: container.id,
        type: 'container',
        data: { container },
        position: { 
          x: containerX, 
          y: containerY
        },
        style: { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }
      });
      
      // 컨테이너와 gwbridge 네트워크 연결
      if (gwbridgeNetwork) {
        calculatedEdges.push({
          id: `edge-${container.id}-${gwbridgeNetwork.id}`,
          source: container.id,
          target: gwbridgeNetwork.id,
          type: 'straight',
        });
      }
    });
    
    // 호스트 외부 네트워크 인터페이스
    const externalIfaceId = `${host.id}-external-if`;
    const externalIfaceNode = createInterfaceNode(
      externalIfaceId,
      'host',
      'eth0',
      currentX + hostWidth / 2,
      hostY + HOST_HEIGHT + 30,
      { top: false, bottom: true }
    );
    
    calculatedNodes.push(externalIfaceNode);
    
    // 호스트와 외부 인터페이스 연결
    calculatedEdges.push({
      id: `edge-${host.id}-${externalIfaceId}`,
      source: host.id,
      target: externalIfaceId,
      type: 'straight',
    });
    
    // 다음 호스트의 X 좌표 계산
    currentX += hostWidth + hostGap;
  });
  
  // 4. 외부 네트워크 (맨 아래)
  const externalNetwork = allNetworks.find(n => n.name === 'External Network');
  if (externalNetwork) {
    calculatedNodes.push({
      id: externalNetwork.id,
      type: 'network',
      data: { 
        network: externalNetwork,
        isExternal: true,
        hostWidth: totalWidth
      },
      position: { 
        x: VIEWPORT_WIDTH / 2 - totalWidth / 2, 
        y: 650 // 맨 아래 배치
      },
      style: { width: totalWidth }
    });
    
    // 각 호스트의 외부 인터페이스와 외부 네트워크 연결
    allHosts.forEach((host) => {
      const externalIfaceId = `${host.id}-external-if`;
      
      calculatedEdges.push({
        id: `edge-${externalIfaceId}-${externalNetwork.id}`,
        source: externalIfaceId,
        target: externalNetwork.id,
        type: 'straight',
      });
    });
  }
  
  console.log("Generated Swarm nodes:", calculatedNodes);
  console.log("Generated Swarm edges:", calculatedEdges);
  
  return { nodes: calculatedNodes, edges: calculatedEdges };
}, [
  VIEWPORT_WIDTH, 
  HOST_WIDTH, 
  HOST_HEIGHT, 
  CONTAINER_WIDTH, 
  CONTAINER_HEIGHT,
  mapContainersToHosts,
  createInterfaceNode
]);
  
  // 데이터 로드 및 노드/엣지 생성
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let dockerContainers: DockerContainer[] = [];
      let dockerNetworks: DockerNetwork[] = [];
      let dockerHosts: HostMachineType[] = [];
      
      if (testMode || (!containers.length && !networks.length && !hosts.length)) {
        // 테스트 모드 또는 외부 데이터가 없는 경우 더미 데이터 사용
        console.log("Using test data mode");
        const testData = generateTestData();
        dockerContainers = testData.containers;
        dockerNetworks = testData.networks;
        dockerHosts = testData.hosts;
      } else {
        // 외부에서 주입된 데이터 사용
        console.log("Using provided data from props");
        dockerContainers = containers;
        dockerNetworks = networks;
        dockerHosts = hosts;
      }
      
      console.log("Docker containers:", dockerContainers);
      console.log("Docker networks:", dockerNetworks);
      console.log("Docker hosts:", dockerHosts);
      
      // 레이아웃 계산
      const { nodes: layoutNodes, edges: layoutEdges } = calculateLayout(
        dockerContainers,
        dockerNetworks,
        dockerHosts
      );
      
      // 인터페이스 연결 정보 수집
      const connections = collectInterfaceConnections(
        dockerContainers,
        dockerNetworks,
        dockerHosts
      );
      
      console.log("Interface connections:", connections);
      
      // 인터페이스 노드 및 엣지 생성
      const { edges: interfaceEdges } = createInterfaceNodesAndEdges(
        connections,
        layoutNodes
      );
      
      // 모든 엣지 통합
      const allEdges = [...layoutEdges, ...interfaceEdges];
      
      console.log("Final nodes:", layoutNodes);
      console.log("Final edges:", allEdges);
      
      setNodes(layoutNodes);
      setEdges(allEdges);
    } catch (error) {
      console.error('Error loading infrastructure data:', error);
    } finally {
      setLoading(false);
    }
  }, [
    testMode, 
    containers, 
    networks, 
    hosts, 
    setNodes, 
    setEdges, 
    calculateLayout, 
    collectInterfaceConnections, 
    createInterfaceNodesAndEdges,
    generateTestData
  ]);
  
  // 엣지 연결 스타일 정의
  const getEdgeStyle = useCallback(() => {
    return {
      stroke: '#888',
      strokeWidth: 2,
      strokeDasharray: '5,5',
    };
  }, []);
  
  // 노드 드래그 완료 후 처리
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    // 노드 이동 후 연결된 엣지 업데이트 로직 추가 가능
    console.log('Node dragged:', node.id);
  }, []);
  
  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, [loadData, containers, networks, hosts]);
  
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
  
  // 네트워크 구조 리로드
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      loadData();
    }, 300);
  }, [loadData]);
  
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
            onRefresh={handleRefresh}
            activeMode={activeMode}
          />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            defaultEdgeOptions={{
              type: 'straight',
              style: getEdgeStyle(),
              animated: true,
            }}
            fitView
            minZoom={0.1}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            attributionPosition="bottom-right"
          >
            <Controls showInteractive={false} />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
          
          <div className="absolute bottom-16 left-4 bg-white p-2 rounded shadow text-xs">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 mr-2 bg-container-blue border border-blue-400 rounded"></div>
              <span>Container</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 mr-2 bg-network-green border border-green-400 rounded"></div>
              <span>Network</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 mr-2 bg-host-yellow border border-yellow-400 rounded"></div>
              <span>Host Machine</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 mr-2 bg-blue-200 border border-blue-400 rounded"></div>
              <span>Interface</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Canvas;