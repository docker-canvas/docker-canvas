import { DockerContainer, DockerNetwork, HostMachine } from '../types/docker.types';

// API 엔드포인트 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Docker API 서비스
export const DockerApiService = {
  // 컨테이너 목록 조회
  async getContainers(): Promise<DockerContainer[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/containers`);
      if (!response.ok) {
        throw new Error('Failed to fetch containers');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching containers:', error);
      return [];
    }
  },

  // 네트워크 목록 조회
  async getNetworks(): Promise<DockerNetwork[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/networks`);
      if (!response.ok) {
        throw new Error('Failed to fetch networks');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching networks:', error);
      return [];
    }
  },

  // 호스트 머신 정보 조회
  async getHostMachines(): Promise<HostMachine[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hosts`);
      if (!response.ok) {
        throw new Error('Failed to fetch host machines');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching host machines:', error);
      return [];
    }
  },

  // 전체 Docker Swarm 인프라 정보 조회
  async getInfrastructure() {
    try {
      const response = await fetch(`${API_BASE_URL}/infrastructure`);
      if (!response.ok) {
        throw new Error('Failed to fetch infrastructure');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching infrastructure:', error);
      return {
        containers: [],
        networks: [],
        hosts: []
      };
    }
  }
};