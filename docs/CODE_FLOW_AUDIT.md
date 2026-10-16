# CODE FLOW AUDIT — DRISHTI (SIH26038)

## 1. Audit Scope & Objective
This audit analyzes the end-to-end runtime request execution flow across all five primary application workflows:
- **Workflow A:** Registration & Authentication Flow
- **Workflow B:** Patient Management Flow
- **Workflow C:** Screening & AI Processing Flow
- **Workflow D:** Doctor Clinical Review & Referral Flow
- **Workflow E:** Administrator & Verification Flow

---

## 2. Detailed Workflow Tracing

### Workflow A: Registration and Login Flow

```
[Browser / React Form]
       |
       +---> [src/api/client.js (POST)]
                  |
                  v
       [Backend: Express 5 app.js]
                  |
                  v
       [routes/auth.routes.js -> controller/auth.controller.js]
                  |
                  +---> userRegistration() / userLogin()
                             |
                             +---> userModel.create() / userModel.findOne()
                             |        |
                             |        +---> MongoDB Atlas 'User' Collection
                             |
                             +---> Role Profile Creation ('PatientProfile', 'HealthcareWorkerProfile', 'DoctorProfile')
                             |
                             +---> res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: prod })
                             |
                             v
[Browser receives Set-Cookie & JSON envelope]
       |
       v
[src/context/AuthContext.tsx updates user state in memory]
       |
       v
[src/App.tsx RoleRoute evaluates user.role and renders Role Dashboard]
```

#### Detailed Inspection Findings for Workflow A:
1. **Registration Path:**
   - Client sends POST payload to `/api/auth/register`.
   - Controller `userRegistration` enforces password complexity (regex check in controller lines 18-48 and model lines 52-71).
   - If `role === 'patient'`: Creates User with `verificationStatus: 'not_required'` and `isActive: true`, creates `PatientProfile`, issues JWT in HTTP-only cookie, and logs patient in immediately.
   - If `role === 'healthcare_worker'` or `role === 'doctor'`: Creates User with `verificationStatus: 'pending'` and `isActive: false`, creates respective profile, does **not** issue auth cookie, and prompts user to wait for administrative approval.
   - Role `'admin'` is strictly rejected from public registration.
2. **Login Path:**
   - Client sends POST payload to `/api/auth/login` containing `loginInput` (accepts either Email or uppercase Login ID) and `password`.
   - Controller retrieves user via `.select('+password')`, calls `user.comparePassword()`.
   - Crucial check in `auth.controller.js` line 517: `if (!user.isActive) throw new AppError('Your account is pending admin approval...', 403)`. Unverified staff accounts are blocked from logging in.
   - On success, sets HTTP-only cookie `token` (7 days expiry) and returns sanitized user object `{ id, loginId, fullName, email, role }`.
3. **Session Restoration (`GET /api/auth/me`):**
   - Frontend `AuthContext.tsx` on initial mount dispatches `GET /api/auth/me`.
   - Backend `auth.middleware.js` decodes cookie, verifies JWT against `process.env.JWT_KEY`, validates `user.isActive`, attaches `req.user`, and returns user state.
   - **Discrepancy:** The route implemented is `/api/auth/me`. The specification refers to `/api/auth/profile`. `/api/auth/profile` does not exist in the backend.

---

### Workflow B: Patient Management Flow

```
[Patient UI]                             [Backend: Node / Express]
     |                                               |
     | GET /api/patients/me                          |
     +---------------------------------------------->| routes/patient.routes.js
                                                     | -> patientController.getMyProfile
                                                     |    -> PatientProfile.findOne({ userId: req.user._id })
     |                                               |
     | PATCH /api/patients/me                        |
     +---------------------------------------------->| patientController.updateMyProfile
                                                          -> PatientProfile.findOneAndUpdate()
```

#### Detailed Inspection Findings for Workflow B:
1. **Self-Management Works Correctly:**
   - Patients can inspect and update their own demographics via `/api/patients/me`.
   - Object-level security is enforced natively because queries filter by `req.user._id`.
   - `updateMyProfile` restricts updates to a strict whitelist: `['dateOfBirth', 'gender', 'phone', 'address', 'diabetesStatus', 'diabetesDuration']`.
