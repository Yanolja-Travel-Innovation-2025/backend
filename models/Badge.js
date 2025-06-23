const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String,
  location: {
    name: String,
    coordinates: [Number], // [경도, 위도]
    qrCode: String,
  },
  rarity: { type: String, enum: ['bronze', 'silver', 'gold'], default: 'bronze' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Badge', BadgeSchema); 