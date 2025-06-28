const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String, required: true },
  badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
  visitCount: { type: Number, default: 0 },
  lastVisit: { type: Date },
  walletAddress: { type: String }, // MetaMask 지갑 주소
  nftTransactions: [{ // NFT 발행 트랜잭션 기록
    badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
    txHash: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema); 