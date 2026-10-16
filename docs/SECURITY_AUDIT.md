# SECURITY AUDIT — DRISHTI (SIH26038)

## 1. Executive Summary
This security audit provides an empirical vulnerability assessment of the Drishti codebase across authentication, authorization, session management, network security, and data exposure. 

Findings are strictly classified into:
- **CONFIRMED VULNERABILITY:** Verifiable defect in active source code.
- **SECURITY ARCHITECTURE DEFECT:** Structural omission violating defense-in-depth principles.
- **SECURITY RECOMMENDATION:** Best practice hardening required prior to clinical deployment.

---

## 2. Security Findings Matrix

| Finding ID | Title | Severity | Category | Status |
|---|---|:---:|---|---|
| **SEC-01** | Unauthenticated Direct AI Endpoint Exposure with Arbitrary File Ingestion | **CRITICAL** | Authorization / Network | CONFIRMED |
| **SEC-02** | Total Screening Volatility & Absence of Clinical Audit Trail | **CRITICAL** | Data Integrity / Compliance | CONFIRMED |
| **SEC-03** | Broken Model Reference in Screening Schema (`ref: 'Patient'`) | **HIGH** | Database Integrity | CONFIRMED |
| **SEC-04** | Missing Rate Limiting on Authentication Endpoints (Defunct Middleware) | **HIGH** | Denial of Service / Brute Force | CONFIRMED |
| **SEC-05** | Complete Absence of Healthcare Worker & Doctor Clinical APIs | **HIGH** | Functional Authorization | CONFIRMED |
| **SEC-06** | Insecure Dual Token Handling in Frontend Client (`localStorage` Ambiguity) | **MEDIUM** | Credential Storage | CONFIRMED |
| **SEC-07** | Hardcoded CORS Origin in Backend (`http://localhost:5173`) | **MEDIUM** | Network Security | CONFIRMED |
| **SEC-08** | Inadequate Security Audit Logging on Sensitive Actions | **MEDIUM** | Audit & Accountability | ARCHITECTURAL DEFECT |
| **SEC-09** | Image Storage Infrastructure Divergence (Azure Blob vs Cloudinary) | **MEDIUM** | Infrastructure Security | ARCHITECTURAL DEFECT |
| **SEC-10** | Missing Centralized Request Validation Middleware (Joi/Zod on Express) | **LOW** | Input Validation | RECOMMENDATION |

---

## 3. Detailed Finding Reports

### SEC-01: Unauthenticated Direct AI Endpoint Exposure with Arbitrary File Ingestion
- **Severity:** **CRITICAL**
- **File Path:** `Frontend/src/services/screeningApi.js` (lines 12–55)
- **Evidence:**
  ```javascript
  const AI_API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://192.168.137.145:8000';
  export const SCREENING_ENDPOINT = `${AI_API_BASE_URL}/api/v1/screening/screen`;
  ...
  const response = await fetch(SCREENING_ENDPOINT, {
    method: 'POST',
    body: formData, // user_id, file, language
  });
  ```
- **Why It Matters:**
  1. The Python FastAPI service has **no authentication header, API key, or JWT requirement**.
  2. Any client or malicious entity on the network can spam computationally expensive deep learning inferences (denial-of-service).
  3. The `user_id` is passed as plain text from browser state with zero cryptographic validation by the Express backend.
  4. Bypasses all backend role-based access controls.
- **Recommended Fix:** Mediate screening ingestion through the Node.js backend (`POST /api/screenings`). The backend authenticates the user's HTTP-only cookie, validates role permission (`patient` or `healthcare_worker`), validates file MIME type/size, and forwards the request to the AI service using an authenticated service-to-service header (`X-Internal-Service-Key`).
- **Dependencies:** Backend screening controller, AI service secret configuration.
- **Data Migration Required:** No.

---

