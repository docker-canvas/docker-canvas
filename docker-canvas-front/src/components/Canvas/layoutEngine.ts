/**
 * 레이아웃 엔진
 * 
 * 이 파일은 Docker Swarm 인프라 시각화의 전체 레이아웃 프로세스를 조율합니다.
 * 노드 계산기와 엣지 계산기를 통합하여 완전한 시각화 요소를 생성합니다.
 */

import { Node, Edge } from 'reactflow';
import { NodeData } from '../types/node';
import { NetworkData } from '../types/network';
import { calculateLayout } from './layoutCalculator';
import { calculateEdges } from './edgeCalculator';

/**
 * 전체 레이아웃을 처리하는 함수
 * 
 * 노드 레이아웃 계산과 엣지 계산을 순차적으로 실행하여
 * 완전한 시각화를 위한 모든 요소를 생성합니다.
 * 
 * @param nodeData Docker Swarm 노드 데이터 배열
 * @param networks 네트워크 데이터 배열
 * @returns 노드와 엣지 배열이 포함된 객체
 */
export const generateLayout = (
  nodeData: NodeData[], 
  networks: NetworkData[]
): { nodes: Node[], edges: Edge[] } => {
  // 1. 노드 레이아웃 계산
  const { nodes, layoutInfo } = calculateLayout(nodeData, networks);
  
  // 2. 엣지 계산
  const edges = calculateEdges(nodes, layoutInfo, nodeData, networks);
  
  // 3. 결과 반환
  return { nodes, edges };
};