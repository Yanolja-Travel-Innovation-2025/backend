const path = require('path');

// 환경변수 검증 및 기본값 설정
const validateEnvironment = () => {
  const required = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT || '4000'
  };

  // 필수 환경변수 검증
  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('❌ 필수 환경변수가 설정되지 않았습니다:', missing.join(', '));
    console.error('💡 .env 파일을 확인하거나 .env.example을 참고하세요.');
    process.exit(1);
  }

  // 보안 검증 (운영 환경)
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-here') {
      console.error('❌ 운영 환경에서 기본 JWT_SECRET을 사용할 수 없습니다.');
      process.exit(1);
    }

    if (process.env.PRIVATE_KEY === 'your-wallet-private-key-here') {
      console.error('❌ 운영 환경에서 기본 PRIVATE_KEY를 사용할 수 없습니다.');
      process.exit(1);
    }
  }

  return required;
};

// 환경별 설정
const getConfig = () => {
  const baseConfig = validateEnvironment();
  
  const config = {
    ...baseConfig,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // 데이터베이스
    database: {
      uri: process.env.MONGO_URI,
      options: {
        maxPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
        serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT) || 5000,
      }
    },

    // JWT
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      algorithm: 'HS256'
    },

    // 블록체인
    blockchain: {
      privateKey: process.env.PRIVATE_KEY,
      rpcUrl: process.env.AMOY_RPC_URL,
      contractAddress: process.env.NFT_CONTRACT_ADDRESS,
      polygonscanApiKey: process.env.POLYGONSCAN_API_KEY,
      gasLimit: parseInt(process.env.GAS_LIMIT) || 500000,
      gasPrice: process.env.GAS_PRICE || 'auto'
    },

    // IPFS
    ipfs: {
      apiKey: process.env.PINATA_API_KEY,
      secretKey: process.env.PINATA_SECRET_API_KEY,
      gateway: 'https://gateway.pinata.cloud/ipfs/',
      timeout: parseInt(process.env.IPFS_TIMEOUT) || 30000
    },

    // 보안 설정
    security: {
      corsOrigin: process.env.CORS_ORIGIN || (
        process.env.NODE_ENV === 'production' 
          ? ['https://jejupassport.com', 'https://www.jejupassport.com']
          : ['http://localhost:3000', 'http://localhost:5173']
      ),
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15분
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb'
    },

    // 로깅
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      toFile: process.env.LOG_TO_FILE === 'true',
      directory: path.join(__dirname, '../logs')
    },

    // 이미지 및 정적 파일
    assets: {
      badgeImageBaseUrl: process.env.BADGE_IMAGE_BASE_URL || 'https://api.jejupassport.com/images/badges',
      uploadsDir: path.join(__dirname, '../uploads'),
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
    }
  };

  return config;
};

module.exports = getConfig();