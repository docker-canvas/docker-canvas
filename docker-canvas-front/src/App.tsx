import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import Canvas from './components/Canvas/Canvas';
import { DockerApiService } from './services/api';
import { DockerContainer, DockerNetwork, HostMachine } from './types/docker.types';
import './index.css';

const App: React.FC = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [networks, setNetworks] = useState<DockerNetwork[]>([]);
  const [hosts, setHosts] = useState<HostMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useTestMode, setUseTestMode] = useState(true); // 기본적으로 테스트 모드 사용

  // Docker API에서 데이터 로드
  const loadInfrastructureData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (useTestMode) {
        // 테스트 모드: 더미 데이터 사용
        console.log("App: Loading test data");
        const testData = DockerApiService.getTestData();
        console.log("App: Test data loaded:", testData);
        setContainers(testData.containers);
        setNetworks(testData.networks);
        setHosts(testData.hosts);
      } else {
        // 실제 API 호출
        console.log("App: Loading data from API");
        const data = await DockerApiService.getInfrastructure();
        console.log("App: API data loaded:", data);
        setContainers(data.containers);
        setNetworks(data.networks);
        setHosts(data.hosts);
      }
      
    } catch (err) {
      console.error('Error loading infrastructure data:', err);
      setError('Failed to load Docker infrastructure data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadInfrastructureData();
  }, [useTestMode]);

  // 테스트 모드 토글 핸들러
  const toggleTestMode = () => {
    setUseTestMode(!useTestMode);
  };

  return (
    <div className="App">
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Docker & Swarm 인프라 시각화</h1>
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer mr-4">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={useTestMode}
                onChange={toggleTestMode}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2 text-sm font-medium text-white">테스트 모드</span>
            </label>
            {error && <div className="text-red-300 text-sm">{error}</div>}
            {loading && !useTestMode && <div className="text-gray-300 text-sm">로딩 중...</div>}
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden h-screen">
        <ReactFlowProvider>
          <Canvas 
            testMode={useTestMode}
            containers={containers}
            networks={networks}
            hosts={hosts}
          />
        </ReactFlowProvider>
      </main>
      
      <footer className="bg-gray-100 p-2 text-center text-sm text-gray-600 border-t fixed bottom-0 w-full">
        <p>Docker Infrastructure Visualization Tool</p>
      </footer>
    </div>
  );
};

export default App;