import React from 'react';
import { DockerNetwork } from '../../types/docker.types';
import { Handle, Position } from 'reactflow';
import Tooltip from '../UI/Tooltip';

interface NetworkProps {
  data: {
    network: DockerNetwork;
    isExternal?: boolean;
  };
}

const Network: React.FC<NetworkProps> = ({ data }) => {
  const { network, isExternal = false } = data;
  const width = isExternal ? 'w-full' : 'w-72';
  const height = isExternal ? 'h-16' : 'h-12';

  const tooltipContent = (
    <div>
      <div><strong>Network:</strong> {network.name}</div>
      <div><strong>Driver:</strong> {network.driver}</div>
      <div><strong>Scope:</strong> {network.scope}</div>
    </div>
  );

  return (
    <div className="relative">
      <Tooltip content={tooltipContent}>
        <div className={`bg-network-green ${width} ${height} rounded-lg border border-gray-400 shadow-md flex items-center justify-center`}>
          <div className="text-center text-sm font-medium">
            {network.name}
          </div>
        </div>
      </Tooltip>
      {!isExternal && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="network-in"
            className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="network-out"
            className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
          />
        </>
      )}
      {isExternal && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="external-in"
            className="w-3 h-3 bg-pink-200 border-2 border-pink-500"
          />
        </>
      )}
    </div>
  );
};

export default Network;