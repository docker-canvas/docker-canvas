import { NetworkData } from "../types/network";
import { NodeData } from "../types/node";

export const simpleSampleNodes: NodeData[] = [
    {
      id: 'node-1',
      hostname: 'simple-swarm-node',
      role: 'Worker',
      networkInterfaces: [
        { name: 'eth0', address: '192.168.1.10' }
      ],
      status: 'Ready',
      containers: [
        {
          id: 'node-1-container-1',
          name: 'container-1',
          image: 'nginx:latest',
          status: 'running',
          networks: [
            {
              name: 'ingress',
              driver: 'overlay',
              ipAddress: '10.0.0.2'
            },
            {
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
  
  export const simpleSampleNetworks: NetworkData[] = [
    {
      id: 'network-gwbridge',
      name: 'docker_gwbridge',
      driver: 'bridge',
      scope: 'local',
      networkInfo: 
        {
          subnet: '172.18.0.0/16',
          gateway: '172.18.0.1'
        },
    },
    {
      id: 'network-ingress',
      name: 'ingress',
      driver: 'overlay',
      scope: 'swarm',
      networkInfo: 
        {
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
      networkInfo:
        {
          subnet: '10.1.0.0/24',
          gateway: '10.1.0.1'
        },
      attachable: true
    }
  ];