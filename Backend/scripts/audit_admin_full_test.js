const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const userModel = require('../models/user.model');
const DoctorProfile = require('../models/doctorProfile.model');
const HealthcareWorkerProfile = require('../models/healthCare.model');
const AuditLog = require('../models/auditLog.model');

async function runAdminAuditTests() {
  console.log('===============================================================');
  console.log('=== PHASE 7: 20-SCENARIO ADMIN & RBAC VERIFICATION TEST SUITE ===');
  console.log('===============================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Ephemeral test server running at ${baseUrl}\n`);

  const ts = Date.now();
  const createdUserIds = [];

  try {
    // ── Fixture Creation ────────────────────────────────────────────────────
    // 1. Active Admin
    const activeAdmin = await userModel.create({
      fullName: { firstName: 'Super', lastName: 'Admin' },
      email: `active_admin_${ts}@test.com`,
      password: 'AdminPassword@123',
      role: 'admin',
      verificationStatus: 'not_required',
      isActive: true
    });
    createdUserIds.push(activeAdmin._id);
    const adminToken = activeAdmin.generateAuthToken();

    // 2. Inactive Admin
    const inactiveAdmin = await userModel.create({
      fullName: { firstName: 'Disabled', lastName: 'Admin' },
      email: `inactive_admin_${ts}@test.com`,
      password: 'AdminPassword@123',
      role: 'admin',
      verificationStatus: 'not_required',
      isActive: false
    });
    createdUserIds.push(inactiveAdmin._id);

    // 3. Active Patient
    const patientUser = await userModel.create({
      fullName: { firstName: 'Active', lastName: 'Patient' },
      email: `patient_${ts}@test.com`,
      password: 'PatientPassword@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true
    });
    createdUserIds.push(patientUser._id);
    const patientToken = patientUser.generateAuthToken();

    // 4. Active Doctor
    const doctorUser = await userModel.create({
      fullName: { firstName: 'Dr.', lastName: 'Active' },
      email: `doctor_${ts}@test.com`,
      password: 'DoctorPassword@123',
      role: 'doctor',
      verificationStatus: 'approved',
      isActive: true
    });
    createdUserIds.push(doctorUser._id);
    const doctorToken = doctorUser.generateAuthToken();

    // 5. Active Healthcare Worker
    const hcwUser = await userModel.create({
      fullName: { firstName: 'Worker', lastName: 'Active' },
      email: `hcw_${ts}@test.com`,
      password: 'WorkerPassword@123',
      role: 'healthcare_worker',
      verificationStatus: 'approved',
      isActive: true
    });
    createdUserIds.push(hcwUser._id);
    const hcwToken = hcwUser.generateAuthToken();

    // 6. Pending Doctor (for approval)
    const pendingDoctor = await userModel.create({
      fullName: { firstName: 'Doc', lastName: 'Pending' },
      email: `pending_doc_${ts}@test.com`,
      password: 'Password@123',
      role: 'doctor',
      verificationStatus: 'pending',
      isActive: false
    });
    createdUserIds.push(pendingDoctor._id);
    await DoctorProfile.create({
      userId: pendingDoctor._id,
      qualification: 'MBBS, MD',
      specialization: 'Ophthalmology',
      yearsOfExperience: 5
    });

    // 7. Pending Healthcare Worker (for approval)
    const pendingHcw = await userModel.create({
      fullName: { firstName: 'Worker', lastName: 'Pending' },
      email: `pending_hcw_${ts}@test.com`,
      password: 'Password@123',
      role: 'healthcare_worker',
      verificationStatus: 'pending',
      isActive: false
    });
    createdUserIds.push(pendingHcw._id);
    await HealthcareWorkerProfile.create({
      userId: pendingHcw._id,
      qualification: 'ANM/GNM',
      designation: 'Health Assistant',
      yearsOfExperience: 3
    });

    // 8. Pending Doctor (for rejection)
    const doctorToReject = await userModel.create({
      fullName: { firstName: 'Doc', lastName: 'ToReject' },
      email: `reject_doc_${ts}@test.com`,
      password: 'Password@123',
      role: 'doctor',
      verificationStatus: 'pending',
      isActive: false
    });
    createdUserIds.push(doctorToReject._id);
    await DoctorProfile.create({
      userId: doctorToReject._id,
      qualification: 'BDS'
    });

    console.log('Test fixtures created successfully.\n');

    let allPassed = true;
    function logResult(scenarioNum, title, pass, detail = '') {
      if (!pass) allPassed = false;
      const badge = pass ? '[PASS]' : '[FAIL]';
      console.log(`Scenario ${scenarioNum.toString().padStart(2, ' ')}: ${badge} ${title} ${detail ? '-> ' + detail : ''}`);
    }

    // ── SCENARIO 1: Admin login with valid credentials ──────────────────────
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginInput: activeAdmin.email,
          password: 'AdminPassword@123'
        })
      });
      const data = await res.json();
      const setCookie = res.headers.get('set-cookie');
      const pass = res.status === 200 && data.user?.role === 'admin' && !data.user?.password && !!setCookie;
      logResult(1, 'Admin login with valid credentials', pass, `Status ${res.status}, role=${data.user?.role}`);
    }

    // ── SCENARIO 2: Admin login with an incorrect password ──────────────────
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginInput: activeAdmin.email,
          password: 'WrongPassword@999'
        })
      });
      const pass = res.status === 401;
      logResult(2, 'Admin login with incorrect password', pass, `Status ${res.status}`);
    }

    // ── SCENARIO 3: Login attempt for an inactive admin ─────────────────────
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginInput: inactiveAdmin.email,
          password: 'AdminPassword@123'
        })
      });
      const data = await res.json();
      const pass = res.status === 403 && data.message.includes('disabled');
      logResult(3, 'Login attempt for an inactive admin', pass, `Status ${res.status}, msg="${data.message}"`);
    }

    // ── SCENARIO 4: Patient attempts to access admin APIs ────────────────────
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/pending`, {
        headers: { Cookie: `token=${patientToken}` }
      });
      const pass = res.status === 403;
      logResult(4, 'Patient attempts to access admin APIs', pass, `Status ${res.status}`);
    }

    // ── SCENARIO 5: Doctor attempts to access admin APIs ─────────────────────
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/pending`, {
        headers: { Cookie: `token=${doctorToken}` }
      });
      const pass = res.status === 403;
      logResult(5, 'Doctor attempts to access admin APIs', pass, `Status ${res.status}`);
    }

    // ── SCENARIO 6: Healthcare worker attempts to access admin APIs ──────────
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/pending`, {
        headers: { Cookie: `token=${hcwToken}` }
      });
      const pass = res.status === 403;
      logResult(6, 'Healthcare worker attempts to access admin APIs', pass, `Status ${res.status}`);
    }

    // ── SCENARIO 7: Unauthenticated request to an admin endpoint ────────────
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/pending`);
      const pass = res.status === 401;
      logResult(7, 'Unauthenticated request to an admin endpoint', pass, `Status ${res.status}`);
    }

    // ── SCENARIO 8: Admin successfully loads verification overview ───────────
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/analytics/overview`, {
        headers: { Cookie: `token=${adminToken}` }
      });
      const data = await res.json();
      const pass = res.status === 200 && data.data?.users && typeof data.data?.users?.total === 'number';
      logResult(8, 'Admin successfully loads verification dashboard', pass, `Status ${res.status}, total users=${data.data?.users?.total}`);
    }

    // ── SCENARIO 9: Admin can view pending doctor applications ──────────────
    {
      const listRes = await fetch(`${baseUrl}/api/v1/admin/verification/pending`, {
        headers: { Cookie: `token=${adminToken}` }
      });
      const listData = await listRes.json();
      const hasPendingDoc = listData.data?.some(u => u._id === pendingDoctor._id.toString());

      const detailRes = await fetch(`${baseUrl}/api/v1/admin/verification/${pendingDoctor._id}`, {
        headers: { Cookie: `token=${adminToken}` }
      });
      const detailData = await detailRes.json();
      const hasProfile = detailData.data?.profile?.qualification === 'MBBS, MD';

      const pass = listRes.status === 200 && hasPendingDoc && detailRes.status === 200 && hasProfile;
      logResult(9, 'Admin can view pending doctor applications', pass, `List status ${listRes.status}, Detail qual="${detailData.data?.profile?.qualification}"`);
    }

    // ── SCENARIO 10: Admin can view pending healthcare worker applications ───
    {
      const detailRes = await fetch(`${baseUrl}/api/v1/admin/verification/${pendingHcw._id}`, {
        headers: { Cookie: `token=${adminToken}` }
      });
      const detailData = await detailRes.json();
      const pass = detailRes.status === 200 && detailData.data?.profile?.designation === 'Health Assistant';
      logResult(10, 'Admin can view pending healthcare worker applications', pass, `Detail status ${detailRes.status}, desig="${detailData.data?.profile?.designation}"`);
    }

    // ── SCENARIO 11: Admin can approve a doctor ─────────────────────────────
    let approvedDoctorLoginId = '';
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/${pendingDoctor._id}/approve`, {
        method: 'PATCH',
        headers: { Cookie: `token=${adminToken}` }
      });
      const data = await res.json();
      approvedDoctorLoginId = data.data?.loginId || '';
      const pass =
        res.status === 200 &&
        data.data?.verificationStatus === 'approved' &&
        data.data?.isActive === true &&
        data.data?.role === 'doctor' &&
        approvedDoctorLoginId.startsWith('DOC-');
      logResult(11, 'Admin can approve a doctor', pass, `Status ${res.status}, assigned LoginId=${approvedDoctorLoginId}`);
    }

    // ── SCENARIO 12: Admin can approve a healthcare worker ───────────────────
    let approvedHcwLoginId = '';
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/${pendingHcw._id}/approve`, {
        method: 'PATCH',
        headers: { Cookie: `token=${adminToken}` }
      });
      const data = await res.json();
      approvedHcwLoginId = data.data?.loginId || '';
      const pass =
        res.status === 200 &&
        data.data?.verificationStatus === 'approved' &&
        data.data?.isActive === true &&
        data.data?.role === 'healthcare_worker' &&
        approvedHcwLoginId.startsWith('HCW-');
      logResult(12, 'Admin can approve a healthcare worker', pass, `Status ${res.status}, assigned LoginId=${approvedHcwLoginId}`);
    }

    // ── SCENARIO 13: Admin can reject an application ─────────────────────────
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/${doctorToReject._id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${adminToken}`
        },
        body: JSON.stringify({ reason: 'Invalid registration credentials' })
      });
      const data = await res.json();
      const auditEntry = await AuditLog.findOne({ action: 'ADMIN_REJECT_USER', targetId: doctorToReject._id });
      const pass = res.status === 200 && data.data?.verificationStatus === 'rejected' && data.data?.isActive === false && !!auditEntry;
      logResult(13, 'Admin can reject an application', pass, `Status ${res.status}, audit recorded=${!!auditEntry}`);
    }

    // ── SCENARIO 14: A rejected account cannot log in ───────────────────────
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginInput: doctorToReject.email,
          password: 'Password@123'
        })
      });
      const data = await res.json();
      const pass = res.status === 403 && data.message.includes('rejected');
      logResult(14, 'A rejected account cannot log in', pass, `Status ${res.status}, msg="${data.message}"`);
    }

    // ── SCENARIO 15: A pending account cannot log in ────────────────────────
    {
      // Create a fresh pending doctor
      const freshPending = await userModel.create({
        fullName: { firstName: 'Fresh', lastName: 'Pending' },
        email: `fresh_pending_${ts}@test.com`,
        password: 'Password@123',
        role: 'doctor',
        verificationStatus: 'pending',
        isActive: false
      });
      createdUserIds.push(freshPending._id);

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginInput: freshPending.email,
          password: 'Password@123'
        })
      });
      const data = await res.json();
      const pass = res.status === 403 && data.message.includes('pending admin approval');
      logResult(15, 'A pending account cannot log in', pass, `Status ${res.status}, msg="${data.message}"`);
    }

    // ── SCENARIO 16: A user cannot approve the same application twice ────────
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/${pendingDoctor._id}/approve`, {
        method: 'PATCH',
        headers: { Cookie: `token=${adminToken}` }
      });
      const pass = res.status === 400;
      logResult(16, 'A user cannot approve the same application twice', pass, `Status ${res.status}`);
    }

    // ── SCENARIO 17: Approved user's Login ID works with common login flow ───
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginInput: approvedDoctorLoginId,
          password: 'Password@123'
        })
      });
      const data = await res.json();
      const pass = res.status === 200 && data.user?.role === 'doctor' && data.user?.loginId === approvedDoctorLoginId;
      logResult(17, "Approved user's Login ID works with login flow", pass, `Status ${res.status}, authenticated as ${data.user?.loginId}`);
    }

    // ── SCENARIO 18: Refreshing admin dashboard preserves authentication ─────
    {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: `token=${adminToken}` }
      });
      const data = await res.json();
      const pass = res.status === 200 && data.user?.role === 'admin' && data.user?.id === activeAdmin._id.toString();
      logResult(18, 'Refreshing admin dashboard preserves authentication', pass, `Status ${res.status}, role=${data.user?.role}`);
    }

    // ── SCENARIO 19: Public registration cannot create an admin account ──────
    {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: { firstName: 'Hacker', lastName: 'Admin' },
          email: `hacker_admin_${ts}@test.com`,
          password: 'Password@123',
          role: 'admin'
        })
      });
      const data = await res.json();
      const pass = res.status === 400 && data.message.includes('Invalid role');
      logResult(19, 'Public registration cannot create an admin account', pass, `Status ${res.status}, msg="${data.message}"`);
    }

    // ── SCENARIO 20: Non-admin users cannot access admin dashboard or APIs ───
    {
      const [resPat, resDoc, resHcw] = await Promise.all([
        fetch(`${baseUrl}/api/admin/audit-logs`, { headers: { Cookie: `token=${patientToken}` } }),
        fetch(`${baseUrl}/api/admin/audit-logs`, { headers: { Cookie: `token=${doctorToken}` } }),
        fetch(`${baseUrl}/api/admin/audit-logs`, { headers: { Cookie: `token=${hcwToken}` } })
      ]);
      const pass = resPat.status === 403 && resDoc.status === 403 && resHcw.status === 403;
      logResult(20, 'Non-admin users cannot access admin APIs', pass, `Patient=${resPat.status}, Doctor=${resDoc.status}, HCW=${resHcw.status}`);
    }

    console.log('\n===============================================================');
    console.log(`ALL 20 SCENARIOS RESULT: ${allPassed ? '100% PASSED (20/20)' : 'FAILURES DETECTED'}`);
    console.log('===============================================================\n');

  } finally {
    console.log('Cleaning up test fixtures...');
    if (createdUserIds.length > 0) {
      await userModel.deleteMany({ _id: { $in: createdUserIds } });
      await DoctorProfile.deleteMany({ userId: { $in: createdUserIds } });
      await HealthcareWorkerProfile.deleteMany({ userId: { $in: createdUserIds } });
      await AuditLog.deleteMany({ targetId: { $in: createdUserIds } });
    }
    await mongoose.disconnect();
    server.close();
    console.log('Database disconnected and server closed.\n');
  }
}

runAdminAuditTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
