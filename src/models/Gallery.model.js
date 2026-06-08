const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: String,
  originalName: String,
  type: String,
  size: Number,
  url: String,
  thumbnail: String,
  path: String,
  metadata: {
    width: Number,
    height: Number,
    duration: Number,
    takenAt: Date,
    location: {
      latitude: Number,
      longitude: Number,
    },
  },
  createdAt: { type: Date, default: Date.now },
});

gallerySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Gallery', gallerySchema);
