/**
 * 노드 레이아웃 계산 유틸리티
 * 
 * Docker Swarm 인프라 요소들(노드, 컨테이너, 네트워크)의 
 * 위치와 크기를 계산하는 유틸리티 함수들을 제공합니다.
 */

import { Node } from 'reactflow';
import { NodeData } from '../types/node';
import { ContainerData } from '../types/container';
import { NetworkData, ContainerHandleInfo, IngressToGwbridgeHandleInfo } from '../types/network';
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
    const aIsLeader = a.managerStatus?.leader === true;
    const bIsLeader = b.managerStatus?.leader === true;
    
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
  const overlayNetworkToNodes: Record<string, { nodeId: string; xPosition: number }[]> = {};
  
  // 전체 레이아웃의 현재 상태 추적
  const layoutInfo: NodeLayoutInfo = {
    nodeWidths: {},             // 노드 기본 너비 (컨테이너 기반)
    nodeExpandedWidths: {},     // 노드 확장 너비 (오버레이 핸들 포함)
    gwbridgeWidths: {},         // GWBridge 네트워크 너비 (노드 기본 너비와 동일)
    nodePositions: {},
    currentX: layoutConfig.startX,
    totalWidth: 0,
    containerToGWBridge: {},
    containerToOverlay: {},
    overlayNetworkContainers: {},
    overlayNetworkToNodes: {}, // 초기화 추가
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
  
  const overlayNetworks = networks.filter(n => 
    n.driver === 'overlay'
  );

  // 실제 배치할 네트워크 필터링 및 정렬
  const networksToPlace = [...overlayNetworks]
    // 연결된 컨테이너가 없는 네트워크는 제외
    // 정렬 적용
    .sort((a, b) => {
      // Ingress 네트워크가 컨테이너와 가장 가까운 곳에 배치되도록 함
      if (a.name === 'ingress') return 1;
      if (b.name === 'ingress') return -1;

      const aId = a.id;
      const bId = b.id;
      
      // 연결된 컨테이너가 있는 네트워크 우선 배치
      const aConnections = (overlayNetworkContainers[aId]?.length || 0) + 
                         (overlayNetworkToNodes[aId]?.length || 0);
      const bConnections = (overlayNetworkContainers[bId]?.length || 0) + 
                         (overlayNetworkToNodes[bId]?.length || 0);
      
      return bConnections - aConnections;
    });

  // 1. 각 노드의 기본 너비 계산 (컨테이너 기반)
  sortedNodes.forEach((node, index) => {
    // 컨테이너 정렬 적용 (실행 중인 컨테이너 우선)
    const sortedContainers = sortContainers(node.containers);
    node.containers = sortedContainers;
    
    const containersWidth = node.containers.length * layoutConfig.containerWidth + 
                          (node.containers.length - 1) * layoutConfig.containerGap;
    // 노드 너비 계산 시 추가 공간 20px 확보 (컨테이너 배치 후 여유 공간)
    const gwbridgeWidth = Math.max(layoutConfig.nodeMinWidth, containersWidth) + 30;
    layoutInfo.gwbridgeWidths[node.id] = gwbridgeWidth;
    const nodeWidth = gwbridgeWidth + overlayNetworks.length * 10;
    
    layoutInfo.nodeWidths[node.id] = nodeWidth;
  });

  // 2. Overlay 네트워크 연결 정보 계산 및 노드 확장 너비 조정
  // Overlay 네트워크 계산 (gwbridge 제외)
  
  sortedNodes.forEach((node) => {
    const nodeId = node.id;
    const nodeWidth = layoutInfo.nodeWidths[nodeId];
    
    // 노드당 연결할 overlay 네트워크 핸들 위치 계산
    if (networksToPlace.length > 0) {
      const handleSpacing = 30; // 핸들 간 간격 (px)
      const totalHandleWidth = networksToPlace.length * handleSpacing;
      
      // 노드 확장 폭 조정 (overlay 네트워크 연결을 위한 공간 확보)
      const expandedNodeWidth = nodeWidth + totalHandleWidth;
      // 확장된 너비 저장 (기본 너비는 그대로 유지)
      layoutInfo.nodeExpandedWidths[nodeId] = expandedNodeWidth;
      
      // 노드용 overlay 핸들 정보 배열 생성
      const nodeOverlayHandles: { networkId: string; xPosition: number }[] = [];
      
      // 각 overlay 네트워크에 대한 핸들 위치 계산
      networksToPlace.forEach((network, idx) => {
        // 핸들 위치: 노드 오른쪽에서부터 일정 간격으로 배치
        const handleXPosition = 1 - ((idx + 1) * handleSpacing / expandedNodeWidth);
        
        // 노드의 overlay 네트워크 핸들 정보 추가
        nodeOverlayHandles.push({
          networkId: network.id,
          xPosition: handleXPosition
        });
        
        // overlay 네트워크의 노드 핸들 정보 추가
        if (!overlayNetworkToNodes[network.id]) {
          overlayNetworkToNodes[network.id] = [];
        }
      });
      
      // 노드 데이터에 overlayHandles 추가
      node.overlayHandles = nodeOverlayHandles;
    }
  });
  
  // 3. 노드 위치 계산 (확장 너비 사용)
  layoutInfo.currentX = layoutConfig.startX;
  
  sortedNodes.forEach((node, index) => {
    const nodeId = node.id;
    const expandedNodeWidth = layoutInfo.nodeExpandedWidths[nodeId];
    
    const nodeX = layoutInfo.currentX;
    layoutInfo.nodePositions[nodeId] = { x: nodeX, y: 0 };
    
    layoutInfo.currentX += expandedNodeWidth + layoutConfig.horizontalGap;
    
    if (index === sortedNodes.length - 1) {
      layoutInfo.totalWidth = nodeX + expandedNodeWidth - layoutConfig.startX;
    }
  });
  
  // 4. 노드와 overlay 네트워크 간의 상대적 위치 계산 (전체 레이아웃 기준)
  sortedNodes.forEach((node) => {
    const nodeId = node.id;
    const nodeX = layoutInfo.nodePositions[nodeId].x;
    const expandedNodeWidth = layoutInfo.nodeExpandedWidths[nodeId];
    
    if (node.overlayHandles && node.overlayHandles.length > 0) {
      node.overlayHandles.forEach((handle, idx) => {
        const networkId = handle.networkId;
        
        if (!overlayNetworkToNodes[networkId]) {
          overlayNetworkToNodes[networkId] = [];
        }
        
        // 실제 핸들 X 좌표 계산 (노드 기준 상대 위치 -> 전체 레이아웃 기준 상대 위치)
        const handleX = nodeX + expandedNodeWidth * (1 - ((idx + 1) * 30 / expandedNodeWidth));
        const relativeX = (handleX - layoutConfig.startX) / layoutInfo.totalWidth;
        
        overlayNetworkToNodes[networkId].push({
          nodeId: nodeId,
          xPosition: relativeX
        });
      });
    }
  });
  
  // 5. 레이어별 Y 위치 계산
  layoutInfo.layerYPositions.overlay = layoutConfig.startY;

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
  
  // 6. 컨테이너 배치 및 핸들 위치 계산
  sortedNodes.forEach((node) => {
    const nodeId = node.id;
    const nodeX = layoutInfo.nodePositions[nodeId].x;
    const baseNodeWidth = layoutInfo.nodeWidths[nodeId]; // 기본 노드 너비 사용
    
    node.containers.forEach((container, containerIndex) => {
      // 컨테이너는 노드의 기본 너비 내에 배치
      const containerX = nodeX + containerIndex * 
                        (layoutConfig.containerWidth + layoutConfig.containerGap);
      
      const containerY = layoutInfo.layerYPositions.containers;
      
      const containerId = `container-${nodeId}-${containerIndex}`;
      
      const containerCenterX = containerX + layoutConfig.containerWidth / 2;
      
      const gwbridgeId = `network-gwbridge-${nodeId}`;
      
      // xOffset은 기본 노드 너비 기준으로 계산 (GWBridge 연결용)
      const xOffset = (containerCenterX - nodeX) / baseNodeWidth;
      
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
  
  // 7. Ingress 네트워크 찾기
  const ingressNetwork = networks.find(n => n.name === 'ingress') || {
    id: 'network-ingress',
    name: 'ingress',
    driver: 'overlay',
    scope: 'swarm',
    networkInfo: {}
  };
  
  // gwbridge에서 ingress로의 연결 정보를 저장할 배열
  const ingressToGwbridgeHandles: IngressToGwbridgeHandleInfo[] = [];
  
  // 8. Overlay 네트워크 배치

  // Overlay 네트워크 배치
  networksToPlace.forEach((network, index) => {
    const networkId = network.id;
    
    const containerHandles = overlayNetworkContainers[networkId] || [];
    const nodeHandles = overlayNetworkToNodes[networkId] || [];
    
    // 기본 네트워크 데이터
    let networkWithHandles: NetworkData = {
      ...network,
      containerHandles: containerHandles,
      nodeHandles: nodeHandles
    };
    
    // ingress 네트워크인 경우 향후 gwbridge 연결 핸들 정보 배열 추가
    if (network.name === 'ingress') {
      networkWithHandles = {
        ...networkWithHandles,
        ingressToGwbridgeHandles: [] // 여기에 gwbridge 연결 정보 추가 (나중에 업데이트)
      };
    }
    
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

  // 9. 각 노드별 GWBridge 네트워크 배치 부분

  for (let i = 0; i < sortedNodes.length; i++) {
    const nodeId = sortedNodes[i].id;
    const nodeX = layoutInfo.nodePositions[nodeId].x;
    const gwbridgeWidth = layoutInfo.gwbridgeWidths[nodeId];
    const expandedNodeWidth = layoutInfo.nodeExpandedWidths[nodeId] || layoutInfo.nodeWidths[nodeId];
    
    const gwbridgeId = `network-gwbridge-${nodeId}`;
    
    const gwbridgeNetwork: NetworkData = {
      id: gwbridgeId,
      name: 'docker_gwbridge',
      driver: 'bridge',
      scope: 'local',
      networkInfo: {},
      createdAt: new Date().toISOString()
    };
    
    // 노드에서의 연결 위치를 노드의 확장된 너비를 기준으로 계산
    // gwbridge는 기본 노드 너비와 같으므로, 정확한 위치 매핑이 필요
    const nodeToBridgePosition = gwbridgeWidth / 2; // gwbridge의 중앙 좌표
    const nodeConnectionRatio = nodeToBridgePosition / expandedNodeWidth; // 노드 너비 기준 비율
    
    // nodeToGwbridgeHandle 정보 생성
    const nodeToGwbridgeHandle = {
      position: nodeConnectionRatio // 0~1 사이 값 (노드 내 상대적 위치)
    };
    
    // 여기서 gwbridge 쪽의 핸들 위치도 같은 방식으로 계산
    const gwbridgeToNodePosition = 0.5; // gwbridge의 정중앙 (0.5)
    
    // 나머지 코드는 그대로 유지
    const connectedHandles: ContainerHandleInfo[] = Object.values(layoutInfo.containerToGWBridge)
      .filter(info => info.gwbridgeId === gwbridgeId)
      .map(info => ({
        containerId: info.containerId,
        xPosition: info.xOffset
      }));
    
    // ingress 네트워크와의 연결을 위한 핸들 위치 계산
    const handleXPosition = (gwbridgeWidth - 15) / gwbridgeWidth;
    
    const ingressToGwbridgeHandle = {
      networkId: ingressNetwork.id,
      xPosition: handleXPosition
    };
    
    const gwbridgeWithHandles: NetworkData = {
      ...gwbridgeNetwork,
      id: gwbridgeId,
      containerHandles: connectedHandles,
      ingressToGwbridgeHandles: [ingressToGwbridgeHandle],
      nodeToGwbridgeHandle: {
        position: gwbridgeToNodePosition,
        nodeConnectionPosition: nodeConnectionRatio // 노드 쪽 연결 위치 정보도 저장
      }
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
        width: gwbridgeWidth,
        height: layoutConfig.gwbridgeNetworkHeight 
      }
    });
    
    // 노드 데이터에도 gwbridge 연결 정보 저장
    // 해당 노드 객체 찾기
    const nodeData = sortedNodes[i];
    // 노드 데이터에 gwbridgeConnectionPosition 추가
    nodeData.gwbridgeConnectionPosition = nodeConnectionRatio;
  }
  
  // 10. ingress 네트워크 노드 찾기 및 업데이트
  const ingressNode = nodes.find(node => 
    node.type === 'networkNode' && node.data.name === 'ingress'
  );
  
  // ingress 네트워크 노드가 있으면 gwbridge 연결 정보 추가
  if (ingressNode) {
    // 기존 ingressNode 데이터에 핸들 정보 추가
    ingressNode.data = {
      ...ingressNode.data,
      ingressToGwbridgeHandles: ingressToGwbridgeHandles
    };
  }
  
  // 11. 노드 배치
  sortedNodes.forEach((node) => {
    const nodeId = node.id;
    const nodeX = layoutInfo.nodePositions[nodeId].x;
    const expandedNodeWidth = layoutInfo.nodeExpandedWidths[nodeId];
    
    layoutInfo.nodePositions[nodeId].y = layoutInfo.layerYPositions.nodes;
    
    nodes.push({
      id: nodeId,
      type: 'swarmNode',
      position: { x: nodeX, y: layoutInfo.layerYPositions.nodes },
      data: node,
      style: { width: expandedNodeWidth, height: layoutConfig.nodeHeight }
    });
  });
  
  return { nodes, layoutInfo };
};