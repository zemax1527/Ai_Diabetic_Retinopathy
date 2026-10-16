/**
 * Mock Screenings — DEMO DATA ONLY
 * ~60 screenings across all statuses, multiple patients, both eyes.
 * Includes AI results, quality results, clinical reviews, and XAI data.
 */

// --- Synthetic fundus image SVG data URL ---
// These are clearly-labelled synthetic placeholder images. No real retinal images.
export function syntheticFundusDataUrl(label = 'Synthetic demo image') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <radialGradient id="retina" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#c17a3e" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="#8b4513" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#3d1a00" stop-opacity="1"/>
      </radialGradient>
    </defs>
    <circle cx="200" cy="200" r="195" fill="#1a0a00"/>
    <circle cx="200" cy="200" r="190" fill="url(#retina)"/>
    <!-- Optic disc -->
    <circle cx="240" cy="200" r="25" fill="#f5d08a" opacity="0.9"/>
    <circle cx="240" cy="200" r="18" fill="#f0c060" opacity="0.8"/>
    <!-- Blood vessels -->
    <line x1="240" y1="200" x2="120" y2="130" stroke="#cc2200" stroke-width="3" opacity="0.7"/>
    <line x1="240" y1="200" x2="100" y2="250" stroke="#cc2200" stroke-width="3" opacity="0.7"/>
    <line x1="240" y1="200" x2="300" y2="100" stroke="#cc2200" stroke-width="2" opacity="0.6"/>
    <line x1="240" y1="200" x2="320" y2="300" stroke="#cc2200" stroke-width="2" opacity="0.6"/>
    <line x1="120" y1="130" x2="80" y2="100" stroke="#cc2200" stroke-width="2" opacity="0.5"/>
    <line x1="120" y1="130" x2="90" y2="160" stroke="#cc2200" stroke-width="2" opacity="0.5"/>
    <!-- Macula -->
    <circle cx="165" cy="200" r="20" fill="#7a3a10" opacity="0.5"/>
    <circle cx="165" cy="200" r="8" fill="#4a2008" opacity="0.7"/>
    <!-- Demo label -->
    <rect x="10" y="10" width="${label.length * 7 + 16}" height="24" rx="3" fill="#00000088"/>
    <text x="18" y="26" font-family="monospace" font-size="12" fill="#ffcc00">${label}</text>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export function syntheticHeatmapDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <radialGradient id="heat1" cx="42%" cy="55%" r="25%">
        <stop offset="0%" stop-color="#ff0000" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#ff0000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="heat2" cx="30%" cy="40%" r="18%">
        <stop offset="0%" stop-color="#ff6600" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#ff6600" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="heat3" cx="65%" cy="60%" r="15%">
        <stop offset="0%" stop-color="#ffaa00" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#ffaa00" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="200" cy="200" r="195" fill="transparent"/>
    <circle cx="200" cy="200" r="190" fill="url(#heat1)" opacity="0.9"/>
    <circle cx="200" cy="200" r="190" fill="url(#heat2)" opacity="0.7"/>
    <circle cx="200" cy="200" r="190" fill="url(#heat3)" opacity="0.6"/>
    <rect x="10" y="10" width="200" height="24" rx="3" fill="#00000088"/>
    <text x="18" y="26" font-family="monospace" font-size="12" fill="#ffcc00">Synthetic demo explanation</text>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

const IMG = syntheticFundusDataUrl()
const HEATMAP = syntheticHeatmapDataUrl()

