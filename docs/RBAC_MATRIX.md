# ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION MATRIX — DRISHTI (SIH26038)
*Corrected Security Boundaries Across Main Backend & AI Service*

## 1. Principles of Distributed Access Control
1. **Dual-Service Enforcement:**
   - The **Main MERN Backend** enforces permissions for human identity, demographic records, staff verification, and patient profile access.
   - The **AI Service** enforces its own API access controls and validates which screenings or results a requester is permitted to initiate, view, or review.
2. **Zero-Trust Identity Mapping:** A client-supplied `user_id` is never trusted without cryptographic verification. The AI service must validate user identity before accepting a screening or returning history.
3. **Object-Level Access Control (OLAC):** Patients must never access another patient's medical profile (Backend) or screening history (AI Service) by manipulating IDs in URLs or request payloads.

---

## 2. Distributed Permission Grid

| Capability / Action | Patient | Healthcare Worker | Doctor | Admin | Enforcing Service & Mechanism |
|---|:---:|:---:|:---:|:---:|---|
| **Register Public Account** | Yes | Yes (Pending) | Yes (Pending) | No | **Backend:** `auth.controller.js` rejects `admin` role |
| **Login with Credentials** | Yes | Yes (if active) | Yes (if active) | Yes | **Backend:** `authMiddleware` validates `user.isActive` |
| **View Own Patient Profile** | Yes | No | No | No | **Backend:** `GET /api/patients/me` (OLAC on `req.user._id`) |
| **Update Own Patient Profile** | Yes | No | No | No | **Backend:** `PATCH /api/patients/me` (Whitelisted fields) |
| **Register Field Outreach Patient** | No | Yes | Yes | No | **Backend:** `authorize('healthcare_worker', 'doctor')` |
| **Search District Patients** | No | Yes | Yes | No | **Backend:** `authorize('healthcare_worker', 'doctor')` |
| **Request Patient AI Context** | No | No | No | No | **Backend:** `GET /api/v1/patients/:id/ai-context` (Service-to-Service key) |
| **Perform Self-Screening** | Yes | No | No | No | **AI Service:** Initiates fundus inference for authenticated user |
| **Perform Assisted Screening** | No | Yes | No | No | **AI Service:** Initiates fundus inference for field patient |
| **View Own Screening History** | Yes | Yes (Assisted) | Yes (Assigned) | No | **AI Service:** Filters screening database by verified user ID |
| **Inspect Grad-CAM++ & Lesion Maps**| Yes | Yes | Yes | No | **AI Service:** Serves signed overlay image links to authorized viewers |
| **Access Clinical Review Queue** | No | No | Yes | No | **AI Service:** Returns cases flagged as referable (Grade 2+) |
| **Submit Clinical Review Findings** | No | No | Yes | No | **AI Service / Doctor Flow:** Confirms or overrides AI severity |
| **Review Staff Verification Requests**| No | No | No | Yes | **Backend:** `authorize('admin')` |
| **Approve / Reject Staff Accounts** | No | No | No | Yes | **Backend:** `authorize('admin')` |
| **Inspect System Audit Logs** | No | No | No | Yes | **Backend:** `authorize('admin')` |

---

## 3. Security Boundary Implementation Requirements

### A. Main Backend Security Boundary
- Validates that requests to `/api/patients/me` match `req.user._id`.
- Guards `/api/v1/patients/:patientId/ai-context` so it cannot be invoked by unauthorized browsers. Only service-to-service calls presenting `X-Internal-Service-Key` or verified staff sessions can access the minimal clinical profile.
- Strips all non-essential PII before returning patient context to the AI service.

### B. AI Service Security Boundary
- Must not allow an unauthenticated browser to invoke deep learning inference.
- Must not allow a user with ID `A` to retrieve screening records belonging to user ID `B` by passing `GET /api/v1/screening/history/B`.
- The AI service must verify a signed token (e.g. JWT signed by the main backend or a short-lived screening authorization token) confirming that the requester owns the session.
