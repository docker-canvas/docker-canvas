import { NetworkData } from "../types/network";
import { NodeData } from "../types/node";

/**
 * 간단한 샘플 데이터 제공 모듈
 * 
 * 간소화된 샘플 데이터로 테스트와 디버깅 용도로 사용됩니다.
 */

// 간단한 네트워크 데이터 샘플
export const simpleSampleNetworks: NetworkData[] = [
  {
    id: 'network-gwbridge',
    name: 'docker_gwbridge',
    driver: 'bridge',
    scope: 'local',
    networkInfo: {
      subnet: '172.18.0.0/16',
      gateway: '172.18.0.1'
    },
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
    attachable: true
  },
  {
    id: 'network-web-net',
    name: 'web-net',
    driver: 'overlay',
    scope: 'swarm',
    networkInfo: {
      subnet: '10.1.0.0/24',
      gateway: '10.1.0.1'
    },
    attachable: true
  }
];

// 간단한 노드 데이터 샘플 - 컨테이너 네트워크에 ID 추가
export const simpleSampleNodes: NodeData[] = [
  {
    id: 'node-1',
    hostname: 'simple-swarm-node',
    role: 'Worker',
    networkInterfaces: [
      { name: 'eth0', address: '192.168.1.10' }
    ],
    status: 'ready',
    containers: [
      {
        id: 'node-1-container-1',
        name: 'container-1',
        image: 'nginx:latest',
        status: 'running',
        networks: [
          {
            id: 'network-ingress',  // 네트워크 ID 추가
            name: 'ingress',
            driver: 'overlay',
            ipAddress: '10.0.0.2'
          },
          {
            id: 'network-web-net',  // 네트워크 ID 추가
            name: 'web-net',
            driver: 'overlay',
            ipAddress: '10.1.0.2'
          }
        ]
      },
      {
        id: 'node-1-container-2',
        name: 'container-2',
        image: 'redis:alpine',
        status: 'running',
        networks: [
          {
            id: 'network-web-net',  // 네트워크 ID 추가
            name: 'web-net',
            driver: 'overlay',
            ipAddress: '10.1.0.3'
          }
        ]
      }
    ],
    labels: {
      'node.role': 'worker'
    }
  }
];