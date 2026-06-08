const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info',
  },
  title: String,
  message: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

alertSchema.index({ userId: 1, createdAt: -1 });
alertSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Alert', alertSchema);
