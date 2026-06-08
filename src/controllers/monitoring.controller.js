const {
  Email,
  WhatsApp,
  SocialMedia,
  Contact,
  SMS,
  Call,
  Location,
  Network,
  Device,
} = require('../models/MonitoringData.model');

// Email Controllers
const getEmails = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    
    const query = { userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const emails = await Email.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Email.countDocuments(query);
    
    res.json({
      success: true,
      data: emails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createEmail = async (req, res) => {
  try {
    const { userId } = req.user;
    const emailData = { ...req.body, userId };
    
    const email = await Email.create(emailData);
    
    // Emit via WebSocket
    const io = req.app.get('io');
    io.to(userId).emit('email-update', [email]);
    
    res.status(201).json({ success: true, data: email });
  } catch (error) {
    console.error('Create email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// WhatsApp Controllers
const getWhatsApp = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 50, contact } = req.query;
    
    const query = { userId };
    if (contact) query.contact = contact;
    
    const messages = await WhatsApp.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await WhatsApp.countDocuments(query);
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get WhatsApp error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createWhatsApp = async (req, res) => {
  try {
    const { userId } = req.user;
    const messageData = { ...req.body, userId };
    
    const message = await WhatsApp.create(messageData);
    
    const io = req.app.get('io');
    io.to(userId).emit('whatsapp-update', [message]);
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Create WhatsApp error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Social Media Controllers
const getSocialMedia = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 50, platform } = req.query;
    
    const query = { userId };
    if (platform) query.platform = platform;
    
    const posts = await SocialMedia.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await SocialMedia.countDocuments(query);
    
    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get social media error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Contacts Controllers
const getContacts = async (req, res) => {
  try {
    const { userId } = req.user;
    const { search, page = 1, limit = 100 } = req.query;
    
    const query = { userId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    const contacts = await Contact.find(query)
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Contact.countDocuments(query);
    
    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createContact = async (req, res) => {
  try {
    const { userId } = req.user;
    const contactData = { ...req.body, userId };
    
    const contact = await Contact.create(contactData);
    
    const io = req.app.get('io');
    io.to(userId).emit('contacts-update', [contact]);
    
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateContact = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    
    const contact = await Contact.findOneAndUpdate(
      { _id: id, userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    
    const contact = await Contact.findOneAndDelete({ _id: id, userId });
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// SMS Controllers
const getSMS = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 50, type } = req.query;
    
    const query = { userId };
    if (type) query.type = type;
    
    const messages = await SMS.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await SMS.countDocuments(query);
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get SMS error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSMS = async (req, res) => {
  try {
    const { userId } = req.user;
    const smsData = { ...req.body, userId };
    
    const sms = await SMS.create(smsData);
    
    const io = req.app.get('io');
    io.to(userId).emit('sms-update', [sms]);
    
    res.status(201).json({ success: true, data: sms });
  } catch (error) {
    console.error('Create SMS error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Calls Controllers
const getCalls = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 50, type } = req.query;
    
    const query = { userId };
    if (type) query.type = type;
    
    const calls = await Call.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Call.countDocuments(query);
    
    res.json({
      success: true,
      data: calls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCall = async (req, res) => {
  try {
    const { userId } = req.user;
    const callData = { ...req.body, userId };
    
    const call = await Call.create(callData);
    
    const io = req.app.get('io');
    io.to(userId).emit('calls-update', [call]);
    
    res.status(201).json({ success: true, data: call });
  } catch (error) {
    console.error('Create call error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Location Controllers
const getLocation = async (req, res) => {
  try {
    const { userId } = req.user;
    const location = await Location.findOne({ userId }).sort({ timestamp: -1 });
    
    res.json({ success: true, data: location });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { userId } = req.user;
    const locationData = { ...req.body, userId, timestamp: new Date() };
    
    const location = await Location.create(locationData);
    
    const io = req.app.get('io');
    io.to(userId).emit('location-update', location);
    
    res.json({ success: true, data: location });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Network Controllers
const getNetwork = async (req, res) => {
  try {
    const { userId } = req.user;
    const network = await Network.findOne({ userId }).sort({ timestamp: -1 });
    
    res.json({ success: true, data: network });
  } catch (error) {
    console.error('Get network error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateNetwork = async (req, res) => {
  try {
    const { userId } = req.user;
    const networkData = { ...req.body, userId, timestamp: new Date() };
    
    const network = await Network.create(networkData);
    
    const io = req.app.get('io');
    io.to(userId).emit('network-update', network);
    
    res.json({ success: true, data: network });
  } catch (error) {
    console.error('Update network error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Device Controllers
const getDevice = async (req, res) => {
  try {
    const { userId } = req.user;
    const device = await Device.findOne({ userId }).sort({ timestamp: -1 });
    
    res.json({ success: true, data: device });
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDevice = async (req, res) => {
  try {
    const { userId } = req.user;
    const deviceData = { ...req.body, userId, timestamp: new Date() };
    
    const device = await Device.create(deviceData);
    
    const io = req.app.get('io');
    io.to(userId).emit('device-update', device);
    
    res.json({ success: true, data: device });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const [
      emailsCount,
      whatsappCount,
      socialCount,
      contactsCount,
      smsCount,
      callsCount,
      recentLocation,
      recentNetwork,
      recentDevice,
    ] = await Promise.all([
      Email.countDocuments({ userId }),
      WhatsApp.countDocuments({ userId }),
      SocialMedia.countDocuments({ userId }),
      Contact.countDocuments({ userId }),
      SMS.countDocuments({ userId }),
      Call.countDocuments({ userId }),
      Location.findOne({ userId }).sort({ timestamp: -1 }),
      Network.findOne({ userId }).sort({ timestamp: -1 }),
      Device.findOne({ userId }).sort({ timestamp: -1 }),
    ]);
    
    res.json({
      success: true,
      data: {
        stats: {
          emails: emailsCount,
          whatsapp: whatsappCount,
          socialMedia: socialCount,
          contacts: contactsCount,
          sms: smsCount,
          calls: callsCount,
        },
        recent: {
          location: recentLocation,
          network: recentNetwork,
          device: recentDevice,
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEmails,
  createEmail,
  getWhatsApp,
  createWhatsApp,
  getSocialMedia,
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getSMS,
  createSMS,
  getCalls,
  createCall,
  getLocation,
  updateLocation,
  getNetwork,
  updateNetwork,
  getDevice,
  updateDevice,
  getDashboardStats,
};
