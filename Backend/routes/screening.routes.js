const express = require('express');
const router = express.Router();
const screeningController = require('../controller/screening.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/authorize.middleware');

// All screening routes require authentication
router.use(authMiddleware);

// Sync AI screening result to MongoDB (restricted to authorized roles)
router.post('/sync', authorize('patient', 'healthcare_worker', 'doctor'), screeningController.syncScreening);

// Get screenings for logged in user
router.get('/my', screeningController.getMyScreenings);

// Get screenings for a specific patient (Doctor, Healthcare Worker, Admin)
router.get('/patient/:patientId', authorize('healthcare_worker', 'doctor', 'admin'), screeningController.getPatientScreenings);

// Get single screening details
router.get('/:id', screeningController.getScreeningById);

module.exports = router;
