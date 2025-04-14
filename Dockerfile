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