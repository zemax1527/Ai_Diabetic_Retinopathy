const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/authorize.middleware');

// All admin routes require authentication + admin role
router.use(authMiddleware);
router.use(authorize('admin'));

// Verification workflows
router.get('/verification/pending', adminController.getPendingVerifications);
router.get('/verification/:userId', adminController.getVerificationDetails);
router.patch('/verification/:userId/approve', adminController.approveVerification);
router.patch('/verification/:userId/reject', adminController.rejectVerification);

// System Analytics
router.get('/analytics/overview', adminController.getSystemOverview);
router.get('/analytics/districts', adminController.getDistrictAnalytics);

// Audit Logging
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
