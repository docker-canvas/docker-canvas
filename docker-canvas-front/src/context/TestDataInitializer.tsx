
import { useEffect } from 'react';
import { useDockerContext } from '../context/DockerContext';
import {sampleNodes, sampleNetworks} from '../components/data/sampleData';

const LocalDataInitializer: React.FC = () => {
  const { synchronizeData, refreshData } = useDockerContext();
  
  useEffect(() => {
    // 로컬 JSON 파일의 데이터로 초기화
    synchronizeData(sampleNodes, sampleNetworks);
    console.log('로컬 데이터로 Docker 컨텍스트 초기화 완료');
  }, [synchronizeData, refreshData]);
  
  return null;
};

export default LocalDataInitializer;