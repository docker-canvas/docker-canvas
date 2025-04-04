/**
 * Docker 네트워크 타입을 정의하는 파일
 * 
 * 이 파일은 Docker 네트워크의 데이터 구조와
 * 관련 타입, 인터페이스를 정의합니다.
 */

// 네트워크 드라이버 타입 정의
export type NetworkDriver = 'bridge' | 'overlay' | 'host' | 'macvlan' | 'none' | 'gwbridge';

// 네트워크 범위 타입 정의
export type NetworkScope = 'swarm' | 'local' | 'global';

// 네트워크 유형 정의
export type NetworkType = 'external' | 'docker' | 'internal';

// 네트워크 인터페이스 정의
export interface NetworkInterface {
  name: string;         // 인터페이스 이름
  ipAddress: string;    // IP 주소
  subnet?: string;      // 서브넷
  gateway?: string;     // 게이트웨이
}

// 네트워크 데이터 인터페이스 정의
export interface NetworkData {
  id: string;                       // 네트워크 ID
  name: string;                     // 네트워크 이름 (ingress, docker_gwbridge 등)
  driver: NetworkDriver;            // 네트워크 드라이버
  scope: NetworkScope;              // 네트워크 범위
  type: NetworkType;                // 네트워크 유형 (external, docker)
  interfaces: NetworkInterface[];   // 네트워크 인터페이스 목록
  attachable?: boolean;             // 컨테이너 수동 연결 가능 여부
  internal?: boolean;               // 내부 네트워크 여부
  labels?: Record<string, string>;  // 네트워크 라벨
  createdAt?: string;               // 생성 일시
}

// 네트워크 위치 및 크기 정보를 정의하는 인터페이스
export interface NetworkDimension {
  width: number;      // 너비
  height: number;     // 높이
  x: number;          // x 좌표
  y: number;          // y 좌표
}

// ReactFlow에서 사용할 네트워크 노드 타입 확장
export interface NetworkNode {
  id: string;         // 노드 고유 식별자
  type: 'networkNode'; // 노드 타입
  position: {         // 위치 정보
    x: number;
    y: number;
  };
  data: NetworkData;  // 네트워크 데이터
  style?: React.CSSProperties; // 스타일 속성
}