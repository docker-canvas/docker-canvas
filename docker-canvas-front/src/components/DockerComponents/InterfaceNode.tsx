import React from 'react';
import { Handle, Position } from 'reactflow';
import Tooltip from '../UI/Tooltip';
import { NetworkInterfaceData } from './NetworkInterface';

interface InterfaceNodeProps {
  data: {
    interface: NetworkInterfaceData;
    sourceType?: 'overlay' | 'bridge' | 'host' | 'container';
    targetType?: 'overlay' | 'bridge' | 'host' | 'container' | 'external';
  };
}

// 독립적인 인터페이스 노드 컴포넌트
const InterfaceNode: React.FC<InterfaceNodeProps> = ({ data }) => {
  const { interface: networkInterface, sourceType, targetType } = data;
  
  // 인터페이스 타입에 따른 색상 지정
  const getInterfaceColor = () => {
    switch(networkInterface.type) {
      case 'overlay': return 'bg-blue-200 border-blue-400';
      case 'bridge': return 'bg-green-200 border-green-400';
      case 'host': return 'bg-yellow-200 border-yellow-400';
      case 'container': return 'bg-container-blue border-blue-400';
      default: return 'bg-gray-200 border-gray-400';
    }
  };

  const tooltipContent = (
    <div>
      <div><strong>Interface:</strong> {networkInterface.name}</div>
      <div><strong>Type:</strong> {networkInterface.type}</div>
      <div><strong>ID:</strong> {networkInterface.id}</div>
      {sourceType && targetType && (
        <div><strong>Connection:</strong> {sourceType} → {targetType}</div>
      )}
    </div>
  );

  return (
    <div className="relative">
      <Tooltip content={tooltipContent}>
        <div className={`${getInterfaceColor()} rounded-md p-1 w-10 h-10 border shadow-sm flex items-center justify-center`}>
          <div className="text-center text-xs font-medium">
            IF
          </div>
        </div>
      </Tooltip>
      
      <Handle
        type="target"
        position={Position.Top}
        id={`${networkInterface.id}-in`}
        className="w-2 h-2 bg-pink-200 border-2 border-pink-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${networkInterface.id}-out`}
        className="w-2 h-2 bg-pink-200 border-2 border-pink-500"
      />
    </div>
  );
};

export default InterfaceNode;