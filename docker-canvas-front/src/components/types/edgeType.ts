/**
 * Edge 타입 등록 파일
 * 
 * ReactFlow에서 사용할 사용자 정의 엣지 타입을 등록합니다.
 * 이 파일에서 정의된 엣지 타입은 ReactFlow 컴포넌트의 edgeTypes 속성에 전달됩니다.
 * 
 * 우리는 하나의 엣지 컴포넌트(SwarmEdge)를 사용하고, 데이터의 edgeType 속성을 통해
 * 다양한 엣지 스타일을 적용합니다. 이렇게 하면 코드 중복이 줄어들고 유지보수가 용이합니다.
 */

import SwarmEdge from "../Edges/SwarmEdge";

// ReactFlow에 등록할 엣지 타입 매핑
const edgeTypes = {
  swarmEdge: SwarmEdge  // 단일 엣지 컴포넌트를 사용
};

export default edgeTypes;