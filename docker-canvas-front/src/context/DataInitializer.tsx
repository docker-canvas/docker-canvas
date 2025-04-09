// docker-canvas-front/src/context/DataInitializer.tsx
import { useEffect } from 'react';
import { useDockerContext } from '../context/DockerContext';
import { useNetworkAPI, useNodeAPI } from '../components/data/api_others';

const DataInitializer: React.FC = () => {
  const { synchronizeData } = useDockerContext();
  const { networkData } = useNetworkAPI();
  const { nodeData } = useNodeAPI();
  
  useEffect(() => {
    // 초기 로드
    synchronizeData(nodeData, networkData);
    
    // 3초마다 데이터를 폴링하는 타이머 설정
    const intervalId = setInterval(() => {
      synchronizeData(nodeData, networkData);
    }, 3000);
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearInterval(intervalId);
  }, [synchronizeData, nodeData, networkData]);
  
  return null;
};

export default DataInitializer;