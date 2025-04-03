/**
 * Docker 컨테이너 타입을 정의하는 파일
 * 
 * 이 파일은 Docker 컨테이너의 데이터 구조와
 * 관련 타입, 인터페이스를 정의합니다.
 */

// 컨테이너 상태 타입 정의
export type ContainerStatus = 'running' | 'stopped' | 'paused' | 'created' | 'exited';

// 네트워크 정보를 정의하는 인터페이스
export interface ContainerNetwork {
  name: string;       // 네트워크 이름
  driver: string;     // 네트워크 드라이버 (bridge, overlay, host 등)
  ipAddress?: string; // 컨테이너의 해당 네트워크 내 IP 주소
  gateway?: string;   // 게이트웨이 주소
  aliases?: string[]; // 네트워크 별칭
}

// 컨테이너 데이터 인터페이스 정의
export interface ContainerData {
  id: string;                       // 컨테이너 ID
  name: string;                     // 컨테이너 이름
  image: string;                    // 이미지 이름과 태그
  status: ContainerStatus;          // 컨테이너 상태
  networks: ContainerNetwork[];     // 연결된 네트워크 목록
  ports?: { internal: number; external: number; protocol: 'tcp' | 'udp' }[]; // 포트 매핑
  command?: string;                 // 실행 명령어
  createdAt?: string;               // 생성 일시
  labels?: Record<string, string>;  // 컨테이너 라벨
}