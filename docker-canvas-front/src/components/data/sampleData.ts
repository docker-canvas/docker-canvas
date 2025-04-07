/**
 * 샘플 데이터 제공 모듈
 * 
 * 개발 및 테스트용 샘플 데이터를 제공합니다.
 * API 연동 전 프로토타이핑 용도로 사용됩니다.
 */

import { NodeData } from '../types/node';
import { NetworkData } from '../types/network';
import { ContainerData } from '../types/container';

/**
 * 샘플 네트워크 데이터
 * 각 네트워크에 고유한 ID 부여
 */
export const sampleNetworks: NetworkData[] = [
  {
    id: 'network-external',
    name: 'docker_gwbridge',
    driver: 'bridge',
    scope: 'local',
    networkInfo: {
      subnet: '192.168.1.0/24',
      gateway: '192.168.1.1'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'network-ingress',
    name: 'ingress',
    driver: 'overlay',
    scope: 'swarm',
    networkInfo: {
      subnet: '10.0.0.0/24',
      gateway: '10.0.0.1'
    },
    attachable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'network-app',
    name: 'app-network',
    driver: 'overlay',
    scope: 'swarm',
    networkInfo: {
      subnet: '10.0.0.0/24',
      gateway: '10.0.0.1'
    },
    attachable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'network-frontend',
    name: 'frontend-network',
    driver: 'overlay',
    scope: 'swarm',
    networkInfo: {
      subnet: '10.1.0.0/24',
      gateway: '10.1.0.1'
    },
    attachable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'network-backend',
    name: 'backend-network',
    driver: 'overlay',
    scope: 'swarm',
    networkInfo: {
      subnet: '10.2.0.0/24',
      gateway: '10.2.0.1'
    },
    attachable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'network-gwbridge-node-1',  // 노드 ID를 포함한 고유 ID 사용
    name: 'docker_gwbridge',
    driver: 'bridge',
    scope: 'local',
    networkInfo: {
      subnet: '172.18.0.0/16',
      gateway: '172.18.0.1'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'network-gwbridge-node-2',
    name: 'docker_gwbridge',
    driver: 'bridge',
    scope: 'local',
    networkInfo: {
      subnet: '172.18.0.0/16',
      gateway: '172.18.0.1'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'network-gwbridge-node-3',
    name: 'docker_gwbridge',
    driver: 'bridge',
    scope: 'local',
    networkInfo: {
      subnet: '172.18.0.0/16',
      gateway: '172.18.0.1'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'network-gwbridge-node-5',  // 노드 5에 대한 gwbridge 추가
    name: 'docker_gwbridge',
    driver: 'bridge',
    scope: 'local',
    networkInfo: {
      subnet: '172.18.0.0/16',
      gateway: '172.18.0.1'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'network-bridge',  // 일반 bridge 네트워크 추가
    name: 'bridge',
    driver: 'bridge',
    scope: 'local',
    networkInfo: {
      subnet: '172.17.0.0/16',
      gateway: '172.17.0.1'
    },
    createdAt: new Date().toISOString()
  }
];

/**
 * 네트워크 이름으로 ID를 찾는 헬퍼 함수
 */
const getNetworkIdByName = (name: string): string | undefined => {
  const network = sampleNetworks.find(net => net.name === name);
  return network?.id;
};

/**
 * 샘플 컨테이너 데이터 생성 함수
 * 
 * @param nodeId 컨테이너가 속한 노드 ID
 * @param count 생성할 컨테이너 수
 * @returns 컨테이너 데이터 배열
 */
export const getSampleContainers = (nodeId: string, count: number): ContainerData[] => {
  return Array.from({ length: count }, (_, i) => {
    // 네트워크 정보에 ID 추가
    const bridgeNetworkName = i % 2 === 0 ? 'bridge' : 'docker_gwbridge';
    const bridgeNetworkId = i % 2 === 0 
      ? 'network-bridge' 
      : `network-gwbridge-${nodeId}`;
    
    const networks = [
      {
        id: bridgeNetworkId,
        name: bridgeNetworkName,
        driver: 'bridge',
        ipAddress: `172.17.0.${10 + i}`
      }
    ];
    
    // 일부 컨테이너에 overlay 네트워크 추가
    if (i % 3 === 0) {
      networks.push({
        id: 'network-app',
        name: 'app-network',
        driver: 'overlay',
        ipAddress: `10.0.0.${i+1}`
      });
    }
    
    if (i % 5 === 0) {
      networks.push({
        id: 'network-frontend',
        name: 'frontend-network',
        driver: 'overlay',
        ipAddress: `10.1.0.${i+1}`
      });
    }
    
    if (i % 7 === 0) {
      networks.push({
        id: 'network-backend',
        name: 'backend-network',
        driver: 'overlay',
        ipAddress: `10.2.0.${i+1}`
      });
    }
    
    return {
      id: `${nodeId}-container-${i+1}`,
      name: `${nodeId.replace('node-', '')}-container-${i+1}`,
      image: i % 3 === 0 ? 'nginx:latest' : (i % 3 === 1 ? 'redis:alpine' : 'postgres:13'),
      status: i % 4 === 0 ? 'stopped' : 'running',
      networks: networks,
      ports: i % 2 === 0 ? [
        { internal: 80, external: 8080 + i, protocol: 'tcp' }
      ] : [],
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    };
  });
};

/**
 * 샘플 Docker Swarm 노드 데이터
 */
export const sampleNodes: NodeData[] = [
  {
    id: 'node-1',
    hostname: 'swarm-manager-01',
    role: 'Manager',
    networkInterfaces: [
      { name: 'eth0', address: '192.168.1.10' }
    ],
    status: 'Ready',
    containers: getSampleContainers('node-1', 5),
    labels: {
      'node.role': 'manager'
    }
  },
  {
    id: 'node-5',
    hostname: 'swarm-manager-02',
    role: 'Manager',
    networkInterfaces: [
      { name: 'eth0', address: '192.168.1.14' }
    ],
    status: 'Ready',
    containers: getSampleContainers('node-5', 3),
    labels: {
      'node.role': 'manager'
    }
  },
  {
    id: 'node-2',
    hostname: 'swarm-worker-01',
    role: 'Worker',
    networkInterfaces: [
      { name: 'eth0', address: '192.168.1.11' }
    ],
    status: 'Ready',
    containers: getSampleContainers('node-2', 8),
    labels: {
      'node.role': 'worker'
    }
  },
  {
    id: 'node-3',
    hostname: 'swarm-worker-02',
    role: 'Worker',
    networkInterfaces: [
      { name: 'eth0', address: '192.168.1.12' }
    ],
    status: 'Down',
    containers: getSampleContainers('node-3', 3),
    labels: {
      'node.role': 'worker'
    }
  }
];