const cron = require('node-cron');
const {
  Location,
  Network,
  Device,
} = require('../models/MonitoringData.model');
const Gallery = require('../models/Gallery.model');
const Session = require('../models/Session.model');
const logger = require('../services/logger.service');
const fs = require('fs');
const path = require('path');

// Clean up old location data (keep 7 days)
const cleanupLocationData = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const result = await Location.deleteMany({
    createdAt: { $lt: sevenDaysAgo },
  });
  
  logger.info('cron', `Cleaned up ${result.deletedCount} old location records`);
};

// Clean up old network data (keep 7 days)
const cleanupNetworkData = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const result = await Network.deleteMany({
    createdAt: { $lt: sevenDaysAgo },
  });
  
  logger.info('cron', `Cleaned up ${result.deletedCount} old network records`);
};

// Clean up old device data (keep 30 days)
const cleanupDeviceData = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const result = await Device.deleteMany({
    createdAt: { $lt: thirtyDaysAgo },
  });
  
  logger.info('cron', `Cleaned up ${result.deletedCount} old device records`);
};

// Clean up expired sessions
const cleanupSessions = async () => {
  const result = await Session.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  
  logger.info('cron', `Cleaned up ${result.deletedCount} expired sessions`);
};

// Clean up orphaned gallery files
const cleanupOrphanedFiles = async () => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) return;
  
  const files = fs.readdirSync(uploadsDir, { recursive: true });
  const dbFiles = await Gallery.find().select('path');
  const dbPaths = new Set(dbFiles.map(f => f.path));
  
  let deletedCount = 0;
  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    if (fs.statSync(filePath).isFile()) {
      if (!dbPaths.has(filePath)) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
  }
  
  logger.info('cron', `Cleaned up ${deletedCount} orphaned files`);
};

// Initialize all cron jobs
const initCronJobs = () => {
  // Run every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Running cleanup jobs...');
    await cleanupLocationData();
    await cleanupNetworkData();
    await cleanupDeviceData();
    await cleanupSessions();
    await cleanupOrphanedFiles();
    console.log('✅ Cleanup jobs completed');
  });
  
  // Run every hour for session cleanup
  cron.schedule('0 * * * *', async () => {
    await cleanupSessions();
  });
  
  // Run every week for log cleanup
  cron.schedule('0 3 * * 0', async () => {
    const loggerService = require('../services/logger.service');
    await loggerService.cleanupOldLogs(30);
  });
  
  console.log('⏰ Cron jobs initialized');
};

module.exports = {
  initCronJobs,
  cleanupLocationData,
  cleanupNetworkData,
  cleanupDeviceData,
  cleanupSessions,
  cleanupOrphanedFiles,
};
