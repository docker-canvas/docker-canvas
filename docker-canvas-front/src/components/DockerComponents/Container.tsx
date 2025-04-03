import React from 'react';
import { DockerContainer } from '../../types/docker.types';
import { Handle, Position } from 'reactflow';
import Tooltip from '../UI/Tooltip';

interface ContainerProps {
  data: {
    container: DockerContainer;
  };
}

const Container: React.FC<ContainerProps> = ({ data }) => {
  const { container } = data;

  const tooltipContent = (
    <div>
      <div><strong>Container:</strong> {container.name}</div>
      <div><strong>Image:</strong> {container.image}</div>
      <div><strong>Status:</strong> {container.status}</div>
    </div>
  );

  return (
    <div className="relative">
      <Tooltip content={tooltipContent}>
        <div className="bg-container-blue rounded-lg p-3 w-24 h-24 border border-gray-400 shadow-md flex items-center justify-center">
          <div className="text-center text-xs overflow-hidden text-ellipsis whitespace-nowrap">
            {container.name}
          </div>
        </div>
      </Tooltip>
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
    </div>
  );
};

export default Container;