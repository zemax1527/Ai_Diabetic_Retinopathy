# DATABASE DESIGN & SCHEMA SPECIFICATION — DRISHTI (SIH26038)

## 1. Database Paradigm
- **Database Engine:** MongoDB Atlas (v7+)
- **ODM:** Mongoose v9
- **Design Philosophy:** Normalized user identities with role-specific profile extensions. Embedded subdocuments for tightly coupled screening results (quality metrics, classification probabilities, XAI URLs) to guarantee atomic reads.

---

## 2. Entity-Relationship Overview

```
 [User] 1 <---> 1 [PatientProfile]
   |    1 <---> 1 [HealthcareWorkerProfile]
   |    1 <---> 1 [DoctorProfile]
   |
   +--- 1 <---> * [Screening] (via patientId / conductedBy)
                     |
                     +---> [FundusImage] (Embedded or Referenced)
                     |
                     +---> [AIResult] (Embedded subdocument)
                     |
                     +---> [DoctorReview] (Embedded or Subdocument)

 [User] 1 <---> * [AuditLog] (Administrative & Security Events)
```

---

## 3. Schema Definitions

### A. `User` Schema (`models/user.model.js`) — [COMPLETED]
Represents authentication credentials, identity, and system authorization flags.
```javascript
{
  fullName: {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, default: '', trim: true }
  },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  loginId: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
  password: { type: String, required: function() { return !this.googleId; }, select: false },
  googleId: { type: String, unique: true, sparse: true },
  role: { 
    type: String, 
    enum: ['patient', 'healthcare_worker', 'doctor', 'admin'], 
    default: 'patient' 
  },
  verificationStatus: { 
    type: String, 
    enum: ['not_required', 'pending', 'approved', 'rejected'], 
    default: 'not_required' 
  },
  isActive: { type: Boolean, default: true },
  timestamps: true
}
```

### B. `PatientProfile` Schema (`models/patientProfile.model.js`) — [COMPLETED]
Contains medical history and rural demographic profiling.
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true, unique: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  phone: { type: String, trim: true },
  address: {
    village: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true }
  },
  diabetesStatus: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
  diabetesDuration: { type: Number, min: 0 },
  timestamps: true
}
```

### C. `HealthcareWorkerProfile` Schema (`models/healthCare.model.js`) — [COMPLETED]
Contains staff credentials, designation, and verification proof files.
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true, unique: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  phone: { type: String, trim: true },
  address: { village, district, state, pincode },
  designation: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  qualification: { type: String, required: true, trim: true },
  yearsOfExperience: { type: Number, min: 0 },
  employeeId: { type: String, trim: true },
  institution: { name: String, address: String },
  documents: {
    idProof: String,
    employmentProof: String,
    qualificationCertificate: String
  },
  timestamps: true
}
```

### D. `DoctorProfile` Schema (`models/doctorProfile.model.js`) — [COMPLETED]
Clinical credentials, registration council, and medical degrees.
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true, unique: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  phone: { type: String, trim: true },
  address: { village, district, state, pincode },
  specialization: { type: String, trim: true },
  qualification: { type: String, required: true, trim: true },
  yearsOfExperience: { type: Number },
  institution: { name: String, address: String },
  medicalRegistrationNumber: { type: String, trim: true },
  registrationCouncil: { type: String, trim: true },
  registrationYear: { type: Number },
  documents: {
    idProof: String,
    medicalDegree: String,
    medicalRegistrationCertificate: String,
    experienceCertificate: String
  },
  timestamps: true
}
```

### E. `Screening` Schema (`models/screening.model.js`) — [ACTION REQUIRED: UPDATE]
Represents one screening evaluation event per eye. Embedded with AI findings and clinical review.
```javascript
{
  patientId: { type: ObjectId, ref: 'PatientProfile', required: true },
  eye: { type: String, enum: ['left', 'right'], required: true },
  screeningType: { type: String, enum: ['self', 'assisted'], required: true },
  conductedBy: { type: ObjectId, ref: 'User', default: null }, // Null for self-screening

  status: {
    type: String,
    enum: ['created', 'image_uploaded', 'processing', 'completed', 'failed', 'pending_review', 'reviewed'],
    default: 'created'
  },

  // Image references (Azure Blob / Cloud Storage)
  images: {
    originalUrl: { type: String, required: true },
    storageKey: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String }
  },

  // Optical Quality Assessment
  quality: {
    status: { type: String, enum: ['good', 'poor', 'rejected'] },
    score: { type: Number },
    isFundus: { type: Boolean },
    checks: {
      resolution: { passed: Boolean, width: Number, height: Number },
      blur: { passed: Boolean, blurScore: Number },
      brightness: { passed: Boolean, brightness: Number },
      contrast: { passed: Boolean, contrast: Number },
      retinaVisibility: { passed: Boolean, visibilityRatio: Number }
    },
    decisionReason: { type: String },
    recommendation: { type: String }
  },

  // DR AI Classification & Safety Ensembling
  aiResult: {
    grade: { type: Number, min: 0, max: 4 }, // 0: No DR, 1: Mild, 2: Moderate, 3: Severe, 4: PDR
    label: { type: String },
    confidence: { type: Number },
    probabilities: {
      noDR: Number,
      mild: Number,
      moderate: Number,
      severe: Number,
      proliferativeDR: Number
    },
    screeningDecision: {
      decision: { type: String, enum: ['REFERABLE', 'NON-REFERABLE'] },
      referable: { type: Boolean },
      reason: { type: String },
      safetyEnsembleUsed: { type: Boolean }
    }
  },

  // Explainability and Lesion Findings
  xaiResult: {
    method: { type: String, default: 'Grad-CAM++' },
    heatmapUrl: { type: String },
    overlayUrl: { type: String },
    explanation: { type: String },
    lesions: {
      count: { type: Number, default: 0 },
      summary: mongoose.Schema.Types.Mixed,
      overlayUrl: { type: String }
    }
  },

  // Clinical Review by Doctor
  doctorReview: {
    reviewedBy: { type: ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    clinicalGrade: { type: Number, min: 0, max: 4 },
    agreesWithAI: { type: Boolean },
    clinicalNotes: { type: String },
    triageLevel: { type: String, enum: ['routine', 'priority', 'urgent'] },
    referralHospital: { type: String },
    followUpWeeks: { type: Number }
  },

  timestamps: true
}
```

### F. `AuditLog` Schema (`models/auditLog.model.js`) — [NEW MODEL]
Immutable log of security-sensitive operations.
```javascript
{
  actorId: { type: ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g., 'VERIFY_DOCTOR_APPROVED', 'ROLE_CHANGED'
  targetId: { type: ObjectId, ref: 'User' },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
}
```
