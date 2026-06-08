const Gallery = require('../models/Gallery.model');
const fs = require('fs');
const path = require('path');

// In production, use cloud storage like AWS S3
// This is a local implementation for development

const getGallery = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 50, type } = req.query;
    
    const query = { userId };
    if (type) query.type = { $regex: type, $options: 'i' };
    
    const media = await Gallery.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Gallery.countDocuments(query);
    
    res.json({
      success: true,
      data: media,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadMedia = async (req, res) => {
  try {
    const { userId } = req.user;
    const { file } = req;
    
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Create media record
    const media = await Gallery.create({
      userId,
      name: file.filename,
      originalName: file.originalname,
      type: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      thumbnail: `/uploads/thumb_${file.filename}`,
      path: file.path,
    });
    
    // Emit via WebSocket
    const io = req.app.get('io');
    io.to(userId).emit('new-media', media);
    
    res.status(201).json({ success: true, data: media });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMedia = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    
    const media = await Gallery.findOneAndDelete({ _id: id, userId });
    
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }
    
    // Delete file from storage
    if (media.path && fs.existsSync(media.path)) {
      fs.unlinkSync(media.path);
    }
    
    res.json({ success: true, message: 'Media deleted' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadMedia = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    
    const media = await Gallery.findOne({ _id: id, userId });
    
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }
    
    if (!fs.existsSync(media.path)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    res.download(media.path, media.originalName);
  } catch (error) {
    console.error('Download media error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGallery,
  uploadMedia,
  deleteMedia,
  downloadMedia,
};
