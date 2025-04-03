import React from 'react';
import { Handle, Position } from 'reactflow';
import Tooltip from '../UI/Tooltip';
import { NetworkInterfaceData } from './NetworkInterface';

interface NetworkInterfaceConnectorProps {
  data: {
    interface: NetworkInterfaceData;
    sourceType: 'overlay' | 'bridge' | 'host' | 'external';
    targetType: 'overlay' | 'bridge' | 'host' | 'external';
  };
}

// 네트워크 간 연결을 위한 인터페이스 커넥터 컴포넌트
const NetworkInterfaceConnector: React.FC<NetworkInterfaceConnectorProps> = ({ data }) => {
  const { interface: networkInterface, sourceType, targetType } = data;
  
  // 인터페이스 타입에 따른 색상 지정
  const getInterfaceColor = () => {
    if (sourceType === 'overlay' && targetType === 'bridge') {
      return 'bg-blue-200 border-blue-400';
    } else if (sourceType === 'bridge' && targetType === 'host') {
      return 'bg-green-200 border-green-400';
    } else if (sourceType === 'host' && targetType === 'external') {
      return 'bg-yellow-200 border-yellow-400';
    }
    return 'bg-gray-200 border-gray-400';
  };

  const tooltipContent = (
    <div>
      <div><strong>Interface:</strong> {networkInterface.name}</div>
      <div><strong>Connection:</strong> {sourceType} → {targetType}</div>
    </div>
  );

  return (
    <div className="relative">
      <Tooltip content={tooltipContent}>
        <div className={`${getInterfaceColor()} rounded-md p-1 w-8 h-8 border shadow-sm flex items-center justify-center`}>
          <div className="text-center text-xs font-medium">
            IF
          </div>
        </div>
      </Tooltip>
      
      <Handle
        type="target"
        position={Position.Top}
        id="if-in"
        className="w-2 h-2 bg-pink-200 border-2 border-pink-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="if-out"
        className="w-2 h-2 bg-pink-200 border-2 border-pink-500"
      />
    </div>
  );
};

export default NetworkInterfaceConnector;