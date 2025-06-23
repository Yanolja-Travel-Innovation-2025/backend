const express = require('express');
const Partner = require('../models/Partner');
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

module.exports = router; 