export const MOCK_SCREENINGS = [
  // --- p-001 Gopal Verma — multiple screenings, both eyes ---
  {
    id: 's-001',
    patientId: 'p-001',
    eye: 'RIGHT',
    status: 'CLOSED',
    triage: 'ROUTINE_MONITORING',
    createdBy: 'u-hw-01',
    assignedDoctorId: 'u-doc-01',
    createdAt: '2025-07-01T09:00:00Z',
    updatedAt: '2025-07-05T14:00:00Z',
    imageUrl: IMG,
    qualityResult: { passed: true, issues: [] },
    aiResult: {
      prediction: 'No DR',
      severityLabel: 'No DR',
      confidence: 0.92,
      modelVersion: 'drishti-v1.2',
      processingStatus: 'COMPLETED',
      xaiAvailable: true,
    },
    xaiResult: {
      originalImageUrl: IMG,
      heatmapUrl: HEATMAP,
      overlayUrl: null,
      explanationText: 'The model found minimal features associated with diabetic retinopathy.',
      modelVersion: 'drishti-v1.2',
    },
    clinicalReview: {
      screeningId: 's-001',
      reviewerId: 'u-doc-01',
      agreesWithAi: true,
      findings: 'No signs of diabetic retinopathy on fundus examination.',
      notes: 'Annual follow-up recommended.',
      triage: 'ROUTINE_MONITORING',
      followUpDate: '2026-07-01',
      referral: null,
      completedAt: '2025-07-05T14:00:00Z',
    },
  },
  {
    id: 's-002',
    patientId: 'p-001',
    eye: 'LEFT',
    status: 'CLOSED',
    triage: 'ROUTINE_MONITORING',
    createdBy: 'u-hw-01',
    assignedDoctorId: 'u-doc-01',
    createdAt: '2025-07-01T09:30:00Z',
    updatedAt: '2025-07-05T14:30:00Z',
    imageUrl: IMG,
    qualityResult: { passed: true, issues: [] },
    aiResult: {
      prediction: 'Mild DR',
      severityLabel: 'Mild',
      confidence: 0.78,
      modelVersion: 'drishti-v1.2',
      processingStatus: 'COMPLETED',
      xaiAvailable: true,
    },
    xaiResult: {
      originalImageUrl: IMG,
      heatmapUrl: HEATMAP,
      overlayUrl: null,
      explanationText: 'The model highlighted small areas near the optic disc.',
      modelVersion: 'drishti-v1.2',
    },
    clinicalReview: {
      screeningId: 's-002',
      reviewerId: 'u-doc-01',
      agreesWithAi: true,
      findings: 'Mild non-proliferative changes noted.',
      notes: 'Close monitoring required.',
      triage: 'ROUTINE_MONITORING',
      followUpDate: '2026-01-01',
      referral: null,
      completedAt: '2025-07-05T14:30:00Z',
    },
  },
  {
    id: 's-003',
    patientId: 'p-001',
    eye: 'RIGHT',
    status: 'CLINICAL_REVIEW',
    triage: null,
    createdBy: 'u-hw-01',
    assignedDoctorId: 'u-doc-01',
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-01T10:00:00Z',
    imageUrl: IMG,
    qualityResult: { passed: true, issues: [] },
    aiResult: {
      prediction: 'Moderate DR',
      severityLabel: 'Moderate',
      confidence: 0.84,
      modelVersion: 'drishti-v1.3',
      processingStatus: 'COMPLETED',
      xaiAvailable: true,
    },
    xaiResult: {
      originalImageUrl: IMG,
      heatmapUrl: HEATMAP,
      overlayUrl: null,
      explanationText: null,
      modelVersion: 'drishti-v1.3',
    },
    clinicalReview: null,
  },
  // --- p-003 Ratan Lal — severe, referred ---
  {
    id: 's-004',
    patientId: 'p-003',
    eye: 'RIGHT',
    status: 'REFERRED',
    triage: 'REFERRAL',
    createdBy: 'u-hw-01',
    assignedDoctorId: 'u-doc-02',
    createdAt: '2025-09-10T10:00:00Z',
    updatedAt: '2025-09-15T16:00:00Z',
    imageUrl: IMG,
    qualityResult: { passed: true, issues: [] },
    aiResult: {
      prediction: 'Severe DR',
      severityLabel: 'Severe',
      confidence: 0.89,
      modelVersion: 'drishti-v1.2',
      processingStatus: 'COMPLETED',
      xaiAvailable: true,
      lesions: [
        { type: 'HAEMORRHAGE', count: 5, confidence: 0.82 },
        { type: 'HARD_EXUDATE', count: 3, confidence: 0.76 },
      ],
    },
    xaiResult: {
      originalImageUrl: IMG,
      heatmapUrl: HEATMAP,
      overlayUrl: null,
      explanationText: 'Multiple high-activation regions detected. Note: these highlighted areas show model focus, not confirmed lesion locations.',
      modelVersion: 'drishti-v1.2',
    },
    clinicalReview: {
      screeningId: 's-004',
      reviewerId: 'u-doc-02',
      agreesWithAi: true,
      findings: 'Extensive retinal changes noted on examination.',
      notes: 'Urgent ophthalmology referral arranged.',
      triage: 'REFERRAL',
      followUpDate: null,
      referral: {
        facility: 'Regional Eye Hospital, Chandanpur',
        reason: 'Severe diabetic retinopathy with risk of vision loss',
        urgency: 'URGENT',
      },
      completedAt: '2025-09-15T16:00:00Z',
    },
  },
  {
    id: 's-005',
    patientId: 'p-003',
    eye: 'LEFT',
    status: 'REFERRED',
    triage: 'REFERRAL',
    createdBy: 'u-hw-01',
    assignedDoctorId: 'u-doc-02',
    createdAt: '2025-09-10T10:30:00Z',
    updatedAt: '2025-09-15T16:30:00Z',
    imageUrl: IMG,
    qualityResult: { passed: true, issues: [] },
    aiResult: {
      prediction: 'Proliferative DR',
      severityLabel: 'Proliferative',
      confidence: 0.91,
      modelVersion: 'drishti-v1.2',
      processingStatus: 'COMPLETED',
      xaiAvailable: true,
    },
    xaiResult: {
      originalImageUrl: IMG,
      heatmapUrl: HEATMAP,
      overlayUrl: null,
      explanationText: null,
      modelVersion: 'drishti-v1.2',
    },
    clinicalReview: {
      screeningId: 's-005',
      reviewerId: 'u-doc-02',
      agreesWithAi: false,
      findings: 'Advanced proliferative changes with neovascularisation.',
      notes: 'Immediate intervention needed.',
      triage: 'REFERRAL',
      followUpDate: null,
      referral: {
        facility: 'Regional Eye Hospital, Chandanpur',
        reason: 'Proliferative diabetic retinopathy',
        urgency: 'URGENT',
      },
      completedAt: '2025-09-15T16:30:00Z',
    },
  },
  // --- p-002 Savitri Devi ---
  {
    id: 's-006',
    patientId: 'p-002',
    eye: 'RIGHT',
    status: 'TRIAGED',
    triage: 'FOLLOW_UP_REQUIRED',
    createdBy: 'u-hw-01',
    assignedDoctorId: 'u-doc-01',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-20T12:00:00Z',
    imageUrl: IMG,
    qualityResult: { passed: true, issues: [] },
    aiResult: {
      prediction: 'Mild DR',
      severityLabel: 'Mild',
      confidence: 0.81,
      modelVersion: 'drishti-v1.3',
      processingStatus: 'COMPLETED',
      xaiAvailable: true,
    },
    xaiResult: {
      originalImageUrl: IMG,
      heatmapUrl: HEATMAP,
      overlayUrl: null,
      explanationText: null,
      modelVersion: 'drishti-v1.3',
    },
    clinicalReview: {
      screeningId: 's-006',
      reviewerId: 'u-doc-01',
      agreesWithAi: true,
      findings: 'Early retinal changes consistent with mild NPDR.',
      notes: 'Follow up in 6 months.',
      triage: 'FOLLOW_UP_REQUIRED',
      followUpDate: '2026-07-15',
      referral: null,
      completedAt: '2026-01-20T12:00:00Z',
    },
  },
  // --- Quality failures for testing ---
  {
    id: 's-007',
    patientId: 'p-004',
    eye: 'RIGHT',
    status: 'QUALITY_FAILED',
    triage: null,
    createdBy: 'u-hw-02',
    assignedDoctorId: null,
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T09:05:00Z',
    imageUrl: IMG,
    qualityResult: {
      passed: false,
      issues: [
        { code: 'BLUR', message: 'The image is too blurry to assess reliably.' },
        { code: 'LOW_ILLUMINATION', message: 'Insufficient illumination makes the retina hard to see.' },
      ],
    },
    aiResult: null,
    xaiResult: null,
    clinicalReview: null,
  },
  {
    id: 's-008',
    patientId: 'p-005',
    eye: 'LEFT',
    status: 'QUALITY_FAILED',
    triage: null,
    createdBy: 'u-hw-02',
    assignedDoctorId: null,
    createdAt: '2026-08-05T10:00:00Z',
    updatedAt: '2026-08-05T10:05:00Z',
    imageUrl: IMG,
    qualityResult: {
      passed: false,
      issues: [
        { code: 'FIELD_OF_VIEW', message: 'The retinal field of view is incomplete.' },
      ],
    },
    aiResult: null,
    xaiResult: null,
    clinicalReview: null,
  },
  // --- AI processing ---
  {
    id: 's-009',
    patientId: 'p-006',
    eye: 'RIGHT',
    status: 'AI_PROCESSING',
    triage: null,
    createdBy: 'u-hw-02',
    assignedDoctorId: null,
    createdAt: '2026-10-02T08:00:00Z',
    updatedAt: '2026-10-02T08:01:00Z',
    imageUrl: IMG,
    qualityResult: { passed: true, issues: [] },
    aiResult: null,
    xaiResult: null,
    clinicalReview: null,
  },
  // --- AI completed, awaiting review ---
  {
    id: 's-010',
    patientId: 'p-007',
    eye: 'RIGHT',
    status: 'CLINICAL_REVIEW',
    triage: null,
    createdBy: 'u-hw-01',
    assignedDoctorId: 'u-doc-01',
    createdAt: '2026-09-28T09:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
    imageUrl: IMG,
    qualityResult: { passed: true, issues: [] },
    aiResult: {
      prediction: 'Severe DR',
      severityLabel: 'Severe',
      confidence: 0.87,
      modelVersion: 'drishti-v1.3',
      processingStatus: 'COMPLETED',
      xaiAvailable: true,
    },
    xaiResult: {
      originalImageUrl: IMG,
      heatmapUrl: HEATMAP,
      overlayUrl: null,
      explanationText: null,
      modelVersion: 'drishti-v1.3',
    },
    clinicalReview: null,
  },
  {
    id: 's-011',
    patientId: 'p-010',
    eye: 'RIGHT',
    status: 'CLINICAL_REVIEW',
    triage: null,
    createdBy: 'u-hw-03',
    assignedDoctorId: 'u-doc-01',
    createdAt: '2026-09-29T10:00:00Z',
    updatedAt: '2026-09-29T11:00:00Z',
    imageUrl: IMG,
    qualityResult: { passed: true, issues: [] },
    aiResult: {
      prediction: 'Moderate DR',
      severityLabel: 'Moderate',
      confidence: 0.75,
      modelVersion: 'drishti-v1.3',
      processingStatus: 'COMPLETED',
      xaiAvailable: true,
    },
    xaiResult: {
      originalImageUrl: IMG,
      heatmapUrl: HEATMAP,
      overlayUrl: null,
      explanationText: null,
      modelVersion: 'drishti-v1.3',
    },
    clinicalReview: null,
  },
  {
    id: 's-012',
    patientId: 'p-011',
    eye: 'LEFT',
    status: 'CLINICAL_REVIEW',
    triage: null,
    createdBy: 'u-hw-03',
    assignedDoctorId: 'u-doc-01',
    createdAt: '2026-09-30T09:00:00Z',
    updatedAt: '2026-09-30T10:00:00Z',
    imageUrl: IMG,
    qualityResult: { passed: true, issues: [] },
    aiResult: {
      prediction: 'Proliferative DR',
      severityLabel: 'Proliferative',
      confidence: 0.93,
      modelVersion: 'drishti-v1.3',
      processingStatus: 'COMPLETED',
      xaiAvailable: true,
    },
    xaiResult: {
      originalImageUrl: IMG,
      heatmapUrl: HEATMAP,
      overlayUrl: null,
      explanationText: null,
      modelVersion: 'drishti-v1.3',
    },
    clinicalReview: null,
  },
  // More screenings for various patients
  ...generateAdditionalScreenings(),
]

