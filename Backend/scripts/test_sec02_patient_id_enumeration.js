const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = require('../app');
const userModel = require('../models/user.model');
const PatientProfile = require('../models/patientProfile.model');

const GENERIC_CLAIM_FAILURE_MESSAGE = 'Unable to claim this patient record. Verify the supplied details or contact support.';

async function runSec02Tests() {
  console.log('=============================================================');
  console.log('   SEC-02 Patient ID Enumeration Verification Test Suite');
  console.log('=============================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to MongoDB');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✓ Test server running on port ${port}\n`);

  const suffix = Date.now();
  const createdUserIds = [];
  const createdProfileIds = [];

  let passedTests = 0;
  let totalTests = 0;

  function assert(title, condition, extraInfo = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`PASS [Test ${totalTests}]: ${title} ${extraInfo ? `(${extraInfo})` : ''}`);
    } else {
      console.error(`FAIL [Test ${totalTests}]: ${title} ${extraInfo ? `(${extraInfo})` : ''}`);
    }
  }

  try {
    // 1. Create a Healthcare Worker to set up camp patient
    const hcwUser = await userModel.create({
      fullName: { firstName: 'Worker', lastName: 'Field' },
      email: `hcw_sec02_${suffix}@test.com`,
      password: 'Password@123',
      role: 'healthcare_worker',
      verificationStatus: 'approved',
      isActive: true,
      loginId: `HCW-2026-${String(suffix).slice(-4)}`
    });
    createdUserIds.push(hcwUser._id);
    const hcwToken = hcwUser.generateAuthToken();

    // 2. Create a Doctor to verify role-based restrictions
    const docUser = await userModel.create({
      fullName: { firstName: 'Doctor', lastName: 'Clinical' },
      email: `doc_sec02_${suffix}@test.com`,
      password: 'Password@123',
      role: 'doctor',
      verificationStatus: 'approved',
      isActive: true,
      loginId: `DOC-2026-${String(suffix + 1).slice(-4)}`
    });
    createdUserIds.push(docUser._id);
    const docToken = docUser.generateAuthToken();

    // 3. Create Patient accounts
    const patientUser = await userModel.create({
      fullName: { firstName: 'Audit', lastName: 'Patient' },
      email: `pat_sec02_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true,
      loginId: `PAT-2026-${String(suffix + 2).slice(-4)}`
    });
    createdUserIds.push(patientUser._id);
    const patientToken = patientUser.generateAuthToken();

    const secondPatientUser = await userModel.create({
      fullName: { firstName: 'Second', lastName: 'Patient' },
      email: `pat2_sec02_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true,
      loginId: `PAT-2026-${String(suffix + 3).slice(-4)}`
    });
    createdUserIds.push(secondPatientUser._id);
    const secondPatientToken = secondPatientUser.generateAuthToken();

    // 4. Register an unclaimed field patient record
    const regRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'Ramesh',
        lastName: 'Kumar',
        phone: '9876543210',
        dateOfBirth: '1985-05-20',
        gender: 'male',
        address: { village: 'Sonapur', district: 'Nashik', state: 'Maharashtra', pincode: '422001' }
      })
    });
    const regData = await regRes.json();
    assert('Field patient registered successfully', regRes.status === 201 && regData.success);

    const targetPatientId = regData.data.patientId;
    const targetClaimCode = regData.data.claimCode;
    const targetProfileId = regData.data._id;
    createdProfileIds.push(targetProfileId);

    // -------------------------------------------------------------
    // TEST 1: Nonexistent Patient ID returns generic failure response (HTTP 400)
    // -------------------------------------------------------------
    const nonExistentRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${patientToken}`
      },
      body: JSON.stringify({
        patientId: 'PAT-9999-9999',
        claimCode: 'CLM-ABCDEF',
        phone: '9876543210',
        dateOfBirth: '1985-05-20'
      })
    });
    const nonExistentData = await nonExistentRes.json();
    assert(
      'Nonexistent Patient ID returns HTTP 400 with generic failure message',
      nonExistentRes.status === 400 &&
      nonExistentData.status === 'failed' &&
      nonExistentData.message === GENERIC_CLAIM_FAILURE_MESSAGE,
      `Status: ${nonExistentRes.status}, Message: "${nonExistentData.message}"`
    );

    // -------------------------------------------------------------
    // TEST 2: Incorrect claim code returns identical generic failure response (HTTP 400)
    // -------------------------------------------------------------
    const wrongCodeRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${patientToken}`
      },
      body: JSON.stringify({
        patientId: targetPatientId,
        claimCode: 'CLM-WRONG0',
        phone: '9876543210',
        dateOfBirth: '1985-05-20'
      })
    });
    const wrongCodeData = await wrongCodeRes.json();
    assert(
      'Incorrect claim code returns HTTP 400 with identical generic failure message',
      wrongCodeRes.status === 400 &&
      wrongCodeData.status === 'failed' &&
      wrongCodeData.message === GENERIC_CLAIM_FAILURE_MESSAGE,
      `Status: ${wrongCodeRes.status}, Message: "${wrongCodeData.message}"`
    );

    // -------------------------------------------------------------
    // TEST 3: Incorrect phone returns identical generic failure response (HTTP 400)
    // -------------------------------------------------------------
    const wrongPhoneRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${patientToken}`
      },
      body: JSON.stringify({
        patientId: targetPatientId,
        claimCode: targetClaimCode,
        phone: '9123456789',
        dateOfBirth: '1985-05-20'
      })
    });
    const wrongPhoneData = await wrongPhoneRes.json();
    assert(
      'Incorrect phone returns HTTP 400 with identical generic failure message',
      wrongPhoneRes.status === 400 &&
      wrongPhoneData.status === 'failed' &&
      wrongPhoneData.message === GENERIC_CLAIM_FAILURE_MESSAGE,
      `Status: ${wrongPhoneRes.status}, Message: "${wrongPhoneData.message}"`
    );

    // -------------------------------------------------------------
    // TEST 4: Incorrect Date of Birth returns identical generic failure response (HTTP 400)
    // -------------------------------------------------------------
    const wrongDobRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${patientToken}`
      },
      body: JSON.stringify({
        patientId: targetPatientId,
        claimCode: targetClaimCode,
        phone: '9876543210',
        dateOfBirth: '1999-01-01'
      })
    });
    const wrongDobData = await wrongDobRes.json();
    assert(
      'Incorrect DOB returns HTTP 400 with identical generic failure message',
      wrongDobRes.status === 400 &&
      wrongDobData.status === 'failed' &&
      wrongDobData.message === GENERIC_CLAIM_FAILURE_MESSAGE,
      `Status: ${wrongDobRes.status}, Message: "${wrongDobData.message}"`
    );

    // -------------------------------------------------------------
    // TEST 5: Patient ID alone cannot claim a record (HTTP 400)
    // -------------------------------------------------------------
    const idAloneRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${patientToken}`
      },
      body: JSON.stringify({
        patientId: targetPatientId
      })
    });
    assert(
      'Patient ID alone cannot claim a record (HTTP 400 rejected)',
      idAloneRes.status === 400
    );

    // -------------------------------------------------------------
    // TEST 6: Valid claim succeeds (HTTP 200)
    // -------------------------------------------------------------
    const validClaimRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${patientToken}`
      },
      body: JSON.stringify({
        patientId: targetPatientId,
        claimCode: targetClaimCode,
        phone: '9876543210',
        dateOfBirth: '1985-05-20'
      })
    });
    const validClaimData = await validClaimRes.json();
    assert(
      'Valid claim succeeds with HTTP 200 and links account',
      validClaimRes.status === 200 &&
      validClaimData.success === true &&
      validClaimData.data.claimStatus === 'claimed',
      `Status: ${validClaimRes.status}`
    );

    // -------------------------------------------------------------
    // TEST 7: Already-claimed Patient ID returns identical generic failure response (HTTP 400)
    // -------------------------------------------------------------
    const alreadyClaimedRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${secondPatientToken}`
      },
      body: JSON.stringify({
        patientId: targetPatientId,
        claimCode: targetClaimCode,
        phone: '9876543210',
        dateOfBirth: '1985-05-20'
      })
    });
    const alreadyClaimedData = await alreadyClaimedRes.json();
    assert(
      'Already-claimed Patient ID returns HTTP 400 with identical generic failure message',
      alreadyClaimedRes.status === 400 &&
      alreadyClaimedData.status === 'failed' &&
      alreadyClaimedData.message === GENERIC_CLAIM_FAILURE_MESSAGE,
      `Status: ${alreadyClaimedRes.status}, Message: "${alreadyClaimedData.message}"`
    );

    // -------------------------------------------------------------
    // TEST 8: Response consistency check across failure vectors
    // -------------------------------------------------------------
    const allStatusesMatch = [
      nonExistentRes.status,
      wrongCodeRes.status,
      wrongPhoneRes.status,
      wrongDobRes.status,
      alreadyClaimedRes.status
    ].every(s => s === 400);

    const allMessagesMatch = [
      nonExistentData.message,
      wrongCodeData.message,
      wrongPhoneData.message,
      wrongDobData.message,
      alreadyClaimedData.message
    ].every(m => m === GENERIC_CLAIM_FAILURE_MESSAGE);

    assert(
      'Failure responses are 100% indistinguishable across nonexistent, claimed, wrong-code, and wrong-demographic cases',
      allStatusesMatch && allMessagesMatch,
      `All HTTP 400: ${allStatusesMatch}, All Generic Message: ${allMessagesMatch}`
    );

    // -------------------------------------------------------------
    // TEST 9: Unauthenticated requests are rejected (HTTP 401)
    // -------------------------------------------------------------
    const unauthRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: targetPatientId,
        claimCode: targetClaimCode
      })
    });
    assert('Unauthenticated claim request returns HTTP 401', unauthRes.status === 401);

    // -------------------------------------------------------------
    // TEST 10: Non-patient roles (e.g. Doctor, HCW) are blocked (HTTP 403)
    // -------------------------------------------------------------
    const docClaimRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${docToken}`
      },
      body: JSON.stringify({
        patientId: targetPatientId,
        claimCode: targetClaimCode
      })
    });
    assert('Non-patient role (Doctor) is rejected with HTTP 403', docClaimRes.status === 403);

    console.log(`\n=============================================================`);
    console.log(`Results: ${passedTests}/${totalTests} tests PASSED`);
    console.log(`=============================================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    console.log('Cleaning up test fixtures...');
    if (createdProfileIds.length > 0) {
      await PatientProfile.deleteMany({ _id: { $in: createdProfileIds } });
    }
    if (createdUserIds.length > 0) {
      await userModel.deleteMany({ _id: { $in: createdUserIds } });
    }
    server.close();
    await mongoose.disconnect();
    console.log('Test suite finished.');
  }
}

runSec02Tests().catch(console.error);
