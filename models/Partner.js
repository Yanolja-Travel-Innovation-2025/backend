const mongoose = require('mongoose');

const PartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  location: Object,
  discountRate: Number,
  minimumBadges: Number,
  contact: String,
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('Partner', PartnerSchema); 