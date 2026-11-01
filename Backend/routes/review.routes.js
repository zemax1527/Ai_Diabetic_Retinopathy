const express = require('express');
const router = express.Router();
const reviewController = require('../controller/review.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const s = require('../utils/schema.validator');

// All review routes require authentication + doctor (or admin) role
router.use(authMiddleware);
router.use(authorize('doctor', 'admin'));

// Fetch review queue
router.get('/queue', reviewController.getReviewQueue);

// Fetch doctor's review history
router.get('/history', reviewController.getDoctorReviewHistory);

// SEC-10: Schemas for clinical review submission
const reviewParamsSchema = s.object({
  screeningId: s.objectId({ message: 'Invalid screening ID' })
}, { allowUnknown: false })

const reviewBodySchema = s.object({
  clinicalGrade: s.integer({
    required: true,
    min: 0,
    max: 4,
    requiredMessage: 'Clinical grade (0 to 4) is required',
    message: 'Clinical grade must be an integer between 0 and 4'
  }),
  triageLevel: s.string({
    enum: ['routine', 'priority', 'urgent'],
    message: 'Invalid triage level. Must be routine, priority, or urgent'
  }),
  clinicalNotes: s.string({
    max: 5000,
    trim: true,
    default: '',
    message: 'Clinical notes must not exceed 5000 characters'
  }),
  referralHospital: s.string({
    max: 200,
    trim: true,
    default: '',
    message: 'Referral hospital must not exceed 200 characters'
  })
}, { allowUnknown: false });

// Submit clinical review for a screening
router.post(
  '/:screeningId',
  validate({ params: reviewParamsSchema, body: reviewBodySchema }),
  reviewController.submitClinicalReview
);

module.exports = router;
