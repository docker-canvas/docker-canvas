/**
 * 레이아웃 계산 관련 타입 정의
 * 
 * 이 파일은 레이아웃 계산에 사용되는 다양한 타입들을 정의합니다.
 * 레이아웃 엔진, 계산기, 엣지 생성기 등에서 공통으로 사용됩니다.
 */

import { ContainerHandleInfo } from './network';

/**
 * 노드 위치 정보를 나타내는 인터페이스
 */
export interface NodePosition {
  x: number;   // X 좌표
  y: number;   // Y 좌표
}

/**
 * 컨테이너와 GWBridge 간의 연결 정보
 */
export interface ContainerGWBridgeConnection {
  containerId: string;   // 컨테이너 ID
  gwbridgeId: string;    // GWBridge 네트워크 ID
  xOffset: number;       // 상대적 X 위치 (0~1 사이 값)
}

/**
 * 컨테이너와 Overlay 네트워크 간의 연결 정보
 */
export interface ContainerOverlayConnection {
  containerId: string;   // 컨테이너 ID
  networkId: string;     // Overlay 네트워크 ID
  networkName: string;   // Overlay 네트워크 이름
  xOffset: number;       // 상대적 X 위치 (0~1 사이 값)
}

/**
 * 레이어 Y 위치 정보
 */
export interface LayerYPositions {
  external: number;    // External 네트워크 레이어 Y 위치
  nodes: number;       // 노드 레이어 Y 위치
  gwbridge: number;    // GWBridge 레이어 Y 위치
  containers: number;  // 컨테이너 레이어 Y 위치
  ingress: number;     // Ingress 레이어 Y 위치
  overlay: number;     // 기타 Overlay 레이어 Y 위치
}

/**
 * 노드 레이아웃 정보
 * 레이아웃 계산 결과를 저장하는 인터페이스
 */
export interface NodeLayoutInfo {
  nodeWidths: Record<string, number>;  // 노드 ID별 너비
  nodePositions: Record<string, NodePosition>;  // 노드 ID별 위치
  currentX: number;   // 현재 X 좌표 (배치 계산 중 사용)
  totalWidth: number;  // 전체 너비
  containerToGWBridge: Record<string, ContainerGWBridgeConnection>;  // 컨테이너-GWBridge 연결 정보
  containerToOverlay?: Record<string, ContainerOverlayConnection[]>;  // 컨테이너-Overlay 연결 정보
  overlayNetworkContainers?: Record<string, ContainerHandleInfo[]>;  // Overlay 네트워크별 연결된 컨테이너 정보
  layerYPositions: LayerYPositions;  // 레이어별 Y 위치
}