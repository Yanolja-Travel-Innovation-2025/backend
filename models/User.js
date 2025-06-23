const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
  visitCount: { type: Number, default: 0 },
  lastVisit: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema); 