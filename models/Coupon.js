const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  discountRate: { type: Number, required: true }, // 할인율 (%)
  discountAmount: { type: Number }, // 고정 할인 금액 (원)
  minimumPurchase: { type: Number, default: 0 }, // 최소 구매 금액
  validUntil: { type: Date, required: true }, // 유효기간
  isUsed: { type: Boolean, default: false },
  usedAt: { type: Date },
  couponCode: { type: String, required: true, unique: true }, // 쿠폰 코드
  requiredBadges: { type: Number, default: 1 }, // 필요한 배지 개수
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// 인덱스 추가
CouponSchema.index({ couponCode: 1 });
CouponSchema.index({ userId: 1, isUsed: 1 });
CouponSchema.index({ validUntil: 1 });

module.exports = mongoose.model('Coupon', CouponSchema);