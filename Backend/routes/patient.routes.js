const express = require('express');
const router = express.Router();
const patientController = require('../controller/patient.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/authorize.middleware');

// Patient self-management routes
router.get('/me', authMiddleware, authorize('patient'), patientController.getMyProfile);
router.patch('/me', authMiddleware, authorize('patient'), patientController.updateMyProfile);
router.post('/claim', authMiddleware, authorize('patient'), patientController.claimPatientRecord);

// Field patient management routes (Healthcare Worker, Doctor, Admin)
router.post('/', authMiddleware, authorize('healthcare_worker', 'doctor', 'admin'), patientController.registerFieldPatient);
router.get('/', authMiddleware, authorize('healthcare_worker', 'doctor', 'admin'), patientController.searchPatients);
router.get('/:patientId', authMiddleware, authorize('healthcare_worker', 'doctor', 'admin'), patientController.getPatientById);

module.exports = router;
