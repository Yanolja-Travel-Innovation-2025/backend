const express = require('express');
const Badge = require('../models/Badge');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const blockchainService = require('../utils/blockchain');
const { createNFTMetadata, generateBadgeImageUrl } = require('../utils/nftMetadata');
const { uploadMetadataToIPFS, createLocalMetadata } = require('../utils/ipfsUpload');
const logger = require('../utils/logger');

const router = express.Router();

// 전체 배지 목록 조회 (공개)
router.get('/', async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true }).select('-__v');
    logger.info('배지 목록 조회', { count: badges.length });
    res.json({ success: true, badges, count: badges.length });
  } catch (err) {
    logger.error('배지 목록 조회 실패', err);
    res.status(500).json({ 
      success: false, 
      message: '배지 목록을 불러오는데 실패했습니다.', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// 내 배지 목록 조회 (인증 필요)
router.get('/my', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('badges');
    if (!user) {
      logger.warn('존재하지 않는 사용자 조회 시도', { userId: req.user.userId });
      return res.status(404).json({ 
        success: false, 
        message: '사용자를 찾을 수 없습니다.' 
      });
    }
    
    logger.info('내 배지 목록 조회', {
      userId: req.user.userId,
      badgeCount: user.badges.length
    });
    
    res.json({ 
      success: true, 
      badges: user.badges,
      count: user.badges.length,
      walletConnected: !!user.walletAddress
    });
  } catch (err) {
    logger.error('내 배지 목록 조회 실패', err, { userId: req.user.userId });
    res.status(500).json({ 
      success: false, 
      message: '배지 목록을 불러오는데 실패했습니다.', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// 배지 발급 (인증 필요)
router.post('/issue', auth, async (req, res) => {
  try {
    const { badgeId } = req.body;
    const user = await User.findById(req.user.userId);
    const badge = await Badge.findById(badgeId);
    
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    if (!badge) return res.status(404).json({ message: '배지를 찾을 수 없습니다.' });
    
    if (user.badges.includes(badgeId)) {
      return res.status(400).json({ message: '이미 획득한 배지입니다.' });
    }

    let nftResult = null;
    
    // NFT 발행 (지갑 주소가 있는 경우에만)
    if (user.walletAddress) {
      try {
        logger.info('NFT 배지 발행 시작', {
          userId: req.user.userId,
          user: user.nickname,
          badge: badge.name,
          wallet: user.walletAddress
        });
        
        // NFT 메타데이터 생성
        const imageUrl = generateBadgeImageUrl(badge.name, badge.rarity);
        const metadataObj = createNFTMetadata({
          name: badge.name,
          description: badge.description,
          location: badge.location?.name || '',
          rarity: badge.rarity,
          coordinates: badge.location?.coordinates ? 
            `${badge.location.coordinates[1]},${badge.location.coordinates[0]}` : '',
          imageUrl: imageUrl,
          timestamp: new Date()
        });
        
        // IPFS에 메타데이터 업로드 시도
        let metadataUri;
        try {
          if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
            const metadataFileName = `${badge.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
            const ipfsHash = await uploadMetadataToIPFS(metadataObj, metadataFileName);
            metadataUri = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
            console.log('📁 IPFS 업로드 완료:', metadataUri);
          } else {
            // IPFS 설정이 없으면 로컬 메타데이터 사용
            const localData = createLocalMetadata({
              name: badge.name,
              description: badge.description,
              location: badge.location?.name || '',
              rarity: badge.rarity,
              coordinates: badge.location?.coordinates ? 
                `${badge.location.coordinates[1]},${badge.location.coordinates[0]}` : '',
              timestamp: new Date()
            });
            metadataUri = localData.metadataUrl;
            console.log('📁 로컬 메타데이터 생성 완료');
          }
        } catch (ipfsError) {
          console.error('❌ IPFS 업로드 실패, 로컬 메타데이터 사용:', ipfsError.message);
          const localData = createLocalMetadata({
            name: badge.name,
            description: badge.description,
            location: badge.location?.name || '',
            rarity: badge.rarity,
            coordinates: badge.location?.coordinates ? 
              `${badge.location.coordinates[1]},${badge.location.coordinates[0]}` : '',
            timestamp: new Date()
          });
          metadataUri = localData.metadataUrl;
        }
        
        // 블록체인에 NFT 발행
        nftResult = await blockchainService.mintBadge(
          user.walletAddress,
          {
            name: badge.name,
            description: badge.description,
            location: badge.location?.name || '',
            rarity: badge.rarity,
            coordinates: badge.location?.coordinates ? 
              `${badge.location.coordinates[1]},${badge.location.coordinates[0]}` : ''
          },
          metadataUri
        );
        
        logger.nftMinted(
          req.user.userId,
          badgeId,
          nftResult.txHash,
          true,
          { badgeName: badge.name, wallet: user.walletAddress }
        );
      } catch (nftError) {
        logger.error('NFT 발행 실패', nftError, {
          userId: req.user.userId,
          badgeId,
          wallet: user.walletAddress
        });
        
        logger.nftMinted(
          req.user.userId,
          badgeId,
          null,
          false,
          { error: nftError.message }
        );
        
        // NFT 발행 실패해도 데이터베이스 배지는 발급
        nftResult = { success: false, error: nftError.message };
      }
    }

    // 데이터베이스에 배지 발급 기록
    user.badges.push(badgeId);
    user.visitCount += 1;
    user.lastVisit = new Date();
    
    // NFT 정보가 있으면 추가
    if (nftResult?.success) {
      user.nftTransactions = user.nftTransactions || [];
      user.nftTransactions.push({
        badgeId,
        txHash: nftResult.txHash,
        timestamp: new Date()
      });
    }
    
    await user.save();
    
    logger.badgeIssued(
      req.user.userId,
      badgeId,
      true,
      { 
        badgeName: badge.name,
        rarity: badge.rarity,
        nftEnabled: !!user.walletAddress,
        nftSuccess: nftResult?.success || false
      }
    );
    
    const responseData = {
      success: true,
      message: '배지 발급 완료',
      badgeId,
      badge: {
        name: badge.name,
        description: badge.description,
        rarity: badge.rarity,
        location: badge.location
      }
    };
    
    // NFT 발행 결과 포함
    if (user.walletAddress) {
      responseData.nft = nftResult;
    }
    
    res.json(responseData);
  } catch (err) {
    logger.error('배지 발급 오류', err, {
      userId: req.user.userId,
      badgeId: req.body.badgeId
    });
    
    logger.badgeIssued(
      req.user.userId,
      req.body.badgeId,
      false,
      { error: err.message }
    );
    
    res.status(500).json({ 
      success: false, 
      message: '배지 발급에 실패했습니다. 잠시 후 다시 시도해주세요.', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// 블록체인 연결 상태 확인
router.get('/blockchain/status', async (req, res) => {
  try {
    const status = await blockchainService.getConnectionStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: '블록체인 상태 확인 실패', error: err.message });
  }
});

// 사용자의 NFT 배지 목록 조회
router.get('/nft/my', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    
    if (!user.walletAddress) {
      return res.json({ message: '지갑 주소가 설정되지 않았습니다.', nftBadges: [] });
    }
    
    const nftBadges = await blockchainService.getUserBadges(user.walletAddress);
    res.json({ nftBadges, walletAddress: user.walletAddress });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router; 