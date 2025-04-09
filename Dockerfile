# 베이스 이미지
FROM node:18-alpine

# 백엔드 설정
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production

# 프론트엔드 설정
WORKDIR /app/docker-canvas-front
COPY docker-canvas-front/package*.json ./
RUN npm install

# 백엔드 소스 복사
WORKDIR /app/server
COPY ./server/ ./
RUN npm install

WORKDIR /app/docker-canvas-front
COPY docker-canvas-front/ .
RUN npm run build

# 프론트엔드 소스 복사
COPY docker-canvas-front/ ./


# 환경 변수
WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "server.js"]

# 포트 노출
EXPOSE 3000