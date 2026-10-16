# RISKS, BLOCKERS & RESOLUTION STRATEGY — DRISHTI (SIH26038)

## 1. Top Five Critical Blockers

### Blocker 1: AI Service Networking & Hardcoded Local IP
- **Problem:** Frontend file `screeningApi.js` is hardcoded to connect directly to `http://192.168.137.145:8000/api/v1/screening/screen`. In external hackathon presentation venues, across different Wi-Fi networks, or on evaluator machines, this IP is completely unreachable, causing total screening failure.
- **Impact:** High. Breaks the core presentation workflow if the AI machine's LAN IP changes or CORS is not configured.
- **Resolution:**
  1. Route requests via an environment variable (`VITE_AI_API_URL`).
  2. Implement a unified Node.js proxy `/api/screenings/process` where Node calls the AI service server-to-server, removing browser CORS and network binding issues.
  3. Include an offline fallback / contract mock mode so the demo remains bulletproof under erratic venue connectivity.

---

### Blocker 2: Missing Backend Screening Persistence & Database Model Void
- **Problem:** `screening.model.js` has broken references (`ref: 'Patient'` instead of `'PatientProfile'`), while `aiResult.model.js` and `fundusImage.model.js` are 0-byte stub files. No screening routes or controllers exist in the Node backend.
- **Impact:** High. Screening results live solely in temporary React state. As soon as the page is refreshed or the patient logs out, the entire screening history is lost.
- **Resolution:** Finalize the consolidated `Screening` Mongoose schema with embedded AI & XAI fields, and deploy `/api/screenings` persistence routes.

---

### Blocker 3: Incomplete Doctor and Healthcare Worker Dashboards
- **Problem:** `DoctorDashboard.tsx` and `HealthcareWorkerDashboard.tsx` are minimal placeholder shells (under 3KB) showing static "Dashboard Under Development" text.
- **Impact:** Critical for SIH. Smart India Hackathon problem statements require a demonstrable multi-role platform. Showing placeholders for doctors and rural health workers directly fails role requirements.
- **Resolution:** Build the Doctor Review Workspace (split-pane fundus + Grad-CAM viewer with triage form) and the Healthcare Worker Assisted Screening & Patient Camp Registration views.

---

### Blocker 4: Storage Pipeline Disconnect (Azure Blob vs. Cloudinary vs. Local)
- **Problem:** Project requirements specify Azure Blob Storage, but the backend lacks the `@azure/storage-blob` SDK. In parallel, the AI developer's test service returns Cloudinary image URLs (`https://res.cloudinary.com/...`).
- **Impact:** Medium-High. Risk of architectural inconsistency or broken image links if Cloudinary quotas expire or Azure credentials are not wired.
- **Resolution:** Establish a clean image URL contract: the backend stores image URLs regardless of whether they originate from Azure Blob Storage or Cloudinary CDN. Document Azure container setup for deployment while accepting valid HTTPS image URLs.

---

### Blocker 5: Schema Duplication & Divergence (`patient.model.js` vs `patientProfile.model.js`)
- **Problem:** Both files exist in `Backend/models/` and register the exact same mongoose model name `'PatientProfile'`, causing confusion and potential runtime collision.
- **Impact:** Medium. Violates code cleanliness, leads to import errors, and complicates foreign key references.
- **Resolution:** Remove redundant duplicate file and standardize imports to `models/patientProfile.model.js`.

---

## 2. Technical Risk Matrix

| Risk | Probability | Severity | Mitigation Strategy |
|---|:---:|:---:|---|
| **AI Inference Latency (Timeout > 60s)** | Medium | High | Use ONNX runtime optimizations, resize image to 1050x1050 before inference, set 120s timeout on client with animated progress steps. |
| **Flaky Wi-Fi at Hackathon Venue** | High | High | Prepare local localhost AI runner instructions and backup cached contract responses so demo never freezes. |
| **Incompatible Fundus Camera Image Formats** | Medium | Medium | Validate MIME types on frontend and backend; convert HEIC/BMP to standard PNG/JPEG before upload. |
| **Overwriting Working Auth Code** | Low | Critical | Strict coding rule: do not touch `auth.controller.js`, `user.model.js`, or `passport.js` unless fixing confirmed bugs. |
