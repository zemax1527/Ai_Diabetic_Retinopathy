require('dotenv').config();
const mongoose = require('mongoose');
const generateLoginId = require('../utils/generateLoginId');
const Sequence = require('../models/sequence.model');
const userModel = require('../models/user.model');
const DoctorProfile = require('../models/doctorProfile.model');
const HealthcareWorkerProfile = require('../models/healthCare.model');
const http = require('http');
const app = require('../app');

async function testConcurrency() {
  console.log('=== Starting Login ID Concurrency & Sequence Tests ===\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const currentYear = new Date().getFullYear();
  const testCreatedUserIds = [];

  try {
    // ─── TEST 1: Patient Login ID generation ───
    {
      const patId = await generateLoginId('patient');
      const pass = patId.startsWith(`PAT-${currentYear}-`);
      console.log(`TEST 1 [Patient Login ID] Generated: ${patId} [${pass ? 'PASS' : 'FAIL'}]`);
    }

    // ─── TEST 2 & 3: Doctor & Healthcare Worker format checks ───
    {
      const docId = await generateLoginId('doctor');
      const hcwId = await generateLoginId('healthcare_worker');
      const passDoc = docId.startsWith(`DOC-${currentYear}-`);
      const passHcw = hcwId.startsWith(`HCW-${currentYear}-`);
      console.log(`TEST 2 [Doctor Login ID format] Generated: ${docId} [${passDoc ? 'PASS' : 'FAIL'}]`);
      console.log(`TEST 3 [HCW Login ID format] Generated: ${hcwId} [${passHcw ? 'PASS' : 'FAIL'}]`);
    }

    // ─── TEST 4: Concurrent generation of 10 Login IDs for the same role and year ───
    {
      console.log('\nRunning 10 simultaneous parallel generateLoginId("doctor") calls...');
      const promises = Array.from({ length: 10 }, () => generateLoginId('doctor'));
      const results = await Promise.all(promises);

      // Verify all 10 are completely unique
      const uniqueSet = new Set(results);
      const isUnique = uniqueSet.size === 10;

      // Extract sequence integers and verify they are sequential
      const seqNumbers = results.map(id => parseInt(id.split('-')[2], 10)).sort((a, b) => a - b);
      let isStrictlySequential = true;
      for (let i = 1; i < seqNumbers.length; i++) {
        if (seqNumbers[i] !== seqNumbers[i - 1] + 1) {
          isStrictlySequential = false;
          break;
        }
      }

      console.log(`TEST 4 [Concurrent Same-Role] 10 IDs generated:`, results);
      console.log(`  -> Uniqueness: 10/10 [${isUnique ? 'PASS' : 'FAIL'}]`);
      console.log(`  -> Sequential: [${isStrictlySequential ? 'PASS' : 'FAIL'}]`);
    }

    // ─── TEST 5: Concurrent generation across different roles ───
    {
      console.log('\nRunning simultaneous calls across patient, doctor, and healthcare_worker...');
      const [patP, docP, hcwP] = await Promise.all([
        generateLoginId('patient'),
        generateLoginId('doctor'),
        generateLoginId('healthcare_worker')
      ]);

      const pass =
        patP.startsWith(`PAT-${currentYear}-`) &&
        docP.startsWith(`DOC-${currentYear}-`) &&
        hcwP.startsWith(`HCW-${currentYear}-`);

      console.log(`TEST 5 [Concurrent Multi-Role] PAT: ${patP}, DOC: ${docP}, HCW: ${hcwP} [${pass ? 'PASS' : 'FAIL'}]`);
    }

    // ─── TEST 6 & 7: Admin Approval Concurrency on Same User & Preservation ───
    {
      console.log('\nTesting Admin Approval under double-click/concurrency...');
      // Create admin user
      const admin = await userModel.create({
        fullName: { firstName: 'Admin', lastName: 'Concurrency' },
        email: `admin_conc_${Date.now()}@test.com`,
        password: 'Password@123',
        role: 'admin',
        isActive: true
      });
      testCreatedUserIds.push(admin._id);
      const adminToken = admin.generateAuthToken();

      // Create pending doctor
      const pendingDoc = await userModel.create({
        fullName: { firstName: 'Doc', lastName: 'Conc' },
        email: `doc_conc_${Date.now()}@test.com`,
        password: 'Password@123',
        role: 'doctor',
        verificationStatus: 'pending',
        isActive: false
      });
      testCreatedUserIds.push(pendingDoc._id);
      await DoctorProfile.create({
        userId: pendingDoc._id,
        qualification: 'MBBS'
      });

      // Fire 2 simultaneous approval requests for the EXACT same doctor
      const [res1, res2] = await Promise.all([
        fetch(`${baseUrl}/api/v1/admin/verification/${pendingDoc._id}/approve`, {
          method: 'PATCH',
          headers: { Cookie: `token=${adminToken}` }
        }),
        fetch(`${baseUrl}/api/v1/admin/verification/${pendingDoc._id}/approve`, {
          method: 'PATCH',
          headers: { Cookie: `token=${adminToken}` }
        })
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one must succeed (200), and the second must be rejected (400)
      const passConcurrencyLock = statuses[0] === 200 && statuses[1] === 400;
      console.log(`TEST 6 [Atomic Approval Collision Lock] Statuses: ${statuses.join(', ')} [${passConcurrencyLock ? 'PASS' : 'FAIL'}]`);

      // Verify the doctor has valid approved state and one loginId
      const finalDoc = await userModel.findById(pendingDoc._id);
      const passFinal = finalDoc.verificationStatus === 'approved' && finalDoc.isActive === true && finalDoc.loginId.startsWith('DOC-');
      console.log(`TEST 7 [Single Login ID Preserved] LoginId: ${finalDoc.loginId} [${passFinal ? 'PASS' : 'FAIL'}]`);

      // Verify doctor can login with this generated login ID
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginInput: finalDoc.loginId,
          password: 'Password@123'
        })
      });
      console.log(`TEST 8 [Login with Generated LoginId] Status: ${loginRes.status} [${loginRes.status === 200 ? 'PASS' : 'FAIL'}]`);
    }

    // ─── TEST 9: Sequence behavior beyond 9999 ───
    {
      console.log('\nTesting sequence behavior across 9999 threshold...');
      // Set patient sequence to 9999
      await Sequence.findOneAndUpdate(
        { key: `PAT-${currentYear}` },
        { $set: { seq: 9999 } },
        { upsert: true }
      );

      // Now generate next for patient — should increment 9999 -> 10000
      const nextPatId = await generateLoginId('patient');
      const seqPart = nextPatId.split('-')[2];
      const passBeyond = seqPart === '10000';
      console.log(`TEST 9 [Sequence Beyond 9999] Expected '10000', Got: ${seqPart} [${passBeyond ? 'PASS' : 'FAIL'}]`);
    }

  } finally {
    console.log('\nCleaning up fixtures...');
    if (testCreatedUserIds.length > 0) {
      await userModel.deleteMany({ _id: { $in: testCreatedUserIds } });
      await DoctorProfile.deleteMany({ userId: { $in: testCreatedUserIds } });
    }
    await mongoose.disconnect();
    server.close();
    console.log('Finished and DB disconnected.\n');
  }
}

testConcurrency().catch(err => {
  console.error('Fatal concurrency test error:', err);
  process.exit(1);
});
