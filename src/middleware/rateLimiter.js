const rateLimit = require('express-rate-limit');

// Rate limiter for high-frequency blockchain data requests
const blockchainRateLimit = rateLimit({
  windowMs: 1 * 1000, // 1 second window
  max: 100, // Allow up to 100 requests per second per IP
  message: {
    success: false,
    error: 'Too many requests, please slow down',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost during development
  skip: (req) => {
    return req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
  }
});

// More lenient rate limiter for general API endpoints
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Allow up to 1000 requests per 15 minutes per IP
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  blockchainRateLimit,
  generalRateLimit
};
