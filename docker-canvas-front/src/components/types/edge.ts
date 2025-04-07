/**
 * Edge 관련 타입을 정의하는 파일
 * 
 * 이 파일은 Docker Swarm 인프라 요소들 간의 연결을 나타내는
 * 엣지(Edge)의 데이터 구조와 관련 타입, 인터페이스를 정의합니다.
 */

// 엣지 타입 정의 (시각적 스타일 구분용)
export type SwarmEdgeType = 'default' | 'vxlan' | 'ingress';

// 엣지 데이터 인터페이스 정의
export interface EdgeData {
  edgeType: SwarmEdgeType;   // 엣지 타입 (스타일 결정)
  label?: string;            // 엣지 라벨 (선택적)
  sourceNetwork?: string;    // 소스 네트워크 정보 (선택적)
  targetNetwork?: string;    // 타겟 네트워크 정보 (선택적)
  connectionType?: string;   // 연결 유형 설명 (선택적)
  animated?: boolean;        // 애니메이션 적용 여부 (선택적)
}

// ReactFlow에서 사용할 엣지 인터페이스 확장
export interface SwarmEdge {
  id: string;               // 엣지 ID
  source: string;           // 소스 노드 ID
  target: string;           // 타겟 노드 ID
  sourceHandle?: string;    // 소스 핸들 ID (선택적)
  targetHandle?: string;    // 타겟 핸들 ID (선택적)
  type?: string;            // 엣지 컴포넌트 타입
  data?: EdgeData;          // 엣지 데이터
}