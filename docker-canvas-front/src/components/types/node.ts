/**
 * Docker Swarm 노드 타입을 정의하는 파일
 * 
 * 이 파일은 Docker Swarm 노드의 데이터 구조와
 * 관련 타입, 인터페이스를 정의합니다.
 */

import { ContainerData } from './container';

// 노드의 역할 타입 정의 (Manager 또는 Worker)
export type NodeRole = 'Manager' | 'Worker';

// 네트워크 인터페이스 정보를 정의하는 인터페이스
export interface NetworkInterface {
  name: string;       // 인터페이스 이름 (eth0, eth1 등)
  address: string;    // IP 주소
  netmask?: string;   // 넷마스크 (선택적)
  gateway?: string;   // 게이트웨이 (선택적)
}

// 노드 데이터 인터페이스 정의
export interface NodeData {
  id: string;                         // 노드 고유 식별자
  hostname: string;                   // 호스트명
  role: NodeRole;                     // 역할 (Manager/Worker)
  networkInterfaces: NetworkInterface[]; // 네트워크 인터페이스 목록
  status?: 'Ready' | 'Down' | 'Disconnected'; // 노드 상태 (선택적)
  containers: ContainerData[];        // 컨테이너 목록 (이전의 containerCount 대체)
  labels?: Record<string, string>;    // 노드 라벨 (선택적)
  createdAt?: string;                 // 생성 일시 (선택적)
  updatedAt?: string;                 // 업데이트 일시 (선택적)
}

// Node 위치 및 크기 정보를 정의하는 인터페이스
export interface NodeDimension {
  width: number;      // 너비 (containers 길이에 비례)
  height: number;     // 높이 (고정값)
  x: number;          // x 좌표
  y: number;          // y 좌표
}

// ReactFlow에서 사용할 노드 타입 확장
export interface SwarmNode {
  id: string;         // 노드 고유 식별자
  type: 'swarmNode';  // 노드 타입
  position: {         // 위치 정보
    x: number;
    y: number;
  };
  data: NodeData;     // 노드 데이터
}