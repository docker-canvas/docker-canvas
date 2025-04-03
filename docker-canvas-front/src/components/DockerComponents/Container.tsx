import React from 'react';
import { DockerContainer } from '../../types/docker.types';
import { Handle, Position } from 'reactflow';
import Tooltip from '../UI/Tooltip';
import NetworkInterface, { NetworkInterfaceData } from './NetworkInterface';

interface ContainerProps {
  data: {
    container: DockerContainer;
    interfaces?: NetworkInterfaceData[];
  };
}

const Container: React.FC<ContainerProps> = ({ data }) => {
  const { container, interfaces = [] } = data;

  // Swarm 서비스인 경우 특별한 스타일 적용
  const isSwarmService = !!container.serviceId;
  
  // 서비스명만 추출 (task ID 제외)
  const displayName = isSwarmService 
    ? container.serviceName || container.name.split('.')[0]
    : container.name;

  // 툴팁 내용 (Swarm 정보 추가)
  const tooltipContent = (
    <div>
      <div><strong>Container:</strong> {container.name}</div>
      <div><strong>Image:</strong> {container.image}</div>
      <div><strong>Status:</strong> {container.status}</div>
      {isSwarmService && (
        <>
          <div><strong>Service:</strong> {container.serviceName}</div>
          <div><strong>Task:</strong> {container.taskId}</div>
        </>
      )}
      <div><strong>Networks:</strong> {container.networkInterfaces.join(', ')}</div>
    </div>
  );

  return (
    <div className="relative">
      <Tooltip content={tooltipContent}>
        <div 
          className={`${isSwarmService ? 'bg-container-blue' : 'bg-blue-200'} rounded-lg p-3 w-28 h-28 border border-gray-400 shadow-md flex flex-col items-center justify-center relative`}
        >
          {isSwarmService && (
            <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              S
            </div>
          )}
          
          <div className="text-center text-xs overflow-hidden text-ellipsis whitespace-nowrap w-full">
            {displayName}
          </div>
          
          {container.taskId && (
            <div className="mt-1 text-center text-xs text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap w-full">
              {container.taskId}
            </div>
          )}
          
          {/* 컨테이너 내부에 인터페이스 표시 */}
          {interfaces.length > 0 && (
            <div className="absolute top-0 left-0 right-0 flex justify-center -mt-5">
              <div className="scale-75">
                <NetworkInterface 
                  data={{ 
                    interface: interfaces[0]
                  }} 
                />
              </div>
            </div>
          )}
        </div>
      </Tooltip>
      
      {/* 컨테이너 연결점 (인터페이스가 없을 경우) */}
      {interfaces.length === 0 && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="container-in"
            className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="container-out"
            className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
          />
        </>
      )}
    </div>
  );
};

export default Container;