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
    
    // 규칙 3: 컨테이너는 Overlay 네트워크와 연결
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
            }
          });
        });
      });
    }
    
    // 규칙 4: GWBridge와 Ingress 네트워크 연결
    const ingressNetwork = layoutedNodes.find(
      node => node.type === 'networkNode' && node.data.name === 'ingress'
    );
    
    if (ingressNetwork) {
      // 각 gwbridge 네트워크와 ingress 네트워크 간 연결
      gwbridgeNetworks.forEach(gwbridge => {
        // gwbridge의 ingressToGwbridgeHandles 정보 확인
        if (gwbridge.data.ingressToGwbridgeHandles && gwbridge.data.ingressToGwbridgeHandles.length > 0) {
          // gwbridge에서 ingress로 엣지 생성
          edges.push({
            id: `edge-${gwbridge.id}-to-${ingressNetwork.id}`,
            source: gwbridge.id,
            target: ingressNetwork.id,
            sourceHandle: 'ingress-out',    // GWBridge 네트워크의 상단 핸들
            targetHandle: `gwbridge-in-${gwbridge.id}`,  // Ingress 네트워크의 하단 핸들
            type: 'swarmEdge',
            data: {
              edgeType: 'ingress' as SwarmEdgeType,
              label: 'Ingress'
            }
          });
        }
      });
    }

    // 규칙 5: 노드와 Overlay 네트워크 연결
    overlayNetworks.forEach(overlayNetwork => {
      // overlayNetwork.data.nodeHandles 사용
      if (overlayNetwork.data.nodeHandles && overlayNetwork.data.nodeHandles.length > 0) {
        overlayNetwork.data.nodeHandles.forEach((handleInfo:any) => {
          const nodeId = handleInfo.nodeId;
          const nodeElement = swarmNodeElements.find(node => node.id === nodeId);
          
          if (nodeElement && nodeElement.data.overlayHandles) {
            // 해당 오버레이 네트워크에 대한 노드 핸들 찾기
            const matchingHandle = nodeElement.data.overlayHandles.find(
              (h:any) => h.networkId === overlayNetwork.id
            );
            
            if (matchingHandle) {
              // 노드와 오버레이 네트워크 간 엣지 생성
              edges.push({
                id: `edge-${nodeId}-to-${overlayNetwork.id}`,
                source: nodeId,
                target: overlayNetwork.id,
                sourceHandle: `overlay-out-${overlayNetwork.id}`,  // 노드의 해당 오버레이 네트워크용 핸들
                targetHandle: `node-in-${nodeId}`,  // 오버레이 네트워크의 해당 노드용 핸들
                type: 'swarmEdge',
                data: {
                  edgeType: 'default' as SwarmEdgeType
                }
              });
            }
          }
        });
      }
    });
  
    return edges;
  };