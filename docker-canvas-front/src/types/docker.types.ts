// Docker 관련 타입 정의

export interface DockerContainer {
    id: string;
    name: string;
    status: string;
    image: string;
    networkInterfaces: string[];
  }
  
  export interface DockerNetwork {
    id: string;
    name: string;
    driver: string;
    scope: string;
    containers: string[];
  }
  
  export interface HostMachine {
    id: string;
    name: string;
    networks: string[];
    containers: string[];
  }
  
  // ReactFlow 노드 타입
  export type NodeType = 'container' | 'network' | 'host' | 'external-network';
  
  export interface DockerNode {
    id: string;
    type: NodeType;
    position: { x: number; y: number };
    data: DockerContainer | DockerNetwork | HostMachine;
  }
  
  export interface DockerEdge {
    id: string;
    source: string;
    target: string;
    type: string;
  }