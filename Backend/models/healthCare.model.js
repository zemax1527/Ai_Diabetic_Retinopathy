const mongoose = require('mongoose')

const healthcareWorkerProfileSchema = new mongoose.Schema(
  {
    // ─── User reference ──────────────────────────────────────────────────────
    // One-to-one with User. Must exist before this profile is created.

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    // ─── Personal details ────────────────────────────────────────────────────
    // Sourced from personalDetails in the registration and completeProfile payloads.

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

    // ─── Professional details ─────────────────────────────────────────────────
    // Sourced from professionalDetails in the registration and completeProfile payloads.

    designation: {
      type: String,
      trim: true
    },

    department: {
      type: String,
      trim: true
    },

    qualification: {
      type: String,
      trim: true
    },

    yearsOfExperience: {
      type: Number
    },

    employeeId: {
      type: String,
      trim: true
    },

    institution: {
      name: { type: String, trim: true }
    },

    // ─── Verification documents ───────────────────────────────────────────────
    // Sourced from verificationDetails in the registration and completeProfile payloads.
    // Stored as file name strings (actual file upload handled externally).

    documents: {
      idProof: { type: String, trim: true },
      employmentProof: { type: String, trim: true },
      qualificationCertificate: { type: String, trim: true }
    }
  },
  {
    timestamps: true
  }
)

// Guard against Mongoose OverwriteModelError if the module is hot-reloaded.
const HealthcareWorkerProfile =
  mongoose.models.HealthcareWorkerProfile ||
  mongoose.model('HealthcareWorkerProfile', healthcareWorkerProfileSchema)

module.exports = HealthcareWorkerProfile
