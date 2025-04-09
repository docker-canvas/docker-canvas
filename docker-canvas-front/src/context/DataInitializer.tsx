// docker-canvas-front/src/context/DataInitializer.tsx
import { useEffect, useState } from 'react';
import { useDockerContext } from '../context/DockerContext';
import { NodeData, NodeResources, EngineInfo, PlatformInfo, ManagerStatus } from '../components/types/node';
import { NetworkData } from '../components/types/network';

const DataInitializer: React.FC = () => {
  const { synchronizeData } = useDockerContext();
  const [loading, setLoading] = useState(false);
  
  // 직접 데이터를 가져오는 함수 정의
  const fetchData = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // 노드 데이터 가져오기
      const nodesResponse = await fetch('/docker/nodes');
      const nodesData = await nodesResponse.json();
      
      // 태스크(컨테이너) 데이터 가져오기
      const tasksResponse = await fetch('/docker/tasks');
      const tasksData = await tasksResponse.json();
      
      // 네트워크 데이터 가져오기
      const networksResponse = await fetch('/docker/networks');
      const networksData = await networksResponse.json();
      
      // 노드 데이터 형식 변환
      const nodes: NodeData[] = nodesData.map((node: any) => {
        // 플랫폼 정보 추출
        const platform: PlatformInfo = {};
        if (node.Description?.Platform) {
          platform.architecture = node.Description.Platform.Architecture;
          platform.os = node.Description.Platform.OS;
        }
        
        // 리소스 정보 추출
        const resources: NodeResources = {};
        if (node.Description?.Resources) {
          resources.nanoCPUs = node.Description.Resources.NanoCPUs;
          resources.memoryBytes = node.Description.Resources.MemoryBytes;
        }
        
        // 엔진 정보 추출
        const engineInfo: EngineInfo = {};
        if (node.Description?.Engine) {
          engineInfo.engineVersion = node.Description.Engine.EngineVersion;
        }
        
        // 매니저 상태 추출
        let managerStatus: ManagerStatus | undefined;
        if (node.ManagerStatus) {
          managerStatus = {
            leader: node.ManagerStatus.Leader,
            reachability: node.ManagerStatus.Reachability,
            addr: node.ManagerStatus.Addr
          };
        }
        
        return {
          id: node.ID,
          hostname: node.Description?.Hostname || '',
          role: node.Spec?.Role || 'worker',
          status: node.Status?.State,
          addr: node.Status?.Addr,
          availability: node.Spec?.Availability,
          labels: node.Spec?.Labels || {},
          createdAt: node.CreatedAt,
          updatedAt: node.UpdatedAt,
          containers: [], // 아래에서 채워질 예정
          platform,
          resources,
          engineInfo,
          managerStatus
        };
      });
      
      // 컨테이너 데이터 처리 및 노드에 할당
      const containers = tasksData.map((task: any) => ({
        id: task.ID,
        nodeId: task.NodeID,
        serviceName: task.ServiceID,
        image: task.Spec.ContainerSpec.Image,
        status: task.Status.State,
        networks: task.NetworksAttachments?.map((network: any) => ({
          id: network.Network.ID,
          name: network.Network.Spec.Name,
          driver: network.Network.DriverState.Name,
          ipAddress: network.Addresses?.[0]
        })) || [],
        createdAt: task.CreatedAt
      }));
      
      // 컨테이너를 해당 노드에 할당
      nodes.forEach(node => {
        node.containers = containers.filter(container => container.nodeId === node.id);
      });
      
      // 네트워크 데이터 형식 변환
      const networks: NetworkData[] = networksData
        .filter((network: any) => network.Scope === 'swarm')
        .map((network: any) => ({
          id: network.Id,
          name: network.Name,
          driver: network.Driver,
          scope: network.Scope,
          networkInfo: {
            subnet: network.IPAM?.Config?.[0]?.Subnet,
            gateway: network.IPAM?.Config?.[0]?.Gateway
          },
          attachable: network.Attachable,
          internal: network.Internal,
          labels: network.Labels,
          createdAt: network.Created
        }));
      
      // DockerContext에 데이터 동기화
      synchronizeData(nodes, networks);
      console.log('데이터 동기화 완료:', { nodes, networks });
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // 초기 로드
    fetchData();
    
    // 5초마다 데이터를 폴링하는 타이머 설정
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearInterval(intervalId);
  }, []); // 의존성 배열 비움
  
  return null;
};

export default DataInitializer;