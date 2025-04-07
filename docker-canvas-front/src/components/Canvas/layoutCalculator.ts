/**
 * 노드 레이아웃 계산 유틸리티
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
import { NetworkData, ContainerHandleInfo } from '../types/network';
import { layoutConfig } from './layoutConfig';
import { NodeLayoutInfo } from '../types/layoutTypes';

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
  
  // 핸들 위치 정보를 저장할 객체
  const containerToGWBridge: Record<string, { containerId: string, gwbridgeId: string, xOffset: number }> = {};
  
  // 전체 레이아웃의 현재 상태 추적
  const layoutInfo: NodeLayoutInfo = {
    nodeWidths: {},
    nodePositions: {},
    currentX: layoutConfig.startX,
    totalWidth: 0,
    containerToGWBridge: {},
    layerYPositions: {
      external: 0,
      nodes: 0,
      gwbridge: 0,
      containers: 0,
      ingress: 0,
      overlay: 0
    }
  };
  
  // 1. 각 노드와 해당 노드의 컨테이너 너비 계산
  nodeData.forEach((node, index) => {
    // 컨테이너 수에 따른 노드 너비 계산
    const containersWidth = node.containers.length * layoutConfig.containerWidth + 
                          (node.containers.length - 1) * layoutConfig.containerGap;
    const nodeWidth = Math.max(layoutConfig.nodeMinWidth, containersWidth);
    
    layoutInfo.nodeWidths[node.id] = nodeWidth;
    
    // 노드 X 위치 계산
    const nodeX = layoutInfo.currentX;
    
    layoutInfo.nodePositions[node.id] = { x: nodeX, y: 0 }; // Y는 나중에 설정
    
    // 다음 노드의 시작 X 좌표 업데이트
    layoutInfo.currentX += nodeWidth + layoutConfig.horizontalGap;
    
    // 전체 너비 계산 (마지막 노드의 끝 위치)
    if (index === nodeData.length - 1) {
      layoutInfo.totalWidth = nodeX + nodeWidth - layoutConfig.startX;
    }
  });
  
  // 2. 레이어별 Y 위치 계산 (위에서 아래로 - 화면상 overlay가 최상단, external이 최하단에 오도록)
  
  // Overlay 레이어 (맨 위 시작)
  layoutInfo.layerYPositions.overlay = layoutConfig.startY;
  
  // Ingress 레이어 (Overlay 아래)
  layoutInfo.layerYPositions.ingress = 
    layoutInfo.layerYPositions.overlay + layoutConfig.overlayNetworkHeight + layoutConfig.layerGap;
  
  // 컨테이너 레이어 (Ingress 아래)
  layoutInfo.layerYPositions.containers = 
    layoutInfo.layerYPositions.ingress + layoutConfig.ingressNetworkHeight + layoutConfig.layerGap;
  
  // GWBridge 레이어 (컨테이너 아래)
  layoutInfo.layerYPositions.gwbridge = 
    layoutInfo.layerYPositions.containers + layoutConfig.containerHeight + layoutConfig.layerGap;
  
  // 노드 레이어 (GWBridge 아래)
  layoutInfo.layerYPositions.nodes = 
    layoutInfo.layerYPositions.gwbridge + layoutConfig.gwbridgeNetworkHeight + layoutConfig.layerGap;
  
  // External 네트워크 레이어 (노드 아래 - 맨 아래)
  layoutInfo.layerYPositions.external = 
    layoutInfo.layerYPositions.nodes + layoutConfig.nodeHeight + layoutConfig.layerGap;
  
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
        y: layoutInfo.layerYPositions.overlay + index * (layoutConfig.overlayNetworkHeight + 10) 
      },
      data: network,
      style: { 
        width: layoutInfo.totalWidth,
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
        y: layoutInfo.layerYPositions.ingress 
      },
      data: ingressNetwork,
      style: { 
        width: layoutInfo.totalWidth,
        height: layoutConfig.ingressNetworkHeight 
      }
    });
  }
  
  // 5. 컨테이너 배치 및 핸들 위치 계산 (Ingress 아래)
  nodeData.forEach((node) => {
    const nodeX = layoutInfo.nodePositions[node.id].x;
    const nodeWidth = layoutInfo.nodeWidths[node.id];
    
    // 컨테이너 노드 생성 및 배치
    node.containers.forEach((container, containerIndex) => {
      // 컨테이너 X 위치 계산 (노드 왼쪽 가장자리 + 컨테이너 인덱스 * (너비 + 간격))
      const containerX = nodeX + containerIndex * 
                        (layoutConfig.containerWidth + layoutConfig.containerGap);
      
      // 컨테이너 Y 위치는 컨테이너 레이어 Y 위치
      const containerY = layoutInfo.layerYPositions.containers;
      
      // 컨테이너 노드 생성
      const containerId = `container-${node.id}-${containerIndex}`;
      
      // 컨테이너의 중앙 X 좌표 계산 (Handle 위치 계산용)
      const containerCenterX = containerX + layoutConfig.containerWidth / 2;
      
      // GWBridge 노드 ID 계산
      const gwbridgeId = `network-gwbridge-${node.id}`;
      
      // 노드 내에서의 상대적 X 위치 (0~1 사이 값)
      const xOffset = (containerCenterX - nodeX) / nodeWidth;
      
      // 핸들 위치 정보 저장
      layoutInfo.containerToGWBridge[containerId] = {
        containerId: containerId,
        gwbridgeId: gwbridgeId,
        xOffset: xOffset
      };
      
      // 컨테이너에 핸들 위치 정보 추가
      const containerWithHandles: ContainerData = {
        ...container,
        handlePositions: {
          gwbridgeOut: 0.5  // 중앙 위치 (0.5 = 50%)
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
  
  // 6. 각 노드별 GWBridge 네트워크 배치 (컨테이너 아래)
  const gwbridgeNetworks = networks.filter(n => 
    n.driver === 'gwbridge' || n.name.includes('gwbridge')
  );
  
  // 노드 수와 gwbridge 수가 일치하는지 확인 (불일치하면 샘플만큼만 사용)
  const useGwbridgeCount = Math.min(nodeData.length, gwbridgeNetworks.length);
  
  for (let i = 0; i < useGwbridgeCount; i++) {
    const nodeId = nodeData[i].id;
    const nodeX = layoutInfo.nodePositions[nodeId].x;
    const nodeWidth = layoutInfo.nodeWidths[nodeId];
    
    // GWBridge 네트워크 ID
    const gwbridgeId = `network-gwbridge-${nodeId}`;
    
    // 해당 GWBridge에 연결될 컨테이너 핸들 정보 찾기
    const connectedHandles: ContainerHandleInfo[] = Object.values(layoutInfo.containerToGWBridge)
      .filter(info => info.gwbridgeId === gwbridgeId)
      .map(info => ({
        containerId: info.containerId,
        xPosition: info.xOffset  // 상대적 X 좌표
      }));
    
    // GWBridge 네트워크에 핸들 위치 정보 추가
    const gwbridgeWithHandles: NetworkData = {
      ...gwbridgeNetworks[i],
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
  
  // 7. 노드 배치 (GWBridge 아래)
  nodeData.forEach((node) => {
    const nodeWidth = layoutInfo.nodeWidths[node.id];
    const nodeX = layoutInfo.nodePositions[node.id].x;
    
    // 노드 Y 위치 설정
    layoutInfo.nodePositions[node.id].y = layoutInfo.layerYPositions.nodes;
    
    // 노드 생성 및 추가
    nodes.push({
      id: node.id,
      type: 'swarmNode',
      position: { x: nodeX, y: layoutInfo.layerYPositions.nodes },
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
        y: layoutInfo.layerYPositions.external 
      },
      data: externalNetwork,
      style: { 
        width: layoutInfo.totalWidth,
        height: layoutConfig.externalNetworkHeight 
      }
    });
  }
  
  return { nodes, layoutInfo };
};