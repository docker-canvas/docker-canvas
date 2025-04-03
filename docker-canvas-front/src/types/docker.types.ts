// Docker 관련 타입 정의

export interface DockerContainer {
  id: string;
  name: string;
  status: string;
  image: string;
  networkInterfaces: string[];
  serviceId?: string; // Swarm 서비스 ID
  serviceName?: string; // Swarm 서비스 이름
  taskId?: string; // Swarm 태스크 ID
  nodeId?: string; // 컨테이너가 배치된 노드 ID
}

export interface DockerNetwork {
  id: string;
  name: string;
  driver: string; // 'overlay', 'bridge', 'host', 'gwbridge'
  scope: string; // 'swarm', 'local', 'global'
  containers: string[];
  subnet?: string; // CIDR 형식 (예: '10.0.0.0/24')
  gateway?: string; // 게이트웨이 IP 주소
}

export interface HostMachine {
  id: string;
  name: string;
  role: 'manager' | 'worker'; // Swarm 역할
  status: string; // 'Ready', 'Down' 등
  networks: string[];
  containers: string[];
  ip?: string; // 호스트 IP 주소
}

// 네트워크 인터페이스 타입 정의
export interface NetworkInterface {
  id: string;
  name: string;
  type: 'overlay' | 'bridge' | 'host' | 'external' | 'gwbridge';
  connects: {
    source: string;
    target: string;
  };
}

// ReactFlow 노드 타입
export type NodeType = 'container' | 'network' | 'host' | 'external-network' | 'network-interface' | 'gwbridge';

export interface DockerNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: DockerContainer | DockerNetwork | HostMachine | NetworkInterface;
}

export interface DockerEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}