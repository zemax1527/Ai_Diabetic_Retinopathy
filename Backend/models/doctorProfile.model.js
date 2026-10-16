const mongoose = require('mongoose')

const doctorProfileSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Personal details
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
    village: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true }
  },

  // Professional / qualification details
  specialization: {
    type: String,
    trim: true
  },

  qualification: {
  type: String,
  required: true,
  trim: true
},

  yearsOfExperience: {
    type: Number
  },

  institution: {
    name: { type: String, trim: true },
    address: { type: String, trim: true }
  },

  // Medical registration / professional details
  medicalRegistrationNumber: {
    type: String,
    trim: true
  },

  registrationCouncil: {
    type: String,
    trim: true
  },

  registrationYear: {
    type: Number
  },

  // Verification documents (stored as file paths/URLs — upload handled separately)
  documents: {
    idProof: { type: String, trim: true },                  // Govt ID / Aadhaar
    medicalDegree: { type: String, trim: true },             // MBBS / MD / MS certificate
    medicalRegistrationCertificate: { type: String, trim: true }, // MCI / State council
    experienceCertificate: { type: String, trim: true }
  }

}, {
  timestamps: true
})

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema)

module.exports = DoctorProfile
