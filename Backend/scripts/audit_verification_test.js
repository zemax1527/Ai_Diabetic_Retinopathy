require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const userModel = require('../models/user.model');
const DoctorProfile = require('../models/doctorProfile.model');
const HealthcareWorkerProfile = require('../models/healthCare.model');
const AuditLog = require('../models/auditLog.model');

async function runTests() {
  console.log('--- Starting Admin Verification & Approval Flow Audit Tests ---');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on port ${port}`);

  const testSuffix = Date.now();
  const createdUserIds = [];

  try {
    // 1. Create Test Admin
    const adminUser = await userModel.create({
      fullName: { firstName: 'Admin', lastName: 'Audit' },
      email: `admin_audit_${testSuffix}@test.com`,
      password: 'Password@123',
      role: 'admin',
      verificationStatus: 'not_required',
      isActive: true
    });
    createdUserIds.push(adminUser._id);
    const adminToken = adminUser.generateAuthToken();

    // 2. Create Test Patient
    const patientUser = await userModel.create({
      fullName: { firstName: 'Patient', lastName: 'Audit' },
      email: `patient_audit_${testSuffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true
    });
    createdUserIds.push(patientUser._id);
    const patientToken = patientUser.generateAuthToken();

    // 3. Create Pending Doctor
    const doctorUser = await userModel.create({
      fullName: { firstName: 'Doc', lastName: 'Pending' },
      email: `doctor_pending_${testSuffix}@test.com`,
      password: 'Password@123',
      role: 'doctor',
      verificationStatus: 'pending',
      isActive: false
    });
    createdUserIds.push(doctorUser._id);
    await DoctorProfile.create({
      userId: doctorUser._id,
      qualification: 'MBBS, MD',
      specialization: 'Ophthalmology'
    });

    // 4. Create Pending Healthcare Worker
    const hcwUser = await userModel.create({
      fullName: { firstName: 'HCW', lastName: 'Pending' },
      email: `hcw_pending_${testSuffix}@test.com`,
      password: 'Password@123',
      role: 'healthcare_worker',
      verificationStatus: 'pending',
      isActive: false
    });
    createdUserIds.push(hcwUser._id);
    await HealthcareWorkerProfile.create({
      userId: hcwUser._id,
      qualification: 'ANM/GNM',
      designation: 'Field Worker'
    });

    // 5. Create Doctor for Rejection Test
    const doctorToReject = await userModel.create({
      fullName: { firstName: 'Doc', lastName: 'ToReject' },
      email: `doctor_reject_${testSuffix}@test.com`,
      password: 'Password@123',
      role: 'doctor',
      verificationStatus: 'pending',
      isActive: false
    });
    createdUserIds.push(doctorToReject._id);
    await DoctorProfile.create({
      userId: doctorToReject._id,
      qualification: 'MBBS'
    });

    console.log('Test fixtures created successfully.\n');

    // ─── TEST 1: Unauthorized user attempting approval ───
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/${doctorUser._id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      console.log(`TEST 1 - Unauthorized user: Status ${res.status} [${res.status === 401 ? 'PASS' : 'FAIL'}]`, data.message);
    }

    // ─── TEST 2: Patient attempting approval ───
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/${doctorUser._id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        }
      });
      const data = await res.json();
      console.log(`TEST 2 - Patient attempting approval: Status ${res.status} [${res.status === 403 ? 'PASS' : 'FAIL'}]`, data.message);
    }

    // ─── TEST 3: Invalid target user ID (malformed) ───
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/invalid-mongo-id/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${adminToken}`
        }
      });
      const data = await res.json();
      console.log(`TEST 3 - Invalid target user ID: Status ${res.status} [${res.status === 400 ? 'PASS' : 'FAIL'}]`, data.message);
    }

    // ─── TEST 4: Non-existent target user ID ───
    {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/${fakeId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${adminToken}`
        }
      });
      const data = await res.json();
      console.log(`TEST 4 - Non-existent user ID: Status ${res.status} [${res.status === 404 ? 'PASS' : 'FAIL'}]`, data.message);
    }

    // ─── TEST 5: Admin approval of pending doctor ───
    let approvedDoctorLoginId = '';
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/${doctorUser._id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${adminToken}`
        }
      });
      const data = await res.json();
      const pass =
        res.status === 200 &&
        data.data.verificationStatus === 'approved' &&
        data.data.isActive === true &&
        data.data.role === 'doctor' &&
        data.data.loginId &&
        data.data.loginId.startsWith('DOC-');

      approvedDoctorLoginId = data.data.loginId;
      console.log(`TEST 5 - Approve pending doctor: Status ${res.status} [${pass ? 'PASS' : 'FAIL'}]`, {
        loginId: data.data?.loginId,
        role: data.data?.role,
        isActive: data.data?.isActive,
        verificationStatus: data.data?.verificationStatus
      });

      // Verify audit log
      const audit = await AuditLog.findOne({
        action: 'ADMIN_APPROVE_USER',
        targetId: doctorUser._id
      });
      console.log(`  -> AuditLog recorded: [${audit ? 'PASS' : 'FAIL'}] Action: ${audit?.action}, Details:`, audit?.details);

      // Verify doctor can now log in using generated loginId
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginInput: approvedDoctorLoginId,
          password: 'Password@123'
        })
      });
      const loginData = await loginRes.json();
      console.log(`  -> Approved doctor login with loginId: Status ${loginRes.status} [${loginRes.status === 200 ? 'PASS' : 'FAIL'}]`, loginData.message);
    }

    // ─── TEST 6: Repeated approval of already approved doctor ───
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/${doctorUser._id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${adminToken}`
        }
      });
      const data = await res.json();
      console.log(`TEST 6 - Repeated approval on already approved account: Status ${res.status} [${res.status === 400 ? 'PASS' : 'FAIL'}]`, data.message);
    }

    // ─── TEST 7: Admin approval of pending healthcare worker ───
    let approvedHcwLoginId = '';
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/${hcwUser._id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${adminToken}`
        }
      });
      const data = await res.json();
      const pass =
        res.status === 200 &&
        data.data.verificationStatus === 'approved' &&
        data.data.isActive === true &&
        data.data.role === 'healthcare_worker' &&
        data.data.loginId &&
        data.data.loginId.startsWith('HCW-');

      approvedHcwLoginId = data.data.loginId;
      console.log(`TEST 7 - Approve pending healthcare worker: Status ${res.status} [${pass ? 'PASS' : 'FAIL'}]`, {
        loginId: data.data?.loginId,
        role: data.data?.role,
        isActive: data.data?.isActive,
        verificationStatus: data.data?.verificationStatus
      });

      // Verify HCW can now log in using generated loginId
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginInput: approvedHcwLoginId,
          password: 'Password@123'
        })
      });
      const loginData = await loginRes.json();
      console.log(`  -> Approved HCW login with loginId: Status ${loginRes.status} [${loginRes.status === 200 ? 'PASS' : 'FAIL'}]`, loginData.message);
    }

    // ─── TEST 8: Rejection and subsequent login behavior ───
    {
      // First attempt to reject
      const res = await fetch(`${baseUrl}/api/v1/admin/verification/${doctorToReject._id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${adminToken}`
        },
        body: JSON.stringify({ reason: 'Invalid medical credentials submitted' })
      });
      const data = await res.json();
      console.log(`TEST 8a - Reject doctor application: Status ${res.status} [${res.status === 200 ? 'PASS' : 'FAIL'}]`, {
        status: data.data?.verificationStatus,
        isActive: data.data?.isActive
      });

      // Repeated rejection attempt
      const repeatRes = await fetch(`${baseUrl}/api/v1/admin/verification/${doctorToReject._id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${adminToken}`
        },
        body: JSON.stringify({ reason: 'Duplicate reject' })
      });
      const repeatData = await repeatRes.json();
      console.log(`TEST 8b - Repeated rejection attempt: Status ${repeatRes.status} [${repeatRes.status === 400 ? 'PASS' : 'FAIL'}]`, repeatData.message);

      // Attempt to approve rejected user
      const approveRejectRes = await fetch(`${baseUrl}/api/v1/admin/verification/${doctorToReject._id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${adminToken}`
        }
      });
      const approveRejectData = await approveRejectRes.json();
      console.log(`TEST 8c - Attempt to approve rejected user: Status ${approveRejectRes.status} [${approveRejectRes.status === 400 ? 'PASS' : 'FAIL'}]`, approveRejectData.message);

      // Attempt to log in with rejected doctor account
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginInput: doctorToReject.email,
          password: 'Password@123'
        })
      });
      const loginData = await loginRes.json();
      console.log(`TEST 8d - Rejected doctor login attempt: Status ${loginRes.status} [${loginRes.status === 403 ? 'PASS' : 'FAIL'}]`, loginData.message);
    }

    // ─── TEST 9: Login ID generation role prefix & sequence check ───
    {
      const docMatch = approvedDoctorLoginId.match(/^DOC-\d{4}-\d{4}$/);
      const hcwMatch = approvedHcwLoginId.match(/^HCW-\d{4}-\d{4}$/);
      console.log(`TEST 9 - Login ID format verification: [${docMatch && hcwMatch ? 'PASS' : 'FAIL'}] Doc: ${approvedDoctorLoginId}, HCW: ${approvedHcwLoginId}`);
    }

  } finally {
    // Clean up created fixtures and logs
    console.log('\nCleaning up test fixtures...');
    if (createdUserIds.length > 0) {
      await userModel.deleteMany({ _id: { $in: createdUserIds } });
      await DoctorProfile.deleteMany({ userId: { $in: createdUserIds } });
      await HealthcareWorkerProfile.deleteMany({ userId: { $in: createdUserIds } });
      await AuditLog.deleteMany({ targetId: { $in: createdUserIds } });
    }
    await mongoose.disconnect();
    server.close();
    console.log('Cleanup finished and disconnected from DB.\n');
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
