const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const userModel = require('../models/user.model');
const PatientProfile = require('../models/patientProfile.model');

async function runSec04Tests() {
  console.log('=============================================================');
  console.log('   SEC-04 Patient Claim Code Display & Privacy Test Suite');
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
    // 1. Create Healthcare Worker actor
    const hcwUser = await userModel.create({
      fullName: { firstName: 'Nurse', lastName: 'Asha' },
      email: `hcw_sec04_${suffix}@test.com`,
      password: 'Password@123',
      role: 'healthcare_worker',
      verificationStatus: 'approved',
      isActive: true,
      loginId: `HCW-2026-${String(suffix).slice(-4)}`
    });
    createdUserIds.push(hcwUser._id);
    const hcwToken = hcwUser.generateAuthToken();

    // 2. Create Patient actor who will later claim the record
    const patientUser = await userModel.create({
      fullName: { firstName: 'Devi', lastName: 'Kisan' },
      email: `pat_sec04_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true,
      loginId: `PAT-2026-${String(suffix + 1).slice(-4)}`
    });
    createdUserIds.push(patientUser._id);
    const patientToken = patientUser.generateAuthToken();

    // -------------------------------------------------------------
    // TEST 1: Field-patient registration returns the expected claimCode property
    // -------------------------------------------------------------
    const regPayload = {
      firstName: 'Kisan',
      lastName: 'Devi',
      phone: '9876543210',
      gender: 'female',
      dateOfBirth: '1975-08-15',
      address: { village: 'Pimpalgaon', district: 'Nashik', state: 'Maharashtra' },
      diabetesStatus: 'yes',
      diabetesDuration: 3
    };

    const regRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify(regPayload)
    });
    const regData = await regRes.json();

    assert(
      'Field-patient registration returns HTTP 201 with success: true',
      regRes.status === 201 && regData.success === true
    );

    const generatedPatientId = regData.data?.patientId;
    const generatedProfileId = regData.data?.profileId;
    const returnedClaimCode = regData.data?.claimCode;
    const returnedFullName = regData.data?.fullName;
    if (generatedProfileId) createdProfileIds.push(generatedProfileId);

    assert(
      'Registration response contains valid Patient ID format (PAT-YYYY-####)',
      typeof generatedPatientId === 'string' && /^PAT-\d{4}-\d{4}$/.test(generatedPatientId),
      `Patient ID: ${generatedPatientId}`
    );

    assert(
      'Registration response contains patient full name object',
      returnedFullName && returnedFullName.firstName === 'Kisan' && returnedFullName.lastName === 'Devi'
    );

    assert(
      'Registration response returns plaintext one-time claim code with CLM- prefix',
      typeof returnedClaimCode === 'string' && /^CLM-[A-F0-9]{6}$/.test(returnedClaimCode),
      `Claim Code: ${returnedClaimCode}`
    );

    // -------------------------------------------------------------
    // TEST 2: Never expose raw claimCodeHash in registration response
    // -------------------------------------------------------------
    assert(
      'Registration response never exposes claimCodeHash',
      regData.data?.claimCodeHash === undefined,
      `claimCodeHash in response: ${regData.data?.claimCodeHash}`
    );

    // -------------------------------------------------------------
    // TEST 3: Database stores only bcrypt hash, never plaintext claim code
    // -------------------------------------------------------------
    const storedProfileInDb = await PatientProfile.findById(generatedProfileId).select('+claimCodeHash');
    assert(
      'Database stores bcrypt hash in claimCodeHash starting with $2b$',
      typeof storedProfileInDb.claimCodeHash === 'string' && storedProfileInDb.claimCodeHash.startsWith('$2b$'),
      `Hash prefix: ${storedProfileInDb.claimCodeHash?.slice(0, 7)}`
    );

    assert(
      'Database document does not store plaintext claimCode field',
      storedProfileInDb.claimCode === undefined
    );

    // -------------------------------------------------------------
    // TEST 4: GET /api/patients roster does NOT leak claimCode or claimCodeHash
    // -------------------------------------------------------------
    const rosterRes = await fetch(`${baseUrl}/api/patients?search=${encodeURIComponent(generatedPatientId)}`, {
      headers: { Cookie: `token=${hcwToken}` }
    });
    const rosterData = await rosterRes.json();
    const foundRosterItem = rosterData.data?.find(p => p.patientId === generatedPatientId);

    assert(
      'Patient roster GET /api/patients does not expose claimCode',
      foundRosterItem && foundRosterItem.claimCode === undefined
    );

    assert(
      'Patient roster GET /api/patients does not expose claimCodeHash',
      foundRosterItem && foundRosterItem.claimCodeHash === undefined
    );

    // -------------------------------------------------------------
    // TEST 5: GET /api/patients/:patientId does NOT leak claimCode or claimCodeHash
    // -------------------------------------------------------------
    const detailRes = await fetch(`${baseUrl}/api/patients/${generatedPatientId}`, {
      headers: { Cookie: `token=${hcwToken}` }
    });
    const detailData = await detailRes.json();

    assert(
      'Single patient GET /api/patients/:id does not expose claimCode',
      detailData.data && detailData.data.claimCode === undefined
    );

    assert(
      'Single patient GET /api/patients/:id does not expose claimCodeHash',
      detailData.data && detailData.data.claimCodeHash === undefined
    );

    // -------------------------------------------------------------
    // TEST 6: Frontend claim-code extraction and missing-code fallback logic
    // -------------------------------------------------------------
    function simulateFrontendRegistrationHandler(backendResponse) {
      const newPatientData = backendResponse?.data;
      const patientId = newPatientData?.patientId || null;
      const profileId = newPatientData?.profileId || newPatientData?._id || null;
      const claimCode = newPatientData?.claimCode || null;
      const fullName = newPatientData?.fullName
        ? `${newPatientData.fullName.firstName || ''} ${newPatientData.fullName.lastName || ''}`.trim()
        : 'Patient';

      return {
        patientId,
        profileId,
        claimCode,
        fullName,
        hasClaimCode: Boolean(claimCode)
      };
    }

    const normalFrontendState = simulateFrontendRegistrationHandler(regData);
    assert(
      'Frontend correctly maps backend response: patientId, fullName, claimCode',
      normalFrontendState.patientId === generatedPatientId &&
      normalFrontendState.claimCode === returnedClaimCode &&
      normalFrontendState.fullName === 'Kisan Devi' &&
      normalFrontendState.hasClaimCode === true
    );

    // Simulate missing claim code response (safe fallback)
    const mockMissingCodeResponse = {
      success: true,
      data: {
        patientId: 'PAT-2026-9999',
        profileId: '65e000000000000000000001',
        fullName: { firstName: 'Test', lastName: 'Fallback' }
      }
    };
    const fallbackFrontendState = simulateFrontendRegistrationHandler(mockMissingCodeResponse);
    assert(
      'Frontend safely handles missing claim code without fabricating code or crashing',
      fallbackFrontendState.patientId === 'PAT-2026-9999' &&
      fallbackFrontendState.claimCode === null &&
      fallbackFrontendState.hasClaimCode === false
    );

    // -------------------------------------------------------------
    // TEST 7: Patient claims record using the returned claim code
    // -------------------------------------------------------------
    const claimRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${patientToken}`
      },
      body: JSON.stringify({
        patientId: generatedPatientId,
        claimCode: returnedClaimCode,
        phone: '9876543210',
        dateOfBirth: '1975-08-15'
      })
    });
    const claimData = await claimRes.json();

    assert(
      'Patient can claim record using the exact displayed claim code (HTTP 200)',
      claimRes.status === 200 && claimData.success === true && claimData.data?.claimStatus === 'claimed'
    );

    // -------------------------------------------------------------
    // TEST 8: One-time claim code semantics - cannot be reused
    // -------------------------------------------------------------
    const secondPatient = await userModel.create({
      fullName: { firstName: 'Second', lastName: 'Claimer' },
      email: `pat2_sec04_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true,
      loginId: `PAT-2026-${String(suffix + 2).slice(-4)}`
    });
    createdUserIds.push(secondPatient._id);
    const secondPatientToken = secondPatient.generateAuthToken();

    const secondClaimRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${secondPatientToken}`
      },
      body: JSON.stringify({
        patientId: generatedPatientId,
        claimCode: returnedClaimCode,
        phone: '9876543210',
        dateOfBirth: '1975-08-15'
      })
    });

    assert(
      'One-time claim code is consumed and cannot be reused (HTTP 400 rejection)',
      secondClaimRes.status === 400
    );

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

runSec04Tests().catch(console.error);
