/**
 * Docker 인프라 컨텍스트
 * 
 * 이 파일은 Docker Swarm 인프라 데이터를 관리하는 Context를 정의합니다.
 * - NodeData와 NetworkData 상태 관리
 * - Context Provider 컴포넌트 제공
 * - 필요한 타입들 임포트
 * - 노드, 컨테이너, 네트워크 조작을 위한 함수들 제공
 */

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { NodeData } from '../components/types/node';
import { NetworkData } from '../components/types/network';
import { ContainerData } from '../components/types/container';

// Docker 인프라 컨텍스트 인터페이스 정의
interface DockerContextType {
  nodes: NodeData[];          // 노드 데이터 배열
  networks: NetworkData[];    // 네트워크 데이터 배열
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;         // 노드 업데이트 함수
  setNetworks: React.Dispatch<React.SetStateAction<NetworkData[]>>;   // 네트워크 업데이트 함수
  useTestData: boolean;       // 테스트 데이터 사용 여부
  setUseTestData: React.Dispatch<React.SetStateAction<boolean>>;      // 테스트 데이터 사용 여부 설정 함수
  refreshData: () => void;    // 데이터 새로고침 함수
  
  // 데이터 초기화 함수
  initializeData: (initialNodes: NodeData[], initialNetworks: NetworkData[]) => void;  // 전체 데이터 초기화
  
  // 노드 관련 함수
  addNode: (node: NodeData) => void;                    // 노드 추가
  removeNode: (nodeId: string) => void;                 // 노드 삭제
  updateNode: (nodeId: string, data: Partial<NodeData>) => void;   // 노드 업데이트
  
  // 컨테이너 관련 함수
  addContainer: (nodeId: string, container: ContainerData) => void;   // 컨테이너 추가
  removeContainer: (nodeId: string, containerId: string) => void;     // 컨테이너 삭제
  updateContainer: (nodeId: string, containerId: string, data: Partial<ContainerData>) => void;   // 컨테이너 업데이트
  
  // 네트워크 관련 함수
  addNetwork: (network: NetworkData) => void;                        // 네트워크 추가
  removeNetwork: (networkId: string) => void;                       // 네트워크 삭제
  updateNetwork: (networkId: string, data: Partial<NetworkData>) => void;  // 네트워크 업데이트
  
  // 컨테이너와 네트워크 연결 관리
  connectContainerToNetwork: (nodeId: string, containerId: string, networkId: string, ipAddress?: string) => void;  // 컨테이너와 네트워크 연결
  disconnectContainerFromNetwork: (nodeId: string, containerId: string, networkId: string) => void;                  // 컨테이너와 네트워크 연결 해제
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
  const [useTestData, setUseTestData] = useState<boolean>(true);
  
  /**
   * 전체 데이터 초기화 함수
   * 
   * 노드와 네트워크 데이터를 외부에서 제공된 데이터로 한 번에 초기화합니다.
   * 이 함수는 API 응답이나 파일에서 로드한 데이터로 상태를 설정할 때 유용합니다.
   * 
   * @param initialNodes 초기화할 노드 데이터 배열
   * @param initialNetworks 초기화할 네트워크 데이터 배열
   */
  const initializeData = useCallback((initialNodes: NodeData[], initialNetworks: NetworkData[]) => {
    setNodes(initialNodes);
    setNetworks(initialNetworks);
    // 테스트 데이터 모드를 false로 설정 (실제 데이터 사용 중임을 표시)
    setUseTestData(false);
    console.log('Docker 인프라 데이터가 초기화되었습니다.');
  }, []);
  
  // 테스트 데이터와 실제 데이터 간 전환을 위한 함수
  const refreshData = useCallback(() => {
    if (useTestData) {
      // 테스트 데이터 사용 시, sampleData.ts의 데이터 사용
      setNodes([]);
      setNetworks([]);
    } else {
      // 간단한 테스트 데이터 사용 시, simpleSampleData.ts의 데이터 사용
      setNodes([]);
      setNetworks([]);
    }
  }, [useTestData]);

  // ============= 노드 관련 함수 =============
  
  /**
   * 노드 추가 함수
   * 
   * 새로운 노드를 추가합니다. ID가 중복되면 추가하지 않습니다.
   * 
   * @param node 추가할 노드 데이터
   */
  const addNode = useCallback((node: NodeData) => {
    setNodes(prevNodes => {
      // ID 중복 확인
      const exists = prevNodes.some(n => n.id === node.id);
      if (exists) {
        console.warn(`노드 ID '${node.id}'가 이미 존재합니다.`);
        return prevNodes;
      }
      
      // 새 노드 추가
      return [...prevNodes, node];
    });
  }, []);
  
