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
      (node.data.driver === 'bridge' || node.data.name.includes('gwbridge') || node.data.name === 'docker_gwbridge')
    );
    
    const overlayNetworks = layoutedNodes.filter(
      node => node.type === 'networkNode' && 
      node.data.driver === 'overlay'
    );
    
    // 3. Swarm Node들 찾기
    const swarmNodeElements = layoutedNodes.filter(
      node => node.type === 'swarmNode'
    );
    
    // 4. Container 요소들 찾기
    const containerElements = layoutedNodes.filter(
      node => node.type === 'container'
    );
    
    // 규칙 1: Node는 GWBridge 네트워크와 연결
    swarmNodeElements.forEach((swarmNode) => {
        // gwbridge id 형식: network-gwbridge-node-1
        const gwbridgeId = `network-gwbridge-${swarmNode.id}`;
        
        // 네트워크 ID 직접 일치 여부가 아닌 ID에 노드 ID가 포함되는지 확인하는 방식으로 변경
        // 더 유연한 매칭 로직으로 변경
        const matchingGWBridge = gwbridgeNetworks.find(network => 
          network.id === gwbridgeId || 
          (network.id.includes('gwbridge') && network.id.includes(swarmNode.id))
        );
        
        
        if (matchingGWBridge) {
          edges.push({
            id: `edge-${swarmNode.id}-to-${matchingGWBridge.id}`,
            source: swarmNode.id,
            target: matchingGWBridge.id,
            sourceHandle: 'gwbridge-out',  // SwarmNode의 상단 핸들
            targetHandle: 'gwbridge-in',   // GWBridge 네트워크의 하단 핸들
            type: 'swarmEdge',
            data: {
              edgeType: 'default' as SwarmEdgeType,
            }
          });
        }
      });
      
    
    // 규칙 2: 컨테이너는 GWBridge 네트워크와 연결
    // VXLAN 타입이므로 라벨 유지
    containerElements.forEach(container => {
      const containerInfo = layoutInfo.containerToGWBridge[container.id];
      if (!containerInfo) return;
      
      const matchingGWBridge = gwbridgeNetworks.find(network => 
        network.id === containerInfo.gwbridgeId || 
        (network.id.includes('gwbridge') && network.id.includes(containerInfo.gwbridgeId.split('-').slice(-1)[0]))
      );
      
      if (matchingGWBridge) {
        const targetHandleId = `handle-${container.id}`;
        
        edges.push({
          id: `edge-${container.id}-to-${matchingGWBridge.id}`,
          source: container.id,
          target: matchingGWBridge.id,
          sourceHandle: 'gwbridge-out',
          targetHandle: targetHandleId,
          type: 'swarmEdge',
          data: {
            edgeType: 'vxlan' as SwarmEdgeType,
            label: 'VXLAN' // VXLAN 라벨 유지
          }
        });
      }
    });
    
    // 규칙 3: 컨테이너는 Overlay 네트워크와 연결
    // VXLAN이 아니므로 라벨 제거
    if (layoutInfo.containerToOverlay) {
      Object.values(layoutInfo.containerToOverlay).forEach(connections => {
        connections.forEach(connection => {
          const { containerId, networkId, networkName } = connection;
          
          const overlayNetwork = overlayNetworks.find(network => 
            network.id === networkId || 
            network.data.name === networkName
          );
          
          if (!overlayNetwork) return;
          
          const containerNode = nodeMap.get(containerId);
          const networkNode = nodeMap.get(overlayNetwork.id);
          
          if (!containerNode || !networkNode) return;
          
          const targetHandleId = `overlay-in-${networkName}`;
          const sourceHandleId = `overlay-out-${containerId}`;
          
          edges.push({
            id: `edge-${overlayNetwork.id}-to-${containerId}`,
            source: overlayNetwork.id,
            target: containerId,
            sourceHandle: sourceHandleId,
            targetHandle: targetHandleId,
            type: 'swarmEdge',
            data: {
              edgeType: 'ingress' as SwarmEdgeType,
              // 라벨 제거
            }
          });
        });
      });
    }
    
    return edges;
  };