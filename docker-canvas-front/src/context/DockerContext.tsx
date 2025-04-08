/**
 * Docker 인프라 컨텍스트
 * 
 * 이 파일은 Docker Swarm 인프라 데이터를 관리하는 Context를 정의합니다.
 * - NodeData와 NetworkData 상태 관리
 * - Context Provider 컴포넌트 제공
 * - 필요한 타입들 임포트
 */

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { NodeData } from '../components/types/node';
import { NetworkData } from '../components/types/network';
import { sampleNodes, sampleNetworks } from '../components/data/sampleData';
import { simpleSampleNodes, simpleSampleNetworks } from '../components/data/simpleSampleData';

// Docker 인프라 컨텍스트 인터페이스 정의
interface DockerContextType {
  nodes: NodeData[];          // 노드 데이터 배열
  networks: NetworkData[];    // 네트워크 데이터 배열
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;         // 노드 업데이트 함수
  setNetworks: React.Dispatch<React.SetStateAction<NetworkData[]>>;   // 네트워크 업데이트 함수
  useTestData: boolean;       // 테스트 데이터 사용 여부
  setUseTestData: React.Dispatch<React.SetStateAction<boolean>>;      // 테스트 데이터 사용 여부 설정 함수
  refreshData: () => void;    // 데이터 새로고침 함수
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
  const [nodes, setNodes] = useState<NodeData[]>(sampleNodes);
  const [networks, setNetworks] = useState<NetworkData[]>(sampleNetworks);
  const [useTestData, setUseTestData] = useState<boolean>(true);
  
  // 테스트 데이터와 실제 데이터 간 전환을 위한 함수
  const refreshData = () => {
    if (useTestData) {
      // 테스트 데이터 사용 시, sampleData.ts의 데이터 사용
      setNodes(sampleNodes);
      setNetworks(sampleNetworks);
    } else {
      // 간단한 테스트 데이터 사용 시, simpleSampleData.ts의 데이터 사용
      setNodes(simpleSampleNodes);
      setNetworks(simpleSampleNetworks);
    }
  };

  // Context 값 생성
  const contextValue: DockerContextType = {
    nodes,
    networks,
    setNodes,
    setNetworks,
    useTestData,
    setUseTestData,
    refreshData
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