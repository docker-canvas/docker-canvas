/**
 * 엣지 생성 유틸리티
 * 
 * 노드, 컨테이너, 네트워크 간의 연결을 나타내는 엣지(Edge)를 생성하는
 * 유틸리티 함수들을 제공합니다.
 */

import { Edge, Node } from 'reactflow';
import { NodeData } from '../types/node';
import { NetworkData } from '../types/network';
import { SwarmEdgeType } from '../types/edge';
import { ContainerNetwork } from '../types/container';

/**
 * 모든 필요한 엣지를 생성하는 함수
 * 
 * 요구사항에 따라 다음 규칙을 적용합니다:
 * - gwbridge는 Node (HostMachine)의 네트워크와 연결
 * - swarm 네트워크 관련 컨테이너는 gwbridge와 연결
 * - ingress-sbox 컨테이너는 gwbridge와 Ingress에 연결
 * - 컨테이너는 모든 overlay network와 연결
 * 
 * @param layoutedNodes 배치가 계산된 노드들
 * @param swarmNodes Docker Swarm 노드 데이터
 * @param networks 네트워크 데이터
 * @returns 엣지 배열
 */
export const createEdges = (
  layoutedNodes: Node[],
  swarmNodes: NodeData[],
  networks: NetworkData[]
): Edge[] => {
  const edges: Edge[] = [];
  
  // 1. 각 노드 ID로 빠르게 접근할 수 있는 맵 생성
  const nodeMap = new Map<string, Node>();
  layoutedNodes.forEach(node => {
    nodeMap.set(node.id, node);
  });
  
  // 2. 각 네트워크 유형별로 찾기
  const gwbridgeNetworks = layoutedNodes.filter(
    node => node.type === 'networkNode' && 
    (node.data.driver === 'gwbridge' || node.data.name.includes('gwbridge'))
  );
  
  const ingressNetwork = layoutedNodes.find(
    node => node.type === 'networkNode' && node.data.name === 'ingress'
  );
  
  const overlayNetworks = layoutedNodes.filter(
    node => node.type === 'networkNode' && 
    node.data.driver === 'overlay' && 
    node.data.name !== 'ingress' && 
    !node.data.name.includes('gwbridge')
  );
  
  const externalNetwork = layoutedNodes.find(
    node => node.type === 'networkNode' && node.data.type === 'external'
  );
  
  // 3. Swarm Node들 찾기
  const swarmNodeElements = layoutedNodes.filter(
    node => node.type === 'swarmNode'
  );
  
  // 4. Container 요소들 찾기
  const containerElements = layoutedNodes.filter(
    node => node.type === 'container'
  );
  
  // 5. 규칙에 따라 엣지 생성
  
  // 규칙 1: gwbridge는 Node (HostMachine)의 네트워크와 연결
  swarmNodeElements.forEach((swarmNode) => {
    // gwbridge id 형식: network-gwbridge-node-1
    const gwbridgeId = `network-gwbridge-${swarmNode.id}`;
    const matchingGWBridge = gwbridgeNetworks.find(network => network.id === gwbridgeId);
    
    if (matchingGWBridge) {
      edges.push({
        id: `edge-${swarmNode.id}-to-${matchingGWBridge.id}`,
        source: swarmNode.id,
        target: matchingGWBridge.id,
        sourceHandle: 'gwbridge-in',
        targetHandle: 'gwbridge-out',
        type: 'swarmEdge',
        data: {
          edgeType: 'default' as SwarmEdgeType,
          label: 'node-gwbridge'
        }
      });
    }
  });
  
  // 규칙 2: 각 컨테이너는 연결된 GWBridge의 특정 핸들에 연결 (VXLAN 연결)
  containerElements.forEach(container => {
    // 컨테이너 ID 형식: container-node-1-0
    const containerIdParts = container.id.split('-');
    if (containerIdParts.length < 3) return; // ID 형식이 올바르지 않은 경우 건너뛰기
    
    // 노드 ID 추출 (container-node-1-0 -> node-1)
    const nodeId = `${containerIdParts[1]}-${containerIdParts[2]}`;
    
    // 해당 노드의 GWBridge 찾기
    const gwbridgeId = `network-gwbridge-${nodeId}`;
    const matchingGWBridge = gwbridgeNetworks.find(network => network.id === gwbridgeId);
    
    if (matchingGWBridge) {
      // 컨테이너의 ID에 해당하는 GWBridge의 핸들 ID 계산
      const targetHandleId = `handle-${container.id}`;
      
      edges.push({
        id: `edge-${container.id}-to-${matchingGWBridge.id}`,
        source: container.id,
        target: matchingGWBridge.id,
        sourceHandle: 'gwbridge-out',  // 컨테이너의 하단 핸들
        targetHandle: targetHandleId,  // GWBridge의 해당 컨테이너용 핸들
        type: 'swarmEdge',
        data: {
          edgeType: 'vxlan' as SwarmEdgeType,
          label: 'VXLAN'
        }
      });
    }
  });
  
  return edges;
};