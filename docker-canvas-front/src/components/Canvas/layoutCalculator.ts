/**
 * 레이아웃 계산 유틸리티
 * 
 * Docker Swarm 인프라 요소들(노드, 컨테이너, 네트워크)의 
 * 위치와 크기를 계산하는 유틸리티 함수들을 제공합니다.
 */

import { Node } from 'reactflow';
import { NodeData } from '../types/node';
import { ContainerData } from '../types/container';
import { NetworkData } from '../types/network';

// 레이아웃 설정값
const layoutConfig = {
  // 컨테이너 관련 설정
  containerWidth: 120,      // 컨테이너 너비
  containerHeight: 30,      // 컨테이너 높이
  containerGap: 10,         // 컨테이너 간 간격
  containerTopMargin: 40,   // 컨테이너와 노드 사이 간격
  
  // 네트워크 관련 설정
  externalNetworkHeight: 40, // External 네트워크 높이
  ingressNetworkHeight: 40,  // Ingress 네트워크 높이
  gwbridgeNetworkHeight: 60, // GWBridge 네트워크 높이
  networkGap: 20,           // 네트워크 간 간격
  
  // 노드 관련 설정
  nodeMinWidth: 400,        // 노드 최소 너비
  horizontalGap: 200,       // 노드 간 수평 간격
  
  // 전체 레이아웃 설정
  startX: 50,               // 시작 X 좌표
  verticalSpacing: 100,     // 요소 간 수직 간격
};

/**
 * 노드, 컨테이너, 네트워크 배치 계산 함수
 * 
 * @param nodeData Docker Swarm 노드 데이터 배열
 * @param networks 네트워크 데이터 배열
 * @returns ReactFlow 노드 배열 (위치 및 크기 정보 포함)
 */
export const calculateLayout = (nodeData: NodeData[], networks: NetworkData[]): Node[] => {
  let currentX = layoutConfig.startX;
  let totalWidth = 0;
  const nodes: Node[] = [];
  
  // 1. 각 노드와 해당 노드의 컨테이너 너비 계산
  const nodeWidths: Record<string, number> = {};
  const nodePositions: Record<string, { x: number, y: number }> = {};
  
  nodeData.forEach((node, index) => {
    // 컨테이너 수에 따른 노드 너비 계산
    const containersWidth = node.containers.length * layoutConfig.containerWidth + 
                           (node.containers.length - 1) * layoutConfig.containerGap;
    const nodeWidth = Math.max(layoutConfig.nodeMinWidth, containersWidth);
    
    nodeWidths[node.id] = nodeWidth;
    
    // 노드 위치 계산
    const nodeX = currentX;
    const nodeY = layoutConfig.verticalSpacing * 4; // 네트워크, 컨테이너 등을 고려한 Y 위치
    
    nodePositions[node.id] = { x: nodeX, y: nodeY };
    
    // 다음 노드의 시작 X 좌표 업데이트
    currentX += nodeWidth + layoutConfig.horizontalGap;
    
    // 전체 너비 계산 (마지막 노드의 끝 위치)
    if (index === nodeData.length - 1) {
      totalWidth = nodeX + nodeWidth;
    }
  });
  
  // 2. External 네트워크 배치 (최상단, 전체 너비)
  const externalNetwork = networks.find(n => n.type === 'external');
  if (externalNetwork) {
    nodes.push({
      id: externalNetwork.id,
      type: 'networkNode',
      position: { x: layoutConfig.startX, y: layoutConfig.verticalSpacing },
      data: externalNetwork,
      style: { width: totalWidth }
    });
  }
  
  // 3. Ingress 네트워크 배치 (컨테이너 위, 전체 너비)
  const ingressNetwork = networks.find(n => n.name === 'ingress');
  if (ingressNetwork) {
    nodes.push({
      id: ingressNetwork.id,
      type: 'networkNode',
      position: { x: layoutConfig.startX, y: layoutConfig.verticalSpacing * 2 },
      data: ingressNetwork,
      style: { width: totalWidth }
    });
  }
  
  // 4. 각 노드별 GWBridge 네트워크 배치 (노드 위, 노드 너비와 일치)
  const gwbridgeNetworks = networks.filter(n => 
    n.driver === 'gwbridge' || n.name.includes('gwbridge')
  );
  
  // 노드 수와 gwbridge 수가 일치하는지 확인 (불일치하면 샘플만큼만 사용)
  const useGwbridgeCount = Math.min(nodeData.length, gwbridgeNetworks.length);
  
  for (let i = 0; i < useGwbridgeCount; i++) {
    const nodeId = nodeData[i].id;
    const nodePosition = nodePositions[nodeId];
    const nodeWidth = nodeWidths[nodeId];
    
    nodes.push({
      id: gwbridgeNetworks[i].id,
      type: 'networkNode',
      position: { 
        x: nodePosition.x, 
        y: nodePosition.y - layoutConfig.gwbridgeNetworkHeight - 
           layoutConfig.containerTopMargin - layoutConfig.containerHeight - 
           layoutConfig.networkGap
      },
      data: gwbridgeNetworks[i],
      style: { width: nodeWidth }
    });
  }
  
  // 5. 노드 배치
  nodeData.forEach((node) => {
    const nodePosition = nodePositions[node.id];
    const nodeWidth = nodeWidths[node.id];
    
    // 노드 생성 및 추가
    nodes.push({
      id: node.id,
      type: 'swarmNode',
      position: nodePosition,
      data: node,
      style: { width: nodeWidth }
    });
    
    // 6. 컨테이너 노드 생성 및 배치
    node.containers.forEach((container, containerIndex) => {
      // 컨테이너 X 위치 계산 (노드 왼쪽 가장자리 + 컨테이너 인덱스 * (너비 + 간격))
      const containerX = nodePosition.x + containerIndex * 
                        (layoutConfig.containerWidth + layoutConfig.containerGap);
      
      // 컨테이너 Y 위치 계산 (노드 Y 위치 - 컨테이너 높이 - 간격)
      const containerY = nodePosition.y - layoutConfig.containerHeight - 
                        layoutConfig.containerTopMargin;
      
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
  
  return nodes;
};