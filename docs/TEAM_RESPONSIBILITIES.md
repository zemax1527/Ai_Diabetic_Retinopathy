# TEAM RESPONSIBILITIES & RACI MATRIX — DRISHTI (SIH26038)
*Corrected Team Boundaries: Backend vs. AI Developer vs. Frontend*

## 1. Domain Ownership Division

### A. Main MERN Backend Lead (Node.js / Express / MongoDB)
* **Primary Ownership:**
  - Preserving working authentication, JWT generation, and HTTP-only cookie flows.
  - Role-based authorization middleware (`patient`, `healthcare_worker`, `doctor`, `admin`).
  - Patient profile management, demographic records, and medical histories.
  - Staff professional verification workflows and Admin account management.
  - Enforcing Object-Level Access Control on patient records.
  - Providing the **minimum patient context endpoint** (`GET /api/v1/patients/:patientId/ai-context`).
  - Maintaining patient-to-AI identifier mappings (`loginId` / pseudonymous UID).
* **Explicit Boundary:** Does **not** manage the screening database, duplicate AI results in MongoDB, or run computer vision inference.

### B. AI Developer (FastAPI / PyTorch / ONNX / Screening DB)
* **Primary Ownership:**
  - Fundus image ingestion and optical quality assessment (blur, illumination, contrast, retina visibility).
  - Diabetic retinopathy severity classification (Grades 0–4) and Senanur safety ensembling.
  - Explainable AI generation: Grad-CAM++ attention heatmaps and UNet lesion segmentation overlays.
  - **Screening Database & History:** Storing screening sessions, technical metrics, timestamps, and reports.
  - Serving screening history and detailed diagnostic results to authorized requesters.
  - Implementing AI-side APIs and direct frontend integration contracts.
* **Security Obligation:** Enforcing authentication and access control on the AI service to prevent unauthorized inference and history snooping.

### C. Frontend Lead (React 19 / Tailwind CSS v4)
* **Primary Ownership:**
  - Authentication UI using the main MERN backend (Login, Registration, Pending, Session Restore).
  - Patient profile viewing and editing UI.
  - Role-specific dashboard layouts for Patient, Healthcare Worker, Doctor, and Admin.
  - Screening user experience (camera capture, image uploader, quality feedback, results display).
  - **Direct Frontend-to-AI Integration:** Calling the AI developer's screening API and history endpoints directly according to the agreed security contract.
  - Visualizing Grad-CAM++ heatmaps, lesion overlays, and historical reports.
* **Security Obligation:** Never stores privileged AI service secrets or API keys in client code or `.env` files bundled into the browser.

---

## 2. Updated RACI Responsibility Matrix

| Feature / Architectural Area | Backend Lead | Frontend Lead | AI Developer | Project Mentor |
|---|:---:|:---:|:---:|:---:|
| **User Authentication & Cookies** | **R / A** | C | I | I |
| **Role Authorization & RBAC** | **R / A** | R | I | C |
| **Patient Demographic & Medical Profiles** | **R / A** | C | I | I |
| **Staff Verification & Admin Management** | **R / A** | C | I | C |
| **Patient AI-Context Handoff Endpoint** | **R / A** | I | **C** | I |
| **Fundus Image Quality Assessment** | I | C | **R / A** | I |
| **DR Classification & Safety Ensembling** | I | I | **R / A** | C |
| **Grad-CAM++ & Lesion Segmentation** | I | C | **R / A** | I |
| **Screening Database & Historical Records** | **I (No DB Duplication)** | C | **R / A** | C |
| **Direct Screening API & Ingestion** | I | **R** | **R / A** | C |
| **Screening History & Results UI** | I | **R / A** | C | I |
| **Doctor Review Queue & Workspace** | I | **R** | **R / A** | C |
| **SIH Demonstration Integration** | C | **A** | C | **R** |

*Legend: **R** = Responsible, **A** = Accountable, **C** = Consulted, **I** = Informed*
