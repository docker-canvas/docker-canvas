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
import { areNetworksEqual, areNodesEqual } from './objectComparison';

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
    setNodes(prevNodes => {
      const existingNodeIds = new Set(prevNodes.map(node => node.id));
      const newNodeIds = new Set(newNodes.map(node => node.id));
      const deletedNodes = prevNodes.filter(node => !newNodeIds.has(node.id));
      const addedNodes = newNodes.filter(node => !existingNodeIds.has(node.id));
  
      let hasChanged = false;
      const persistedNodes = prevNodes
        .filter(node => newNodeIds.has(node.id))
        .map(node => {
          const updatedNode = newNodes.find(n => n.id === node.id);
          const changed = updatedNode && !areNodesEqual(node, updatedNode);
  
          if (changed) {
            hasChanged = true;
            return updatedNode!;
          }
  
          return node;
        });
  
      const nextNodes = [...persistedNodes, ...addedNodes];
      const hasAdded = addedNodes.length > 0;
      const hasDeleted = deletedNodes.length > 0;
      const hasNodeChanges = hasAdded || hasDeleted || hasChanged;
  
      if (hasNodeChanges) {
        console.log('✅ Node state will update:', {
          added: addedNodes.map(n => n.id),
          deleted: deletedNodes.map(n => n.id),
          changed: persistedNodes.filter(n => !prevNodes.some(p => p.id === n.id))
        });
        return nextNodes;
      }
  
      console.log('⏸️ Node state unchanged');
      return prevNodes;
    });
  
    setNetworks(prevNetworks => {
      const existingNetworkIds = new Set(prevNetworks.map(network => network.id));
      const newNetworkIds = new Set(newNetworks.map(network => network.id));
    
      const deletedNetworks = prevNetworks.filter(network => !newNetworkIds.has(network.id));
      const addedNetworks = newNetworks.filter(network => !existingNetworkIds.has(network.id));
    
      let hasChanged = false;
      const persistedNetworks = prevNetworks
        .filter(network => newNetworkIds.has(network.id))
        .map(network => {
          const updatedNetwork = newNetworks.find(n => n.id === network.id);
          const changed = updatedNetwork && !areNetworksEqual(network, updatedNetwork);
    
          if (changed) {
            hasChanged = true;
            return updatedNetwork!;
          }
    
          return network;
        });
    
      const nextNetworks = [...persistedNetworks, ...addedNetworks];
    
      const hasNetworkChanges =
        hasChanged ||
        addedNetworks.length > 0 ||
        deletedNetworks.length > 0;
    
      if (hasNetworkChanges) {
        console.log('✅ Network state will update:', {
          added: addedNetworks.map(n => n.id),
          deleted: deletedNetworks.map(n => n.id),
          changed: persistedNetworks.filter(n => !prevNetworks.some(p => p.id === n.id)),
        });
        return nextNetworks;
      }
    
      console.log('⏸️ Network state unchanged');
      return prevNetworks;
    });    
  }, [nodes, networks]);
  
  
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