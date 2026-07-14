const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 uploads per 15 minutes
});

module.exports = {
  authLimiter,
  uploadLimiter,
};
