const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('인증 헤더 누락', { 
        url: req.originalUrl, 
        method: req.method,
        ip: req.ip 
      });
      return res.status(401).json({ 
        success: false,
        message: '인증 토큰이 필요합니다.' 
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('잘못된 토큰 형식', { 
        url: req.originalUrl,
        authHeader: authHeader.substring(0, 20) + '...'
      });
      return res.status(401).json({ 
        success: false,
        message: '올바른 토큰 형식이 아닙니다. Bearer 형식을 사용해주세요.' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: '토큰이 제공되지 않았습니다.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 토큰 만료 시간 체크 (추가 안전장치)
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      logger.warn('만료된 토큰 사용 시도', { 
        userId: decoded.userId,
        expiredAt: new Date(decoded.exp * 1000)
      });
      return res.status(401).json({ 
        success: false,
        message: '토큰이 만료되었습니다. 다시 로그인해주세요.' 
      });
    }

    req.user = decoded;
    
    // 성공적인 인증 로그 (debug 레벨)
    logger.debug('사용자 인증 성공', {
      userId: decoded.userId,
      email: decoded.email,
      url: req.originalUrl
    });
    
    next();
  } catch (err) {
    logger.error('토큰 검증 실패', err, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: '토큰이 만료되었습니다. 다시 로그인해주세요.' 
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: '유효하지 않은 토큰입니다.' 
      });
    }

    return res.status(401).json({ 
      success: false,
      message: '토큰 검증에 실패했습니다.' 
    });
  }
}

module.exports = auth;
