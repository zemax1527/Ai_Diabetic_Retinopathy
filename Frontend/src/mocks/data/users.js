/**
 * Mock Users — DEMO DATA ONLY
 * All names, emails, and details are entirely fictional.
 * Do not use real patient or staff data.
 */

export const MOCK_USERS = [
  {
    id: 'u-admin-01',
    name: 'Priya Sharma',
    email: 'admin@drishti.demo',
    role: 'admin',
    status: 'active',
    createdAt: '2025-01-15T08:00:00Z',
    lastActiveAt: '2026-09-30T14:22:00Z',
  },
  {
    id: 'u-hw-01',
    name: 'Ramesh Yadav',
    email: 'hw1@drishti.demo',
    role: 'healthcare_worker',
    status: 'active',
    createdAt: '2025-02-01T09:00:00Z',
    lastActiveAt: '2026-10-01T11:30:00Z',
  },
  {
    id: 'u-hw-02',
    name: 'Anjali Mehta',
    email: 'hw2@drishti.demo',
    role: 'healthcare_worker',
    status: 'active',
    createdAt: '2025-03-10T09:00:00Z',
    lastActiveAt: '2026-09-28T16:45:00Z',
  },
  {
    id: 'u-doc-01',
    name: 'Dr. Vikram Nair',
    email: 'doctor1@drishti.demo',
    role: 'doctor',
    status: 'active',
    createdAt: '2025-01-20T10:00:00Z',
    lastActiveAt: '2026-10-02T09:15:00Z',
  },
  {
    id: 'u-doc-02',
    name: 'Dr. Sunita Pillai',
    email: 'doctor2@drishti.demo',
    role: 'doctor',
    status: 'active',
    createdAt: '2025-04-05T10:00:00Z',
    lastActiveAt: '2026-09-25T13:00:00Z',
  },
  {
    id: 'u-pat-01',
    name: 'Gopal Verma',
    email: 'patient@drishti.demo',
    role: 'patient',
    status: 'active',
    createdAt: '2025-06-01T07:00:00Z',
    lastActiveAt: '2026-09-20T08:00:00Z',
  },
  // Extra users for admin user list
  {
    id: 'u-hw-03',
    name: 'Kavitha Rajan',
    email: 'hw3@drishti.demo',
    role: 'healthcare_worker',
    status: 'active',
    createdAt: '2025-05-01T09:00:00Z',
    lastActiveAt: '2026-09-15T10:20:00Z',
  },
  {
    id: 'u-hw-04',
    name: 'Suresh Babu',
    email: 'hw4@drishti.demo',
    role: 'healthcare_worker',
    status: 'disabled',
    createdAt: '2025-06-15T09:00:00Z',
    lastActiveAt: '2026-07-01T09:00:00Z',
  },
  {
    id: 'u-doc-03',
    name: 'Dr. Ananya Bose',
    email: 'doctor3@drishti.demo',
    role: 'doctor',
    status: 'active',
    createdAt: '2025-07-01T10:00:00Z',
    lastActiveAt: '2026-09-29T11:00:00Z',
  },
  {
    id: 'u-pat-02',
    name: 'Meena Iyer',
    email: 'meena.iyer@demo.test',
    role: 'patient',
    status: 'active',
    createdAt: '2025-08-01T07:00:00Z',
    lastActiveAt: '2026-09-18T09:00:00Z',
  },
]

/**
 * Demo credentials for the mock login page.
 * Only shown when VITE_USE_MOCKS=true.
 */
export const DEMO_CREDENTIALS = [
  { role: 'admin',             email: 'admin@drishti.demo',   password: 'demo' },
  { role: 'healthcare_worker', email: 'hw1@drishti.demo',     password: 'demo' },
  { role: 'doctor',            email: 'doctor1@drishti.demo', password: 'demo' },
  { role: 'patient',           email: 'patient@drishti.demo', password: 'demo' },
]