  /**
   * 노드 삭제 함수
   * 
   * 지정된 ID의 노드를 삭제합니다. 삭제 시 연결된 컨테이너도 모두 삭제됩니다.
   * 
   * @param nodeId 삭제할 노드의 ID
   */
  const removeNode = useCallback((nodeId: string) => {
    setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId));
    
    // 노드가 삭제되면 해당 노드에 연결된 GWBridge 네트워크도 삭제
    setNetworks(prevNetworks => 
      prevNetworks.filter(network => 
        !network.id.includes(`gwbridge-${nodeId}`)
      )
    );
  }, []);
  
  /**
   * 노드 업데이트 함수
   * 
   * 지정된 ID의 노드 데이터를 부분적으로 업데이트합니다.
   * 
   * @param nodeId 업데이트할 노드의 ID
   * @param data 업데이트할 노드 데이터 객체
   */
  const updateNode = useCallback((nodeId: string, data: Partial<NodeData>) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, ...data } 
          : node
      )
    );
  }, []);
  
  // ============= 컨테이너 관련 함수 =============
  
  /**
   * 컨테이너 추가 함수
   * 
   * 지정된 노드에 새 컨테이너를 추가합니다.
   * 
   * @param nodeId 컨테이너를 추가할 노드의 ID
   * @param container 추가할 컨테이너 데이터
   */
  const addContainer = useCallback((nodeId: string, container: ContainerData) => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === nodeId) {
          // 컨테이너 ID 중복 확인
          const exists = node.containers.some(c => c.id === container.id);
          if (exists) {
            console.warn(`컨테이너 ID '${container.id}'가 이미 존재합니다.`);
            return node;
          }
          
          // ID 형식이 잘못된 경우 자동 수정 (nodeId를 포함하도록)
          let containerId = container.id;
          if (!containerId.includes(nodeId)) {
            containerId = `${nodeId}-container-${node.containers.length + 1}`;
            container = { ...container, id: containerId };
          }
          
          // 기존 컨테이너 목록에 새 컨테이너 추가
          return {
            ...node,
            containers: [...node.containers, container]
          };
        }
        return node;
      })
    );
  }, []);
  
  /**
   * 컨테이너 삭제 함수
   * 
   * 지정된 노드에서 컨테이너를 삭제합니다.
   * 
   * @param nodeId 컨테이너가 속한 노드의 ID
   * @param containerId 삭제할 컨테이너의 ID
   */
  const removeContainer = useCallback((nodeId: string, containerId: string) => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            containers: node.containers.filter(container => container.id !== containerId)
          };
        }
        return node;
      })
    );
  }, []);
  
  /**
   * 컨테이너 업데이트 함수
   * 
   * 지정된 노드에서 특정 컨테이너의 데이터를 부분적으로 업데이트합니다.
   * 
   * @param nodeId 컨테이너가 속한 노드의 ID
   * @param containerId 업데이트할 컨테이너의 ID
   * @param data 업데이트할 컨테이너 데이터 객체
   */
  const updateContainer = useCallback((nodeId: string, containerId: string, data: Partial<ContainerData>) => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            containers: node.containers.map(container => 
              container.id === containerId 
                ? { ...container, ...data } 
                : container
            )
          };
        }
        return node;
      })
    );
  }, []);
  
  // ============= 네트워크 관련 함수 =============
  
  /**
   * 네트워크 추가 함수
   * 
   * 새로운 네트워크를 추가합니다. ID가 중복되면 추가하지 않습니다.
   * 
   * @param network 추가할 네트워크 데이터
   */
  const addNetwork = useCallback((network: NetworkData) => {
    setNetworks(prevNetworks => {
      // ID 중복 확인
      const exists = prevNetworks.some(n => n.id === network.id);
      if (exists) {
        console.warn(`네트워크 ID '${network.id}'가 이미 존재합니다.`);
        return prevNetworks;
      }
      
      // 새 네트워크 추가
      return [...prevNetworks, network];
    });
  }, []);
  
  /**
   * 네트워크 삭제 함수
   * 
   * 지정된 ID의 네트워크를 삭제합니다.
   * 이 네트워크에 연결된 모든 컨테이너의 네트워크 연결도 제거합니다.
   * 
   * @param networkId 삭제할 네트워크의 ID
   */
  const removeNetwork = useCallback((networkId: string) => {
    // 네트워크 삭제
    setNetworks(prevNetworks => prevNetworks.filter(network => network.id !== networkId));
    
    // 모든 컨테이너에서 이 네트워크 연결 제거
    setNodes(prevNodes => 
      prevNodes.map(node => ({
        ...node,
        containers: node.containers.map(container => ({
          ...container,
          networks: container.networks.filter(network => network.id !== networkId)
        }))
      }))
    );
  }, []);
  
  /**
   * 네트워크 업데이트 함수
   * 
   * 지정된 ID의 네트워크 데이터를 부분적으로 업데이트합니다.
   * 
   * @param networkId 업데이트할 네트워크의 ID
   * @param data 업데이트할 네트워크 데이터 객체
   */
  const updateNetwork = useCallback((networkId: string, data: Partial<NetworkData>) => {
    setNetworks(prevNetworks => 
      prevNetworks.map(network => 
        network.id === networkId 
          ? { ...network, ...data } 
          : network
      )
    );
    
    // 네트워크 이름이 변경된 경우 연결된 컨테이너의 네트워크 정보도 업데이트
    if (data.name) {
      setNodes(prevNodes => 
        prevNodes.map(node => ({
          ...node,
          containers: node.containers.map(container => ({
            ...container,
            networks: container.networks.map(network => 
              network.id === networkId 
                ? { ...network, name: data.name || network.name } 
                : network
            )
          }))
        }))
      );
    }
  }, []);
  
  // ============= 컨테이너-네트워크 연결 관리 함수 =============
  
  /**
   * 컨테이너와 네트워크 연결 함수
   * 
   * 지정된 컨테이너를 네트워크에 연결합니다.
   * 
   * @param nodeId 컨테이너가 속한 노드의 ID
   * @param containerId 연결할 컨테이너의 ID
   * @param networkId 연결할 네트워크의 ID
   * @param ipAddress 할당할 IP 주소 (선택 사항)
   */
  const connectContainerToNetwork = useCallback((
    nodeId: string, 
    containerId: string, 
    networkId: string, 
    ipAddress?: string
  ) => {
    // 네트워크 정보 가져오기
    const network = networks.find(n => n.id === networkId);
    if (!network) {
      console.error(`네트워크 ID '${networkId}'를 찾을 수 없습니다.`);
      return;
    }
    
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            containers: node.containers.map(container => {
              if (container.id === containerId) {
                // 이미 해당 네트워크에 연결되어 있는지 확인
                const alreadyConnected = container.networks.some(n => n.id === networkId);
                if (alreadyConnected) {
                  console.warn(`컨테이너 '${containerId}'는 이미 네트워크 '${networkId}'에 연결되어 있습니다.`);
                  return container;
                }
                
                // 네트워크 연결 추가
                return {
                  ...container,
                  networks: [
                    ...container.networks,
                    {
                      id: networkId,
                      name: network.name,
                      driver: network.driver,
                      ipAddress: ipAddress || `10.0.0.${Math.floor(Math.random() * 254) + 1}`, // 랜덤 IP 할당
                    }
                  ]
                };
              }
              return container;
            })
          };
        }
        return node;
      })
    );
  }, [networks]);
  
  /**
   * 컨테이너와 네트워크 연결 해제 함수
   * 
   * 지정된 컨테이너를 네트워크에서 연결 해제합니다.
   * 
   * @param nodeId 컨테이너가 속한 노드의 ID
   * @param containerId 연결 해제할 컨테이너의 ID
   * @param networkId 연결 해제할 네트워크의 ID
   */
  const disconnectContainerFromNetwork = useCallback((
    nodeId: string, 
    containerId: string, 
    networkId: string
  ) => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            containers: node.containers.map(container => {
              if (container.id === containerId) {
                // 네트워크 연결 제거
                return {
                  ...container,
                  networks: container.networks.filter(network => network.id !== networkId)
                };
              }
              return container;
            })
          };
        }
        return node;
      })
    );
  }, []);

  // Context 값 생성
  const contextValue: DockerContextType = {
    nodes,
    networks,
    setNodes,
    setNetworks,
    useTestData,
    setUseTestData,
    refreshData,
    
    // 데이터 초기화 함수
    initializeData,
    
    // 노드 관련 함수
    addNode,
    removeNode,
    updateNode,
    
    // 컨테이너 관련 함수
    addContainer,
    removeContainer,
    updateContainer,
    
    // 네트워크 관련 함수
    addNetwork,
    removeNetwork,
    updateNetwork,
    
    // 컨테이너-네트워크 연결 관리
    connectContainerToNetwork,
    disconnectContainerFromNetwork
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