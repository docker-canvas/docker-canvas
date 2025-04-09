/**
 * 노드 레이아웃 계산 유틸리티
 * 
 * Docker Swarm 인프라 요소들(노드, 컨테이너, 네트워크)의 
 * 위치와 크기를 계산하는 유틸리티 함수들을 제공합니다.
 */

import { Node } from 'reactflow';
import { NodeData } from '../types/node';
import { ContainerData, ContainerNetwork } from '../types/container';
import { NetworkData, ContainerHandleInfo } from '../types/network';
import { layoutConfig } from './layoutConfig';
import { NodeLayoutInfo } from '../types/layoutTypes';

/**
 * 네트워크 데이터에서 ID로 네트워크를 찾는 유틸리티 함수
 * 
 * @param networks 네트워크 데이터 배열
 * @param networkId 찾을 네트워크 ID
 * @returns 찾은 네트워크 데이터 또는 undefined
 */
const findNetworkById = (networks: NetworkData[], networkId: string): NetworkData | undefined => {
  return networks.find(network => network.id === networkId);
};

/**
 * 네트워크 이름으로 네트워크 데이터를 찾는 유틸리티 함수 (ID가 없을 때 폴백용)
 * 
 * @param networks 네트워크 데이터 배열
 * @param networkName 찾을 네트워크 이름
 * @returns 찾은 네트워크 데이터 또는 undefined
 */
const findNetworkByName = (networks: NetworkData[], networkName: string): NetworkData | undefined => {
  return networks.find(network => network.name === networkName);
};

/**
 * 노드 정렬 함수
 * 1. leader가 true인 것이 우선
 * 2. role이 manager인 것 우선
 * 3. 그 외에는 node name을 기준으로 정렬
 * 
 * @param nodes 정렬할 노드 배열
 * @returns 정렬된 노드 배열
 */
const sortNodes = (nodes: NodeData[]): NodeData[] => {
  return [...nodes].sort((a, b) => {
    // 1. leader가 true인 것이 우선
    const aIsLeader = a.labels && (a.labels as any)['node.leader'] === 'true';
    const bIsLeader = b.labels && (b.labels as any)['node.leader'] === 'true';
    
    if (aIsLeader && !bIsLeader) return -1;
    if (!aIsLeader && bIsLeader) return 1;
    
    // 2. role이 manager인 것 우선
    if (a.role === 'manager' && b.role !== 'manager') return -1;
    if (a.role !== 'manager' && b.role === 'manager') return 1;
    
    // 3. 그 외에는 node name을 기준으로 정렬
    return a.hostname.localeCompare(b.hostname);
  });
};

/**
 * 컨테이너 정렬 함수
 * - running 중인 것 우선
 * 
 * @param containers 정렬할 컨테이너 배열
 * @returns 정렬된 컨테이너 배열
 */
const sortContainers = (containers: ContainerData[]): ContainerData[] => {
  return [...containers].sort((a, b) => {
    // running 중인 것 우선
    if (a.status === 'running' && b.status !== 'running') return -1;
    if (a.status !== 'running' && b.status === 'running') return 1;
    
    return 0;
  });
};

/**
 * 노드, 컨테이너, 네트워크 배치 계산 함수
 * 
 * @param nodeData Docker Swarm 노드 데이터 배열
 * @param networks 네트워크 데이터 배열
 * @returns 노드 정보와 레이아웃 정보
 */
