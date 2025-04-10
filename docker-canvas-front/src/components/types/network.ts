/**
 * Docker 네트워크 타입을 정의하는 파일
 * 
 * 이 파일은 Docker 네트워크의 데이터 구조와
 * 관련 타입, 인터페이스를 정의합니다.
 */

// 네트워크 드라이버 타입 정의
export type NetworkDriver = 'bridge' | 'overlay' | 'host' | 'macvlan' | 'none';

// 네트워크 범위 타입 정의
export type NetworkScope = 'swarm' | 'local';

// 네트워크 기본 정보 정의 (간소화됨)
export interface NetworkInfo {
  subnet?: string;      // 서브넷
  gateway?: string;     // 게이트웨이
}

// 컨테이너 핸들 연결 정보 (위치 정보 포함)
export interface IngressToGwbridgeHandleInfo {
  networkId: string;   // 연결된 컨테이너 ID
  xPosition: number;    // 핸들 X의 절대적 좌표 위치 
}

// 컨테이너 핸들 연결 정보 (위치 정보 포함)
export interface ContainerHandleInfo {
  containerId: string;   // 연결된 컨테이너 ID
  xPosition: number;     // 핸들 X 좌표의 상대적 위치 (0~1 사이 값)
}

export interface NetworkToNodeHandleInfo {
  nodeId: string;     // 연결된 노드 ID
  xPosition: number;  // 핸들 X 좌표의 상대적 위치 (0~1 사이 값)
}

export interface NodeToGwbridgeHandleInfo {
  position: number; // gwbridge에서의 핸들 위치 (0~1)
  nodeConnectionPosition?: number; // 노드에서의 연결 위치 (0~1)
}

// 네트워크 데이터 인터페이스 정의
export interface NetworkData {
  id: string;                       // 네트워크 ID
  name: string;                     // 네트워크 이름 (ingress, docker_gwbridge 등)
  driver: NetworkDriver;            // 네트워크 드라이버
  scope: NetworkScope;              // 네트워크 범위
  networkInfo: NetworkInfo;         // 네트워크 기본 정보 (subnet, gateway, IP)
  attachable?: boolean;             // 컨테이너 수동 연결 가능 여부
  internal?: boolean;               // 내부 네트워크 여부
  labels?: object;  // 네트워크 라벨
  createdAt?: string;               // 생성 일시
  containerHandles?: ContainerHandleInfo[];  // 컨테이너 핸들 정보 - 레이아웃 계산기에서 설정
  ingressToGwbridgeHandles?: IngressToGwbridgeHandleInfo[];
  nodeHandles?: NetworkToNodeHandleInfo[];
  nodeToGwbridgeHandle?: NodeToGwbridgeHandleInfo;
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