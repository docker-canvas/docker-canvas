## 프로젝트 목적
- Docker Swarm Overlay 네트워크 구조 심층 학습

## 핵심 기능
- Docker Swarm Overlay Network 심층 분석을 통한 UI 구성
- Docker API와 React를 활용하여 실제 인프라 구성을 시각화
- 멀티 스테이지 빌드를 통해 효율적인 이미지 빌드
- docker hub에 이미지 배포

## 시연 영상
사진을 클릭하면 영상이 링크로 이동합니다.
[![docker-canvas 시연 영상](http://img.youtube.com/vi/Ekjn1hyIAfM/0.jpg)](https://www.youtube.com/watch?v=Ekjn1hyIAfM) 



## Docker Swarm Overlay Network 심층 분석

인프라 구조를 이론적으로 정확하게 시각적으로 표현하고자 했습니다.
호스트 네트워크 인터페이스, docker_gwbridge, overlay 네트워크가 물리적으로 어떻게 구성되는지 심층 분석했습니다.

이를 위해 위와 같은 stack을 구성했습니다.
- worker 노드에 각각 wordpress, mysql을 배치
- wordpress는 8000번 포트로 publish
- wordpress와 mysql은 wordpress_net으로 통신


### tcpdump 확인
우선 외부에서 manager 노드로 8001번 포트에서 접속했을 때, 패킷이 어떤 경로로 이동하는지 확인했습니다.
이를 위해 tcpdump를 이용해 호스트 네트워크의 8001번 포트, VXLAN 통신을 하는 4789 포트, docker_gwbridge의 패킷을 캡쳐했습니다.

1. 클라이언트의 요청이 manager 노드로 전달
2. 클라이언트의 요청이 docker_gwbridge의 ingress_sbox로 이동
3. 패킷이 VXLAN으로 캡슐화 되어 실제 컨테이너가 있는 worker1 노드에게 전달
  ```
  # 캡슐화 된 패킷 예시
  15:53:55.956288 IP manager.34050 > 211.183.3.203.4789: VXLAN, flags [I] (0x08), vni 4096
IP 10.0.0.2.54767 > 10.0.0.108.8001: Flags [P.], seq 1:1230, ack 1, win 255, length 1229
  ```
4. worker1번은 VXLAN 캡슐화된 패킷을 수신
5. 응답이 생성되어 manager 노드를 거쳐 클라이언트에게 응답

패킷 분석을 했지만 여전히 해소되지 않는 점들이 있었습니다.
- gwbridge에서 overlay 네트워크로 패킷을 전달하는 과정이 명확하게 보이지 않음
- worker 노드에서 캡슐화된 패킷은 gwbridge를 거치지 않고 바로 overlay 네트워크로 전달 됨

이를 해결하고자 추가적인 분석에 나섰습니다.


### docker network namespace 확인
overlay 네트워크로 패킷이 어떻게 전달되는지 더 확실하게 분석하기 위해 docker 자체적으로 구성하는 network namespace를 확인했습니다.

![](https://velog.velcdn.com/images/just/post/8528b345-226f-4b83-9720-1f79c7f82b17/image.png)
![](https://velog.velcdn.com/images/just/post/91ed4e0f-fd5c-4fc6-b3a7-6a764e6a8c69/image.png)

docker network namespace로부터 host network namcespace에서 볼 수 없었던 overlay 네트워크와의 연결을 담당하는 vxlan 인터페이스와 br0 인터페이스를 찾을 수 있었습니다.

그리고 네임스페이스 이름에서 유추할 수 있듯, 각각의 overlay 네트워크마다 독립적인 network namespace가 존재한다는 것도 알 수 있었습니다.

```
$ docker network inspect docker_gwbridge
  
  ...
            "ingress-sbox": {
                "Name": "gateway_ingress-sbox",
                "EndpointID": "67eb06fb8393fe3611ee34a83ed9ce9d70255371b1878043aba5fb28bd8db672",
                "MacAddress": "02:42:ac:15:00:02",
                "IPv4Address": "172.21.0.2/16",
                "IPv6Address": ""
            }
  ...
  
$ docker network inspect ingress
  ...
              "ingress-sbox": {
                "Name": "ingress-endpoint",
                "EndpointID": "b13cd8fea4ed24457889d0e5978c6f3cce73cdcaed5d31e4f2fb1d8b06c0ee21",
                "MacAddress": "02:42:0a:00:00:02",
                "IPv4Address": "10.0.0.2/24",
                "IPv6Address": ""
            }
  ...
```
또한 docker_gwbridge와 ingress 네트워크를 각각 inspect하여 ingress_sbox라는 가상의 샌드박스 컨테이너가 gwbridge와 ingress 네트워크를 연결해주고 있음을 발견했습니다.

```
Chain DOCKER-INGRESS (2 references)
 pkts bytes target     prot opt in     out     source               destination
   15   780 DNAT       tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:8001 to:172.21.0.2:8001
  641 39575 RETURN     all  --  *      *       0.0.0.0/0            0.0.0.0/0
```
라우팅 테이블에서도 publish 된 포트에 대해 gwbridge의 ingress_sbox로 라우팅 설정이 되어있는것을 확인하였습니다.

분석한 정보들을 종합하여 다음과 같은 결론을 내렸습니다.
- 외부로부터의 요청은 docker_gwbridge를 거쳐 ingress_sbox가 라우팅
- 컨테이너간의 통신은 노드마다, overlay 네트워크마다 개별적인 인터페이스를 가지며, VXLAN 모듈을 통해서 host network namespace로 전달됨

위 정보들을 바탕으로 최종적으로 UI를 고려하여 약간의 단순화 과정을 거쳐 다음과 같은 그림을 완성할 수 있었습니다.
![](https://velog.velcdn.com/images/just/post/aa57eb66-3b82-4bd3-93e6-d6c4598642ad/image.png)



## 멀티 스테이지 빌드를 통한 반복 빌드 시간 단축
```
# 백엔드 빌드 스테이지
FROM node:18-alpine AS backend
WORKDIR /app
COPY docker-canvas-back/package*.json ./
RUN npm install --production

# 프론트엔드 빌드 스테이지
FROM node:18-alpine AS frontend
WORKDIR /app
COPY docker-canvas-front/package*.json ./
RUN npm install
# 소스 코드 복사 및 빌드 실행
COPY docker-canvas-front .
RUN npm run build

# 최종 이미지
FROM node:18-alpine
# 백엔드 설정
WORKDIR /app/docker-canvas-back
COPY --from=backend /app/node_modules ./node_modules
COPY docker-canvas-back .

# 프론트엔드 설정 - 빌드된 결과물만 복사
WORKDIR /app/docker-canvas-front
COPY --from=frontend /app/build ./build
COPY docker-canvas-front/package.json .

# 실행 설정
WORKDIR /app
CMD ["node", "docker-canvas-back/server.js"]
```
- 이미지 편의성을 위해 React와 socket 통신을 위한 프록시 express 서버를 단일 이미지로 구성
- 멀티 스테이지 빌드와 레이어 캐시를 활용하여 최적화된 빌드 구축
