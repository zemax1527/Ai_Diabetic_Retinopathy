# SYSTEM ARCHITECTURE — DRISHTI (SIH26038)
*Corrected Architecture: Aligned with Team Responsibility Boundaries*

## 1. Architectural Topology Overview
Drishti operates under a clear, decoupled two-pillar architecture with a unified React frontend:
1. **Main MERN Backend (Port 5000):** System of record for User Identity, Authentication, Role Authorization, Patient Demographics, Staff Verification, and Patient Context Handoff.
2. **AI Screening Service & Screening Database (Port 8000):** System of record for Fundus Image Processing, Optical Quality Assessment, DR Classification, Grad-CAM++ / Lesion XAI, AI Screening Results, and Screening History.

```
+----------------------------------------------------------------------------------------------------+
|                                      REACT FRONTEND APPLICATION                                    |
|                                                                                                    |
|   +------------------------------------+          +--------------------------------------------+   |
|   |        Main Backend Client         |          |             AI Screening Client            |   |
|   |  - Auth (/api/auth)                |          |  - Multipart Screening Submission          |   |
|   |  - Patient Profile (/api/patients) |          |  - Image Quality Feedback                  |   |
|   |  - Staff Verification (/api/admin) |          |  - DR Severity & XAI Heatmap Display       |   |
|   |  - Role Dashboards (Patient, Admin)|          |  - Screening History & Report Retrieval    |   |
|   +-----------------+------------------+          +--------------------+-----------------------+   |
+---------------------|--------------------------------------------------|---------------------------+
                      |                                                  |
                      | HTTP-only Cookie Auth                            | Authenticated Screening
                      | REST APIs                                        | Direct REST / Multipart
                      v                                                  v
+-----------------------------------------+         +--------------------------------------------+
|        MAIN MERN BACKEND (Port 5000)    |         |        AI DEVELOPER SERVICE (Port 8000)    |
|                                         |         |                                            |
| - Express.js + Node.js (CommonJS)       |         | - FastAPI / Python Deep Learning Engine    |
| - JWT Auth & HTTP-only Cookies          | Server  | - Optical Quality Filter (OpenCV)          |
| - RBAC (patient, worker, doctor, admin) |   to    | - 5-Stage DR Classifier + Senanur Ensemble |
| - Patient Profile & Demographics        | Server  | - Grad-CAM++ & Lesion Segmentation         |
| - Staff Verification Workflows          |<------->| - Screening Workflow & Processing Status   |
| - Minimum Patient AI-Context Endpoint   | Signed  | - Screening History & Report Generation    |
|   GET /api/v1/patients/:id/ai-context   | Token   |                                            |
+--------------------+--------------------+         +---------------------+----------------------+
                     |                                                    |
                     v                                                    v
+-----------------------------------------+         +--------------------------------------------+
|           MONGODB ATLAS                 |         |              AI-OWNED DATABASE             |
|                                         |         |                                            |
| - Users (Auth credentials, roles, state)|         | - Screening Sessions & Historical Records  |
| - PatientProfiles (Demographics, health)|         | - Image Quality Scores & Technical Checks  |
| - HealthcareWorkerProfiles (Credentials)|         | - AI Prediction Logs & Probabilities       |
| - DoctorProfiles (Medical licenses)     |         | - XAI Heatmap & Overlay References         |
| - AuditLogs (Administrative actions)    |         |                                            |
| *(NO duplicate screening records)*      |         |                                            |
+-----------------------------------------+         +--------------------------------------------+
                                                                          |
                                                                          v
                                                    +--------------------------------------------+
                                                    |            IMAGE STORAGE SERVICE           |
                                                    |   (Azure Blob Storage / Cloud Bucket)      |
                                                    |                                            |
                                                    | - Raw Fundus Image Binaries                |
                                                    | - Grad-CAM++ Overlay Images                |
                                                    | - Lesion Segmentation Maps                 |
                                                    +--------------------------------------------+
```

---

## 2. Core Service Boundaries

### A. Main MERN Backend Responsibilities
* **Ownership:**
  - User registration, login, logout, password hashing, and session restoration.
  - JWT generation and HTTP-only cookie security (`sameSite: 'lax'`).
  - Role-based authorization enforcement (`patient`, `healthcare_worker`, `doctor`, `admin`).
  - Patient personal, demographic, and medical history data.
  - Professional verification and activation of healthcare workers and doctors.
  - Administrative user and role management.
  - Object-level access control on patient profile data (patients access only their own records).
  - **Patient Context Handoff:** Exposing a secure endpoint (`GET /api/v1/patients/:patientId/ai-context`) delivering the minimum required clinical context (age, gender, diabetes status) without sensitive PII (name, phone, address).
* **Strict Constraint:** The main backend **does not** duplicate screening records, AI results, or XAI heatmaps in MongoDB.

### B. AI Developer Service Responsibilities
* **Ownership:**
  - Ingestion and validation of retinal fundus images.
  - Optical quality assessment (resolution, blur, brightness, contrast, retina visibility, fundus classifier).
  - Diabetic retinopathy severity grading (Grade 0 to 4) with confidence probabilities.
  - Safety ensembling (e.g. Senanur 5-fold ensemble).
  - Explainable AI visual artifacts (Grad-CAM++ heatmaps and UNet lesion segmentation overlays).
  - **Screening Database & History:** The AI developer owns the screening database, session records, screening status, historical result retrieval, and clinical report data.
* **Security Responsibility:** The AI service must authenticate incoming requests, verify that the requester is authorized to view or initiate the screening, and enforce object-level ownership so users cannot access other patients' results.

### C. React Frontend Responsibilities
* **Ownership:**
  - Authentication UI interacting with the main backend (login, registration, pending status).
  - Patient profile management UI.
  - Role-specific dashboard layouts for all four personas.
  - Direct integration with the AI service for screening capture, upload, quality feedback, and results visualization.
  - Displaying screening history retrieved directly from the AI service.
* **Security Constraint:** Never stores privileged AI service secrets or API keys in client code or Vite environment variables.

---

## 3. Communication Patterns

1. **Authentication & Identity Flow:**
   - Client sends credentials to `POST /api/auth/login`.
   - Node backend verifies password, sets HTTP-only cookie `token`, and returns user role.
   - Client uses cookie for all subsequent main backend requests.
2. **Screening Initiation Flow:**
   - Patient or Healthcare Worker initiates screening on the frontend.
   - Frontend captures or selects retinal fundus image.
   - Frontend submits multipart request directly to the AI service endpoint (`POST .../api/v1/screening/screen`) with verified authorization credentials.
   - AI service evaluates image quality; if poor, returns actionable quality feedback immediately.
   - If acceptable, AI service executes inference, generates Grad-CAM++ and lesion overlays, saves the session into the AI-owned database, and returns the result to the frontend.
3. **Clinical Context Handoff (Server-to-Server / Backend):**
   - When the AI service requires patient clinical risk factors (e.g., diabetes duration for risk-adjusted grading), it queries the backend's minimal patient context endpoint (`GET /api/v1/patients/:patientId/ai-context`).
   - The backend validates the service-to-service credential and returns only non-PII clinical fields.
4. **Screening History Flow:**
   - The frontend requests past screenings directly from the AI service's history endpoint, presenting verified user authorization. The AI service filters records by the authenticated user's identifier.
