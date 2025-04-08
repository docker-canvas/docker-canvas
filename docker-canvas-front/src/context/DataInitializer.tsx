import { useEffect } from 'react';
import { useDockerContext } from '../context/DockerContext';
import { useNetworkAPI, useNodeAPI, useTaskAPI } from '../components/data/api_others';

const DataInitializer: React.FC = () => {
  const { initializeData } = useDockerContext();
  const { networkData } = useNetworkAPI();
  const { taskData } = useTaskAPI();
  const { nodeData } = useNodeAPI();
  
  
  useEffect(() => {
    console.log(nodeData);
    console.log(networkData);
    initializeData(nodeData, networkData);
  }, [initializeData, nodeData, networkData, taskData]);
  
  return null;
};

export default DataInitializer;