function generateAdditionalScreenings() {
  const statuses = ['CLOSED', 'TRIAGED', 'CLOSED', 'CLOSED', 'TRIAGED']
  const severities = [
    { prediction: 'No DR', severityLabel: 'No DR', confidence: 0.95 },
    { prediction: 'Mild DR', severityLabel: 'Mild', confidence: 0.80 },
    { prediction: 'Moderate DR', severityLabel: 'Moderate', confidence: 0.82 },
    { prediction: 'No DR', severityLabel: 'No DR', confidence: 0.90 },
    { prediction: 'Mild DR', severityLabel: 'Mild', confidence: 0.77 },
  ]
  const patients = ['p-008', 'p-009', 'p-012', 'p-013', 'p-014', 'p-015', 'p-016', 'p-017', 'p-018', 'p-019', 'p-020', 'p-021', 'p-022', 'p-023', 'p-024', 'p-025']
  const workers = ['u-hw-01', 'u-hw-02', 'u-hw-03']
  const doctors = ['u-doc-01', 'u-doc-02']
  const triages = ['ROUTINE_MONITORING', 'FOLLOW_UP_REQUIRED', 'ROUTINE_MONITORING']

  return patients.flatMap((patientId, i) => {
    const sevIdx = i % severities.length
    const sev = severities[sevIdx]
    const date = new Date('2026-01-01')
    date.setDate(date.getDate() + i * 12)
    const iso = date.toISOString()
    const status = statuses[i % statuses.length]
    const triage = triages[i % triages.length]
    return [
      {
        id: `s-gen-${i}-R`,
        patientId,
        eye: 'RIGHT',
        status,
        triage,
        createdBy: workers[i % workers.length],
        assignedDoctorId: doctors[i % doctors.length],
        createdAt: iso,
        updatedAt: iso,
        imageUrl: IMG,
        qualityResult: { passed: true, issues: [] },
        aiResult: {
          ...sev,
          modelVersion: 'drishti-v1.3',
          processingStatus: 'COMPLETED',
          xaiAvailable: true,
        },
        xaiResult: {
          originalImageUrl: IMG,
          heatmapUrl: HEATMAP,
          overlayUrl: null,
          explanationText: null,
          modelVersion: 'drishti-v1.3',
        },
        clinicalReview: status === 'CLOSED' || status === 'TRIAGED' ? {
          screeningId: `s-gen-${i}-R`,
          reviewerId: doctors[i % doctors.length],
          agreesWithAi: true,
          findings: 'Retinal examination completed. Results recorded.',
          notes: null,
          triage,
          followUpDate: triage === 'FOLLOW_UP_REQUIRED' ? '2026-12-01' : null,
          referral: null,
          completedAt: iso,
        } : null,
      },
    ]
  })
}

