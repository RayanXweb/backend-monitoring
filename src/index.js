require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');

// Config
const { initRedis } = require('./config/redis');
const { initCronJobs } = require('./cron/cleanup.jobs');

// Routes
const authRoutes = require('./routes/auth.routes');
const monitoringRoutes = require('./routes/monitoring.routes');
const galleryRoutes = require('./routes/gallery.routes');
const exportRoutes = require('./routes/export.routes');
const alertRoutes = require('./routes/alert.routes');
const profileRoutes = require('./routes/profile.routes');
const docsRoutes = require('./routes/docs.routes');

// Socket
const {
  initializeSocket,
  setIO
} = require('./socket/socket.manager');

// Middleware
const { errorHandler } = require('./middleware/error.middleware');
const {
  xssProtection,
  clickjackProtection,
  noSniff
} = require('./middleware/security.middleware');

// Services
const logger = require('./services/logger.service');

const app = express();
const server = http.createServer(app);

/* ===========================
   SOCKET.IO CONFIGURATION
=========================== */
const io = socketIO(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: process.env.WEBSOCKET_PATH || '/socket.io',
  pingInterval: parseInt(process.env.WEBSOCKET_PING_INTERVAL) || 25000,
  pingTimeout: parseInt(process.env.WEBSOCKET_PING_TIMEOUT) || 20000,
  transports: ['websocket', 'polling'],
});

/* ===========================
   SECURITY MIDDLEWARE
=========================== */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.WEBSOCKET_URL || 'ws://localhost:5000'],
    },
  },
}));
app.use(xssProtection);
app.use(clickjackProtection);
app.use(noSniff);

app.use(compression({
  level: 6,
  threshold: 100 * 1024, // 100KB
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({
  limit: '50mb'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));

/* ===========================
   STATIC FILES
=========================== */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/temp', express.static(path.join(__dirname, '../uploads/temp')));

/* ===========================
   REQUEST LOGGING
=========================== */
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('request', `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  next();
});

/* ===========================
   RATE LIMITERS
=========================== */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

/* ===========================
   DATABASE CONNECTION
=========================== */
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB Connected');
  logger.info('database', 'MongoDB connected successfully');
})
.catch((err) => {
  console.error('❌ MongoDB Error:', err);
  logger.error('database', 'MongoDB connection failed', { error: err.message });
  process.exit(1);
});

// MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  logger.error('database', 'MongoDB connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
  logger.warn('database', 'MongoDB disconnected');
});

/* ===========================
   REDIS INITIALIZATION
=========================== */
(async () => {
  try {
    await initRedis();
    console.log('✅ Redis Connected');
    logger.info('redis', 'Redis connected successfully');
  } catch (err) {
    console.warn('⚠️ Redis not available, running without cache');
    logger.warn('redis', 'Redis connection failed, running without cache', { error: err.message });
  }
})();

/* ===========================
   CRON JOBS INITIALIZATION
=========================== */
initCronJobs();
console.log('⏰ Cron jobs initialized');
logger.info('cron', 'Cron jobs initialized');

/* ===========================
   API ROUTES
=========================== */
app.use('/api/auth', authRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/docs', docsRoutes);

/* ===========================
   HEALTH CHECK
=========================== */
app.get('/api/health', (req, res) => {
  const health = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mongodbState: mongoose.connection.readyState,
    memoryUsage: process.memoryUsage(),
    version: process.version,
  };
  
  // Check if any critical service is down
  let isHealthy = true;
  if (mongoose.connection.readyState !== 1) isHealthy = false;
  
  health.status = isHealthy ? 'healthy' : 'degraded';
  
  res.status(isHealthy ? 200 : 503).json(health);
});

/* ===========================
   ROOT ENDPOINT
=========================== */
app.get('/', (req, res) => {
  res.json({
    name: 'Monitoring System API',
    version: '1.0.0',
    status: 'online',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      monitoring: '/api/monitoring',
      gallery: '/api/gallery',
      export: '/api/export',
      alerts: '/api/alerts',
      profile: '/api/profile',
    }
  });
});

/* ===========================
   404 HANDLER
=========================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

/* ===========================
   SOCKET.IO INITIALIZATION
=========================== */
initializeSocket(io);
setIO(io);
console.log('📡 Socket.IO initialized');

/* ===========================
   GRACEFUL SHUTDOWN
=========================== */
const gracefulShutdown = async () => {
  console.log('\n🛑 Received shutdown signal, closing gracefully...');
  logger.info('system', 'Received shutdown signal');
  
  // Close server first to stop accepting new connections
  server.close(async () => {
    console.log('📡 HTTP server closed');
    
    try {
      // Close MongoDB connection
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      
      // Close Redis connection
      const { redisClient } = require('./config/redis');
      if (redisClient) {
        await redisClient.quit();
        console.log('✅ Redis connection closed');
      }
      
      logger.info('system', 'Graceful shutdown completed');
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      logger.error('system', 'Error during graceful shutdown', { error: err.message });
      process.exit(1);
    }
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

/* ===========================
   UNCAUGHT EXCEPTION HANDLER
=========================== */
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  logger.error('system', 'Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('system', 'Unhandled rejection', {
    reason: reason?.message || reason,
  });
});

/* ===========================
   START SERVER
=========================== */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 MONITORING SYSTEM BACKEND');
  console.log('=================================');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
  console.log('=================================');
  console.log('✅ Server is ready to accept connections');
  console.log('=================================');
});

/* ===========================
   EXPORTS
=========================== */
module.exports = {
  app,
  server,
  io,
};