### SEC-02: Total Screening Volatility & Absence of Clinical Audit Trail
- **Severity:** **CRITICAL**
- **File Path:** `Frontend/src/pages/dashboards/PatientDashboard.jsx` (lines 74–90) & `Frontend/src/components/patient/screening/PatientScreeningFlow.jsx`
- **Evidence:**
  In `PatientDashboard.jsx`:
  ```javascript
  const handleScreeningCompleted = (newScreeningResult) => {
    setScreenings((prev) => [newScreeningResult, ...prev]);
    setActiveResultDetail(newScreeningResult);
  };
  ```
- **Why It Matters:**
  1. Screening inferences, DR severity classifications, and Grad-CAM heatmaps are held **strictly in client React component state**.
  2. When the user navigates away or refreshes the page, the clinical screening record is permanently erased.
  3. No screening record is written to MongoDB Atlas.
  4. Violates fundamental healthcare record retention standards and renders the Doctor Review workflow impossible.
- **Recommended Fix:** Implement `POST /api/screenings/sync` or unified `POST /api/screenings` in the Node backend. Store screening session records, image URIs, AI classifications, and XAI heatmap links in MongoDB.
- **Dependencies:** `screening.model.js`.
- **Data Migration Required:** No.

---

### SEC-03: Broken Model Reference in Screening Schema (`ref: 'Patient'`)
- **Severity:** **HIGH**
- **File Path:** `Backend/models/screening.model.js` (lines 5–9)
- **Evidence:**
  ```javascript
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  }
  ```
- **Why It Matters:**
  The Mongoose model registered in `models/patientProfile.model.js` is `'PatientProfile'`. There is no `'Patient'` model in the Mongoose registry. Calling `.populate('patientId')` on any screening query will crash the Express application with a `MissingSchemaError`.
- **Recommended Fix:** Change `ref: 'Patient'` to `ref: 'PatientProfile'` (or consolidate models consistently).
- **Dependencies:** `models/screening.model.js`.
- **Data Migration Required:** No.

---

### SEC-04: Missing Rate Limiting on Authentication Endpoints (Defunct Middleware)
- **Severity:** **HIGH**
- **File Path:** `Backend/middleware/rateLimit.middleware.js` (lines 1–19) & `Backend/package.json`
- **Evidence:**
  `Backend/middleware/rateLimit.middleware.js` contains:
  ```javascript
  const rateLimit = require('express-rate-limit');
  ```
  However:
  1. `express-rate-limit` is **missing** from `Backend/package.json` `dependencies`.
  2. `rateLimit.middleware.js` is **never imported or mounted** in `Backend/app.js` or `Backend/routes/auth.routes.js`.
- **Why It Matters:**
  Authentication routes (`/api/auth/login`, `/api/auth/register`, `/api/auth/check-email`) have no rate limiting in active runtime. They are vulnerable to automated brute-force password guessing and email enumeration attacks.
- **Recommended Fix:** Add `express-rate-limit` to `package.json` dependencies and apply the limiter middleware to `auth.routes.js`.
- **Dependencies:** `npm install express-rate-limit`.
- **Data Migration Required:** No.

---

### SEC-05: Complete Absence of Healthcare Worker & Doctor Clinical APIs
- **Severity:** **HIGH**
- **File Path:** `Backend/routes/` and `Backend/controller/`
- **Evidence:**
  Only three route files exist in `Backend/routes/`: `admin.routes.js`, `auth.routes.js`, and `patient.routes.js`.
- **Why It Matters:**
  1. Healthcare workers cannot register or manage field patients.
  2. Doctors have no review queue or clinical diagnosis submission endpoints.
  3. The core triage loop of the SIH problem statement cannot be completed on the backend.
- **Recommended Fix:** Implement `routes/review.routes.js` and extend `routes/patient.routes.js` with field patient registration endpoints guarded by `authorize('healthcare_worker', 'doctor')`.
- **Dependencies:** Phase 1 & Phase 2 roadmap tasks.
- **Data Migration Required:** No.

---

