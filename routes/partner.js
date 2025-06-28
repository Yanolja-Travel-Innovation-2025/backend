const express = require('express');
const Partner = require('../models/Partner');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const auth = require('../middlewares/auth');

const router = express.Router();

// 제휴점 등록 (인증 필요)
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, location, discountRate, minimumBadges, contact } = req.body;
    if (!name || !category || !discountRate || !minimumBadges || !contact) {
      return res.status(400).json({ message: '필수 항목을 모두 입력하세요.' });
    }
    const partner = new Partner({ name, category, location, discountRate, minimumBadges, contact });
    await partner.save();
    res.status(201).json({ message: '제휴점 등록 완료', partner });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 제휴점 전체 목록 조회 (공개)
router.get('/', async (req, res) => {
  try {
    const partners = await Partner.find({ isActive: true });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 제휴점 상세 조회 (공개)
router.get('/:id', async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner || !partner.isActive) return res.status(404).json({ message: '제휴점을 찾을 수 없습니다.' });
    res.json(partner);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 제휴점 삭제(비활성화) (인증 필요)
router.delete('/:id', auth, async (req, res) => {
  try {
    const partner = await Partner.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!partner) return res.status(404).json({ message: '제휴점을 찾을 수 없습니다.' });
    res.json({ message: '제휴점 삭제(비활성화) 완료', partner });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 제휴점 정보 수정 (인증 필요)
router.patch('/:id', auth, async (req, res) => {
  try {
    const update = req.body;
    const partner = await Partner.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!partner) return res.status(404).json({ message: '제휴점을 찾을 수 없습니다.' });
    res.json({ message: '제휴점 정보 수정 완료', partner });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 사용자 배지 기반 할인 가능 제휴점 조회
router.get('/eligible/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('badges');
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    
    const userBadgeCount = user.badges.length;
    
    // 사용자 배지 수에 따라 할인 가능한 제휴점 조회
    const eligiblePartners = await Partner.find({ 
      isActive: true,
      minimumBadges: { $lte: userBadgeCount }
    });
    
    // 각 제휴점에 대한 할인 정보 추가
    const partnersWithDiscount = eligiblePartners.map(partner => ({
      ...partner.toObject(),
      availableDiscount: calculateDiscount(userBadgeCount, partner.discountRate),
      userBadgeCount
    }));
    
    res.json({ 
      partners: partnersWithDiscount,
      userBadgeCount,
      totalEligiblePartners: eligiblePartners.length
    });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 할인 쿠폰 생성
router.post('/coupon/generate', auth, async (req, res) => {
  try {
    const { partnerId } = req.body;
    const user = await User.findById(req.user.userId).populate('badges');
    const partner = await Partner.findById(partnerId);
    
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    if (!partner) return res.status(404).json({ message: '제휴점을 찾을 수 없습니다.' });
    
    const userBadgeCount = user.badges.length;
    
    // 최소 배지 요구사항 확인
    if (userBadgeCount < partner.minimumBadges) {
      return res.status(400).json({ 
        message: `최소 ${partner.minimumBadges}개의 배지가 필요합니다. 현재: ${userBadgeCount}개` 
      });
    }
    
    // 이미 해당 제휴점에 대한 미사용 쿠폰이 있는지 확인
    const existingCoupon = await Coupon.findOne({
      userId: req.user.userId,
      partnerId,
      isUsed: false,
      validUntil: { $gt: new Date() }
    });
    
    if (existingCoupon) {
      return res.status(400).json({ 
        message: '해당 제휴점에 대한 유효한 쿠폰이 이미 있습니다.',
        coupon: existingCoupon
      });
    }
    
    // 쿠폰 코드 생성
    const couponCode = generateCouponCode();
    
    // 할인율 계산 (배지 개수에 따라)
    const discountRate = calculateDiscount(userBadgeCount, partner.discountRate);
    
    // 쿠폰 생성
    const coupon = new Coupon({
      userId: req.user.userId,
      partnerId,
      discountRate,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 유효
      couponCode,
      requiredBadges: partner.minimumBadges,
      description: `${partner.name} ${discountRate}% 할인 쿠폰`
    });
    
    await coupon.save();
    
    res.status(201).json({
      message: '할인 쿠폰이 생성되었습니다.',
      coupon: {
        ...coupon.toObject(),
        partnerName: partner.name
      }
    });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 쿠폰 사용
router.post('/coupon/use', auth, async (req, res) => {
  try {
    const { couponCode, purchaseAmount } = req.body;
    
    if (!couponCode || !purchaseAmount) {
      return res.status(400).json({ message: '쿠폰 코드와 구매 금액을 입력해주세요.' });
    }
    
    const coupon = await Coupon.findOne({ couponCode }).populate('partnerId');
    
    if (!coupon) {
      return res.status(404).json({ message: '유효하지 않은 쿠폰 코드입니다.' });
    }
    
    if (coupon.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: '이 쿠폰을 사용할 권한이 없습니다.' });
    }
    
    if (coupon.isUsed) {
      return res.status(400).json({ message: '이미 사용된 쿠폰입니다.' });
    }
    
    if (coupon.validUntil < new Date()) {
      return res.status(400).json({ message: '만료된 쿠폰입니다.' });
    }
    
    if (purchaseAmount < coupon.minimumPurchase) {
      return res.status(400).json({ 
        message: `최소 구매 금액 ${coupon.minimumPurchase}원 이상이어야 합니다.` 
      });
    }
    
    // 할인 금액 계산
    const discountAmount = Math.floor(purchaseAmount * (coupon.discountRate / 100));
    const finalAmount = purchaseAmount - discountAmount;
    
    // 쿠폰 사용 처리
    coupon.isUsed = true;
    coupon.usedAt = new Date();
    await coupon.save();
    
    res.json({
      message: '쿠폰이 성공적으로 사용되었습니다.',
      discount: {
        originalAmount: purchaseAmount,
        discountRate: coupon.discountRate,
        discountAmount,
        finalAmount,
        partnerName: coupon.partnerId.name
      }
    });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 내 쿠폰 목록 조회
router.get('/coupons/my', auth, async (req, res) => {
  try {
    const coupons = await Coupon.find({ userId: req.user.userId })
      .populate('partnerId')
      .sort({ createdAt: -1 });
    
    res.json({
      coupons: coupons.map(coupon => ({
        ...coupon.toObject(),
        partnerName: coupon.partnerId?.name,
        isExpired: coupon.validUntil < new Date(),
        isValid: !coupon.isUsed && coupon.validUntil > new Date()
      }))
    });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 할인율 계산 함수
function calculateDiscount(badgeCount, baseRate) {
  if (badgeCount >= 5) return Math.min(baseRate + 10, 20); // 최대 20%
  if (badgeCount >= 3) return Math.min(baseRate + 5, 15);  // 최대 15%
  if (badgeCount >= 1) return Math.min(baseRate, 10);     // 최대 10%
  return 0;
}

// 쿠폰 코드 생성 함수
function generateCouponCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = router; 