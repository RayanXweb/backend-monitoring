const helmet = require('helmet');
const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Helmet configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.WEBSOCKET_URL],
    },
  },
});

// Prevent XSS attacks
const xssProtection = (req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

// Prevent clickjacking
const clickjackProtection = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

// No sniff
const noSniff = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

module.exports = {
  corsOptions,
  helmetConfig,
  xssProtection,
  clickjackProtection,
  noSniff,
};