export const MOCK_FOLLOW_UPS = [
  {
    id: 'fu-001',
    screeningId: 's-006',
    patientId: 'p-002',
    patientName: 'Savitri Devi',
    dueDate: '2026-07-15',
    status: 'DUE',
    notes: 'Follow-up for mild NPDR in right eye',
    assignedDoctorId: 'u-doc-01',
  },
  {
    id: 'fu-002',
    screeningId: 's-001',
    patientId: 'p-001',
    patientName: 'Gopal Verma',
    dueDate: '2026-07-01',
    status: 'OVERDUE',
    notes: 'Annual follow-up due',
    assignedDoctorId: 'u-doc-01',
  },
  {
    id: 'fu-003',
    screeningId: 's-004',
    patientId: 'p-003',
    patientName: 'Ratan Lal',
    dueDate: '2026-12-01',
    status: 'DUE',
    notes: 'Post-referral follow-up',
    assignedDoctorId: 'u-doc-02',
  },
]

export const MOCK_NOTIFICATIONS = [
  {
    id: 'n-001',
    userId: 'u-doc-01',
    type: 'REVIEW_PENDING',
    title: 'New screening awaiting your review',
    message: 'Patient Ratan Lal — Right Eye — AI result: Severe DR',
    screeningId: 's-010',
    read: false,
    createdAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'n-002',
    userId: 'u-doc-01',
    type: 'REVIEW_PENDING',
    title: 'New screening awaiting your review',
    message: 'Patient Pushpa Soni — Right Eye — AI result: Moderate DR',
    screeningId: 's-011',
    read: false,
    createdAt: '2026-09-29T11:00:00Z',
  },
  {
    id: 'n-003',
    userId: 'u-hw-01',
    type: 'QUALITY_FAILED',
    title: 'Screening needs retake',
    message: 'Patient Kamla Bai — Right Eye quality check failed: Blurry image.',
    screeningId: 's-007',
    read: true,
    createdAt: '2026-08-01T09:05:00Z',
  },
  {
    id: 'n-004',
    userId: 'u-hw-02',
    type: 'REVIEW_COMPLETE',
    title: 'Doctor review completed',
    message: 'Savitri Devi — Right Eye — Triage: Follow-up Required',
    screeningId: 's-006',
    read: false,
    createdAt: '2026-01-20T12:00:00Z',
  },
  {
    id: 'n-005',
    userId: 'u-pat-01',
    type: 'REVIEW_COMPLETE',
    title: 'Your screening result is ready',
    message: 'Your eye screening from July has been reviewed by a doctor.',
    screeningId: 's-002',
    read: false,
    createdAt: '2025-07-05T15:00:00Z',
  },
]

