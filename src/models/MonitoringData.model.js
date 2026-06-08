const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  from: String,
  to: String,
  subject: String,
  body: String,
  date: Date,
  attachments: [{
    name: String,
    size: Number,
    type: String,
    url: String,
  }],
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const whatsappSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  contact: String,
  contactName: String,
  message: String,
  type: { type: String, enum: ['sent', 'received'], default: 'received' },
  timestamp: Date,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const socialMediaSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  platform: { type: String, enum: ['facebook', 'instagram', 'twitter', 'tiktok'] },
  postId: String,
  author: String,
  content: String,
  likes: Number,
  comments: Number,
  shares: Number,
  media: [{
    type: String,
    url: String,
  }],
  date: Date,
  createdAt: { type: Date, default: Date.now },
});

const contactSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: String,
  phone: String,
  email: String,
  company: String,
  notes: String,
  avatar: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const smsSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  from: String,
  to: String,
  body: String,
  type: { type: String, enum: ['sent', 'received'], default: 'received' },
  date: Date,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const callSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  number: String,
  contactName: String,
  type: { type: String, enum: ['incoming', 'outgoing', 'missed'] },
  duration: Number,
  date: Date,
  createdAt: { type: Date, default: Date.now },
});

const locationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  latitude: Number,
  longitude: Number,
  accuracy: Number,
  speed: Number,
  heading: Number,
  timestamp: Date,
  createdAt: { type: Date, default: Date.now, expires: '30d' },
});

const networkSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  operator: String,
  signal: Number,
  type: String,
  ipAddress: String,
  macAddress: String,
  timestamp: Date,
  createdAt: { type: Date, default: Date.now, expires: '30d' },
});

const deviceSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  model: String,
  manufacturer: String,
  osVersion: String,
  battery: Number,
  storageTotal: Number,
  storageUsed: Number,
  ramTotal: Number,
  ramUsed: Number,
  timestamp: Date,
  createdAt: { type: Date, default: Date.now, expires: '30d' },
});

module.exports = {
  Email: mongoose.model('Email', emailSchema),
  WhatsApp: mongoose.model('WhatsApp', whatsappSchema),
  SocialMedia: mongoose.model('SocialMedia', socialMediaSchema),
  Contact: mongoose.model('Contact', contactSchema),
  SMS: mongoose.model('SMS', smsSchema),
  Call: mongoose.model('Call', callSchema),
  Location: mongoose.model('Location', locationSchema),
  Network: mongoose.model('Network', networkSchema),
  Device: mongoose.model('Device', deviceSchema),
};
