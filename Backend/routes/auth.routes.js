const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authRateLimiter = require('../middleware/rateLimit.middleware');
const passport = require('../config/passport');

router.post('/check-email', authController.checkEmail);
router.post('/register', authRateLimiter, authController.userRegistration);
router.post('/login', authRateLimiter, authController.userLogin);
router.post('/logout', authMiddleware, authController.userLogout);

// Profile session check - support both /me and /profile
router.get('/me', authMiddleware, authController.getMe);
router.get('/profile', authMiddleware, authController.getMe);
router.post('/complete-profile', authMiddleware, authController.completeProfile);

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`
  }),
  authController.googleCallback
);

module.exports = router;