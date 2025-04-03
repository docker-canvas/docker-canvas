import React, { useState } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import ToolBar from './ToolBar';

const Canvas: React.FC = () => {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [activeMode, setActiveMode] = useState('hand');
  
  const { zoomIn, zoomOut } = useReactFlow();
  
  // 화면 모드 변경 핸들러
  const handlePanMode = () => {
    setActiveMode('hand');
  };
  
  // 줌 인 핸들러
  const handleZoomIn = () => {
    zoomIn();
  };
  
  // 줌 아웃 핸들러
  const handleZoomOut = () => {
    zoomOut();
  };
  
  // 리프레시 핸들러
  const handleRefresh = () => {
    // 필요하다면 노드와 엣지 초기화
    setNodes([]);
    setEdges([]);
  };

  return (
    <div className="w-full h-screen relative">
      <ToolBar 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onPanMode={handlePanMode}
        onRefresh={handleRefresh}
        activeMode={activeMode}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Controls showInteractive={false} />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default Canvas;