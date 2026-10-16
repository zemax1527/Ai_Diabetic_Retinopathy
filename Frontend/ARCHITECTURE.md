# UI Architecture Summary

## Stack
- React + JavaScript + Vite
- Tailwind CSS
- React Router
- TanStack Query (server state)
- react-hook-form + zod (forms)
- Recharts (charts)
- lucide-react (icons)

## Core Decisions
- **One app shell, four role configurations**: A single AppShell (sidebar on desktop, bottom tab bar plus drawer on mobile) reads a navConfig keyed by role. There are no four separate apps.
- **Feature-based folders**: `features/auth`, `patients`, `screening`, `ai-xai`, `review`, `admin`, `analytics`. Shared UI primitives live in `components/ui`, and clinical components in `components/clinical`.
- **API layer with swappable adapter**: Components never call fetch or mock data directly. They call hooks, which call `api/*` services, which call either the http adapter or the mock adapter, selected by `VITE_USE_MOCKS`. All endpoints are marked provisional.
- **Screening Workflow**: A single wizard route, not many pages. The healthcare worker never leaves it between "select eye" and "screening summary".
- **Patient Profile vs. Screening Details**: The profile is a person with a history. Details are one event, containing AI Analysis and Clinical Review as visibly separate sections.
- **Doctor Review Workspace**: A split-pane workspace. Image and XAI sit on the left, and the AI Analysis and Clinical Review form on the right, all reached directly from the queue.
- **Admin**: Split into System Administration and Analytics. Admin never sees fundus images or clinical detail. Analytics is aggregated only.
- **Frontend Route Guards**: UX only. Auth uses HTTP-only cookies, with no tokens in localStorage. The backend is the security boundary, and the UI handles 401/403 gracefully.
- **No Faked Progress**: Processing shows a generic indicator unless the API returns a stages array. Quality results come from the API, never from client-side guessing.

---

# Page / Route Inventory

| Area | Route | Page / Purpose |
| --- | --- | --- |
| Public | `/` | Landing page |
| Public | `/login` | Login |
| Public | `/register` | Registration (default role: patient) |
| Public | `/forgot-password` | Request reset |
| Public | `/reset-password/:token` | Set new password |
| System | `/app` | Redirects to the role home |
| System | `/unauthorized` | Permission denied page |
| System | `*` | 404 |
| Shared | `/{role}/settings`<br>`/{role}/help`<br>`/{role}/profile` | Settings, help, profile (notifications are a header drawer, not a route) |
| Patient | `/patient` | Dashboard: latest result, follow-up status |
| Patient | `/patient/screenings` | History |
| Patient | `/patient/screenings/:id` | Details (AI result, XAI, follow-up/referral) |
| Healthcare Worker | `/healthcare-worker` | Dashboard: quick actions, pending actions |
| Healthcare Worker | `/healthcare-worker/patients` | List and search |
| Healthcare Worker | `/healthcare-worker/patients/new` | Register patient |
| Healthcare Worker | `/healthcare-worker/patients/:patientId` | Profile with tabs: Overview, Screenings, Follow-up |
| Healthcare Worker | `/healthcare-worker/patients/:patientId/screen` | Screening wizard |
| Healthcare Worker | `/healthcare-worker/screenings` | Screening list |
| Healthcare Worker | `/healthcare-worker/screenings/:id` | Screening details |
| Healthcare Worker | `/healthcare-worker/pending` | Pending actions (retakes, incomplete, awaiting review) |
| Doctor | `/doctor` | Dashboard: pending reviews first |
| Doctor | `/doctor/queue` | Review queue (filter and sort by urgency) |
| Doctor | `/doctor/review/:screeningId` | Review workspace |
| Doctor | `/doctor/patients` | Patient list |
| Doctor | `/doctor/patients/:patientId` | Patient profile |
| Doctor | `/doctor/screenings` | History |
| Doctor | `/doctor/follow-ups` | Follow-ups and referrals tracker |
| Admin | `/admin` | Dashboard |
| Admin | `/admin/users` | Users, with tabs: All, Healthcare Workers, Doctors, Patients |
| Admin | `/admin/users/:id` | User details (change role, status) |
| Admin | `/admin/roles` | Role definitions and permission matrix, role-change history |
| Admin | `/admin/screenings` | Aggregated screening statistics (no PHI) |
| Admin | `/admin/analytics` | Tabs: Overview, District |
| Admin | `/admin/system-activity` | Audit/activity log |

**Note on Routes**: Forgot/reset states, notifications (drawer), confirmation dialogs, image viewer fullscreen (dialog), healthcare worker and doctor management (filtered tabs on Users), screening steps (wizard state), clinical review form (panel inside the workspace) are not separate routes. District analytics is currently under Admin but structured to be easily moved to a separate "District Official" role later.

---

# User Flows

## Patient
Login → `/patient` → see the latest screening card and follow-up status → open History → open Screening Details → read the AI Analysis card (labelled "decision support"), the XAI viewer, and the Clinical Review status, with a plain-language note about next steps. Read-only. The patient never sees other patients.

## Healthcare Worker (primary flow)
Login → Dashboard → "Start Screening" or search → find patient, or Register Patient → Patient Profile → "New Screening" → wizard:
1. Select eye (left/right)
2. Capture or upload
3. Preview
4. Submit for quality check (If failed, show the reason and a retake or re-upload action. If passed, continue.)
5. Upload and processing
6. AI Analysis result
7. XAI viewer
8. Screening Summary
9. Choose the next action (send for doctor review, record routine follow-up, or flag urgent), then complete.

At the end, the worker can start the other eye or return to the patient.

## Doctor
Login → Dashboard (pending reviews at the top) → select a screening → Review Workspace (patient strip, fundus image, AI Analysis, XAI, Clinical Review form, Triage, Follow-up/Referral) → "Complete Review" with confirmation → the next screening in the queue is offered. Follow-ups are tracked at `/doctor/follow-ups`.

## Admin
Login → Dashboard (user counts, activity, screening volume) → Users → User Details → change role or status (confirmation dialog, with audit note) → Roles (matrix) → Analytics (Overview, District) → System Activity.
