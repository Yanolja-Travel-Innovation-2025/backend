# Multi-stage build for optimized production image
FROM node:18-alpine AS base

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# 필요한 시스템 패키지 설치
RUN apk add --no-cache curl

# package.json과 package-lock.json 복사
COPY package*.json ./

# 개발 빌드 스테이지
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --include=dev
COPY . .
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 4000
CMD ["npm", "run", "dev"]

# 프로덕션 빌드 스테이지
FROM base AS production
ENV NODE_ENV=production

# 프로덕션 의존성만 설치
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사 (dockerignore 적용됨)
COPY . .

# 로그 및 업로드 디렉토리 생성
RUN mkdir -p logs uploads && \
    chown -R nextjs:nodejs /app

# non-root 사용자로 실행
USER nextjs

# 포트 노출
EXPOSE 4000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

# 프로덕션 명령어
CMD ["npm", "run", "prod"] 