2. **Healthcare Worker Field Management is COMPLETELY MISSING:**
   - There are **no routes or controllers** for healthcare workers to:
     - Register an offline/camp patient.
     - Search patients by name, phone, or village ID.
     - Access a patient's historical profile.
   - The only patient endpoints in `Backend/routes/patient.routes.js` are strictly guarded by `authorize('patient')`, meaning healthcare workers receive `403 Access denied` if they attempt to call `/api/patients/me`.

---

### Workflow C: Screening and AI Processing Flow

```
                                  [ACTUAL IMPLEMENTED PATH]

[Browser: PatientScreeningFlow.jsx]
       |
       |  1. Submits Fundus Image Multipart Directly to LAN Python Service
       v  (POST http://192.168.137.145:8000/api/v1/screening/screen)
[External FastAPI AI Service]
       |
       |  2. OpenCV Quality Check + EfficientNet DR Classifier + Grad-CAM++
       v
[Browser receives complete AI result]
       |
       |  3. Result stored ONLY in React Component State
       v
[Result displayed in ScreeningResult.jsx]
       |
       X  CRITICAL BREAK: Data is NEVER sent to Node.js backend.
       X  CRITICAL BREAK: Data is NEVER written to MongoDB.
       X  On page refresh, the entire screening is LOST.
```

#### Detailed Inspection Findings for Workflow C:
1. **Severe Architectural Disconnect:**
   - The frontend (`screeningApi.js`) completely bypasses the Express backend.
   - No backend authorization is performed prior to deep learning execution.
   - The AI service does not authenticate the request.
   - The Node backend has no `screening.routes.js` or `screening.controller.js`.
2. **Data Model Collapse:**
   - `Backend/models/screening.model.js` exists as a 43-line stub with an invalid foreign key: `ref: 'Patient'` (should be `'PatientProfile'`).
   - `models/aiResult.model.js`, `models/fundusImage.model.js`, and `models/xAiResult.model.js` are empty 0-byte files.
   - Neither MongoDB nor the AI service persists a link between the user's permanent MongoDB ID and the screening event.

---

### Workflow D: Doctor Clinical Review Flow

```
[DoctorDashboard.tsx]
       |
       v
Static Placeholder: "Dashboard Under Development"
       |
       X  NO review queue endpoint exists in Node backend.
       X  NO review controller or submission route exists in Node backend.
       X  NO referral dispatch mechanism exists.
```

#### Detailed Inspection Findings for Workflow D:
1. **Review Flow is 0% Implemented:**
   - The backend contains no endpoints matching `/api/reviews/*`, `/api/screenings/:id/review`, or `/api/screenings/triage`.
   - `DoctorDashboard.tsx` renders static summary cards with mock dashes (`—`) and a notice that clinical review is not yet available.
   - Doctors have no mechanism to review AI inferences or record professional findings.

---

### Workflow E: Administrator & Verification Flow

```
[AdminDashboard.tsx]
       |
       +---> GET /api/v1/admin/verification/pending
       |        |
       |        v
       |     Backend: admin.controller.js -> userModel.find({ verificationStatus: 'pending' })
       |
       +---> GET /api/v1/admin/verification/:userId
       |        |
       |        v
       |     Backend: fetches User + HealthcareWorkerProfile / DoctorProfile
       |
       +---> PATCH /api/v1/admin/verification/:userId/approve
       |        |
       |        v
       |     Backend: sets verificationStatus='approved', isActive=true, generates LoginID
       |
       +---> PATCH /api/v1/admin/verification/:userId/reject
                |
                v
             Backend: sets verificationStatus='rejected', isActive=false
```

#### Detailed Inspection Findings for Workflow E:
1. **Verification Logic is Functional & Secure:**
   - Admin verification APIs in `routes/admin.routes.js` are guarded by `authMiddleware` and `authorize('admin')`.
   - Prevent unauthorized state mutations (cannot approve already approved users, cannot approve patient accounts, cannot alter admin accounts).
2. **Missing Administrative Analytics:**
   - System analytics cards on `AdminDashboard.tsx` ("Total Users", "Active Sessions") display hardcoded static values.
   - No backend routes exist for aggregated district statistics or system activity logs.
