# 디지털 관광 여권 - 백엔드

## 환경 설정

### 1. 환경변수 설정
`backend` 폴더에 `.env` 파일을 생성하고 다음 내용을 **정확히** 복사해서 붙여넣으세요:

```env
MONGO_URI=mongodb://admin:pass1234@localhost:27017/yanolja?authSource=admin
JWT_SECRET=digital-passport-jeju-2024-super-secret-key
PORT=4000
```

**중요**: 위 값들을 정확히 복사해서 사용하세요!

### 2. MongoDB 시작 (자동 데이터 초기화 포함)
```bash
docker-compose up -d
```

**✨ 첫 실행 시 제주도 배지 데이터가 자동으로 생성됩니다!**

### 3. 서버 시작
```bash
npm install
node index.js
```

## API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 배지 (Badge)
- `GET /api/badge` - 전체 배지 목록 조회
- `GET /api/badge/my` - 내 배지 목록 조회 (인증 필요)
- `POST /api/badge/issue` - 배지 발급 (인증 필요)

### 제휴점 (Partner)
- `GET /api/partner` - 제휴점 목록 조회
- `POST /api/partner` - 제휴점 등록 (인증 필요)
- `DELETE /api/partner/:id` - 제휴점 삭제 (인증 필요)
- `PATCH /api/partner/:id` - 제휴점 수정 (인증 필요) 