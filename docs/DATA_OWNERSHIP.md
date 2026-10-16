# DATA OWNERSHIP & BOUNDARY MATRIX — DRISHTI (SIH26038)
*Corrected Responsibility Matrix: Zero Screening Duplication in MongoDB*

## 1. Principles of Data Ownership
1. **Clear Service Separation:** 
   - **Main MERN Backend:** Owns human identities, roles, credentials, demographic profiles, staff licensing documents, and administrative audit logs.
   - **AI Service:** Owns fundus screening sessions, optical quality scores, DR predictions, Grad-CAM++ heatmaps, lesion segmentation outputs, and the permanent screening database.
2. **Zero Duplicate Storage:** The main MongoDB database **must not duplicate** screening sessions, AI predictions, or XAI results owned by the AI developer.
3. **Privacy by Design:** No unnecessary Personally Identifiable Information (PII) like names, phone numbers, or addresses is shared with or stored by the AI service.

---

## 2. Definitive Data Ownership Matrix

| Entity | Primary Model / Service | Source of Truth Database | Primary Writer | Primary Reader | Duplication Policy | Required Cross-Service References | Access Control Requirements |
|---|---|---|---|---|---|---|---|
| **User Identity** | `models/user.model.js` | MongoDB Atlas | Express Backend (`auth.controller.js`) | Express Auth Middleware | **Never duplicated** | `_id`, `loginId` | Self read; Admin verify; Public create (staff pending) |
| **Patient Demographics** | `models/patientProfile.model.js` | MongoDB Atlas | Express Backend (`auth.controller.js`) | Express Backend (`patient.controller.js`) | **Never duplicated** | `userId` -> `User._id` | Patient self read/update; Healthcare Worker (assigned camp) |
| **Healthcare Worker Profile** | `models/healthCare.model.js` | MongoDB Atlas | Express Backend (`auth.controller.js`) | Express Backend (`admin.controller.js`) | **Never duplicated** | `userId` -> `User._id` | Staff self create; Admin read/verify |
| **Doctor Profile** | `models/doctorProfile.model.js` | MongoDB Atlas | Express Backend (`auth.controller.js`) | Express Backend (`admin.controller.js`) | **Never duplicated** | `userId` -> `User._id` | Doctor self create; Admin read/verify |
| **Audit Log** | `models/auditLog.model.js` | MongoDB Atlas | Express Backend | Express Backend | **Never duplicated** | `actorId`, `targetId` | Admin read only |
| **Screening Session** | AI Developer Screening API | **AI-Owned Screening Database** | AI Service | AI Service & React Frontend | **NOT stored in MongoDB** | `user_id` / `patient_uid` | Authorized Patient (own); Doctor (review queue) |
| **Optical Quality Checks** | AI Developer Screening API | **AI-Owned Screening Database** | AI Service (OpenCV) | AI Service & React Frontend | **NOT stored in MongoDB** | `screening_id` | Patient & Healthcare Worker |
| **AI Classification Result** | AI Developer Screening API | **AI-Owned Screening Database** | AI Service (Inference) | AI Service & React Frontend | **NOT stored in MongoDB** | `screening_id` | Patient, Healthcare Worker, Doctor |
| **Explainable AI (XAI) Overlays** | AI Developer Screening API | **AI-Owned Screening Database** | AI Service (Grad-CAM++) | AI Service & React Frontend | **NOT stored in MongoDB** | `screening_id`, `heatmap_url` | Patient, Healthcare Worker, Doctor |
| **Fundus Image Binaries** | Cloud Bucket (Azure / CDN) | Cloud Blob Storage | AI Service / Storage Pipeline | AI Service & Frontend (`<img src>`) | **NOT stored in MongoDB** | `image_url`, `storage_key` | Authenticated users only; short-lived signed URLs |

---

## 3. Existing Code Cleanup & Alignment Actions

### A. Deprecate Backend Screening Models
Because the AI developer owns the screening workflow and database:
1. `Backend/models/screening.model.js`: Retaining this as an active Mongoose model creates an architectural conflict and duplicate database writes. It must be retired or marked deprecated so the main backend does not attempt duplicate storage.
2. `Backend/models/aiResult.model.js`, `models/fundusImage.model.js`, `models/xAiResult.model.js`: Currently 0-byte stub files. They must **not** be populated into MongoDB collections.
3. `Backend/models/patient.model.js`: Identical duplicate of `patientProfile.model.js`. Consolidate onto `models/patientProfile.model.js` and delete the redundant file.

### B. Patient Identifier Mapping
- The main backend identifies patients via MongoDB `_id` and alphanumeric `loginId` (e.g. `PAT-8291`).
- The AI service accepts `user_id` (string).
- **Mapping Standard:** The frontend passes the verified `loginId` or pseudonymous patient identifier to the AI service. If the AI service needs clinical context, it calls the main backend with this identifier.
