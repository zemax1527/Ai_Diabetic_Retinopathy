const rateLimit = require('express-rate-limit');

const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes

    max: process.env.NODE_ENV === 'development'
        ? 1000
        : 10,

    message: {
        status: 'failed',
        message: 'Too many requests. Please try again later.'
    },

    standardHeaders: true,
    legacyHeaders: false
});

module.exports = authRateLimiter;