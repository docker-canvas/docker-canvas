/**
 * Docker Swarm 노드 타입을 정의하는 파일
 * 
 * 이 파일은 Docker Swarm 노드의 데이터 구조와
 * 관련 타입, 인터페이스를 정의합니다.
 */

import { ContainerData } from './container';

// 노드의 역할 타입 정의 (Manager 또는 Worker)
export type NodeRole = 'manager' | 'worker';

// 노드 가용성 상태 타입 정의
export type NodeAvailability = 'active' | 'pause' | 'drain';

// 노드 상태 타입 정의
export type NodeState = 'ready' | 'down' | 'disconnected';

// 매니저 도달 가능성 타입 정의
export type ManagerReachability = 'reachable' | 'unreachable';

// 하드웨어 정보 인터페이스 정의
export interface NodeResources {
  nanoCPUs?: number;       // CPU 코어 수 (나노 단위)
  memoryBytes?: number;    // 메모리 크기 (바이트)
}

// 플랫폼 정보 인터페이스 정의
export interface PlatformInfo {
  architecture?: string;   // CPU 아키텍처
  os?: string;             // 운영체제
}

// 엔진 정보 인터페이스 정의
export interface EngineInfo {
  engineVersion?: string;  // Docker 엔진 버전
}

// 매니저 상태 인터페이스 정의
export interface ManagerStatus {
  leader?: boolean;            // 리더 노드 여부
  reachability?: ManagerReachability;  // 도달 가능성
  addr?: string;               // 관리자 주소
}

// 노드 데이터 인터페이스 정의
export interface NodeData {
  id: string;                         // 노드 고유 식별자
  hostname: string;                   // 호스트명
  role: NodeRole;                     // 역할 (Manager/Worker)
  status?: NodeState;                 // 노드 상태 (선택적)
  containers: ContainerData[];        // 컨테이너 목록
  labels?: Record<string, string>;    // 노드 라벨 (선택적)
  createdAt?: string;                 // 생성 일시 (선택적)
  updatedAt?: string;                 // 업데이트 일시 (선택적)
  
  // 실제 API에 맞게 추가된 필드
  availability?: NodeAvailability;    // 노드 가용성 상태
  resources?: NodeResources;          // 하드웨어 리소스 정보
  platform?: PlatformInfo;            // 플랫폼 정보
  engineInfo?: EngineInfo;            // 엔진 정보
  addr?: string;                      // 노드 IP 주소
  managerStatus?: ManagerStatus;      // 매니저 상태 (매니저 노드만)
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