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
  nft: { // NFT 관련 정보
    metadataUri: String,
    imageUri: String,
    ipfsHash: String,
    contractAddress: String,
    isNftEnabled: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Badge', BadgeSchema); 