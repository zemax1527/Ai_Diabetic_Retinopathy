# AI INTEGRATION & PATIENT CONTEXT SPECIFICATION — DRISHTI (SIH26038)
*Corrected AI Integration Architecture & Patient Context Handoff*

## 1. Direct Frontend-to-AI Communication Analysis

### A. Team Architectural Decision
The agreed team architecture confirms that:
1. **The AI developer owns the screening workflow, AI inference, and the associated screening database.**
2. **The React frontend communicates directly with the AI service** for image screening, status polling, results display, and history retrieval.
3. **The main MERN backend does not duplicate screening records in MongoDB.**

### B. Security Requirements for Direct Frontend-to-AI Communication
While direct browser-to-AI communication eliminates server proxy overhead, it is **not automatically secure**. The following controls are mandatory:
1. **User Authentication on AI Service:** The AI service must not accept unauthenticated requests. It must verify the requester's identity (e.g. validating the user's signed token or a short-lived screening authorization token).
2. **Screening Ownership Enforcement:** The AI service must validate that a user requesting `/api/v1/screening/history/:userId` or `/api/v1/screening/result/:screeningId` actually owns those records. A user cannot obtain another patient's results simply by altering an ID in the URL.
3. **No Hardcoded LAN IPs in Production:** `Frontend/.env` must read the AI service URL dynamically via `VITE_AI_API_URL` rather than hardcoding `http://192.168.137.145:8000`.
4. **No Privileged Secrets in Browser:** Privileged administrative tokens or service keys must never be bundled into the client React build.

---

## 2. Patient Context Handoff Specification

### A. Clinical Need vs. PII Minimization
Certain advanced AI features, personalized recommendations, or risk-stratified models benefit from clinical context. However, data privacy standards mandate **strict data minimization**:

| Field in PatientProfile | Relevance to AI Service | Action | Rationale |
|---|---|:---:|---|
| `dateOfBirth` | High | **INCLUDE (as Age)** | DR progression risk correlates with patient age. Derived integer (e.g. 52). |
| `gender` | Medium | **INCLUDE** | Anatomical and epidemiological variations. |
| `diabetesStatus` | High | **INCLUDE** | Baseline clinical prerequisite for diabetic retinopathy grading. |
| `diabetesDuration` | High | **INCLUDE** | Strongest statistical predictor of proliferative DR and microaneurysms. |
| `fullName` | None | **EXCLUDE (PII)** | Irrelevant to computer vision; high privacy risk. |
| `phone` | None | **EXCLUDE (PII)** | Irrelevant to computer vision; high privacy risk. |
| `address` (Village/District) | None | **EXCLUDE (PII)** | Irrelevant to individual retinal inference. |
| `email` | None | **EXCLUDE (PII)** | Identity identifier; must not leave main backend. |
| Passwords / JWT Secrets | None | **EXCLUDE (CRITICAL)** | Security credentials. |

---

## 3. Proposed Backend AI-Context Endpoint

To provide the AI service with approved clinical context without exposing PII, the main backend proposes:

### `GET /api/v1/patients/:patientId/ai-context`

- **Endpoint Purpose:** Serves the minimal, sanitized clinical risk profile of a patient to the AI service.
- **Caller:** AI Service (via authenticated server-to-server call) or authorized clinical staff.
- **Authentication:** Validated via an internal service credential header (`X-Internal-Service-Key: <SECRET>`) or verified staff session.

#### Response Payload (200 OK):
```json
{
  "success": true,
  "patientContext": {
    "patientUid": "PAT-8291",
    "age": 58,
    "gender": "male",
    "diabetesStatus": "yes",
    "diabetesDuration": 12
  }
}
```

#### Operational & Architectural Implications:
- **Service-to-Service vs. Frontend Handoff:**
  - *Option A (Server-to-Server - Recommended):* The AI service queries the main backend using the patient's `patientUid` over an internal LAN/container link when running multi-modal inference. This ensures that clinical parameters cannot be tampered with by client-side browser manipulation.
  - *Option B (Client Attachment):* The frontend passes `age`, `gender`, and `diabetesDuration` along with the image in the multipart payload. While simpler, this trusts the client and allows arbitrary parameter modification unless cryptographically signed.