### SEC-06: Insecure Dual Token Handling in Frontend Client (`localStorage` Ambiguity)
- **Severity:** **MEDIUM**
- **File Path:** `Frontend/src/api/client.js` (lines 49–56) & `Frontend/src/context/AuthContext.tsx` (lines 64–74, 256)
- **Evidence:**
  In `client.js`:
  ```javascript
  const storedToken = localStorage.getItem('drishti_auth_token')
  if (storedToken) {
    headers.set('Authorization', `Bearer ${storedToken}`)
  }
  ```
  In `AuthContext.tsx`:
  ```javascript
  saveToken(data.token ?? data.access_token)
  ```
- **Why It Matters:**
  Drishti correctly uses HTTP-only cookies to mitigate XSS-based token theft. Storing tokens in `localStorage` re-introduces XSS token exposure vulnerabilities. While the current backend does not return tokens in the response body, this legacy code creates confusion and risks accidental token leakage.
- **Recommended Fix:** Remove `localStorage` token storage logic entirely and rely solely on `credentials: 'include'` with HTTP-only cookies.
- **Dependencies:** None.
- **Data Migration Required:** No.

---

### SEC-07: Hardcoded CORS Origin in Backend (`http://localhost:5173`)
- **Severity:** **MEDIUM**
- **File Path:** `Backend/app.js` (lines 11–14)
- **Evidence:**
  ```javascript
  app.use(cors({
      origin : 'http://localhost:5173',
      credentials : true
  }))
  ```
- **Why It Matters:**
  Hardcoding `http://localhost:5173` prevents the backend from communicating with frontend builds running on alternative ports, mobile testing hosts, local LAN IPs (e.g. `192.168.x.x`), or staging domains.
- **Recommended Fix:** Bind CORS origin dynamically: `origin: process.env.FRONTEND_URL || 'http://localhost:5173'`.
- **Dependencies:** `Backend/.env`.
- **Data Migration Required:** No.

---

### SEC-08: Inadequate Security Audit Logging on Sensitive Actions
- **Severity:** **MEDIUM**
- **File Path:** `Backend/middleware/logger.middleware.js` & `Backend/controller/admin.controller.js`
- **Evidence:**
  `logger.middleware.js` merely logs `console.log(`${req.method} ${req.url}`)`. Sensitive administrative events (e.g., approving a doctor account, rejecting an applicant, modifying patient data) are not recorded in a persistent database collection.
- **Why It Matters:**
  Healthcare compliance requires non-repudiation and immutable tracking of who granted clinical staff privileges or accessed medical records.
- **Recommended Fix:** Create an `AuditLog` Mongoose model and record all administrative verification events, role changes, and clinical review actions.
- **Dependencies:** MongoDB `AuditLog` collection.
- **Data Migration Required:** No.

---

### SEC-09: Image Storage Infrastructure Divergence (Azure Blob vs Cloudinary)
- **Severity:** **MEDIUM**
- **File Path:** `Backend/package.json` & `Frontend/src/components/patient/screening/PatientScreeningFlow.jsx`
- **Evidence:**
  Specification mandates Azure Blob Storage. However, `@azure/storage-blob` is not installed, and sample AI outputs reference Cloudinary CDN links.
- **Why It Matters:**
  Inconsistent storage design introduces security risks regarding image link expiration, public accessibility of retinal fundus images, and regulatory non-compliance.
- **Recommended Fix:** Define a clear storage contract: raw images and overlays must reside in an authenticated cloud bucket (Azure Blob or secure container) and be served via short-lived signed URLs.
- **Dependencies:** Azure Blob storage credentials.
- **Data Migration Required:** No.

---

### SEC-10: Missing Centralized Request Validation Middleware
- **Severity:** **LOW**
- **File Path:** `Backend/controller/auth.controller.js` & `Backend/controller/admin.controller.js`
- **Evidence:**
  Validation is implemented manually through scattered `if (!field)` checks inside controller functions rather than using a centralized schema validator (e.g., Joi or Zod).
- **Why It Matters:**
  Increases code duplication, risks missing edge-case validations, and produces inconsistent error messages across endpoints.
- **Recommended Fix:** Introduce centralized route validator middleware for incoming request bodies.
- **Dependencies:** Validation library.
- **Data Migration Required:** No.
