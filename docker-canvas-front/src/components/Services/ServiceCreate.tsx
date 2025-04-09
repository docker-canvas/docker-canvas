import React, { useState, useEffect } from 'react';
import { useDockerContext } from '../../context/DockerContext';
import { createService } from '../data/api_services';
import { createNetwork } from '../data/api_networks';
import { NodeData } from '../types/node';

/**
 * 서비스 생성 컴포넌트
 * 
 * Docker 서비스를 생성하기 위한 폼을 제공합니다.
 * 이미지, 서비스 이름, 네트워크, publish 설정, constraint 조건, 환경변수 등을 지정할 수 있습니다.
 */
const ServiceCreate: React.FC = () => {
  const { networks, nodes } = useDockerContext();

    // 로딩 및 에러 상태 추가
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

  // 필터링된 Overlay 네트워크만 표시
  const overlayNetworks = networks.filter(network => 
    network.driver === 'overlay' && !network.name.includes('ingress')
  );

  // 서비스 생성 폼 상태
  const [image, setImage] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceMode, setServiceMode] = useState('replicated');
  const [replicas, setReplicas] = useState(1);
  const [constraint, setConstraint] = useState('');
  
  // 네트워크 관련 상태
  const [networkConfigs, setNetworkConfigs] = useState([{ 
    id: '',
    useExisting: true,
    newNetworkName: ''
  }]);
  
  // 환경변수 관련 상태
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }]);

  // Publish 설정 관련 상태
  const [publishMode, setPublishMode] = useState('ingress');
  const [publishPorts, setPublishPorts] = useState([{ internal: '', external: '', protocol: 'tcp' }]);
  
  // constraint 조건 검사 결과
  const [matchingNodes, setMatchingNodes] = useState<number | null>(null);
  
  // ServiceCreate.tsx에서 constraint 확인 함수 및 도움말을 수정

  const checkConstraint = () => {
    if (!constraint.trim()) {
      setMatchingNodes(nodes.length); // 제약 조건이 없으면 모든 노드가 대상
      return;
    }
    
    try {
      // Docker의 실제 constraint 형식에 맞는 정규식 패턴 확장
      // node.id, node.hostname, node.role, node.platform.os, node.platform.arch, node.labels 지원
      const matches = constraint.match(
        /node\.(id|hostname|role|platform\.os|platform\.arch|labels\.([a-zA-Z0-9_]+))\s*(==|!=)\s*([a-zA-Z0-9_\.-]+)/
      );
      
      if (!matches) {
        alert('제약 조건 형식이 올바르지 않습니다. "node.속성 == 값" 또는 "node.속성 != 값" 형식을 사용하세요.');
        return;
      }
      
      const property = matches[1]; // id, hostname, role, platform.os 등
      const labelKey = matches[2]; // labels인 경우 키값
      const operator = matches[3]; // == 또는 !=
      const value = matches[4];    // 비교할 값
      
      // 초기화: 빈 배열로 시작
      let filteredNodes: NodeData[] = [];
      
      // 속성에 따라 필터링 로직 적용
      if (property === 'id') {
        // ID로 필터링
        filteredNodes = nodes.filter(node => 
          operator === '==' ? node.id === value : node.id !== value
        );
      } else if (property === 'hostname') {
        // 호스트명으로 필터링
        filteredNodes = nodes.filter(node => 
          operator === '==' ? node.hostname === value : node.hostname !== value
        );
      } else if (property === 'role') {
        // 역할로 필터링
        filteredNodes = nodes.filter(node => 
          operator === '==' ? node.role === value : node.role !== value
        );
      } else if (property === 'platform.os') {
        // 운영체제로 필터링
        filteredNodes = nodes.filter(node => {
          const nodeOS = node.platform?.os;
          return operator === '==' 
            ? nodeOS === value 
            : nodeOS !== value && nodeOS !== undefined;
        });
      } else if (property === 'platform.arch') {
        // 아키텍처로 필터링
        filteredNodes = nodes.filter(node => {
          const nodeArch = node.platform?.architecture;
          return operator === '==' 
            ? nodeArch === value 
            : nodeArch !== value && nodeArch !== undefined;
        });
      } else if (property.startsWith('labels.')) {
        // 노드 라벨로 필터링
        filteredNodes = nodes.filter(node => {
          if (!node.labels) return operator === '!='; // 라벨이 없는 경우 != 연산에만 true
          
          const actualValue = node.labels[labelKey];
          return operator === '==' 
            ? actualValue === value 
            : actualValue !== value || actualValue === undefined;
        });
      }
      
      setMatchingNodes(filteredNodes.length);
    } catch (error) {
      console.error('Constraint parsing error:', error);
      alert('제약 조건을 처리하는 중 오류가 발생했습니다.');
    }
  };
  
  // constraint 도움말 표시를 위한 컴포넌트
  const ConstraintHelpTooltip = () => (
    <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded-md">
      <p className="font-semibold mb-1">사용 가능한 제약 조건 예시:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li>node.role == manager - 매니저 노드에만 배치</li>
        <li>node.labels.zone == seoul - 특정 라벨이 있는 노드</li>
        <li>node.labels.zone != jeju - 특정 라벨 값을 갖지 않는 노드</li>
      </ul>
      <p className="mt-1 italic">참고: Docker Swarm은 '==' 및 '!=' 연산자만 지원합니다.</p>
    </div>
  );
  
  // 포트 필드 추가 함수
  const addPortField = () => {
    setPublishPorts([...publishPorts, { internal: '', external: '', protocol: 'tcp' }]);
  };
  
  // 포트 필드 업데이트 함수
  const updatePortField = (index: number, field: string, value: string) => {
    const updatedPorts = [...publishPorts];
    updatedPorts[index] = { 
      ...updatedPorts[index], 
      [field]: field === 'protocol' ? value : value 
    };
    setPublishPorts(updatedPorts);
  };
  
  // 포트 필드 삭제 함수
  const removePortField = (index: number) => {
    if (publishPorts.length > 1) {
      const updatedPorts = [...publishPorts];
      updatedPorts.splice(index, 1);
      setPublishPorts(updatedPorts);
    }
  };

  // 네트워크 필드 추가 함수
  const addNetworkField = () => {
    setNetworkConfigs([...networkConfigs, { 
      id: '',
      useExisting: true,
      newNetworkName: ''
    }]);
  };

  // 네트워크 필드 업데이트 함수
  const updateNetworkField = (index: number, field: string, value: any) => {
    const updatedNetworks = [...networkConfigs];
    updatedNetworks[index] = { 
      ...updatedNetworks[index], 
      [field]: value
    };
    setNetworkConfigs(updatedNetworks);
  };

  // 네트워크 필드 삭제 함수
  const removeNetworkField = (index: number) => {
    if (networkConfigs.length > 1) {
      const updatedNetworks = [...networkConfigs];
      updatedNetworks.splice(index, 1);
      setNetworkConfigs(updatedNetworks);
    }
  };

  // 환경변수 필드 추가 함수
  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  // 환경변수 필드 업데이트 함수
  const updateEnvVar = (index: number, field: string, value: string) => {
    const updatedEnvVars = [...envVars];
    updatedEnvVars[index] = { ...updatedEnvVars[index], [field]: value };
    setEnvVars(updatedEnvVars);
  };

  // 환경변수 필드 삭제 함수
  const removeEnvVar = (index: number) => {
    if (envVars.length > 1) {
      const updatedEnvVars = [...envVars];
      updatedEnvVars.splice(index, 1);
      setEnvVars(updatedEnvVars);
    }
  };
  
  // 서비스 생성 함수
    const createServiceHandler = async () => {
    // 필수 입력 확인 - 이 부분은 그대로 유지
    if (!image.trim()) {
      alert('이미지를 입력하세요.');
      return;
    }
  
    if (!serviceName.trim()) {
      alert('서비스 이름을 입력하세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // 네트워크 설정 처리 - 새 네트워크 생성이 필요한 경우 처리
      const networkAttachments = [];
      
      // 네트워크 설정 순회
      for (const config of networkConfigs) {
        if (config.useExisting) {
          // 기존 네트워크 사용
          if (config.id) {
            networkAttachments.push({ Target: config.id });
          }
        } else {
          // 새 네트워크 생성
          if (config.newNetworkName.trim()) {
            try {
              const newNetwork = await createNetwork(config.newNetworkName.trim());
              
              // 생성된 네트워크 ID를 사용하여 첨부
              networkAttachments.push({ Target: newNetwork.Id });
            } catch (networkError) {
              console.error(`Failed to create network ${config.newNetworkName}:`, networkError);
            }
          }
        }
      }
      
      // 환경 변수 처리 - 이 부분은 그대로 유지
      const environment = envVars
        .filter(env => env.key.trim() && env.value.trim())
        .map(env => `${env.key}=${env.value}`);
      
      // 서비스 설정 객체 생성
      const serviceConfig = {
        Name: serviceName,
        TaskTemplate: {
          ContainerSpec: {
            Image: image,
            Env: environment.length > 0 ? environment : undefined
          },
          Placement: {
            Constraints: constraint ? [constraint] : undefined
          }
        },
        Mode: {
          [serviceMode]: serviceMode === 'replicated' ? { Replicas: replicas } : {}
        },
        Networks: networkAttachments.length > 0 ? networkAttachments : undefined,
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
      
      console.log('Service configuration:', serviceConfig);
      
      // 서비스 생성 API 호출
      const response = await createService(serviceConfig);
      console.log('Service created successfully:', response);
      setSuccess(true);
      alert('서비스가 성공적으로 생성되었습니다.');
      
      // 폼 초기화
      setImage('');
      setServiceName('');
      setServiceMode('replicated');
      setReplicas(1);
      setConstraint('');
      setNetworkConfigs([{ id: '', useExisting: true, newNetworkName: '' }]);
      setEnvVars([{ key: '', value: '' }]);
      setPublishPorts([{ internal: '', external: '', protocol: 'tcp' }]);
    } catch (err) {
      console.error('Failed to create service:', err);
      setError(`서비스 생성 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      alert(`서비스 생성 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
      <h2 className="text-lg font-medium text-gray-900 sticky top-0 bg-white py-2">서비스 생성</h2>
      
      {/* 이미지 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">이미지 <span className="text-red-500">*</span></label>
        <input
          type="text"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="nginx:latest"
          required
        />
      </div>
      
      {/* 서비스 이름 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">서비스 이름 <span className="text-red-500">*</span></label>
        <input
          type="text"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          placeholder="my-service"
          required
        />
      </div>
      
      {/* 네트워크 설정 */}
      <div>
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">네트워크</label>
          <button 
            type="button"
            onClick={addNetworkField}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            + 네트워크 추가
          </button>
        </div>
        
        {networkConfigs.map((networkConfig, index) => (
          <div key={index} className="mt-2 p-3 border border-gray-200 rounded-md">
            <div className="flex justify-between">
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id={`use-existing-network-${index}`}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    checked={networkConfig.useExisting}
                    onChange={() => updateNetworkField(index, 'useExisting', true)}
                  />
                  <label htmlFor={`use-existing-network-${index}`} className="ml-2 block text-sm text-gray-700">
                    기존 네트워크
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id={`create-new-network-${index}`}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    checked={!networkConfig.useExisting}
                    onChange={() => updateNetworkField(index, 'useExisting', false)}
                  />
                  <label htmlFor={`create-new-network-${index}`} className="ml-2 block text-sm text-gray-700">
                    새 네트워크
                  </label>
                </div>
              </div>
              
              {networkConfigs.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeNetworkField(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {networkConfig.useExisting ? (
              <select
                className="mt-2 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={networkConfig.id}
                onChange={(e) => updateNetworkField(index, 'id', e.target.value)}
              >
                <option value="">네트워크 선택</option>
                {overlayNetworks.map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.name} ({network.driver})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={networkConfig.newNetworkName}
                onChange={(e) => updateNetworkField(index, 'newNetworkName', e.target.value)}
                placeholder="새 네트워크 이름"
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Publish 설정 */}
      <div>
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">Publish 설정</label>
          <button 
            type="button"
            onClick={addPortField}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            + 포트 추가
          </button>
        </div>
        
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700">게시 모드</label>
          <select
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={publishMode}
            onChange={(e) => setPublishMode(e.target.value)}
          >
            <option value="ingress">Ingress</option>
            <option value="host">Host</option>
          </select>
        </div>
        
        <div className="mt-2">
          {publishPorts.map((port, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <input
                type="text"
                className="block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={port.internal}
                onChange={(e) => updatePortField(index, 'internal', e.target.value)}
                placeholder="내부 포트"
              />
              <input
                type="text"
                className="block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={port.external}
                onChange={(e) => updatePortField(index, 'external', e.target.value)}
                placeholder="외부 포트"
              />
              <select
                className="block w-1/4 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={port.protocol}
                onChange={(e) => updatePortField(index, 'protocol', e.target.value)}
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>
              {publishPorts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePortField(index)}
                  className="p-2 text-red-600 hover:text-red-800 focus:outline-none"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Constraint 조건 입력 */}
      <div>
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">Constraint 조건</label>
          <button
            type="button"
            onClick={checkConstraint}
            className="text-xs px-2 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded"
          >
            조건 검사
          </button>
        </div>
        <input
          type="text"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={constraint}
          onChange={(e) => setConstraint(e.target.value)}
          placeholder="node.role==manager 또는 node.labels.key==value"
        />
        {matchingNodes !== null && (
          <p className="mt-1 text-sm text-gray-600">
            일치하는 노드: {matchingNodes}개
          </p>
        )}
      </div>
      
      {/* 서비스 모드 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">서비스 모드</label>
        <div className="mt-1 flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="mode-replicated"
              name="serviceMode"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              checked={serviceMode === 'replicated'}
              onChange={() => setServiceMode('replicated')}
            />
            <label htmlFor="mode-replicated" className="ml-2 block text-sm text-gray-700">
              Replicated
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="mode-global"
              name="serviceMode"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              checked={serviceMode === 'global'}
              onChange={() => setServiceMode('global')}
            />
            <label htmlFor="mode-global" className="ml-2 block text-sm text-gray-700">
              Global
            </label>
          </div>
        </div>
        
        {/* 복제본 수 입력 (Replicated 모드인 경우에만) */}
        {serviceMode === 'replicated' && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700">복제본 수</label>
            <input
              type="number"
              min="1"
              className="mt-1 block w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={replicas}
              onChange={(e) => setReplicas(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        )}
      </div>
      
      {/* 환경변수 설정 */}
      <div>
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">환경변수</label>
          <button 
            type="button"
            onClick={addEnvVar}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            + 환경변수 추가
          </button>
        </div>
        
        {envVars.map((env, index) => (
          <div key={index} className="flex space-x-2 mt-2">
            <input
              type="text"
              className="block w-2/5 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={env.key}
              onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
              placeholder="변수명"
            />
            <input
              type="text"
              className="block w-3/5 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={env.value}
              onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
              placeholder="값"
            />
            {envVars.length > 1 && (
              <button
                type="button"
                onClick={() => removeEnvVar(index)}
                className="p-2 text-red-600 hover:text-red-800 focus:outline-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* 서비스 생성 버튼 */}
      <div className="pt-4 sticky bottom-0 bg-white py-4">
        <button
          type="button"
          onClick={createServiceHandler}
          disabled={loading}
          className={`w-full px-4 py-2 ${loading ? 'bg-blue-400' : 'bg-blue-600'} text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative`}
        >
          {loading ? '생성 중...' : '서비스 생성'}
        </button>
      </div>
    </div>
  );
};

export default ServiceCreate;