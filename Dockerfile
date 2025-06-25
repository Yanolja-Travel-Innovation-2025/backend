FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (dev dependencies 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 4000

# 기본 명령어
CMD ["node", "index.js"] 