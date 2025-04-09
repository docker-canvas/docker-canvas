// docker-canvas-front/src/utils/objectComparison.ts

/**
 * 객체 비교 유틸리티
 * 
 * 이 파일은 객체 간의 깊은 비교를 수행하는 유틸리티 함수들을 제공합니다.
 * DockerContext 및 기타 컴포넌트에서 객체 변경 여부를 정확하게 감지하는 데 사용됩니다.
 */

import { NodeData } from '../components/types/node';
import { NetworkData } from '../components/types/network';
import { ContainerData } from '../components/types/container';

/**
 * 두 객체가 깊은 수준에서 동일한지 비교합니다.
 * JSON.stringify를 사용한 비교보다 더 정확하고 성능이 좋습니다.
 * 
 * @param obj1 비교할 첫 번째 객체
 * @param obj2 비교할 두 번째 객체
 * @returns 두 객체가 동일하면 true, 그렇지 않으면 false
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  // 기본 타입 또는 참조가 같은 경우
  if (obj1 === obj2) {
    return true;
  }
  
  // 둘 중 하나만 null 또는 undefined인 경우
  if (obj1 == null || obj2 == null) {
    return false;
  }
  
  // 타입이 다른 경우
  if (typeof obj1 !== typeof obj2) {
    return false;
  }
  
  // 배열 비교
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    
    // 두 배열의 모든 요소가 같은지 확인
    // 배열 요소 순서가 중요한 경우
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) {
        return false;
      }
    }
    
    return true;
  }
  
  // 객체 비교 (배열이 아닌 경우)
  if (typeof obj1 === 'object') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    // 키 개수가 다른 경우
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    // 첫 번째 객체의 모든 키가 두 번째 객체에도 있고, 해당 값이 같은지 확인
    for (const key of keys1) {
      if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }
    
    return true;
  }
  
  // 객체도 배열도 아닌 경우 (이미 위에서 기본 타입은 === 비교를 했음)
  return false;
}

/**
 * 두 노드 데이터 객체가 동일한지 비교합니다.
 * 
 * @param node1 첫 번째 노드 데이터
 * @param node2 두 번째 노드 데이터
 * @returns 두 노드가 동일하면 true, 그렇지 않으면 false
 */
export function areNodesEqual(node1: NodeData, node2: NodeData): boolean {
  // 기본 속성 비교
  if (
    node1.id !== node2.id ||
    node1.hostname !== node2.hostname ||
    node1.role !== node2.role ||
    node1.status !== node2.status ||
    node1.addr !== node2.addr ||
    node1.availability !== node2.availability ||
    node1.createdAt !== node2.createdAt ||
    node1.updatedAt !== node2.updatedAt
  ) {
    return false;
  }
  
  // 복잡한 객체 속성 비교
  if (!deepEqual(node1.labels, node2.labels) ||
      !deepEqual(node1.platform, node2.platform) ||
      !deepEqual(node1.resources, node2.resources) ||
      !deepEqual(node1.engineInfo, node2.engineInfo) ||
      !deepEqual(node1.managerStatus, node2.managerStatus)) {
    return false;
  }
  
  // 컨테이너 비교
  if (node1.containers.length !== node2.containers.length) {
    return false;
  }
  
  // 컨테이너 ID를 기준으로 정렬하고 비교
  const sortedContainers1 = [...node1.containers].sort((a, b) => a.id.localeCompare(b.id));
  const sortedContainers2 = [...node2.containers].sort((a, b) => a.id.localeCompare(b.id));
  
  for (let i = 0; i < sortedContainers1.length; i++) {
    if (!areContainersEqual(sortedContainers1[i], sortedContainers2[i])) {
      return false;
    }
  }
  
  return true;
}

/**
 * 두 컨테이너 데이터 객체가 동일한지 비교합니다.
 * 
 * @param container1 첫 번째 컨테이너 데이터
 * @param container2 두 번째 컨테이너 데이터
 * @returns 두 컨테이너가 동일하면 true, 그렇지 않으면 false
 */
export function areContainersEqual(container1: ContainerData, container2: ContainerData): boolean {
  // 기본 속성 비교
  if (
    container1.id !== container2.id ||
    container1.nodeId !== container2.nodeId ||
    container1.serviceName !== container2.serviceName ||
    container1.image !== container2.image ||
    container1.status !== container2.status ||
    container1.createdAt !== container2.createdAt
  ) {
    return false;
  }
  
  // 네트워크 비교
  if (container1.networks.length !== container2.networks.length) {
    return false;
  }
  
  // 네트워크 비교 (ID 기준 정렬 후 비교)
  const sortedNetworks1 = [...container1.networks].sort((a, b) => 
    (a.id || '').localeCompare(b.id || ''));
  const sortedNetworks2 = [...container2.networks].sort((a, b) => 
    (a.id || '').localeCompare(b.id || ''));
  
  for (let i = 0; i < sortedNetworks1.length; i++) {
    if (!deepEqual(sortedNetworks1[i], sortedNetworks2[i])) {
      return false;
    }
  }
  
  // 포트 비교
  if (!deepEqual(container1.ports, container2.ports)) {
    return false;
  }
  
  // 핸들 위치 비교
  if (!deepEqual(container1.handlePositions, container2.handlePositions)) {
    return false;
  }
  
  return true;
}

/**
 * 두 네트워크 데이터 객체가 동일한지 비교합니다.
 * 
 * @param network1 첫 번째 네트워크 데이터
 * @param network2 두 번째 네트워크 데이터
 * @returns 두 네트워크가 동일하면 true, 그렇지 않으면 false
 */
export function areNetworksEqual(network1: NetworkData, network2: NetworkData): boolean {
  // 기본 속성 비교
  if (
    network1.id !== network2.id ||
    network1.name !== network2.name ||
    network1.driver !== network2.driver ||
    network1.scope !== network2.scope ||
    network1.attachable !== network2.attachable ||
    network1.internal !== network2.internal ||
    network1.createdAt !== network2.createdAt
  ) {
    return false;
  }
  
  // 복잡한 객체 속성 비교
  if (!deepEqual(network1.networkInfo, network2.networkInfo) ||
      !deepEqual(network1.labels, network2.labels)) {
    return false;
  }
  
  // 컨테이너 핸들 비교
  if (!deepEqual(network1.containerHandles, network2.containerHandles)) {
    return false;
  }
  
  return true;
}