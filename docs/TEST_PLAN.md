# TEST PLAN & QUALITY ASSURANCE — DRISHTI (SIH26038)

## 1. Testing Philosophy
In medical screening decision-support software, software faults, unhandled edge cases, or false claims of system readiness can lead to critical patient harm or embarrassing demo failures during jury evaluation. 
Testing in Drishti adheres to **empirical proof**: features are marked verified only when validated with captured HTTP responses, UI screenshots, or automated test executions.

---

## 2. Test Suites by Module

### A. Authentication & Session Verification
- [ ] **Valid Patient Registration:** `POST /api/auth/register` with valid patient payload creates active user and returns 201.
- [ ] **Duplicate Email Detection:** Attempting registration with existing email returns 409 Conflict.
- [ ] **Weak Password Rejection:** Passwords lacking uppercase, numbers, or symbols are rejected with 400.
- [ ] **Privilege Escalation Prevention:** Registration payloads attempting `role: 'admin'` are rejected with 400.
- [ ] **Doctor / HW Approval Gate:** Staff accounts register with `isActive: false` and cannot log in until approved.
- [ ] **Valid Login & Cookie Issuance:** Correct login yields 200 and sets `token` HTTP-only cookie.
- [ ] **Session Restoration:** Calling `GET /api/auth/me` with cookie returns user details; without cookie returns 401.

### B. Authorization & Access Control (RBAC)
- [ ] **Patient Route Isolation:** Patient cannot view another patient's profile or screening record.
- [ ] **Doctor Queue Protection:** Unauthenticated users or Patients calling `/api/reviews/queue` receive 403 Forbidden.
- [ ] **Admin Route Security:** Non-admin roles attempting `/api/v1/admin/verification/*` receive 403 Forbidden.

### C. Fundus Image & Screening Pipeline
- [ ] **Non-Image File Rejection:** Submitting `.txt` or `.exe` files returns 400 Unsupported Media Type.
- [ ] **Large File Rejection:** Images exceeding 15MB return 413 Payload Too Large.
- [ ] **Optical Quality Failure:** Blurry or dark fundus image triggers `quality_decision: 'reject'` with clear advice to recapture.
- [ ] **Non-Fundus Image Rejection:** Uploading a photo of a face, pet, or landscape is caught by `fundus_suitability` classifier and rejected.
- [ ] **Valid Fundus Inference:** High-quality fundus image generates DR Grade (0-4), confidence score, Grad-CAM++ heatmap, and lesion overlay.
- [ ] **Screening Record Persistence:** Full AI result payload successfully writes to MongoDB `Screening` collection.

### D. Clinical Review & Referral Flow
- [ ] **Queue Population:** Referable screenings (Grade 2+) immediately show in Doctor Review Queue.
- [ ] **Doctor Review Submission:** Doctor submits review with notes and hospital referral; status updates to `reviewed`.
- [ ] **Patient Review Visibility:** Patient opens their screening result and sees the doctor's confirmed review and recommendations.

### E. Frontend Edge Cases & Resilience
- [ ] **AI Service Offline Graceful Degradation:** If FastAPI server is unreachable, frontend displays a helpful retry message rather than an unhandled JavaScript crash.
- [ ] **Form Validation:** All required fields trigger inline UI warnings prior to network dispatch.
- [ ] **Responsive Viewport:** Mobile camera capture and dashboard layouts render smoothly on standard phone screen widths (360px - 414px).
