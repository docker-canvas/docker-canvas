import React from 'react';
import { HostMachine as HostMachineType } from '../../types/docker.types';
import { Handle, Position } from 'reactflow';
import Tooltip from '../UI/Tooltip';

interface HostMachineProps {
  data: {
    host: HostMachineType;
  };
}

const HostMachine: React.FC<HostMachineProps> = ({ data }) => {
  const { host } = data;

  const tooltipContent = (
    <div>
      <div><strong>Host:</strong> {host.name}</div>
      <div><strong>Networks:</strong> {host.networks.join(', ')}</div>
      <div><strong>Containers:</strong> {host.containers.length}</div>
    </div>
  );

  return (
    <div className="relative">
      <div className="flex flex-col items-center">
        <Tooltip content={tooltipContent}>
          <div className="bg-host-yellow border-2 border-yellow-400 rounded-lg w-64 h-40 p-3 shadow-md">
            <div className="bg-network-green border border-gray-300 rounded-lg h-full w-full flex items-center justify-center relative">
              <div className="absolute top-2 left-2 text-xs font-medium">
                using Host Network
              </div>
            </div>
          </div>
        </Tooltip>
        <div className="mt-2 text-sm font-medium">
          Host Machine
        </div>
      </div>
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
    </div>
  );
};

export default HostMachine;