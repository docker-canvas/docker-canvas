import { DockerContainer, DockerNetwork, HostMachine } from '../types/docker.types';

// API 엔드포인트 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface InfrastructureData {
  containers: DockerContainer[];
  networks: DockerNetwork[];
  hosts: HostMachine[];
}

// 타임아웃 설정 함수
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Docker API 서비스
export const DockerApiService = {
  // 컨테이너 목록 조회
  async getContainers(): Promise<DockerContainer[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/containers`);
      if (!response.ok) {
        throw new Error(`Failed to fetch containers: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching containers:', error);
      throw error;
    }
  },

  // 네트워크 목록 조회
  async getNetworks(): Promise<DockerNetwork[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/networks`);
      if (!response.ok) {
        throw new Error(`Failed to fetch networks: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching networks:', error);
      throw error;
    }
  },

  // 호스트 머신 정보 조회
  async getHostMachines(): Promise<HostMachine[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/hosts`);
      if (!response.ok) {
        throw new Error(`Failed to fetch host machines: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching host machines:', error);
      throw error;
    }
  },

  // 전체 Docker Swarm 인프라 정보 조회
  async getInfrastructure(): Promise<InfrastructureData> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/infrastructure`);
      if (!response.ok) {
        throw new Error(`Failed to fetch infrastructure: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching infrastructure:', error);
      // 재시도 로직 추가 (옵션)
      return {
        containers: [],
        networks: [],
        hosts: []
      };
    }
  },
  
  // 테스트용 더미 데이터 생성 - 백엔드 연결 전 테스트에 사용
  getTestData(): InfrastructureData {
    // 호스트 머신 생성
    const hosts: HostMachine[] = [
      {
        id: 'host-1',
        name: 'Host Machine 1',
        role: 'manager', // 추가
        status: 'Ready', // 추가
        networks: ['bridge-1', 'mynet'],
        containers: ['1-container-1', '1-container-2']
      },
      {
        id: 'host-2',
        name: 'Host Machine 2',
        role: 'worker', // 추가
        status: 'Ready', // 추가
        networks: ['bridge-2', 'mynet'],
        containers: ['2-container-1', '2-container-2']
      }
    ];

    // 네트워크 생성
    const networks: DockerNetwork[] = [
      {
        id: 'mynet',
        name: 'mynet',
        driver: 'overlay',
        scope: 'swarm',
        containers: ['1-container-1', '1-container-2', '2-container-1', '2-container-2']
      },
      {
        id: 'bridge-1',
        name: 'bridge-1',
        driver: 'bridge',
        scope: 'local',
        containers: ['1-container-1', '1-container-2']
      },
      {
        id: 'bridge-2',
        name: 'bridge-2',
        driver: 'bridge',
        scope: 'local',
        containers: ['2-container-1', '2-container-2']
      },
      {
        id: 'external-network',
        name: 'External Network',
        driver: 'bridge',
        scope: 'global',
        containers: []
      }
    ];
    
    // 컨테이너 생성 (ID 형식을 호스트 번호와 일치하도록 수정)
    const containers: DockerContainer[] = [
      {
        id: '1-container-1', // 호스트 1의 컨테이너
        name: 'Container 1',
        status: 'running',
        image: 'nginx:latest',
        networkInterfaces: ['mynet', 'bridge-1']
      },
      {
        id: '1-container-2', // 호스트 1의 컨테이너
        name: 'Container 2',
        status: 'running',
        image: 'postgres:latest',
        networkInterfaces: ['mynet', 'bridge-1']
      },
      {
        id: '2-container-1', // 호스트 2의 컨테이너
        name: 'Container 3',
        status: 'running',
        image: 'redis:latest',
        networkInterfaces: ['mynet', 'bridge-2']
      },
      {
        id: '2-container-2', // 호스트 2의 컨테이너
        name: 'Container 4',
        status: 'running',
        image: 'mysql:latest',
        networkInterfaces: ['mynet', 'bridge-2']
      }
    ];
    
    return { containers, networks, hosts };
  }
};