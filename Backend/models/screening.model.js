const mongoose = require('mongoose');

const screeningSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientProfile',
    required: true
  },

  // Nullable reference to User: null if the screened patient is an unclaimed field patient without a login account;
  // populated with User._id for self-screening or after the patient claims their record.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  screeningType: {
    type: String,
    enum: ['self', 'assisted'],
    default: 'self'
  },

  // null for self-screening; healthcare_worker User ID for assisted screening
  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  status: {
    type: String,
    enum: [
      'created',
      'image_uploaded',
      'processing',
      'completed',
      'pending_review',
      'reviewed',
      'failed'
    ],
    default: 'completed'
  },

  screeningReferenceId: {
    type: String,
    trim: true
  },

  // Images
  images: {
    originalUrl: { type: String, trim: true },
    heatmapUrl: { type: String, trim: true },
    gradcamUrl: { type: String, trim: true },
    lesionOverlayUrl: { type: String, trim: true },
    storageProvider: {
      type: String,
      enum: ['azure_blob', 'cloudinary', 'local', 'external_secure', 'mixed', 'unknown'],
      default: 'unknown'
    },
    providers: {
      originalUrl: { type: String, default: null },
      heatmapUrl: { type: String, default: null },
      gradcamUrl: { type: String, default: null },
      lesionOverlayUrl: { type: String, default: null }
    }
  },

  // Optical quality metrics
  quality: {
    status: { type: String, default: 'Good' },
    score: { type: Number, default: 1 },
    isFundus: { type: Boolean, default: true },
    retinaVisibility: { type: Number, default: 1 },
    blur: { type: Number, default: 0 },
    brightness: { type: Number, default: 0 },
    contrast: { type: Number, default: 0 },
    recommendation: { type: String, default: '' },
    checks: [{
      name: String,
      passed: Boolean,
      detail: String
    }]
  },

  // AI classification
  aiResult: {
    grade: {
      type: Number,
      min: 0,
      max: 4,
      default: 0
    },
    label: {
      type: String,
      default: 'No Diabetic Retinopathy'
    },
    confidence: {
      type: String,
      default: '0%'
    },
    confidenceScore: {
      type: Number,
      default: 0
    },
    probabilities: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    screeningDecision: {
      decision: { type: String, default: 'NON-REFERABLE' },
      referable: { type: Boolean, default: false },
      reason: { type: String, default: '' }
    }
  },

  // XAI links and explainability
  explainability: {
    method: { type: String, default: 'Grad-CAM++' },
    explanation: { type: String, default: '' },
    heatmapUrl: { type: String, default: '' },
    overlayUrl: { type: String, default: '' }
  },

  lesions: {
    count: { type: Number, default: 0 },
    summaryList: [{
      key: String,
      displayName: String,
      count: Number,
      maxConfidence: String
    }],
    model: { type: String, default: 'fundus-lesions-toolkit' }
  },

  // Doctor review subdocument
  review: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    clinicalGrade: {
      type: Number,
      min: 0,
      max: 4,
      default: null
    },
    clinicalNotes: {
      type: String,
      trim: true,
      default: ''
    },
    triageLevel: {
      type: String,
      enum: ['routine', 'priority', 'urgent', null],
      default: null
    },
    referralHospital: {
      type: String,
      trim: true,
      default: ''
    }
  }

}, {
  timestamps: true
});

// SEC-08: Compound unique partial index enforcing screening reference uniqueness per patient.
// Partial filter ensures missing, null, or undefined references do not conflict with each other.
screeningSchema.index(
  { patientId: 1, screeningReferenceId: 1 },
  {
    unique: true,
    partialFilterExpression: { screeningReferenceId: { $type: 'string' } }
  }
)

const Screening = mongoose.model('Screening', screeningSchema);

module.exports = Screening;