export const calculateLayout = (
  nodeData: NodeData[], 
  networks: NetworkData[]
): { nodes: Node[], layoutInfo: NodeLayoutInfo } => {
  const nodes: Node[] = [];
  
  // 핸들 위치 정보를 저장할 객체들
  const containerToGWBridge: Record<string, { containerId: string, gwbridgeId: string, xOffset: number }> = {};
  const containerToOverlay: Record<string, { containerId: string, networkId: string, networkName: string, xOffset: number }[]> = {};
  const overlayNetworkContainers: Record<string, ContainerHandleInfo[]> = {};
  
  // 전체 레이아웃의 현재 상태 추적
  const layoutInfo: NodeLayoutInfo = {
    nodeWidths: {},
    nodePositions: {},
    currentX: layoutConfig.startX,
    totalWidth: 0,
    containerToGWBridge: {},
    containerToOverlay: {},
    overlayNetworkContainers: {},
    layerYPositions: {
      external: 0,
      nodes: 0,
      gwbridge: 0,
      containers: 0,
      ingress: 0,
      overlay: 0
    }
  };
  
  // 노드 정렬 적용
  const sortedNodes = sortNodes(nodeData);
  
  // 1. 각 노드와 해당 노드의 컨테이너 너비 계산
  sortedNodes.forEach((node, index) => {
    // 컨테이너 정렬 적용 (실행 중인 컨테이너 우선)
    const sortedContainers = sortContainers(node.containers);
    node.containers = sortedContainers;
    
    const containersWidth = node.containers.length * layoutConfig.containerWidth + 
                          (node.containers.length - 1) * layoutConfig.containerGap;
    const nodeWidth = Math.max(layoutConfig.nodeMinWidth, containersWidth);
    
    layoutInfo.nodeWidths[node.id] = nodeWidth;
    
    const nodeX = layoutInfo.currentX;
    
    layoutInfo.nodePositions[node.id] = { x: nodeX, y: 0 };
    
    layoutInfo.currentX += nodeWidth + layoutConfig.horizontalGap;
    
    if (index === sortedNodes.length - 1) {
      layoutInfo.totalWidth = nodeX + nodeWidth - layoutConfig.startX;
    }
  });
  
  // 2. 레이어별 Y 위치 계산
  layoutInfo.layerYPositions.overlay = layoutConfig.startY;

  // Overlay 네트워크 계산 (gwbridge 제외)
  const overlayNetworks = networks.filter(n => 
    n.driver === 'overlay' && !n.name.includes('gwbridge')
  );

  // Overlay 레이어의 총 높이 계산
  const overlayLayerHeight = 
    overlayNetworks.length * layoutConfig.overlayNetworkHeight + 
    (overlayNetworks.length > 1 ? (overlayNetworks.length - 1) * layoutConfig.layerGap : 0);

  // 컨테이너 레이어 Y 위치 계산
  layoutInfo.layerYPositions.containers = 
    layoutInfo.layerYPositions.overlay + overlayLayerHeight + layoutConfig.layerGap;
  
  // 나머지 레이어 Y 위치 계산
  layoutInfo.layerYPositions.gwbridge = 
    layoutInfo.layerYPositions.containers + layoutConfig.containerHeight + layoutConfig.layerGap;
  
  layoutInfo.layerYPositions.nodes = 
    layoutInfo.layerYPositions.gwbridge + layoutConfig.gwbridgeNetworkHeight + layoutConfig.layerGap;
  
  
  // 3. 컨테이너 배치 및 핸들 위치 계산
  sortedNodes.forEach((node) => {
    const nodeX = layoutInfo.nodePositions[node.id].x;
    const nodeWidth = layoutInfo.nodeWidths[node.id];
    
    node.containers.forEach((container, containerIndex) => {
      const containerX = nodeX + containerIndex * 
                        (layoutConfig.containerWidth + layoutConfig.containerGap);
      
      const containerY = layoutInfo.layerYPositions.containers;
      
      const containerId = `container-${node.id}-${containerIndex}`;
      
      const containerCenterX = containerX + layoutConfig.containerWidth / 2;
      
      const gwbridgeId = `network-gwbridge-${node.id}`;
      
      const xOffset = (containerCenterX - nodeX) / nodeWidth;
      
      // GWBridge 핸들 위치 정보 저장
      layoutInfo.containerToGWBridge[containerId] = {
        containerId: containerId,
        gwbridgeId: gwbridgeId,
        xOffset: xOffset
      };
      
      // Overlay 네트워크 연결 정보 처리
      const overlayConnections = container.networks.filter(
        network => network.driver === 'overlay'
      );
      
      if (overlayConnections.length > 0) {
        containerToOverlay[containerId] = [];
        
        overlayConnections.forEach((network, idx) => {
          // 네트워크 ID가 있으면 ID 사용, 없으면 이름으로 찾기
          const networkId = network.id || 
                          (findNetworkByName(networks, network.name)?.id) || 
                          `network-${network.name}`;
          
          // 컨테이너와 Overlay 네트워크 간 연결 정보 저장
          containerToOverlay[containerId].push({
            containerId,
            networkId,
            networkName: network.name, // UI 표시용으로 이름 유지
            xOffset: (idx + 1) / (overlayConnections.length + 1)
          });
          
          // Overlay 네트워크에 컨테이너 핸들 정보 추가
          if (!overlayNetworkContainers[networkId]) {
            overlayNetworkContainers[networkId] = [];
          }
          
          const absoluteX = containerX + (layoutConfig.containerWidth * (idx + 1)) / (overlayConnections.length + 1);
          const relativeX = (absoluteX - layoutConfig.startX) / layoutInfo.totalWidth;
          
          overlayNetworkContainers[networkId].push({
            containerId,
            xPosition: relativeX
          });
        });
      }
      
      // 컨테이너에 핸들 위치 정보 추가
      const containerWithHandles: ContainerData = {
        ...container,
        handlePositions: {
          gwbridgeOut: 0.5,
          overlayIn: overlayConnections.reduce((acc, network, idx) => {
            acc[network.name] = (idx + 1) / (overlayConnections.length + 1);
            return acc;
          }, {} as Record<string, number>)
        }
      };
      
      nodes.push({
        id: containerId,
        position: { x: containerX, y: containerY },
        data: containerWithHandles,
        type: 'container',
        style: {
          width: layoutConfig.containerWidth,
          height: layoutConfig.containerHeight
        }
      });
    });
  });
  
  // 관련 정보 레이아웃 정보에 저장
  layoutInfo.containerToOverlay = containerToOverlay;
  layoutInfo.overlayNetworkContainers = overlayNetworkContainers;
  
  // 4. Overlay 네트워크 배치
  // 실제 배치할 네트워크 필터링 및 정렬
  const networksToPlace = [...overlayNetworks]
    // 연결된 컨테이너가 없는 네트워크는 제외
    .filter(network => {
      const networkId = network.id;
      const connections = overlayNetworkContainers[networkId]?.length || 0;
      return connections > 0 || network.name === 'ingress'; // ingress는 항상 포함
    })
    // 정렬 적용
    .sort((a, b) => {
      // Ingress 네트워크가 컨테이너와 가장 가까운 곳에 배치되도록 함
      if (a.name === 'ingress') return 1;
      if (b.name === 'ingress') return -1;

      const aId = a.id;
      const bId = b.id;
      
      // 연결된 컨테이너가 있는 네트워크 우선 배치
      const aConnections = overlayNetworkContainers[aId]?.length || 0;
      const bConnections = overlayNetworkContainers[bId]?.length || 0;
      
      return bConnections - aConnections;
    });
    
  // Overlay 네트워크 배치
  networksToPlace.forEach((network, index) => {
    const networkId = network.id;
    
    const containerHandles = overlayNetworkContainers[networkId] || [];
    
    const networkWithHandles: NetworkData = {
      ...network,
      containerHandles: containerHandles
    };
    
    const overlayY = layoutInfo.layerYPositions.overlay + 
      index * (layoutConfig.overlayNetworkHeight + layoutConfig.layerGap);
    
    nodes.push({
      id: networkId,
      type: 'networkNode',
      position: { 
        x: layoutConfig.startX, 
        y: overlayY
      },
      data: networkWithHandles,
      style: { 
        width: layoutInfo.totalWidth,
        height: layoutConfig.overlayNetworkHeight 
      }
    });
  });
  
  // 5. 각 노드별 GWBridge 네트워크 배치
  const gwbridgeNetworks = networks.filter(n => 
    n.driver === 'bridge' || n.name == 'docker_gwbridge'
  );

  for (let i = 0; i < sortedNodes.length; i++) {
    const nodeId = sortedNodes[i].id;
    const nodeX = layoutInfo.nodePositions[nodeId].x;
    const nodeWidth = layoutInfo.nodeWidths[nodeId];
    
    const gwbridgeId = `network-gwbridge-${nodeId}`;
    
    // 해당 ID를 가진 네트워크 찾기 - fallback 제거
    const gwbridgeNetwork = gwbridgeNetworks.find(n => n.id === gwbridgeId);
    console.log(gwbridgeNetwork);
    
    // 매칭되는 gwbridge가 있는 경우에만 배치
    if (gwbridgeNetwork) {
      const connectedHandles: ContainerHandleInfo[] = Object.values(layoutInfo.containerToGWBridge)
        .filter(info => info.gwbridgeId === gwbridgeId)
        .map(info => ({
          containerId: info.containerId,
          xPosition: info.xOffset
        }));
      
      const gwbridgeWithHandles: NetworkData = {
        ...gwbridgeNetwork,
        id: gwbridgeId,
        containerHandles: connectedHandles
      };
      
      nodes.push({
        id: gwbridgeId,
        type: 'networkNode',
        position: { 
          x: nodeX, 
          y: layoutInfo.layerYPositions.gwbridge
        },
        data: gwbridgeWithHandles,
        style: { 
          width: nodeWidth,
          height: layoutConfig.gwbridgeNetworkHeight 
        }
      });
    }
  }
  
  // 6. 노드 배치
  sortedNodes.forEach((node) => {
    const nodeWidth = layoutInfo.nodeWidths[node.id];
    const nodeX = layoutInfo.nodePositions[node.id].x;
    
    layoutInfo.nodePositions[node.id].y = layoutInfo.layerYPositions.nodes;
    
    nodes.push({
      id: node.id,
      type: 'swarmNode',
      position: { x: nodeX, y: layoutInfo.layerYPositions.nodes },
      data: node,
      style: { width: nodeWidth, height: layoutConfig.nodeHeight }
    });
  });
  
  return { nodes, layoutInfo };
};