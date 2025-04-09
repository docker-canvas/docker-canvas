/**
 * 서비스 관련 API 호출 함수들을 제공하는 모듈
 * 
 * Docker 서비스 생성, 삭제, 조회와 관련된 API 호출 기능을 제공합니다.
 */

// Docker API의 기본 URL
const API_BASE_URL = '/docker';

/**
 * 모든 서비스 목록을 가져오는 함수
 * 
 * @returns 서비스 목록 Promise
 */
export async function fetchServices() {
  try {
    const response = await fetch(`${API_BASE_URL}/services`);
    if (!response.ok) {
      throw new Error(`Error fetching services: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch services:', error);
    throw error;
  }
}

/**
 * 서비스를 생성하는 함수
 * 
 * @param serviceConfig 서비스 설정 객체
 * @returns 생성된 서비스 정보 Promise
 */
export async function createService(serviceConfig: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/services/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceConfig),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error creating service: ${errorData.message || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to create service:', error);
    throw error;
  }
}

/**
 * 서비스를 삭제하는 함수
 * 
 * @param serviceId 삭제할 서비스 ID
 * @returns 삭제 결과 Promise
 */
export async function deleteService(serviceId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting service: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to delete service ${serviceId}:`, error);
    throw error;
  }
}

/**
 * 서비스 정보를 조회하는 함수
 * 
 * @param serviceId 조회할 서비스 ID
 * @returns 서비스 정보 Promise
 */
export async function getService(serviceId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching service: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch service ${serviceId}:`, error);
    throw error;
  }
}

/**
 * 서비스를 업데이트하는 함수
 * 
 * @param serviceId 업데이트할 서비스 ID
 * @param updateConfig 업데이트 설정 객체
 * @returns 업데이트 결과 Promise
 */
export async function updateService(serviceId: string, updateConfig: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateConfig),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error updating service: ${errorData.message || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to update service ${serviceId}:`, error);
    throw error;
  }
}