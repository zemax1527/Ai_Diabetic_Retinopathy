# API CONTRACT REVIEW & GAP ANALYSIS — DRISHTI (SIH26038)

## 1. Actual Implemented Endpoints vs. Planned Architecture

The table below contrasts the **actual endpoints discovered in the code** with the required system operations:

| Operation | Current Status & Endpoint | Caller | Owner | Authentication | Authorization | Request Format | Response Format | Problems & Incompatibilities |
|---|---|---|---|---|---|---|---|---|
| **User Registration** | `POST /api/auth/register` *(ACTUAL)* | Frontend Register Form | Express Backend | None (Public) | Public (`patient` active, staff `pending`) | `{ fullName, email, password, role, personalDetails, professionalDetails, verificationDetails }` | `{ status: 'success', user: { id, loginId, fullName, email, role } }` | No centralized body validation schema; uses manual controller checks. |
| **User Login** | `POST /api/auth/login` *(ACTUAL)* | Frontend Login Form | Express Backend | None (Public) | None | `{ loginInput, password }` | Set-Cookie `token`; `{ status: 'success', user: { ... } }` | Rate limiter middleware is missing/inactive. |
| **User Logout** | `POST /api/auth/logout` *(ACTUAL)* | Frontend AuthContext | Express Backend | HTTP-only Cookie | All active authenticated users | Empty body `{}` | Clear-Cookie; `{ status: 'success', message: '...' }` | None. Works as intended. |
| **Current User Session** | `GET /api/auth/me` *(ACTUAL)* | Frontend AuthContext on mount | Express Backend | HTTP-only Cookie | All active authenticated users | None | `{ status: 'success', user: { id, loginId, fullName, email, role } }` | Spec named this `/api/auth/profile`. Route in code is `/api/auth/me`. |
| **Check Email Availability** | `POST /api/auth/check-email` *(ACTUAL)* | Frontend Registration Step | Express Backend | None (Public) | None | `{ email }` | `{ status: 'success', message: 'Email is available' }` | None. |
| **Patient Profile Retrieval** | `GET /api/patients/me` *(ACTUAL)* | Frontend PatientDashboard | Express Backend | HTTP-only Cookie | `patient` | None | `{ success: true, data: { userId, dateOfBirth, gender, address, ... } }` | Envelope format uses `{ success: true, data: ... }` whereas auth uses `{ status: 'success', user: ... }`. |
| **Patient Profile Update** | `PATCH /api/patients/me` *(ACTUAL)* | Frontend ProfileView | Express Backend | HTTP-only Cookie | `patient` | Whitelisted fields: `{ phone, address, diabetesStatus, diabetesDuration }` | `{ success: true, data: { ... } }` | Inconsistent envelope compared to auth. |
| **Field Patient Creation** | *DOES NOT EXIST* | Healthcare Worker | Express Backend | None | Missing | N/A | N/A | Healthcare workers cannot register rural camp patients. |
| **Field Patient Search** | *DOES NOT EXIST* | Healthcare Worker / Doctor | Express Backend | None | Missing | N/A | N/A | Healthcare workers cannot search patients in their district. |
| **Screening Submission** | `POST /api/v1/screening/screen` *(ACTUAL DIRECT AI CALL)* | Frontend `screeningApi.js` | Python FastAPI Service | None | None | Multipart: `user_id`, `file`, `language` | Complex JSON: `{ quality, screening, explainability, lesions }` | Bypasses Express; unauthenticated; results never written to MongoDB; hardcoded LAN IP. |
| **Screening DB Persistence** | *DOES NOT EXIST* | Frontend / Express | Express Backend | None | Missing | N/A | N/A | No `/api/screenings` routes exist. Model stubs are 0 bytes. |
| **Doctor Review Queue** | *DOES NOT EXIST* | Frontend DoctorDashboard | Express Backend | None | Missing | N/A | N/A | No `/api/reviews/queue` route exists. |
| **Clinical Diagnosis & Referral** | *DOES NOT EXIST* | Frontend DoctorDashboard | Express Backend | None | Missing | N/A | N/A | No `/api/reviews/:screeningId` route exists. |
| **Staff Verification List** | `GET /api/v1/admin/verification/pending` *(ACTUAL)* | Frontend AdminDashboard | Express Backend | HTTP-only Cookie | `admin` | None | `{ success: true, count, data: [ ... ] }` | Route uses `/api/v1/admin/...` version prefix while auth does not. |
| **Staff Verification Details** | `GET /api/v1/admin/verification/:userId` *(ACTUAL)* | Frontend AdminDashboard | Express Backend | HTTP-only Cookie | `admin` | None | `{ success: true, data: { user, profile } }` | Works as intended. |
| **Staff Approve Applicant** | `PATCH /api/v1/admin/verification/:userId/approve` *(ACTUAL)* | Frontend AdminDashboard | Express Backend | HTTP-only Cookie | `admin` | None | `{ success: true, data: { _id, loginId, ... } }` | Generates Login ID and activates account. Works as intended. |
| **Staff Reject Applicant** | `PATCH /api/v1/admin/verification/:userId/reject` *(ACTUAL)* | Frontend AdminDashboard | Express Backend | HTTP-only Cookie | `admin` | `{ reason }` | `{ success: true, data: { _id, rejectionReason } }` | Works as intended. |
| **District Admin Analytics** | *DOES NOT EXIST* | Frontend AdminDashboard | Express Backend | None | Missing | N/A | N/A | Admin dashboard displays hardcoded static counts. |

---

## 2. Incompatible Cross-Service Conventions Identified

### A. Response Envelope Inconsistency:
- `auth.controller.js` returns:
  ```json
  { "status": "success", "message": "...", "user": { ... } }
  ```
- `patient.controller.js` and `admin.controller.js` return:
  ```json
  { "success": true, "message": "...", "data": { ... } }
  ```
- `screeningApi.js` (FastAPI) returns raw unwrapped payload:
  ```json
  { "filename": "...", "quality": { ... }, "screening": { ... } }
  ```
*Impact:* Frontend adapters must constantly check `res.data || res.user || res` to avoid runtime crashes.

### B. User Identifier Convention:
- MongoDB User ID: Hexadecimal string `user._id` (e.g. `65f1a23b49e10...`).
- Generated Login ID: Alphanumeric prefix format (e.g. `PAT-8291`, `HW-1042`, `DOC-5510`).
- FastAPI parameter: snake_case `user_id` string.
*Impact:* The frontend sometimes passes `user.id`, sometimes `user._id`, and sometimes `user.loginId`. A standardized mapping rule is required.

### C. Status Enumeration Mismatch:
- In `screening.model.js`: `enum: ['created', 'image_uploaded', 'processing', 'completed', 'failed']`.
- In `screeningAdapter.js` (Frontend): Expects `'completed'`, `'pending_review'`, `'reviewed'`.
- In FastAPI: Returns `screening_status: 'completed'`.
*Impact:* The Mongoose model cannot currently represent screenings that are awaiting doctor review or have completed clinical review.
