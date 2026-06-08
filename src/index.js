require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Config
const { initRedis } = require('./config/redis');
const { initCronJobs } = require('./cron/cleanup.jobs');

// Routes
const authRoutes = require('./routes/auth.routes');
const monitoringRoutes = require('./routes/monitoring.routes');
const galleryRoutes = require('./routes/gallery.routes');
const exportRoutes = require('./routes/export.routes');
const alertRoutes = require('./routes/alert.routes');

// Socket
const {
  initializeSocket,
  setIO
} = require('./socket/socket.manager');

// Middleware
const { errorHandler } = require('./middleware/error.middleware');

const app = express();
const server = http.createServer(app);

/* ===========================
   SOCKET.IO
=========================== */
const io = socketIO(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

/* ===========================
   MIDDLEWARE
=========================== */
app.use(helmet());

app.use(compression());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
  credentials: true,
}));

app.use(express.json({
  limit: '50mb'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));

/* ===========================
   RATE LIMIT
=========================== */
const limiter = rateLimit({
  windowMs: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || 900000
  ),
  max: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || 100
  ),
  message: {
    success: false,
    message: 'Too many requests from this IP'
  }
});

app.use('/api', limiter);

/* ===========================
   DATABASE
=========================== */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB Error:', err);
  });

/* ===========================
   REDIS
=========================== */
(async () => {
  try {
    await initRedis();
    console.log('✅ Redis Connected');
  } catch (err) {
    console.error('❌ Redis Error:', err);
  }
})();

/* ===========================
   CRON JOBS
=========================== */
initCronJobs();

/* ===========================
   ROUTES
=========================== */
app.use('/api/auth', authRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/alerts', alertRoutes);

/* ===========================
   HEALTH CHECK
=========================== */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected',
    uptime: process.uptime()
  });
});

/* ===========================
   SOCKET INITIALIZATION
=========================== */
initializeSocket(io);
setIO(io);

/* ===========================
   ERROR HANDLER
=========================== */
app.use(errorHandler);

/* ===========================
   START SERVER
=========================== */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('================================');
  console.log(`🚀 Server Running on ${PORT}`);
  console.log('📡 Socket.IO Ready');
  console.log(
    `🌍 Environment: ${
      process.env.NODE_ENV || 'development'
    }`
  );
  console.log('================================');
});

/* ===========================
   EXPORT
=========================== */
module.exports = {
  app,
  server,
  io
};