export const MOCK_AUDIT_LOG = [
  { id: 'al-001', time: '2026-10-02T08:15:00Z', actorId: 'u-admin-01', actorName: 'Priya Sharma', actorRole: 'admin', action: 'ROLE_CHANGE', target: 'Kavitha Rajan', targetId: 'u-hw-03', outcome: 'SUCCESS', detail: 'Role changed: patient → healthcare_worker' },
  { id: 'al-002', time: '2026-10-01T14:30:00Z', actorId: 'u-hw-01',    actorName: 'Ramesh Yadav',   actorRole: 'healthcare_worker', action: 'SCREENING_CREATED', target: 'Gopal Verma', targetId: 'p-001', outcome: 'SUCCESS', detail: 'Screening s-003 created' },
  { id: 'al-003', time: '2026-09-30T11:00:00Z', actorId: 'u-doc-01',   actorName: 'Dr. Vikram Nair', actorRole: 'doctor', action: 'REVIEW_COMPLETE', target: 'Screening s-012', targetId: 's-012', outcome: 'SUCCESS', detail: 'Triage: REFERRAL' },
  { id: 'al-004', time: '2026-09-29T09:00:00Z', actorId: 'unknown',    actorName: 'Unknown',         actorRole: 'unknown', action: 'LOGIN_FAILED', target: 'admin@drishti.demo', targetId: null, outcome: 'FAILED', detail: 'Incorrect credentials' },
  { id: 'al-005', time: '2026-09-29T09:01:00Z', actorId: 'unknown',    actorName: 'Unknown',         actorRole: 'unknown', action: 'LOGIN_FAILED', target: 'admin@drishti.demo', targetId: null, outcome: 'FAILED', detail: 'Incorrect credentials' },
  { id: 'al-006', time: '2026-09-28T16:00:00Z', actorId: 'u-admin-01', actorName: 'Priya Sharma',   actorRole: 'admin', action: 'USER_DISABLED', target: 'Suresh Babu', targetId: 'u-hw-04', outcome: 'SUCCESS', detail: 'Account disabled by admin' },
  { id: 'al-007', time: '2026-09-27T10:00:00Z', actorId: 'u-hw-02',   actorName: 'Anjali Mehta',    actorRole: 'healthcare_worker', action: 'PATIENT_REGISTERED', target: 'New patient', targetId: 'p-025', outcome: 'SUCCESS', detail: 'Patient Ramesh Kushwah registered' },
]
