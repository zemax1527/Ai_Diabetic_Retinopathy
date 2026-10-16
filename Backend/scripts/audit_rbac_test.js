const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const userModel = require('../models/user.model');
const PatientProfile = require('../models/patientProfile.model');
const Screening = require('../models/screening.model');

async function runRBACTests() {
  console.log('=== Starting RBAC & Resource-Level Authorization Tests ===\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on port ${port}\n`);

  const suffix = Date.now();
  const createdUserIds = [];
  const createdScreeningIds = [];

  try {
    // 1. Create Patient 1
    const patient1 = await userModel.create({
      fullName: { firstName: 'Patient', lastName: 'One' },
      email: `pat1_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true
    });
    createdUserIds.push(patient1._id);
    const patProfile1 = await PatientProfile.create({
      userId: patient1._id,
      phone: '9999900001',
      gender: 'male',
      address: { district: 'District-A' }
    });
    const patient1Token = patient1.generateAuthToken();

    // 2. Create Patient 2
    const patient2 = await userModel.create({
      fullName: { firstName: 'Patient', lastName: 'Two' },
      email: `pat2_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true
    });
    createdUserIds.push(patient2._id);
    const patProfile2 = await PatientProfile.create({
      userId: patient2._id,
      phone: '9999900002',
      gender: 'female',
      address: { district: 'District-B' }
    });
    const patient2Token = patient2.generateAuthToken();

    // 3. Create Doctor
    const doctor = await userModel.create({
      fullName: { firstName: 'Dr.', lastName: 'Tester' },
      email: `doc_${suffix}@test.com`,
      password: 'Password@123',
      role: 'doctor',
      verificationStatus: 'approved',
      isActive: true
    });
    createdUserIds.push(doctor._id);
    const doctorToken = doctor.generateAuthToken();

    // 4. Create Healthcare Worker
    const hcw = await userModel.create({
      fullName: { firstName: 'Worker', lastName: 'Tester' },
      email: `hcw_${suffix}@test.com`,
      password: 'Password@123',
      role: 'healthcare_worker',
      verificationStatus: 'approved',
      isActive: true
    });
    createdUserIds.push(hcw._id);
    const hcwToken = hcw.generateAuthToken();

    // 5. Create Admin
    const admin = await userModel.create({
      fullName: { firstName: 'Admin', lastName: 'Tester' },
      email: `admin_${suffix}@test.com`,
      password: 'Password@123',
      role: 'admin',
      verificationStatus: 'not_required',
      isActive: true
    });
    createdUserIds.push(admin._id);
    const adminToken = admin.generateAuthToken();

    // 6. Create Screenings for Patient 1 and Patient 2
    const screening1 = await Screening.create({
      patientId: patProfile1._id,
      userId: patient1._id,
      status: 'completed',
      screeningReferenceId: `SCR-1-${suffix}`,
      aiResult: { grade: 0, label: 'No DR' }
    });
    createdScreeningIds.push(screening1._id);

    const screening2 = await Screening.create({
      patientId: patProfile2._id,
      userId: patient2._id,
      status: 'pending_review',
      screeningReferenceId: `SCR-2-${suffix}`,
      aiResult: { grade: 2, label: 'Moderate DR', screeningDecision: { referable: true } }
    });
    createdScreeningIds.push(screening2._id);

    console.log('Fixtures initialized. Running test cases...\n');

    // ─── TEST 1: Unauthenticated Requests ───
    {
      const endpoints = [
        ['/api/patients/me', 401],
        ['/api/v1/patients/me', 401],
        ['/api/screenings/my', 401],
        ['/api/v1/screenings/my', 401],
        ['/api/reviews/queue', 401],
        ['/api/v1/admin/verification/pending', 401]
      ];
      for (const [ep, expectedStatus] of endpoints) {
        const res = await fetch(`${baseUrl}${ep}`);
        const pass = res.status === expectedStatus;
        console.log(`TEST 1 [Unauthenticated] GET ${ep}: Status ${res.status} [${pass ? 'PASS' : 'FAIL'}]`);
      }
    }

    // ─── TEST 2: Patient accessing own profile ───
    {
      const res = await fetch(`${baseUrl}/api/patients/me`, {
        headers: { Cookie: `token=${patient1Token}` }
      });
      const data = await res.json();
      const pass = res.status === 200 && data.data?.userId?._id === patient1._id.toString();
      console.log(`\nTEST 2a [Patient own profile] GET /api/patients/me: Status ${res.status} [${pass ? 'PASS' : 'FAIL'}]`);

      // PATCH /api/patients/me
      const patchRes = await fetch(`${baseUrl}/api/patients/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patient1Token}`
        },
        body: JSON.stringify({ phone: '9999988888', diabetesStatus: 'yes' })
      });
      const patchData = await patchRes.json();
      const patchPass = patchRes.status === 200 && patchData.data?.phone === '9999988888';
      console.log(`TEST 2b [Patient update profile] PATCH /api/patients/me: Status ${patchRes.status} [${patchPass ? 'PASS' : 'FAIL'}]`);
    }

    // ─── TEST 3: Patient attempting to access another patient's profile ───
    {
      // Patient 1 tries to access Patient 2 via /api/patients/:patientId
      const res = await fetch(`${baseUrl}/api/patients/${patient2._id}`, {
        headers: { Cookie: `token=${patient1Token}` }
      });
      const pass = res.status === 403;
      console.log(`\nTEST 3a [IDOR Prevention] Patient 1 accessing Patient 2 profile: Status ${res.status} [${pass ? 'PASS' : 'FAIL'}]`);

      // Same via /api/v1
      const resV1 = await fetch(`${baseUrl}/api/v1/patients/${patient2._id}`, {
        headers: { Cookie: `token=${patient1Token}` }
      });
      const passV1 = resV1.status === 403;
      console.log(`TEST 3b [IDOR Prevention /api/v1] Patient 1 accessing Patient 2 profile: Status ${resV1.status} [${passV1 ? 'PASS' : 'FAIL'}]`);
    }

    // ─── TEST 4: Patient accessing screening history & IDOR checks ───
    {
      // Patient 1 getMyScreenings -> only screening1
      const res = await fetch(`${baseUrl}/api/screenings/my`, {
        headers: { Cookie: `token=${patient1Token}` }
      });
      const data = await res.json();
      const onlyOwn = data.data?.length === 1 && data.data[0]._id === screening1._id.toString();
      console.log(`\nTEST 4a [Patient own screenings] GET /api/screenings/my: Count ${data.data?.length} [${onlyOwn ? 'PASS' : 'FAIL'}]`);

      // Patient 1 accessing their own screening by ID -> 200
      const ownRes = await fetch(`${baseUrl}/api/screenings/${screening1._id}`, {
        headers: { Cookie: `token=${patient1Token}` }
      });
      console.log(`TEST 4b [Patient own screening by ID] GET /api/screenings/:id: Status ${ownRes.status} [${ownRes.status === 200 ? 'PASS' : 'FAIL'}]`);

      // Patient 1 accessing Patient 2's screening by ID -> 403 Forbidden!
      const idorRes = await fetch(`${baseUrl}/api/screenings/${screening2._id}`, {
        headers: { Cookie: `token=${patient1Token}` }
      });
      console.log(`TEST 4c [Patient IDOR forbidden] Patient 1 accessing Screening 2: Status ${idorRes.status} [${idorRes.status === 403 ? 'PASS' : 'FAIL'}]`);

      // Patient 1 attempting /api/screenings/patient/:patientId -> 403 Forbidden!
      const patientListRes = await fetch(`${baseUrl}/api/screenings/patient/${patient2._id}`, {
        headers: { Cookie: `token=${patient1Token}` }
      });
      console.log(`TEST 4d [Patient accessing patient screening list] Status ${patientListRes.status} [${patientListRes.status === 403 ? 'PASS' : 'FAIL'}]`);
    }

    // ─── TEST 5: Doctor accessing prohibited endpoints ───
    {
      // Doctor accessing patient-only /api/patients/me -> 403
      const res1 = await fetch(`${baseUrl}/api/patients/me`, {
        headers: { Cookie: `token=${doctorToken}` }
      });
      console.log(`\nTEST 5a [Doctor prohibited] GET /api/patients/me: Status ${res1.status} [${res1.status === 403 ? 'PASS' : 'FAIL'}]`);

      // Doctor accessing admin-only /api/admin/verification/pending -> 403
      const res2 = await fetch(`${baseUrl}/api/admin/verification/pending`, {
        headers: { Cookie: `token=${doctorToken}` }
      });
      console.log(`TEST 5b [Doctor prohibited] GET /api/admin/verification/pending: Status ${res2.status} [${res2.status === 403 ? 'PASS' : 'FAIL'}]`);

      // Doctor accessing authorized /api/reviews/queue -> 200
      const res3 = await fetch(`${baseUrl}/api/reviews/queue`, {
        headers: { Cookie: `token=${doctorToken}` }
      });
      console.log(`TEST 5c [Doctor permitted] GET /api/reviews/queue: Status ${res3.status} [${res3.status === 200 ? 'PASS' : 'FAIL'}]`);
    }

    // ─── TEST 6: Healthcare Worker accessing prohibited endpoints ───
    {
      // HCW accessing patient-only /api/patients/me -> 403
      const res1 = await fetch(`${baseUrl}/api/patients/me`, {
        headers: { Cookie: `token=${hcwToken}` }
      });
      console.log(`\nTEST 6a [HCW prohibited] GET /api/patients/me: Status ${res1.status} [${res1.status === 403 ? 'PASS' : 'FAIL'}]`);

      // HCW accessing doctor-only /api/reviews/queue -> 403
      const res2 = await fetch(`${baseUrl}/api/reviews/queue`, {
        headers: { Cookie: `token=${hcwToken}` }
      });
      console.log(`TEST 6b [HCW prohibited] GET /api/reviews/queue: Status ${res2.status} [${res2.status === 403 ? 'PASS' : 'FAIL'}]`);

      // HCW accessing admin-only /api/admin/audit-logs -> 403
      const res3 = await fetch(`${baseUrl}/api/admin/audit-logs`, {
        headers: { Cookie: `token=${hcwToken}` }
      });
      console.log(`TEST 6c [HCW prohibited] GET /api/admin/audit-logs: Status ${res3.status} [${res3.status === 403 ? 'PASS' : 'FAIL'}]`);
    }

    // ─── TEST 7: Non-admin attempting admin operations ───
    {
      // Patient attempting /api/v1/admin/analytics/overview -> 403
      const res1 = await fetch(`${baseUrl}/api/v1/admin/analytics/overview`, {
        headers: { Cookie: `token=${patient1Token}` }
      });
      console.log(`\nTEST 7a [Patient prohibited] GET /api/v1/admin/analytics/overview: Status ${res1.status} [${res1.status === 403 ? 'PASS' : 'FAIL'}]`);

      // Doctor attempting /api/v1/admin/analytics/overview -> 403
      const res2 = await fetch(`${baseUrl}/api/v1/admin/analytics/overview`, {
        headers: { Cookie: `token=${doctorToken}` }
      });
      console.log(`TEST 7b [Doctor prohibited] GET /api/v1/admin/analytics/overview: Status ${res2.status} [${res2.status === 403 ? 'PASS' : 'FAIL'}]`);

      // HCW attempting approval endpoint -> 403
      const res3 = await fetch(`${baseUrl}/api/v1/admin/verification/${patient1._id}/approve`, {
        method: 'PATCH',
        headers: { Cookie: `token=${hcwToken}` }
      });
      console.log(`TEST 7c [HCW prohibited] PATCH /api/v1/admin/verification/:id/approve: Status ${res3.status} [${res3.status === 403 ? 'PASS' : 'FAIL'}]`);
    }

    // ─── TEST 8: Admin accessing authorized endpoints ───
    {
      const res1 = await fetch(`${baseUrl}/api/admin/verification/pending`, {
        headers: { Cookie: `token=${adminToken}` }
      });
      console.log(`\nTEST 8a [Admin permitted] GET /api/admin/verification/pending: Status ${res1.status} [${res1.status === 200 ? 'PASS' : 'FAIL'}]`);

      const res2 = await fetch(`${baseUrl}/api/v1/admin/analytics/overview`, {
        headers: { Cookie: `token=${adminToken}` }
      });
      console.log(`TEST 8b [Admin permitted] GET /api/v1/admin/analytics/overview: Status ${res2.status} [${res2.status === 200 ? 'PASS' : 'FAIL'}]`);

      const res3 = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
        headers: { Cookie: `token=${adminToken}` }
      });
      console.log(`TEST 8c [Admin permitted] GET /api/v1/admin/audit-logs: Status ${res3.status} [${res3.status === 200 ? 'PASS' : 'FAIL'}]`);
    }

    // ─── TEST 9: Authorization Bearer header support ───
    {
      const res = await fetch(`${baseUrl}/api/patients/me`, {
        headers: { Authorization: `Bearer ${patient1Token}` }
      });
      console.log(`\nTEST 9 [Bearer Token Support] GET /api/patients/me: Status ${res.status} [${res.status === 200 ? 'PASS' : 'FAIL'}]`);
    }

  } finally {
    console.log('\nCleaning up fixtures...');
    if (createdUserIds.length > 0) {
      await userModel.deleteMany({ _id: { $in: createdUserIds } });
      await PatientProfile.deleteMany({ userId: { $in: createdUserIds } });
      await Screening.deleteMany({ _id: { $in: createdScreeningIds } });
    }
    await mongoose.disconnect();
    server.close();
    console.log('Test suite completed and DB disconnected.\n');
  }
}

runRBACTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
