const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  socketId: String,
  ipAddress: String,
  userAgent: String,
  location: {
    city: String,
    country: String,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

sessionSchema.index({ userId: 1, expiresAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);
