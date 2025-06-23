const express = require('express');
const Badge = require('../models/Badge');
const User = require('../models/User');
const auth = require('../middlewares/auth');

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
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    if (user.badges.includes(badgeId)) {
      return res.status(400).json({ message: '이미 획득한 배지입니다.' });
    }
    user.badges.push(badgeId);
    user.visitCount += 1;
    user.lastVisit = new Date();
    await user.save();
    res.json({ message: '배지 발급 완료', badgeId });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router; 