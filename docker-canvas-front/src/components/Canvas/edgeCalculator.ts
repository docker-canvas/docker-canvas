/**
 * 엣지 계산 유틸리티
 * 
 * 노드, 컨테이너, 네트워크 간의 연결을 나타내는 엣지(Edge)를 계산하는
 * 유틸리티 함수들을 제공합니다.
 */

import { Edge, Node } from 'reactflow';
import { NodeData } from '../types/node';
import { NetworkData } from '../types/network';
import { SwarmEdgeType } from '../types/edge';
import { NodeLayoutInfo } from '../types/layoutTypes';

/**
 * 모든 필요한 엣지를 계산하는 함수
 * 
 * 요구사항에 따라 다음 규칙을 적용합니다:
 * - gwbridge는 Node (HostMachine)의 네트워크와 연결
 * - swarm 네트워크 관련 컨테이너는 gwbridge와 연결
 * - 컨테이너는 overlay 네트워크와 연결 (컨테이너의 네트워크 설정에 따라)
 * - ingress-sbox 컨테이너는 gwbridge와 Ingress에 연결
 * 
 * @param layoutedNodes 배치가 계산된 노드들
 * @param layoutInfo 레이아웃 계산 정보
 * @param swarmNodes Docker Swarm 노드 데이터
 * @param networks 네트워크 데이터
 * @returns 엣지 배열
 */
export const calculateEdges = (
  layoutedNodes: Node[],
  layoutInfo: NodeLayoutInfo,
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
    // 컨테이너와 GWBridge 간의 연결 정보 가져오기
    const containerInfo = layoutInfo.containerToGWBridge[container.id];
    if (!containerInfo) return; // 정보가 없으면 건너뛰기
    
    // 해당 컨테이너가 연결될 GWBridge 찾기
    const matchingGWBridge = gwbridgeNetworks.find(network => network.id === containerInfo.gwbridgeId);
    
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
  
  // 규칙 3: 컨테이너는 Overlay 네트워크와 연결
  if (layoutInfo.containerToOverlay) {
    // 모든 컨테이너에 대해 Overlay 네트워크 연결 처리
    Object.values(layoutInfo.containerToOverlay).forEach(connections => {
      connections.forEach(connection => {
        const { containerId, networkId, networkName } = connection;
        
        // 연결할 Overlay 네트워크 찾기
        const overlayNetwork = overlayNetworks.find(network => network.id === networkId);
        if (!overlayNetwork) return; // Overlay 네트워크가 없으면 건너뛰기
        
        // 해당 컨테이너 노드와 네트워크 노드의 실제 핸들 확인
        const containerNode = nodeMap.get(containerId);
        const networkNode = nodeMap.get(networkId);
        
        if (!containerNode || !networkNode) return; // 노드가 없으면 건너뛰기
        
        // 컨테이너 핸들 ID 결정
        const targetHandleId = `overlay-in-${networkName}`;
        
        // 네트워크 노드의 핸들 ID 결정
        const sourceHandleId = `overlay-out-${containerId}`;
        
        // 컨테이너와 Overlay 간 엣지 생성
        edges.push({
          id: `edge-${networkId}-to-${containerId}`,
          source: networkId,  // Overlay 네트워크가 소스(상단)
          target: containerId,  // 컨테이너가 타겟(하단)
          sourceHandle: sourceHandleId,  // Overlay 네트워크의 해당 컨테이너용 핸들
          targetHandle: targetHandleId,  // 컨테이너의 해당 네트워크용 핸들
          type: 'swarmEdge',
          data: {
            edgeType: 'ingress' as SwarmEdgeType, // Overlay 타입은 ingress 스타일로 표시
            label: networkName
          }
        });
      });
    });
  }
  
  return edges;
};