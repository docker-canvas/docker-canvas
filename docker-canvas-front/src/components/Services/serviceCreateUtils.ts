import { NodeData } from '../types/node';

/**
 * 서비스 관리 관련 유틸리티 함수들
 * 
 * 서비스 생성, 네트워크 관리, 제약 조건 검사 등을 위한
 * 유틸리티 함수들을 제공합니다.
 */

/**
 * 서비스 구성 타입 정의
 */
export interface ServiceConfig {
  Name: string;
  TaskTemplate: {
    ContainerSpec: {
      Image: string;
      Env?: string[];
    };
    Placement?: {
      Constraints?: string[];
    };
  };
  Mode: {
    [key: string]: any;
  };
  Networks?: {
    Target: string;
  }[];
  EndpointSpec?: {
    Ports?: {
      Protocol: string;
      TargetPort: number;
      PublishedPort: number;
      PublishMode: string;
    }[];
  };
}

/**
 * 네트워크 구성 타입 정의
 */
export interface NetworkConfig {
  id: string;
  useExisting: boolean;
  newNetworkName: string;
}

/**
 * 포트 구성 타입 정의
 */
export interface PortConfig {
  internal: string;
  external: string;
  protocol: string;
}

/**
 * 환경변수 타입 정의
 */
export interface EnvVarConfig {
  key: string;
  value: string;
}

/**
 * 제약 조건을 검사하는 함수
 * 
 * 제약 조건을 파싱하고 일치하는 노드의 수를 반환합니다.
 * 
 * @param constraint 제약 조건 문자열
 * @param nodes 노드 데이터 배열
 * @returns 일치하는 노드 수 또는 오류인 경우 null
 */
export function checkConstraint(constraint: string, nodes: NodeData[]): number | null {
    if (!constraint.trim()) {
      return nodes.length; // 제약 조건이 없으면 모든 노드가 대상
    }
    
    try {
      // 간단한 형식 체크 (node.labels.key==value 또는 node.role==manager)
      const matches = constraint.match(/node\.(labels\.([a-zA-Z0-9_]+)|role)==([a-zA-Z0-9_]+)/);
      
      if (!matches) {
        console.error('제약 조건 형식이 올바르지 않습니다.');
        return null;
      }
      
      const type = matches[1].startsWith('labels.') ? 'labels' : 'role';
      
      if (type === 'labels') {
        const key = matches[2];
        const value = matches[3];
        
        // 라벨 조건에 맞는 노드 찾기
        // object 타입으로 변경됨에 따라 안전하게 접근하도록 수정
        const filtered = nodes.filter(node => 
          node.labels && 
          typeof node.labels === 'object' && 
          node.labels !== null && 
          (key in node.labels) && 
          (node.labels as any)[key] === value
        );
        return filtered.length;
      } else {
        const value = matches[3];
        
        // 역할 조건에 맞는 노드 찾기
        const filtered = nodes.filter(node => 
          node.role.toLowerCase() === value.toLowerCase()
        );
        return filtered.length;
      }
    } catch (error) {
      console.error('Constraint parsing error:', error);
      return null;
    }
  }

/**
 * 유효한 서비스 구성 객체를 생성하는 함수
 * 
 * @param image 이미지 이름
 * @param serviceName 서비스 이름
 * @param serviceMode 서비스 모드 ('replicated' | 'global')
 * @param replicas 복제본 수 (replicated 모드일 때만 사용)
 * @param networkConfigs 네트워크 구성 배열
 * @param publishPorts 포트 구성 배열
 * @param publishMode 포트 게시 모드 ('ingress' | 'host')
 * @param constraint 제약 조건 (선택 사항)
 * @param envVars 환경 변수 배열 (선택 사항)
 * @returns 유효한 서비스 구성 객체
 */
export function createServiceConfig(
  image: string,
  serviceName: string,
  serviceMode: 'replicated' | 'global',
  replicas: number,
  networkConfigs: NetworkConfig[],
  publishPorts: PortConfig[],
  publishMode: 'ingress' | 'host',
  constraint?: string,
  envVars?: EnvVarConfig[]
): ServiceConfig {
  // 네트워크 구성 처리
  const networkAttachments = networkConfigs
    .filter(config => config.useExisting ? config.id : config.newNetworkName.trim())
    .map(config => ({
      Target: config.useExisting ? config.id : config.newNetworkName.trim()
    }));
  
  // 환경 변수 처리
  const environment = envVars
    ? envVars
        .filter(env => env.key.trim() && env.value.trim())
        .map(env => `${env.key}=${env.value}`)
    : [];
  
  // 서비스 구성 객체 생성
  const serviceConfig: ServiceConfig = {
    Name: serviceName,
    TaskTemplate: {
      ContainerSpec: {
        Image: image,
        ...(environment.length > 0 && { Env: environment })
      },
      ...(constraint && { Placement: { Constraints: [constraint] } })
    },
    Mode: {
      [serviceMode]: serviceMode === 'replicated' ? { Replicas: replicas } : {}
    },
    ...(networkAttachments.length > 0 && { Networks: networkAttachments }),
    EndpointSpec: {
      Ports: publishPorts
        .filter(port => port.internal && port.external)
        .map(port => ({
          Protocol: port.protocol,
          TargetPort: parseInt(port.internal),
          PublishedPort: parseInt(port.external),
          PublishMode: publishMode
        }))
    }
  };
  
  return serviceConfig;
}

/**
 * 필수 입력 필드를 검증하는 함수
 * 
 * @param image 이미지 이름
 * @param serviceName 서비스 이름
 * @returns 유효성 검사 결과 객체 { isValid: boolean, message?: string }
 */
export function validateRequiredFields(image: string, serviceName: string): { isValid: boolean; message?: string } {
  if (!image.trim()) {
    return { isValid: false, message: '이미지를 입력하세요.' };
  }
  
  if (!serviceName.trim()) {
    return { isValid: false, message: '서비스 이름을 입력하세요.' };
  }
  
  return { isValid: true };
}

/**
 * 네트워크 구성이 유효한지 검증하는 함수
 * 
 * @param networkConfigs 네트워크 구성 배열
 * @returns 유효성 검사 결과 객체 { isValid: boolean, message?: string }
 */
export function validateNetworkConfigs(networkConfigs: NetworkConfig[]): { isValid: boolean; message?: string } {
  for (const config of networkConfigs) {
    if (config.useExisting && !config.id) {
      return { isValid: false, message: '네트워크를 선택하세요.' };
    }
    
    if (!config.useExisting && !config.newNetworkName.trim()) {
      return { isValid: false, message: '새 네트워크 이름을 입력하세요.' };
    }
  }
  
  return { isValid: true };
}