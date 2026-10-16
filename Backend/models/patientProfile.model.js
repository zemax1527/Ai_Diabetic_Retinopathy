const mongoose = require('mongoose')

const patientProfileSchema = new mongoose.Schema({

  // Nullable reference to User account: unclaimed field patients have userId = null;
  // claimed or self-registered patients have unique userId ref.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true,
    default: null
  },

  // Unique patient identifier generated via atomic sequence (e.g. PAT-2026-0001)
  patientId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },

  // Direct demographic name for the patient record (ensures field patients have full identity without User account)
  fullName: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true,
      default: ''
    }
  },

  // Registration source: 'self' (public registration) vs 'field_worker' (camp registration)
  registrationType: {
    type: String,
    enum: ['self', 'field_worker'],
    default: 'self'
  },

  // Healthcare worker / Doctor User ID who registered this patient record in outreach camp
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Claim status for independent patient login activation
  claimStatus: {
    type: String,
    enum: ['unclaimed', 'claimed'],
    default: 'claimed'
  },

  // One-time cryptographic claim code hash (excluded from queries by default)
  claimCodeHash: {
    type: String,
    select: false
  },

  // Timestamp when an unclaimed field record was claimed by an authenticated patient
  claimedAt: {
    type: Date,
    default: null
  },

  dateOfBirth: {
    type: Date
  },

  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },

  phone: {
    type: String,
    trim: true
  },

  address: {
    village: {
      type: String,
      trim: true
    },

    district: {
      type: String,
      trim: true
    },

    state: {
      type: String,
      trim: true
    },

    pincode: {
      type: String,
      trim: true
    }
  },

  diabetesStatus: {
    type: String,
    enum: ['yes', 'no', 'unknown'],
    default: 'unknown'
  },

  diabetesDuration: {
    type: Number,
    min: 0
  }

}, {
  timestamps: true
})

const PatientProfile = mongoose.model(
  'PatientProfile',
  patientProfileSchema
)

module.exports = PatientProfile