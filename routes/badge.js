const express = require('express');
const Badge = require('../models/Badge');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const blockchainService = require('../utils/blockchain');
const { generateNFTMetadata, uploadToIPFS } = require('../utils/nftMetadata');

const router = express.Router();

// 전체 배지 목록 조회 (공개)
router.get('/', async (req, res) => {
  try {
    const badges = await Badge.find();
    res.json(badges);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 내 배지 목록 조회 (인증 필요)
router.get('/my', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('badges');
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json(user.badges);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
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
        console.log('🎫 NFT 배지 발행 시작:', {
          user: user.nickname,
          badge: badge.name,
          wallet: user.walletAddress
        });
        
        // NFT 메타데이터 생성
        const metadata = generateNFTMetadata(badge, user);
        
        // IPFS에 메타데이터 업로드
        const metadataUri = await uploadToIPFS(metadata);
        console.log('📁 IPFS 업로드 완료:', metadataUri);
        
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
        
        console.log('✅ NFT 발행 성공:', nftResult);
      } catch (nftError) {
        console.error('❌ NFT 발행 실패:', nftError.message);
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
    
    const responseData = {
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
    console.error('배지 발급 오류:', err);
    res.status(500).json({ message: '서버 오류', error: err.message });
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