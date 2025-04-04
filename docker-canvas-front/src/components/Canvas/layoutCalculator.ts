/**
 * 개선된 레이아웃 계산 유틸리티
 * 
 * Docker Swarm 인프라 요소들(노드, 컨테이너, 네트워크)의 
 * 위치와 크기를 계산하는 유틸리티 함수들을 제공합니다.
 * 
 * 레이아웃 순서(아래에서 위로):
 * external -> node -> gwbridge -> container -> ingress -> overlay 네트워크
 */

import { Node } from 'reactflow';
import { NodeData } from '../types/node';
import { ContainerData } from '../types/container';
import { NetworkData } from '../types/network';

// 레이아웃 설정값
export const layoutConfig = {
  // 컴포넌트 크기 설정
  containerWidth: 120,        // 컨테이너 너비
  containerHeight: 80,        // 컨테이너 높이 (Container.tsx에도 동일한 값 설정 필요)
  nodeMinWidth: 400,          // 노드 최소 너비
  nodeHeight: 400,            // 노드 높이
  externalNetworkHeight: 40,  // External 네트워크 높이
  ingressNetworkHeight: 40,   // Ingress 네트워크 높이
  gwbridgeNetworkHeight: 60,  // GWBridge 네트워크 높이
  overlayNetworkHeight: 40,   // 기타 Overlay 네트워크 높이
  
  // 간격 설정
  containerGap: 10,           // 컨테이너 간 수평 간격
  layerGap: 40,               // 레이어 간 수직 간격
  horizontalGap: 200,         // 노드 간 수평 간격
  
  // 초기 위치 설정
  startX: 50,                 // 시작 X 좌표
  startY: 100,                // 시작 Y 좌표
};

/**
 * 노드, 컨테이너, 네트워크 배치 계산 함수
 * 
 * @param nodeData Docker Swarm 노드 데이터 배열
 * @param networks 네트워크 데이터 배열
 * @returns ReactFlow 노드 배열 (위치 및 크기 정보 포함)
 */
