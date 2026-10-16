# API CONTRACT SPECIFICATION — DRISHTI (SIH26038)
*Corrected Boundary Contract: Main Backend vs. AI Service Endpoints*

## 1. Main MERN Backend Endpoints (Port 5000)

### A. Authentication Module (`/api/auth`)
Owned entirely by the Node.js backend. Uses HTTP-only cookie authentication.

| Method | Endpoint | Allowed Roles | Request Payload | Response | Status |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | `{ fullName, email, password, role, personalDetails, professionalDetails, verificationDetails }` | `{ status: 'success', user: { id, loginId, fullName, email, role } }` | **CONFIRMED** |
| `POST` | `/api/auth/login` | Public | `{ loginInput, password }` | Set-Cookie `token`; `{ status: 'success', user: { ... } }` | **CONFIRMED** |
| `POST` | `/api/auth/logout` | Authenticated | `{}` | Clear-Cookie; `{ status: 'success' }` | **CONFIRMED** |
| `GET` | `/api/auth/me` | Authenticated | None | `{ status: 'success', user: { id, loginId, fullName, email, role } }` | **CONFIRMED** |
| `POST` | `/api/auth/check-email` | Public | `{ email }` | `{ status: 'success', message: 'Email is available' }` | **CONFIRMED** |
| `GET` | `/api/auth/google` | Public | None | Redirects to Google consent screen | **CONFIRMED** |
| `GET` | `/api/auth/google/callback` | Public | None | Redirects to `${FRONTEND_URL}/auth/google/success` | **CONFIRMED** |

### B. Patient Profile & Field Outreach Module (`/api/patients`)
Manages patient medical history, demographics, and outreach records.

| Method | Endpoint | Allowed Roles | Request Payload | Response | Status |
|---|---|---|---|---|---|
| `GET` | `/api/patients/me` | `patient` | None | `{ success: true, data: { userId, dateOfBirth, gender, address, diabetesStatus, diabetesDuration } }` | **CONFIRMED** |
| `PATCH` | `/api/patients/me` | `patient` | Whitelisted: `{ phone, address, diabetesStatus, diabetesDuration }` | `{ success: true, data: { ... } }` | **CONFIRMED** |
| `POST` | `/api/patients` | `healthcare_worker` | Field patient registration details | `{ success: true, patient: { loginId, ... } }` | **PLANNED** |
| `GET` | `/api/patients` | `healthcare_worker`, `doctor` | Query parameters: `?search=...` | `{ success: true, data: [ ... ] }` | **PLANNED** |

### C. Patient AI-Context Handoff Endpoint (PROPOSED)
Exposed by the main backend to provide the minimum non-PII clinical risk factors required by the AI service.

| Method | Endpoint | Allowed Caller | Purpose & Authorization |
|---|---|---|---|
| `GET` | `/api/v1/patients/:patientId/ai-context` | AI Service (Service-to-Service) or Authenticated Staff | Returns minimum clinical fields (`age`, `gender`, `diabetesStatus`, `diabetesDuration`) using pseudonymous ID. Strips all PII. |

#### Request & Response Specification:
- **Headers:** `X-Internal-Service-Key: <SHARED_SECRET>` or verified authorization token.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "patientContext": {
      "patientUid": "PAT-8291",
      "age": 54,
      "gender": "female",
      "diabetesStatus": "yes",
      "diabetesDuration": 8
    }
  }
  ```
- **Security Rule:** Excludes `fullName`, `email`, `phone`, `address`, password hashes, and identity tokens.

### D. Administrative Verification Module (`/api/v1/admin`)

| Method | Endpoint | Allowed Roles | Description | Status |
|---|---|---|---|---|
| `GET` | `/api/v1/admin/verification/pending` | `admin` | List pending healthcare worker and doctor applications. | **CONFIRMED** |
| `GET` | `/api/v1/admin/verification/:userId` | `admin` | View applicant credentials, degrees, and uploaded documents. | **CONFIRMED** |
| `PATCH` | `/api/v1/admin/verification/:userId/approve` | `admin` | Approve applicant: generates Login ID, activates account (`isActive: true`). | **CONFIRMED** |
| `PATCH` | `/api/v1/admin/verification/:userId/reject` | `admin` | Reject applicant: records rejection reason. | **CONFIRMED** |

---

## 2. AI Screening Service Endpoints (Port 8000)
Owned and implemented by the **AI Developer**. The frontend communicates directly with these endpoints for screening operations.

| Method | Endpoint | Caller | Purpose | Contract Status |
|---|---|---|---|---|
| `POST` | `/api/v1/screening/screen` | Frontend Screening UI | Upload fundus image, perform optical quality check, DR classification, Grad-CAM++, and lesion segmentation. | **EXISTING (Needs Auth Hardening)** |
| `GET` | `/api/v1/screening/history/:userId` | Frontend Patient Dashboard | Retrieve past screening sessions, timestamps, severity grades, and reports for a verified user. | **AI DEVELOPER RESPONSIBILITY** |
| `GET` | `/api/v1/screening/result/:screeningId`| Frontend / Doctor Review | Retrieve comprehensive screening details, technical quality metrics, and visual heatmap/overlay URLs. | **AI DEVELOPER RESPONSIBILITY** |
| `GET` | `/api/v1/screening/queue` | Frontend Doctor Dashboard | Retrieve referable cases (Grade 2+ or safety ensemble triggers) awaiting clinical review. | **AI DEVELOPER RESPONSIBILITY** |

### A. Multipart Screening Request Contract (`POST /api/v1/screening/screen`)
- **Headers:** `Authorization: Bearer <TOKEN>` (or signed screening token).
- **Body (`multipart/form-data`):**
  - `user_id`: string (Verified patient/user identifier)
  - `file`: binary fundus image (PNG/JPEG, max 15MB)
  - `language`: string (e.g. `'English'`, `'Hindi'`, `'Marathi'`)
- **Response Format:**
  ```json
  {
    "filename": "fundus_01.png",
    "user_id": "PAT-8291",
    "screening_status": "completed",
    "quality": {
      "status": "good",
      "score": 1,
      "checks": { "resolution": { "passed": true }, "blur": { "passed": true } },
      "fundus_suitability": { "is_fundus": true, "confidence": 0.999 },
      "screening_ready": true,
      "quality_decision": "accept"
    },
    "screening": {
      "screening_id": "SCR-20261010-9182",
      "classification": {
        "grade": 2,
        "label": "Moderate",
        "confidence": 0.88,
        "probabilities": { "No DR": 0.02, "Mild": 0.05, "Moderate": 0.88, "Severe": 0.03, "Proliferative DR": 0.02 }
      },
      "screening_decision": {
        "decision": "REFERABLE",
        "referable": true,
        "reason": "Moderate Diabetic Retinopathy detected. Ophthalmologist review recommended."
      },
      "explainability": {
        "method": "Grad-CAM++",
        "heatmap_url": "https://.../heatmap.jpg",
        "overlay_url": "https://.../gradcam_overlay.jpg"
      },
      "lesions": {
        "status": "success",
        "lesion_count": 3,
        "overlay_url": "https://.../lesion_overlay.jpg"
      }
    }
  }
  ```
