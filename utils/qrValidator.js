const Badge = require('../models/Badge');
const crypto = require('crypto');

class QRValidationService {
  constructor() {
    this.validationCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시
  }

  // QR 코드 유효성 검증
  async validateQRCode(qrCodeData, userLocation = null) {
    try {
      // 캐시 확인
      const cacheKey = `qr_${qrCodeData}`;
      const cached = this.validationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.result;
      }

      // QR 코드가 단순 문자열인 경우 (기존 시드 데이터)
      if (typeof qrCodeData === 'string') {
        const result = await this.validateSimpleQRCode(qrCodeData);
        this.validationCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
        return result;
      }

      // JSON 형태의 QR 코드인 경우 (새로운 동적 QR 코드)
      if (typeof qrCodeData === 'object') {
        const result = await this.validateDynamicQRCode(qrCodeData, userLocation);
        this.validationCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
        return result;
      }

      return {
        valid: false,
        error: '올바르지 않은 QR 코드 형식입니다.'
      };

    } catch (error) {
      console.error('QR 코드 검증 오류:', error);
      return {
        valid: false,
        error: 'QR 코드 검증 중 오류가 발생했습니다.'
      };
    }
  }

  // 기존 단순 QR 코드 검증 (시드 데이터)
  async validateSimpleQRCode(qrCode) {
    try {
      const badge = await Badge.findOne({ 
        'location.qrCode': qrCode,
        isActive: true 
      });

      if (!badge) {
        return {
          valid: false,
          error: '유효하지 않은 QR 코드입니다.'
        };
      }

      return {
        valid: true,
        badge: {
          id: badge._id,
          name: badge.name,
          description: badge.description,
          location: badge.location,
          rarity: badge.rarity,
          image: badge.image
        },
        validationType: 'simple'
      };

    } catch (error) {
      throw new Error(`단순 QR 코드 검증 실패: ${error.message}`);
    }
  }

  // 동적 QR 코드 검증 (서명 기반)
  async validateDynamicQRCode(qrData, userLocation) {
    try {
      const { badgeId, timestamp, signature, nonce } = qrData;

      // 필수 필드 확인
      if (!badgeId || !timestamp || !signature || !nonce) {
        return {
          valid: false,
          error: 'QR 코드에 필수 정보가 누락되었습니다.'
        };
      }

      // 시간 검증 (24시간 유효)
      const qrTimestamp = new Date(timestamp).getTime();
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24시간

      if (now - qrTimestamp > maxAge) {
        return {
          valid: false,
          error: 'QR 코드가 만료되었습니다.'
        };
      }

      // 배지 존재 확인
      const badge = await Badge.findById(badgeId);
      if (!badge || !badge.isActive) {
        return {
          valid: false,
          error: '유효하지 않은 배지입니다.'
        };
      }

      // 서명 검증
      const isValidSignature = this.verifyQRSignature({
        badgeId,
        timestamp,
        nonce
      }, signature);

      if (!isValidSignature) {
        return {
          valid: false,
          error: 'QR 코드 서명이 유효하지 않습니다.'
        };
      }

      // 중복 사용 방지 (nonce 확인)
      const usedNonce = await this.checkNonceUsage(nonce);
      if (usedNonce) {
        return {
          valid: false,
          error: '이미 사용된 QR 코드입니다.'
        };
      }

      // 위치 검증 (선택적)
      if (userLocation && badge.location.coordinates) {
        const distance = this.calculateDistance(
          userLocation,
          {
            lat: badge.location.coordinates[1],
            lng: badge.location.coordinates[0]
          }
        );

        // 1km 반경 내에서만 유효
        if (distance > 1000) {
          return {
            valid: false,
            error: '배지 위치에서 너무 멀리 떨어져 있습니다.',
            distance: Math.round(distance)
          };
        }
      }

      // nonce 사용 기록
      await this.markNonceAsUsed(nonce);

      return {
        valid: true,
        badge: {
          id: badge._id,
          name: badge.name,
          description: badge.description,
          location: badge.location,
          rarity: badge.rarity,
          image: badge.image
        },
        validationType: 'dynamic',
        qrTimestamp: new Date(timestamp)
      };

    } catch (error) {
      throw new Error(`동적 QR 코드 검증 실패: ${error.message}`);
    }
  }

  // QR 코드 서명 검증
  verifyQRSignature(data, signature) {
    try {
      const secret = process.env.QR_SIGNATURE_SECRET || 'qr-default-secret-key';
      const payload = JSON.stringify(data);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      console.error('서명 검증 오류:', error);
      return false;
    }
  }

  // 동적 QR 코드 생성 (관리자용)
  generateDynamicQRCode(badgeId) {
    try {
      const timestamp = new Date().toISOString();
      const nonce = crypto.randomBytes(16).toString('hex');
      const secret = process.env.QR_SIGNATURE_SECRET || 'qr-default-secret-key';

      const data = { badgeId, timestamp, nonce };
      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(data))
        .digest('hex');

      return {
        ...data,
        signature,
        version: '1.0'
      };
    } catch (error) {
      throw new Error(`QR 코드 생성 실패: ${error.message}`);
    }
  }

  // Nonce 사용 여부 확인 (간단한 메모리 캐시 사용)
  async checkNonceUsage(nonce) {
    // 실제 구현에서는 Redis나 데이터베이스를 사용
    return this.usedNonces?.has(nonce) || false;
  }

  // Nonce 사용 표시
  async markNonceAsUsed(nonce) {
    // 실제 구현에서는 Redis나 데이터베이스를 사용
    if (!this.usedNonces) {
      this.usedNonces = new Set();
    }
    this.usedNonces.add(nonce);
    
    // 24시간 후 자동 삭제 (메모리 누수 방지)
    setTimeout(() => {
      this.usedNonces.delete(nonce);
    }, 24 * 60 * 60 * 1000);
  }

  // 두 지점 간의 거리 계산 (미터 단위)
  calculateDistance(pos1, pos2) {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = pos1.lat * Math.PI/180;
    const φ2 = pos2.lat * Math.PI/180;
    const Δφ = (pos2.lat-pos1.lat) * Math.PI/180;
    const Δλ = (pos2.lng-pos1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // 캐시 정리
  clearCache() {
    this.validationCache.clear();
  }
}

// 싱글톤 인스턴스
const qrValidationService = new QRValidationService();

module.exports = qrValidationService;