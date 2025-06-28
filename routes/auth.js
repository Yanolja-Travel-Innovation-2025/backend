const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middlewares/auth');

const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password || !nickname) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash, nickname });
    await user.save();
    res.status(201).json({ message: '회원가입 성공' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email, nickname: user.nickname },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { email: user.email, nickname: user.nickname } });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 지갑 주소 업데이트
router.patch('/wallet', auth, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const userId = req.user.userId;

    // 지갑 주소 형식 검증 (선택적)
    if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ message: '올바르지 않은 지갑 주소 형식입니다.' });
    }

    // 사용자 정보 업데이트
    const user = await User.findByIdAndUpdate(
      userId,
      { walletAddress },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({ 
      message: walletAddress ? '지갑 주소가 연결되었습니다.' : '지갑 연결이 해제되었습니다.',
      user 
    });
  } catch (err) {
    console.error('지갑 주소 업데이트 오류:', err);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router; 