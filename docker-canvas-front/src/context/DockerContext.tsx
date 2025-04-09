// docker-canvas-front/src/context/DockerContext.tsx
/**
 * Docker 인프라 컨텍스트
 * 
 * 이 파일은 Docker Swarm 인프라 데이터를 관리하는 Context를 정의합니다.
 * - NodeData와 NetworkData 상태 관리
 * - Context Provider 컴포넌트 제공
 * - 데이터 동기화 및 비교 기능 제공
 */

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { NodeData } from '../components/types/node';
import { NetworkData } from '../components/types/network';

// Docker 인프라 컨텍스트 인터페이스 정의
interface DockerContextType {
  nodes: NodeData[];          // 노드 데이터 배열
  networks: NetworkData[];    // 네트워크 데이터 배열
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;         // 노드 업데이트 함수
  setNetworks: React.Dispatch<React.SetStateAction<NetworkData[]>>;   // 네트워크 업데이트 함수
  refreshData: () => void;    // 데이터 새로고침 함수
  
  // 데이터 초기화 및 동기화 함수
  synchronizeData: (newNodes: NodeData[], newNetworks: NetworkData[]) => void;  // 데이터 동기화
}

// Context 생성 (기본값은 나중에 Provider에서 제공되므로 여기서는 undefined로 설정)
const DockerContext = createContext<DockerContextType | undefined>(undefined);

// 컨텍스트 Provider 속성 인터페이스
interface DockerProviderProps {
  children: ReactNode;
}

/**
 * Docker 인프라 컨텍스트 Provider 컴포넌트
 * 
 * 이 컴포넌트는 Docker Swarm 인프라 데이터 상태를 관리하고
 * 해당 데이터를 하위 컴포넌트에 제공합니다.
 */
