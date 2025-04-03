import React from 'react';
import { DockerNetwork } from '../../types/docker.types';
import { Handle, Position } from 'reactflow';
import Tooltip from '../UI/Tooltip';
import NetworkInterface, { NetworkInterfaceData } from './NetworkInterface';

interface GwBridgeNetworkProps {
  data: {
    network: DockerNetwork;
    hostWidth?: number;
    interfaces?: NetworkInterfaceData[];
  };
}

/**
 * GwBridge 네트워크 컴포넌트
 * - Docker Swarm에서 각 노드의 gwbridge를 표현
 * - 오버레이 네트워크와 호스트 간 연결 지점
 */
const GwBridgeNetwork: React.FC<GwBridgeNetworkProps> = ({ data }) => {
  const { 
    network, 
    hostWidth = 300,
    interfaces = []
  } = data;
  
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
          className="bg-green-100 rounded-lg p-2 border border-green-400 shadow-md flex items-center justify-center relative"
          style={{ width: hostWidth, height: '40px' }}
        >
          <div className="text-center text-sm font-medium">
            {network.name}
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
      
      {/* 기본 핸들 */}
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
    </div>
  );
};

export default GwBridgeNetwork;