export const calculateLayout = (nodeData: NodeData[], networks: NetworkData[]): Node[] => {
  const nodes: Node[] = [];
  
  // 전체 레이아웃의 현재 상태 추적
  const layoutState = {
    currentX: layoutConfig.startX,
    totalWidth: 0,
    // 레이어 Y 위치 (하위부터 상위 레이어로)
    layerYPositions: {
      external: 0,           // External 네트워크 레이어 Y 위치 (맨 아래 - 첫번째)
      nodes: 0,              // 노드 레이어 Y 위치 (두번째)
      gwbridge: 0,           // GWBridge 레이어 Y 위치 (세번째)
      containers: 0,         // 컨테이너 레이어 Y 위치 (네번째)
      ingress: 0,            // Ingress 레이어 Y 위치 (다섯번째)
      overlay: 0             // 기타 Overlay 레이어 Y 위치 (맨 위 - 여섯번째)
    }
  };
  
  // 1. 각 노드와 해당 노드의 컨테이너 너비 계산
  const nodeWidths: Record<string, number> = {};
  const nodePositions: Record<string, { x: number, y: number }> = {};
  
  // 노드 너비 및 초기 X 위치 계산
  nodeData.forEach((node, index) => {
    // 컨테이너 수에 따른 노드 너비 계산
    const containersWidth = node.containers.length * layoutConfig.containerWidth + 
                          (node.containers.length - 1) * layoutConfig.containerGap;
    const nodeWidth = Math.max(layoutConfig.nodeMinWidth, containersWidth);
    
    nodeWidths[node.id] = nodeWidth;
    
    // 노드 X 위치 계산
    const nodeX = layoutState.currentX;
    
    nodePositions[node.id] = { x: nodeX, y: 0 }; // Y는 나중에 설정
    
    // 다음 노드의 시작 X 좌표 업데이트
    layoutState.currentX += nodeWidth + layoutConfig.horizontalGap;
    
    // 전체 너비 계산 (마지막 노드의 끝 위치)
    if (index === nodeData.length - 1) {
      layoutState.totalWidth = nodeX + nodeWidth - layoutConfig.startX;
    }
  });
  
  // 2. 레이어별 Y 위치 계산 (위에서 아래로 - 화면상 overlay가 최상단, external이 최하단에 오도록)
  
  // Overlay 레이어 (맨 위 시작)
  layoutState.layerYPositions.overlay = layoutConfig.startY;
  
  // Ingress 레이어 (Overlay 아래)
  layoutState.layerYPositions.ingress = 
    layoutState.layerYPositions.overlay + layoutConfig.overlayNetworkHeight + layoutConfig.layerGap;
  
  // 컨테이너 레이어 (Ingress 아래)
  layoutState.layerYPositions.containers = 
    layoutState.layerYPositions.ingress + layoutConfig.ingressNetworkHeight + layoutConfig.layerGap;
  
  // GWBridge 레이어 (컨테이너 아래)
  layoutState.layerYPositions.gwbridge = 
    layoutState.layerYPositions.containers + layoutConfig.containerHeight + layoutConfig.layerGap;
  
  // 노드 레이어 (GWBridge 아래)
  layoutState.layerYPositions.nodes = 
    layoutState.layerYPositions.gwbridge + layoutConfig.gwbridgeNetworkHeight + layoutConfig.layerGap;
  
  // External 네트워크 레이어 (노드 아래 - 맨 아래)
  layoutState.layerYPositions.external = 
    layoutState.layerYPositions.nodes + layoutConfig.nodeHeight + layoutConfig.layerGap;
  
  // 3. 기타 Overlay 네트워크 배치 (맨 위)
  const overlayNetworks = networks.filter(n => 
    n.driver === 'overlay' && n.name !== 'ingress' && !n.name.includes('gwbridge')
  );
  
  overlayNetworks.forEach((network, index) => {
    nodes.push({
      id: network.id,
      type: 'networkNode',
      position: { 
        x: layoutConfig.startX, 
        y: layoutState.layerYPositions.overlay + index * (layoutConfig.overlayNetworkHeight + 10) 
      },
      data: network,
      style: { 
        width: layoutState.totalWidth,
        height: layoutConfig.overlayNetworkHeight 
      }
    });
  });
  
  // 4. Ingress 네트워크 배치 (Overlay 아래)
  const ingressNetwork = networks.find(n => n.name === 'ingress');
  if (ingressNetwork) {
    nodes.push({
      id: ingressNetwork.id,
      type: 'networkNode',
      position: { 
        x: layoutConfig.startX, 
        y: layoutState.layerYPositions.ingress 
      },
      data: ingressNetwork,
      style: { 
        width: layoutState.totalWidth,
        height: layoutConfig.ingressNetworkHeight 
      }
    });
  }
  
  // 5. 컨테이너 배치 (Ingress 아래)
  nodeData.forEach((node) => {
    const nodeX = nodePositions[node.id].x;
    
    // 컨테이너 노드 생성 및 배치
    node.containers.forEach((container, containerIndex) => {
      // 컨테이너 X 위치 계산 (노드 왼쪽 가장자리 + 컨테이너 인덱스 * (너비 + 간격))
      const containerX = nodeX + containerIndex * 
                        (layoutConfig.containerWidth + layoutConfig.containerGap);
      
      // 컨테이너 Y 위치는 컨테이너 레이어 Y 위치
      const containerY = layoutState.layerYPositions.containers;
      
      // 컨테이너 노드 생성
      const containerId = `container-${node.id}-${containerIndex}`;
      nodes.push({
        id: containerId,
        position: { x: containerX, y: containerY },
        data: container,
        type: 'container',
        style: {
          width: layoutConfig.containerWidth,
          height: layoutConfig.containerHeight
        }
      });
    });
  });
  
  // 6. 각 노드별 GWBridge 네트워크 배치 (컨테이너 아래)
  const gwbridgeNetworks = networks.filter(n => 
    n.driver === 'gwbridge' || n.name.includes('gwbridge')
  );
  
  // 노드 수와 gwbridge 수가 일치하는지 확인 (불일치하면 샘플만큼만 사용)
  const useGwbridgeCount = Math.min(nodeData.length, gwbridgeNetworks.length);
  
  for (let i = 0; i < useGwbridgeCount; i++) {
    const nodeId = nodeData[i].id;
    const nodeX = nodePositions[nodeId].x;
    const nodeWidth = nodeWidths[nodeId];
    
    nodes.push({
      id: gwbridgeNetworks[i].id,
      type: 'networkNode',
      position: { 
        x: nodeX, 
        y: layoutState.layerYPositions.gwbridge
      },
      data: gwbridgeNetworks[i],
      style: { 
        width: nodeWidth,
        height: layoutConfig.gwbridgeNetworkHeight 
      }
    });
  }
  
  // 7. 노드 배치 (GWBridge 아래)
  nodeData.forEach((node) => {
    const nodeWidth = nodeWidths[node.id];
    const nodeX = nodePositions[node.id].x;
    
    // 노드 Y 위치 설정
    nodePositions[node.id].y = layoutState.layerYPositions.nodes;
    
    // 노드 생성 및 추가
    nodes.push({
      id: node.id,
      type: 'swarmNode',
      position: { x: nodeX, y: layoutState.layerYPositions.nodes },
      data: node,
      style: { width: nodeWidth, height: layoutConfig.nodeHeight }
    });
  });
  
  // 8. External 네트워크 배치 (맨 아래)
  const externalNetwork = networks.find(n => n.type === 'external');
  if (externalNetwork) {
    nodes.push({
      id: externalNetwork.id,
      type: 'networkNode',
      position: { 
        x: layoutConfig.startX, 
        y: layoutState.layerYPositions.external 
      },
      data: externalNetwork,
      style: { 
        width: layoutState.totalWidth,
        height: layoutConfig.externalNetworkHeight 
      }
    });
  }
  
  return nodes;
};