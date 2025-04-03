import React from 'react';
import { DockerNetwork } from '../../types/docker.types';
import { Handle, Position } from 'reactflow';
import Tooltip from '../UI/Tooltip';
import NetworkInterface, { NetworkInterfaceData } from './NetworkInterface';

interface NetworkProps {
  data: {
    network: DockerNetwork;
    isExternal?: boolean;
    isOverlay?: boolean;
    hostWidth?: number;
    interfaces?: NetworkInterfaceData[];
  };
}

const Network: React.FC<NetworkProps> = ({ data }) => {
  const { 
    network, 
    isExternal = false, 
    isOverlay = false,
    hostWidth = 400,
    interfaces = []
  } = data;
  
  // 네트워크 유형에 따른 스타일 설정
  const height = isExternal ? 'h-16' : 'h-16';
  
  // 네트워크 타입에 따른 배경색 설정
  let bgColorClass = 'bg-network-green';
  if (isExternal) {
    bgColorClass = 'bg-external-network';
  } else if (isOverlay) {
    bgColorClass = 'bg-overlay-network';
  } else if (network.driver === 'bridge' && network.name === 'gwbridge') {
    bgColorClass = 'bg-gwbridge';
  }

  // Swarm 정보를 포함한 툴팁
  const tooltipContent = (
    <div>
      <div><strong>Network:</strong> {network.name}</div>
      <div><strong>Driver:</strong> {network.driver}</div>
      <div><strong>Scope:</strong> {network.scope}</div>
      {network.subnet && <div><strong>Subnet:</strong> {network.subnet}</div>}
      {network.gateway && <div><strong>Gateway:</strong> {network.gateway}</div>}
      <div><strong>Connected containers:</strong> {network.containers.length}</div>
    </div>
  );

  return (
    <div className="relative">
      <Tooltip content={tooltipContent}>
        <div 
          className={`${bgColorClass} ${height} rounded-lg border border-gray-400 shadow-md flex items-center justify-center relative`}
          style={{ 
            width: isExternal || isOverlay ? hostWidth : 240,
            minWidth: '240px'
          }}
        >
          <div className="text-center text-sm font-medium">
            {network.name}
            {isOverlay && (
              <span className="ml-2 text-xs bg-green-700 text-white px-1 rounded">
                overlay
              </span>
            )}
            {network.name === 'gwbridge' && (
              <span className="ml-2 text-xs bg-blue-700 text-white px-1 rounded">
                gwbridge
              </span>
            )}
          </div>
          
          {/* 인터페이스 출력 */}
          {interfaces.length > 0 && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex gap-3">
              {interfaces.map((iface, idx) => (
                <div key={iface.id} className="scale-90">
                  <NetworkInterface 
                    data={{ interface: iface }} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Tooltip>
      
      {/* 네트워크에 인터페이스가 없을 경우에만 기본 핸들 표시 */}
      {interfaces.length === 0 && (
        <>
          {isOverlay && (
            <>
              <Handle
                type="source"
                position={Position.Bottom}
                id={`${network.id}-bottom`}
                className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
              />
              <Handle
                type="source"
                position={Position.Left}
                id={`${network.id}-left`}
                className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
              />
              <Handle
                type="source"
                position={Position.Right}
                id={`${network.id}-right`}
                className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
              />
            </>
          )}
          
          {!isExternal && !isOverlay && (
            <>
              <Handle
                type="target"
                position={Position.Top}
                id={`${network.id}-top`}
                className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id={`${network.id}-bottom`}
                className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
              />
            </>
          )}
          
          {isExternal && (
            <Handle
              type="target"
              position={Position.Top}
              id={`${network.id}-top`}
              className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
            />
          )}
        </>
      )}
    </div>
  );
};

export default Network;