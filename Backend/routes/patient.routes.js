const express = require('express');
const router = express.Router();
const patientController = require('../controller/patient.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/authorize.middleware');
const { claimRateLimiter } = require('../middleware/rateLimit.middleware');
const validate = require('../middleware/validate.middleware');
const s = require('../utils/schema.validator');

// SEC-10: Schemas for outreach field patient registration
const addressSchema = s.object({
  village: s.string({ max: 100, trim: true, default: '' }),
  district: s.string({ max: 100, trim: true, default: '' }),
  state: s.string({ max: 100, trim: true, default: '' }),
  pincode: s.string({ max: 20, trim: true, default: '' })
}, { allowUnknown: false, label: 'address' });

const fieldPatientRegistrationSchema = s.object({
  firstName: s.string({
    required: true,
    min: 1,
    max: 100,
    trim: true,
    requiredMessage: 'Patient first name is required',
    message: 'Patient first name is required'
  }),
  lastName: s.string({
    max: 100,
    trim: true,
    default: ''
  }),
  phone: s.string({
    max: 20,
    trim: true,
    pattern: /^(\+?[0-9\s\-()]{7,20})?$/,
    default: '',
    message: 'Invalid phone number format'
  }),
  gender: s.string({
    enum: ['male', 'female', 'other'],
    default: 'other',
    message: 'Invalid gender value. Allowed: male, female, other'
  }),
  dateOfBirth: s.date({
    pastOnly: true,
    minYear: 1900,
    label: 'Date of birth',
    futureMessage: 'Date of birth cannot be in the future',
    message: 'Invalid date of birth'
  }),
  address: addressSchema,
  diabetesStatus: s.string({
    enum: ['yes', 'no', 'unknown'],
    default: 'unknown',
    message: 'Invalid diabetes status. Allowed: yes, no, unknown'
  }),
  diabetesDuration: s.number({
    min: 0,
    max: 100,
    message: 'Diabetes duration must be a non-negative number'
  })
}, { allowUnknown: false });

const validateFieldPatientRegistration = validate({
  body: fieldPatientRegistrationSchema
});

// Patient self-management routes
router.get('/me', authMiddleware, authorize('patient'), patientController.getMyProfile);
router.patch('/me', authMiddleware, authorize('patient'), patientController.updateMyProfile);
router.post('/claim', authMiddleware, authorize('patient'), claimRateLimiter, patientController.claimPatientRecord);

// Field patient management routes (Healthcare Worker, Doctor, Admin)
router.post(
  '/',
  authMiddleware,
  authorize('healthcare_worker', 'doctor', 'admin'),
  validateFieldPatientRegistration,
  patientController.registerFieldPatient
);
router.get('/', authMiddleware, authorize('healthcare_worker', 'doctor', 'admin'), patientController.searchPatients);
router.get('/:patientId', authMiddleware, authorize('healthcare_worker', 'doctor', 'admin'), patientController.getPatientById);

module.exports = router;
