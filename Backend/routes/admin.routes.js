const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const s = require('../utils/schema.validator');

// All admin routes require authentication + admin role
router.use(authMiddleware);
router.use(authorize('admin'));

// SEC-10: Schemas for admin applicant rejection
const rejectParamsSchema = s.object({
  userId: s.objectId({ message: 'Invalid user ID' })
}, { allowUnknown: true });

const rejectBodySchema = s.object({
  reason: s.string({
    max: 1000,
    trim: true,
    default: 'Not specified',
    message: 'Reason must not exceed 1000 characters'
  })
}, { allowUnknown: false });

const validateRejectVerification = validate({
  params: rejectParamsSchema,
  body: rejectBodySchema
});

// Verification workflows
router.get('/verification/pending', adminController.getPendingVerifications);
router.get('/verification/:userId', adminController.getVerificationDetails);
router.patch('/verification/:userId/approve', adminController.approveVerification);
router.patch('/verification/:userId/reject', validateRejectVerification, adminController.rejectVerification);

// System Analytics
router.get('/analytics/overview', adminController.getSystemOverview);
router.get('/analytics/districts', adminController.getDistrictAnalytics);

// Audit Logging
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
