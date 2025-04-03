import React, { useEffect, useState } from 'react';
import { HostMachine as HostMachineType } from '../../types/docker.types';
import { Handle, Position } from 'reactflow';
import Tooltip from '../UI/Tooltip';
import NetworkInterface, { NetworkInterfaceData } from './NetworkInterface';

interface HostMachineProps {
  data: {
    host: HostMachineType;
    interfaces?: NetworkInterfaceData[];
  };
}

const HostMachine: React.FC<HostMachineProps> = ({ data }) => {
  const { host, interfaces = [] } = data;
  const [width, setWidth] = useState(256); // 기본 너비 (64 * 4)
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);

  // 요소 마운트 후 너비 측정
  useEffect(() => {
    if (elementRef) {
      setWidth(elementRef.offsetWidth);
    }
  }, [elementRef]);

  // Swarm 역할에 따른 클래스 지정
  const roleClass = host.role === 'manager' ? 'node-role-manager' : 'node-role-worker';

  const tooltipContent = (
    <div>
      <div><strong>Host:</strong> {host.name}</div>
      <div><strong>Role:</strong> {host.role}</div>
      <div><strong>Status:</strong> {host.status}</div>
      <div><strong>Networks:</strong> {host.networks.join(', ')}</div>
      <div><strong>Containers:</strong> {host.containers.length}</div>
      {host.ip && <div><strong>IP:</strong> {host.ip}</div>}
    </div>
  );

  // 호스트 인터페이스 분류
  const networkInterfaces = interfaces.filter(iface => 
    ['bridge', 'overlay', 'gwbridge'].includes(iface.type)
  );
  const hostInterfaces = interfaces.filter(iface => iface.type === 'host');

  return (
    <div className={`relative ${roleClass}`}>
      <div className="flex flex-col items-center">
        <Tooltip content={tooltipContent}>
          <div 
            ref={setElementRef}
            className="bg-host-yellow border-2 border-yellow-400 rounded-lg w-64 h-40 p-3 shadow-md"
            style={{ width: width }}
          >
            <div className="bg-green-100 border border-gray-300 rounded-lg h-full w-full flex items-center justify-center relative">
              <div className="absolute top-2 left-2 text-xs font-medium">
                using Host Network
              </div>
              
              {/* 호스트 내부 네트워크 인터페이스 (상단) */}
              {networkInterfaces.length > 0 && (
                <div className="absolute left-4 top-4 flex gap-3">
                  {networkInterfaces.map((iface, idx) => (
                    <div key={iface.id} className="scale-90">
                      <NetworkInterface 
                        data={{ 
                          interface: {
                            ...iface,
                            connectionPoints: {
                              top: true,
                              bottom: false,
                              left: false,
                              right: false
                            }
                          }
                        }} 
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* 호스트 외부 연결 인터페이스 (하단) */}
              {hostInterfaces.length > 0 && (
                <div className="absolute left-4 bottom-2 flex gap-3">
                  {hostInterfaces.map((iface, idx) => (
                    <div key={iface.id} className="scale-90">
                      <NetworkInterface 
                        data={{ 
                          interface: {
                            ...iface,
                            connectionPoints: {
                              top: false,
                              bottom: true,
                              left: false,
                              right: false
                            }
                          }
                        }} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Tooltip>
        <div className="mt-2 text-sm font-medium flex items-center">
          {host.name}
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${host.role === 'manager' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
            {host.role}
          </span>
        </div>
      </div>
      
      {/* 호스트에 인터페이스가 없을 경우에만 기본 핸들 표시 */}
      {interfaces.length === 0 && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="host-in"
            className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="host-out"
            className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
          />
        </>
      )}
    </div>
  );
};

export default HostMachine;