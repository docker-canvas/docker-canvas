/**
 * 레이아웃 설정 상수
 * 
 * 이 파일은 Docker Swarm 인프라 시각화의 레이아웃 관련 
 * 상수 값들을 정의합니다. 레이아웃 크기, 간격 등을 중앙에서 관리하여
 * 일관성을 유지하고 수정을 용이하게 합니다.
 */

export const layoutConfig = {
    // 컴포넌트 크기 설정
    containerWidth: 120,        // 컨테이너 너비
    containerHeight: 80,        // 컨테이너 높이 (Container.tsx에도 동일한 값 설정 필요)
    nodeMinWidth: 380,          // 노드 최소 너비
    nodeHeight: 400,            // 노드 높이
    externalNetworkHeight: 40,  // External 네트워크 높이
    ingressNetworkHeight: 40,   // Ingress 네트워크 높이
    gwbridgeNetworkHeight: 60,  // GWBridge 네트워크 높이
    overlayNetworkHeight: 40,   // 기타 Overlay 네트워크 높이
    
    // 간격 설정
    containerGap: 10,           // 컨테이너 간 수평 간격
    layerGap: 40,               // 레이어 간 수직 간격
    horizontalGap: 200,         // 노드 간 수평 간격
    
    // 초기 위치 설정
    startX: 50,                 // 시작 X 좌표
    startY: 100,                // 시작 Y 좌표
};