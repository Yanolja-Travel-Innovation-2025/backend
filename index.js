const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[logLevel](`${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://jejupassport.com', 'https://www.jejupassport.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is healthy!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/badge', require('./routes/badge'));
app.use('/api/partner', require('./routes/partner'));

// 404 에러 핸들링
app.use('*', (req, res) => {
  logger.warn('404 - 경로를 찾을 수 없음', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    message: '요청하신 경로를 찾을 수 없습니다.',
    path: req.originalUrl
  });
});

// 전역 에러 핸들러 (반드시 마지막에 위치)
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info('서버 시작', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      healthCheck: `http://localhost:${PORT}/api/health`
    });
  });
}).catch(err => {
  logger.error('서버 시작 실패', err);
  process.exit(1);
}); 