/**
 * 노드 타입 등록 파일
 * 
 * ReactFlow에서 사용할 사용자 정의 노드 타입을 등록합니다.
 * 이 파일에서 정의된 노드 타입은 ReactFlow 컴포넌트의 nodeTypes 속성에 전달됩니다.
 */

import Container from "../Dockers/Container";
import Network from "../Dockers/Network";
import SwarmNode from "../Dockers/SwarmNode";

// ReactFlow에 등록할 노드 타입 매핑
const nodeTypes = {
    swarmNode: SwarmNode,
    container: Container,
    networkNode: Network
  };

export default nodeTypes;