export const DockerProvider: React.FC<DockerProviderProps> = ({ children }) => {
  // 노드 및 네트워크 데이터 상태 관리
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [networks, setNetworks] = useState<NetworkData[]>([]);
  
  
  /**
   * 데이터 동기화 함수
   * 
   * 새로운 데이터와 기존 데이터를 비교하여 변경사항을 반영합니다.
   * - 새로운 항목 추가
   * - 변경된 항목 업데이트
   * - 삭제된 항목 제거
   * 
   * @param newNodes 새로운 노드 데이터 배열
   * @param newNetworks 새로운 네트워크 데이터 배열
   */
  const synchronizeData = useCallback((newNodes: NodeData[], newNetworks: NetworkData[]) => {
  // 노드 데이터 동기화
    setNodes(prevNodes => {
      // 기존 노드 ID 집합
      const existingNodeIds = new Set(prevNodes.map(node => node.id));
      // 새 노드 ID 집합
      const newNodeIds = new Set(newNodes.map(node => node.id));
      
      // 삭제 여부 확인 (삭제된 ID가 있는지) - Set을 Array.from으로 변환
      const hasDeletedNodes = Array.from(existingNodeIds).some(id => !newNodeIds.has(id));
      
      // 유지할 노드들 (기존 노드 중 새 데이터에도 존재하는 노드들)
      const persistedNodes = prevNodes
        .filter(node => newNodeIds.has(node.id)) // 삭제된 노드 필터링
        .map(node => {
          // 해당 ID의 새 노드 데이터 찾기
          const updatedNode = newNodes.find(n => n.id === node.id);
          
          // 데이터가 실제로 변경되었는지 확인 (깊은 비교 대신 필요한 필드만 비교)
          if (updatedNode && (
            node.hostname !== updatedNode.hostname ||
            node.role !== updatedNode.role ||
            node.status !== updatedNode.status ||
            JSON.stringify(node.labels) !== JSON.stringify(updatedNode.labels) ||
            node.updatedAt !== updatedNode.updatedAt ||
            // 컨테이너 비교 로직 추가
            node.containers.length !== updatedNode.containers.length ||
            JSON.stringify(node.containers.map(c => c.id).sort()) !== 
            JSON.stringify(updatedNode.containers.map(c => c.id).sort())
          )) {
            return updatedNode; // 실제로 변경된 경우만 새 데이터 사용
          }
          
          return node; // 변경되지 않았으면 기존 객체 유지
        });
      
      // 추가할 노드들 (새 노드 중 기존 데이터에 없는 노드들)
      const addedNodes = newNodes.filter(node => !existingNodeIds.has(node.id));
      
      // 변경된 노드가 있거나 추가/삭제된 노드가 있을 때만 새 배열 반환
      const hasChangedNodes = persistedNodes.some((node, i) => {
        const prevNode = prevNodes.find(p => p.id === node.id);
        return node !== prevNode;
      });
      
      if (hasChangedNodes || addedNodes.length > 0 || hasDeletedNodes) {
        return [...persistedNodes, ...addedNodes];
      }
      
      // 변경된 내용이 없으면 기존 배열 그대로 반환
      return prevNodes;
    });
    
    // 네트워크 데이터 동기화
    setNetworks(prevNetworks => {
      // 기존 네트워크 ID 집합
      const existingNetworkIds = new Set(prevNetworks.map(network => network.id));
      // 새 네트워크 ID 집합
      const newNetworkIds = new Set(newNetworks.map(network => network.id));
      
      // 삭제 여부 확인 (삭제된 ID가 있는지)
      const hasDeletedNetworks = Array.from(existingNetworkIds).some(id => !newNetworkIds.has(id));
      
      // 유지할 네트워크들 (기존 네트워크 중 새 데이터에도 존재하는 네트워크들)
      const persistedNetworks = prevNetworks
        .filter(network => newNetworkIds.has(network.id)) // 삭제된 네트워크 필터링
        .map(network => {
          // 해당 ID의 새 네트워크 데이터 찾기
          const updatedNetwork = newNetworks.find(n => n.id === network.id);
          
          // 데이터가 실제로 변경되었는지 확인 (깊은 비교 대신 필요한 필드만 비교)
          if (updatedNetwork && (
            network.name !== updatedNetwork.name ||
            network.driver !== updatedNetwork.driver ||
            network.scope !== updatedNetwork.scope ||
            JSON.stringify(network.networkInfo) !== JSON.stringify(updatedNetwork.networkInfo) ||
            network.attachable !== updatedNetwork.attachable ||
            network.internal !== updatedNetwork.internal ||
            JSON.stringify(network.labels) !== JSON.stringify(updatedNetwork.labels)
          )) {
            return updatedNetwork; // 실제로 변경된 경우만 새 데이터 사용
          }
          
          return network; // 변경되지 않았으면 기존 객체 유지
        });
      
      // 추가할 네트워크들 (새 네트워크 중 기존 데이터에 없는 네트워크들)
      const addedNetworks = newNetworks.filter(network => !existingNetworkIds.has(network.id));
      
      // 추가된 노드에 대한 gwbridge 네트워크 생성
      const gwbridgeNetworks: NetworkData[] = [];
      
      // 새 노드와 기존 노드 ID 비교
      const existingNodeIds = new Set(nodes.map(node => node.id));
      
      // 새로 추가된 노드들에 대한 gwbridge 네트워크 생성
      newNodes.forEach(node => {
        // 이 노드가 새로 추가된 노드인지 확인
        if (!existingNodeIds.has(node.id)) {
          // 이 노드에 대한 gwbridge 네트워크 ID
          const gwbridgeId = `network-gwbridge-${node.id}`;
          
          // 이미 생성된 gwbridge 네트워크가 있는지 확인
          const existingGwbridge = [...persistedNetworks, ...addedNetworks, ...gwbridgeNetworks]
            .find(network => network.id === gwbridgeId);
          
          // 존재하지 않으면 새로 생성하여 추가
          if (!existingGwbridge) {
            const newGwbridge: NetworkData = {
              id: gwbridgeId,
              name: 'docker_gwbridge',
              driver: 'bridge', // bridge 타입으로 설정
              scope: 'local',
              networkInfo: {},
              createdAt: new Date().toISOString()
            };
            
            gwbridgeNetworks.push(newGwbridge);
          }
        }
      });
      
      // 변경된 네트워크가 있거나 추가/삭제된 네트워크가 있을 때만 새 배열 반환
      const hasChangedNetworks = persistedNetworks.some((network, i) => {
        const prevNetwork = prevNetworks.find(p => p.id === network.id);
        return network !== prevNetwork;
      });
      
      if (hasChangedNetworks || addedNetworks.length > 0 || gwbridgeNetworks.length > 0 || hasDeletedNetworks) {
        return [...persistedNetworks, ...addedNetworks, ...gwbridgeNetworks];
      }
      
      // 변경된 내용이 없으면 기존 배열 그대로 반환
      return prevNetworks;
    });
  }, []);
  
  // 테스트 데이터와 실제 데이터 간 전환을 위한 함수
  const refreshData = useCallback(() => {
    // 데이터 새로고침 로직 
    // 여기서는 빈 함수로 유지 (폴링 메커니즘으로 대체)
  }, []);

  // Context 값 생성
  const contextValue: DockerContextType = {
    nodes,
    networks,
    setNodes,
    setNetworks,
    refreshData,
    
    // 데이터 초기화 및 동기화 함수
    synchronizeData
  };

  return (
    <DockerContext.Provider value={contextValue}>
      {children}
    </DockerContext.Provider>
  );
};

/**
 * Docker 컨텍스트 사용을 위한 커스텀 Hook
 * 
 * 이 Hook을 사용하면 컴포넌트에서 쉽게 Docker 인프라 데이터에
 * 접근하고 수정할 수 있습니다.
 */
export const useDockerContext = (): DockerContextType => {
  const context = useContext(DockerContext);
  
  if (context === undefined) {
    throw new Error('useDockerContext는 DockerProvider 내부에서만 사용할 수 있습니다');
  }
  
  return context;
};