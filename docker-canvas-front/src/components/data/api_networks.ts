const API_BASE_URL: string = '/docker'

/**
 * 새 네트워크를 생성하는 함수
 * 
 * @param networkConfig 네트워크 설정 객체
 * @returns 생성된 네트워크 정보 Promise
 */
export async function createNetwork(networkName: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/networks/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Name: networkName,
          Driver: 'overlay',
          Attachable: true,
          CheckDuplicate: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Error creating network: ${errorData.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create network:', error);
      throw error;
    }
  }