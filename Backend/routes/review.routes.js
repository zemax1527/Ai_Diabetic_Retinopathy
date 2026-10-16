const express = require('express');
const router = express.Router();
const reviewController = require('../controller/review.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/authorize.middleware');

// All review routes require authentication + doctor (or admin) role
router.use(authMiddleware);
router.use(authorize('doctor', 'admin'));

// Fetch review queue
router.get('/queue', reviewController.getReviewQueue);

// Fetch doctor's review history
router.get('/history', reviewController.getDoctorReviewHistory);

// Submit clinical review for a screening
router.post('/:screeningId', reviewController.submitClinicalReview);

module.exports = router;
