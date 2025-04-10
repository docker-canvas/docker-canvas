import React, { useState, useEffect } from 'react';
import { useDockerContext } from '../../context/DockerContext';
import { deleteService, fetchServices } from '../data/api_services';

/**
 * 서비스 삭제 컴포넌트
 * 
 * Docker 서비스를 삭제하기 위한 인터페이스를 제공합니다.
 * 현재 실행 중인 서비스 목록을 표시하고, 선택한 서비스를 삭제할 수 있습니다.
 */
const DeleteService: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  // 서비스 상태 관리
  const [services, setServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // 서비스 목록 가져오기
  const fetchServiceList = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const serviceData = await fetchServices();
      setServices(serviceData);
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setError('서비스 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 서비스 목록 가져오기
  useEffect(() => {
    fetchServiceList();
  }, []);

  // 서비스 선택 핸들러
  const handleServiceSelect = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  // 모든 서비스 선택/해제 핸들러
  const handleSelectAll = () => {
    if (selectedServices.length === services.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(services.map(service => service.ID));
    }
  };

  // 서비스 삭제 핸들러
  const handleDeleteServices = async () => {
    if (selectedServices.length === 0) {
      setError('삭제할 서비스를 선택해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 선택된 모든 서비스 삭제
      const results = await Promise.allSettled(
        selectedServices.map(serviceId => deleteService(serviceId))
      );
      
      // 성공 및 실패 개수 계산
      const succeeded = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      // 결과 메시지 설정
      if (succeeded > 0 && failed === 0) {
        setSuccess(`${succeeded}개의 서비스가 성공적으로 삭제되었습니다.`);
        // 선택 초기화
        setSelectedServices([]);
        // 서비스 목록 새로고침
        fetchServiceList();
      } else if (succeeded > 0 && failed > 0) {
        setSuccess(`${succeeded}개의 서비스가 삭제되었지만, ${failed}개의 서비스 삭제 중 오류가 발생했습니다.`);
        setSelectedServices([]);
        fetchServiceList();
      } else {
        setError('서비스 삭제 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Failed to delete services:', err);
      setError('서비스 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
    }
  };

  // 서비스 상태에 따른 배지 색상 계산
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 서비스가 복제본을 사용하는지 확인하는 함수
  const isReplicatedService = (service: any) => {
    return service.Spec?.Mode?.Replicated !== undefined;
  };

  // 서비스 복제본 수 가져오기
  const getReplicaCount = (service: any) => {
    if (isReplicatedService(service)) {
      return service.Spec.Mode.Replicated.Replicas || 0;
    }
    return '글로벌';
  };

  // 서비스 생성 시간을 읽기 쉬운 형식으로 변환
  const formatCreatedTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // 확인 모달
  const ConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">서비스 삭제 확인</h3>
        <p className="text-gray-600 mb-6">
          선택한 {selectedServices.length}개의 서비스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsConfirmModalOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleDeleteServices}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
      <h2 className="text-lg font-medium text-gray-900 sticky top-0 bg-white py-2 flex justify-between items-center">
        <span>서비스 삭제</span>
        <button
          onClick={() => fetchServiceList()}
          className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center"
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          새로고침
        </button>
      </h2>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p>{success}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">로딩 중...</span>
        </div>
      )}

      {!loading && services.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          서비스가 없습니다. 서비스를 생성하고 다시 시도해주세요.
        </div>
      )}

      {!loading && services.length > 0 && (
        <>
          <div className="flex justify-between mb-2">
            <button
              onClick={handleSelectAll}
              className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              {selectedServices.length === services.length ? '전체 해제' : '전체 선택'}
            </button>
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={selectedServices.length === 0}
              className={`text-sm px-3 py-1 rounded ${
                selectedServices.length === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              선택 삭제 ({selectedServices.length})
            </button>
          </div>

          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    선택
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    서비스 이름
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이미지
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    복제본
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성 시간
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.ID)}
                        onChange={() => handleServiceSelect(service.ID)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {service.Spec.Name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {service.Spec.TaskTemplate.ContainerSpec.Image}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {getReplicaCount(service)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCreatedTime(service.CreatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedServices([service.ID]);
                          setIsConfirmModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isConfirmModalOpen && <ConfirmModal />}

      <div className="pt-4 sticky bottom-0 bg-white py-4">
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
          }}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default DeleteService;