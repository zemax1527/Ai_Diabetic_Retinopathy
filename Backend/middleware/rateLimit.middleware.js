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

const claimRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window

    max: process.env.CLAIM_RATE_LIMIT_MAX
        ? Number(process.env.CLAIM_RATE_LIMIT_MAX)
        : (process.env.NODE_ENV === 'development' ? 100 : 10),

    message: {
        status: 'failed',
        message: 'Too many claim attempts. Please try again later.'
    },

    standardHeaders: true,
    legacyHeaders: false
});

// Preserve backward-compatible default export function while supporting named destructuring
authRateLimiter.authRateLimiter = authRateLimiter;
authRateLimiter.claimRateLimiter = claimRateLimiter;

module.exports = authRateLimiter;
module.exports.authRateLimiter = authRateLimiter;
module.exports.claimRateLimiter = claimRateLimiter;