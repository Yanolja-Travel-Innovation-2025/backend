const errorHandler = (err, req, res, next) => {
  console.error(`❌ 에러 발생 [${new Date().toISOString()}]:`, {
    url: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    user: req.user?.userId || 'anonymous'
  });

  // Mongoose 검증 오류
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: '입력 데이터 검증 실패',
      errors
    });
  }

  // Mongoose 중복 키 오류
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `중복된 ${field}입니다.`,
      field
    });
  }

  // JWT 오류
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '토큰이 만료되었습니다. 다시 로그인해주세요.'
    });
  }

  // MongoDB 연결 오류
  if (err.name === 'MongooseServerSelectionError') {
    return res.status(503).json({
      success: false,
      message: '데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.'
    });
  }

  // 블록체인 관련 오류
  if (err.message?.includes('blockchain') || err.message?.includes('wallet')) {
    return res.status(502).json({
      success: false,
      message: '블록체인 연결에 문제가 있습니다. NFT 발행은 일시적으로 제한됩니다.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // IPFS 관련 오류
  if (err.message?.includes('IPFS') || err.message?.includes('Pinata')) {
    return res.status(502).json({
      success: false,
      message: '파일 저장소 연결에 문제가 있습니다. 로컬 메타데이터를 사용합니다.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // 네트워크 관련 오류
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      message: '외부 서비스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.'
    });
  }

  // 기본 서버 오류
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '서버 내부 오류가 발생했습니다.',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;