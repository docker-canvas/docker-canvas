import React from 'react';
import { Handle, Position } from 'reactflow';
import Tooltip from '../UI/Tooltip';

// 네트워크 인터페이스 타입 정의
export interface NetworkInterfaceData {
  id: string;
  name: string;
  type: 'overlay' | 'bridge' | 'host' | 'container';
  connectionPoints?: {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
  };
}

interface NetworkInterfaceProps {
  data: {
    interface: NetworkInterfaceData;
  };
  isConnector?: boolean;
}

const NetworkInterface: React.FC<NetworkInterfaceProps> = ({ data, isConnector = false }) => {
  const { interface: networkInterface } = data;
  const { connectionPoints = { top: true, bottom: true } } = networkInterface;
  
  // 인터페이스 타입별 스타일 적용
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
    </div>
  );

  return (
    <div className="relative">
      <Tooltip content={tooltipContent}>
        <div className={`${getInterfaceColor()} rounded-md p-1 w-10 h-10 border shadow-sm flex items-center justify-center interface-connector`}>
          <div className="text-center text-xs font-medium">
            IF
          </div>
        </div>
      </Tooltip>
      
      {/* 연결 포인트 설정 */}
      {connectionPoints.top && (
        <Handle
          type="target"
          position={Position.Top}
          id={`${networkInterface.id}-in`}
          className="w-2 h-2 bg-pink-200 border-2 border-pink-500"
        />
      )}
      
      {connectionPoints.bottom && (
        <Handle
          type="source"
          position={Position.Bottom}
          id={`${networkInterface.id}-out`}
          className="w-2 h-2 bg-pink-200 border-2 border-pink-500"
        />
      )}
      
      {connectionPoints.left && (
        <Handle
          type="target"
          position={Position.Left}
          id={`${networkInterface.id}-left`}
          className="w-2 h-2 bg-pink-200 border-2 border-pink-500"
        />
      )}
      
      {connectionPoints.right && (
        <Handle
          type="source"
          position={Position.Right}
          id={`${networkInterface.id}-right`}
          className="w-2 h-2 bg-pink-200 border-2 border-pink-500"
        />
      )}
    </div>
  );
};

export default NetworkInterface;