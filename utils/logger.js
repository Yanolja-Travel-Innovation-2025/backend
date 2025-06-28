const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogsDirectory();
  }

  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, metadata = {}) {
    return JSON.stringify({
      timestamp: this.getTimestamp(),
      level,
      message,
      ...metadata
    }) + '\n';
  }

  writeToFile(filename, content) {
    const filePath = path.join(this.logsDir, filename);
    fs.appendFileSync(filePath, content);
  }

  info(message, metadata = {}) {
    const logMessage = this.formatMessage('INFO', message, metadata);
    console.log(`ℹ️  ${message}`, metadata);
    this.writeToFile('app.log', logMessage);
  }

  error(message, error = null, metadata = {}) {
    const errorMetadata = {
      ...metadata,
      ...(error && {
        error: error.message,
        stack: error.stack
      })
    };
    
    const logMessage = this.formatMessage('ERROR', message, errorMetadata);
    console.error(`❌ ${message}`, errorMetadata);
    this.writeToFile('error.log', logMessage);
  }

  warn(message, metadata = {}) {
    const logMessage = this.formatMessage('WARN', message, metadata);
    console.warn(`⚠️  ${message}`, metadata);
    this.writeToFile('app.log', logMessage);
  }

  debug(message, metadata = {}) {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = this.formatMessage('DEBUG', message, metadata);
      console.debug(`🐛 ${message}`, metadata);
      this.writeToFile('debug.log', logMessage);
    }
  }

  // 특별한 이벤트들을 위한 전용 메서드들
  badgeIssued(userId, badgeId, success, metadata = {}) {
    this.info('배지 발급', {
      userId,
      badgeId,
      success,
      ...metadata
    });
    this.writeToFile('badges.log', this.formatMessage('BADGE_ISSUE', '배지 발급', {
      userId,
      badgeId,
      success,
      ...metadata
    }));
  }

  nftMinted(userId, badgeId, txHash, success, metadata = {}) {
    this.info('NFT 발행', {
      userId,
      badgeId,
      txHash,
      success,
      ...metadata
    });
    this.writeToFile('nft.log', this.formatMessage('NFT_MINT', 'NFT 발행', {
      userId,
      badgeId,
      txHash,
      success,
      ...metadata
    }));
  }

  walletConnected(userId, walletAddress, metadata = {}) {
    this.info('지갑 연결', {
      userId,
      walletAddress,
      ...metadata
    });
    this.writeToFile('wallet.log', this.formatMessage('WALLET_CONNECT', '지갑 연결', {
      userId,
      walletAddress,
      ...metadata
    }));
  }

  couponGenerated(userId, partnerId, couponCode, metadata = {}) {
    this.info('쿠폰 생성', {
      userId,
      partnerId,
      couponCode,
      ...metadata
    });
    this.writeToFile('coupons.log', this.formatMessage('COUPON_GENERATE', '쿠폰 생성', {
      userId,
      partnerId,
      couponCode,
      ...metadata
    }));
  }

  userActivity(userId, action, metadata = {}) {
    this.info(`사용자 활동: ${action}`, {
      userId,
      action,
      ...metadata
    });
    this.writeToFile('activity.log', this.formatMessage('USER_ACTIVITY', action, {
      userId,
      ...metadata
    }));
  }
}

module.exports = new Logger();