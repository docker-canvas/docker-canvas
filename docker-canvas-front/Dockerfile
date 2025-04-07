# Nginx 기반 이미지 사용
FROM nginx:alpine

# 1. 기존 Nginx 기본 설정 삭제
RUN rm /etc/nginx/conf.d/default.conf

# 2. 커스텀 Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/

# 3. 정적 파일 복사 (dist 폴더 전체를 Nginx HTML 디렉토리로)
COPY ./ /usr/share/nginx/html

# 80 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]