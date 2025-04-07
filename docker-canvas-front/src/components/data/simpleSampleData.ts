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
      status: 'ready',
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
      driver: 'gwbridge',
      scope: 'local',
      type: 'docker',
      interfaces: [
        {
          name: 'gwbr0',
          ipAddress: '172.18.0.1',
          subnet: '172.18.0.0/16',
          gateway: '172.18.0.1'
        }
      ]
    },
    {
      id: 'network-ingress',
      name: 'ingress',
      driver: 'overlay',
      scope: 'swarm',
      type: 'docker',
      interfaces: [
        {
          name: 'ovl0',
          ipAddress: '10.0.0.1',
          subnet: '10.0.0.0/24',
          gateway: '10.0.0.1'
        }
      ],
      attachable: true
    },
    {
      id: 'network-web-net',
      name: 'web-net',
      driver: 'overlay',
      scope: 'swarm',
      type: 'docker',
      interfaces: [
        {
          name: 'ovl1',
          ipAddress: '10.1.0.1',
          subnet: '10.1.0.0/24',
          gateway: '10.1.0.1'
        }
      ],
      attachable: true
    }
  ];