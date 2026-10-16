const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = require('../app');
const userModel = require('../models/user.model');
const PatientProfile = require('../models/patientProfile.model');
const Screening = require('../models/screening.model');
const AuditLog = require('../models/auditLog.model');

async function runPatientLifecycleTests() {
  console.log('=== Starting Patient Account Lifecycle & Screening Flow Test Suite ===\n');

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
  const createdScreeningIds = [];

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
    // -------------------------------------------------------------
    // SETUP ACTORS: 1 HCW, 1 Doctor, 1 Admin
    // -------------------------------------------------------------
    const hcwUser = await userModel.create({
      fullName: { firstName: 'Worker', lastName: 'Rani' },
      email: `hcw_${suffix}@test.com`,
      password: 'Password@123',
      role: 'healthcare_worker',
      verificationStatus: 'approved',
      isActive: true,
      loginId: `HCW-2026-${String(suffix).slice(-4)}`
    });
    createdUserIds.push(hcwUser._id);
    const hcwToken = hcwUser.generateAuthToken();

    const doctorUser = await userModel.create({
      fullName: { firstName: 'Doctor', lastName: 'Sharma' },
      email: `doc_${suffix}@test.com`,
      password: 'Password@123',
      role: 'doctor',
      verificationStatus: 'approved',
      isActive: true,
      loginId: `DOC-2026-${String(suffix).slice(-4)}`
    });
    createdUserIds.push(doctorUser._id);
    const docToken = doctorUser.generateAuthToken();

    // -------------------------------------------------------------
    // REQUIREMENT 1: Existing self-registration behavior remains functional
    // -------------------------------------------------------------
    const selfRegEmail = `selfpat_${suffix}@test.com`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: { firstName: 'Self', lastName: 'Patient' },
        email: selfRegEmail,
        password: 'Password@123',
        role: 'patient',
        personalDetails: { phone: '9876500001', gender: 'male', diabetesStatus: 'no' }
      })
    });
    const regData = await regRes.json();
    assert(
      'Self-registration succeeds with HTTP 201',
      regRes.status === 201 && regData.status === 'success'
    );
    if (regData.user?.id) createdUserIds.push(regData.user.id);

    const selfPatUser = await userModel.findOne({ email: selfRegEmail });
    const selfPatProfile = await PatientProfile.findOne({ userId: selfPatUser._id });
    if (selfPatProfile) createdProfileIds.push(selfPatProfile._id);

    assert(
      'Self-registered patient has unique loginId & PatientProfile linked with claimStatus=claimed',
      !!selfPatUser.loginId && !!selfPatProfile && selfPatProfile.claimStatus === 'claimed'
    );

    // -------------------------------------------------------------
    // REQUIREMENT 2, 3, 4: Healthcare worker creates field patient record
    // Record receives unique Patient ID, but does NOT create active login account
    // -------------------------------------------------------------
    const fieldRegRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'Outreach',
        lastName: 'Kisan',
        phone: '9876543210',
        dateOfBirth: '1978-06-15',
        gender: 'female',
        diabetesStatus: 'yes',
        address: { village: 'Sonapur', district: 'Nagpur' }
      })
    });
    const fieldRegData = await fieldRegRes.json();
    assert(
      'Healthcare worker can create authorized field patient record (201)',
      fieldRegRes.status === 201 && fieldRegData.success === true
    );

    const fieldPatientId = fieldRegData.data?.patientId;
    const fieldClaimCode = fieldRegData.data?.claimCode;
    const fieldProfileId = fieldRegData.data?.profileId;
    if (fieldProfileId) createdProfileIds.push(fieldProfileId);

    assert(
      'Field patient record receives unique Patient ID format (PAT-YYYY-####)',
      /^PAT-\d{4}-\d{4}$/.test(fieldPatientId),
      `Generated ID: ${fieldPatientId}`
    );

    assert(
      'Field registration returns one-time claim code for outreach card',
      !!fieldClaimCode && fieldClaimCode.startsWith('CLM-'),
      `Claim Code: ${fieldClaimCode}`
    );

    // Verify in DB that no User account was created for the field patient
    const fieldProfileDoc = await PatientProfile.findById(fieldProfileId);
    assert(
      'Field patient record does NOT automatically receive a User login account (userId is null)',
      fieldProfileDoc.userId === null && fieldProfileDoc.claimStatus === 'unclaimed'
    );

    // -------------------------------------------------------------
    // REQUIREMENT 5, 6, 7: Assisted screening by Healthcare Worker
    // Screening linked to field patient, actor recorded separately (conductedBy = HCW)
    // -------------------------------------------------------------
    const assistedSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        patientId: fieldPatientId,
        screeningData: {
          id: `SCR-CAMP-${suffix}`,
          classification: { grade: 2, label: 'Moderate DR', confidence: '88%' },
          decision: { decision: 'REFERABLE', referable: true, reason: 'Microaneurysms detected' },
          quality: { status: 'Good', score: 1 },
          images: { original: 'http://cloudinary.test/original.jpg' }
        }
      })
    });
    const assistedSyncData = await assistedSyncRes.json();
    assert(
      'HCW can submit assisted screening for field patient (201)',
      assistedSyncRes.status === 201 && assistedSyncData.success === true
    );

    const assistedScreeningId = assistedSyncData.data?._id;
    if (assistedScreeningId) createdScreeningIds.push(assistedScreeningId);

    const assistedScreeningDoc = await Screening.findById(assistedScreeningId);
    assert(
      'Assisted screening is linked to target PatientProfile and records actor separately',
      assistedScreeningDoc.patientId.toString() === fieldProfileId.toString() &&
      assistedScreeningDoc.conductedBy.toString() === hcwUser._id.toString() &&
      assistedScreeningDoc.screeningType === 'assisted' &&
      assistedScreeningDoc.userId === null,
      `conductedBy: ${assistedScreeningDoc.conductedBy}`
    );

    // -------------------------------------------------------------
    // REQUIREMENT 8, 9: Invalid patient ID & Non-patient rejection
    // -------------------------------------------------------------
    const invalidSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        patientId: 'PAT-9999-9999',
        screeningData: { id: `SCR-INV-${suffix}` }
      })
    });
    assert('Invalid patient ID is rejected with 404', invalidSyncRes.status === 404);

    const nonPatientSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        patientId: doctorUser._id.toString(),
        screeningData: { id: `SCR-NONPAT-${suffix}` }
      })
    });
    assert('Non-patient target is rejected with 400', nonPatientSyncRes.status === 400);

    // -------------------------------------------------------------
    // REQUIREMENT 10: Patient cannot screen on behalf of another patient
    // -------------------------------------------------------------
    const selfPatToken = selfPatUser.generateAuthToken();
    const spoofSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${selfPatToken}`
      },
      body: JSON.stringify({
        patientId: fieldProfileId.toString(),
        screeningData: { id: `SCR-SPOOF-${suffix}` }
      })
    });
    assert(
      'Patient attempting to submit screening for another patient is rejected (403)',
      spoofSyncRes.status === 403
    );

    // -------------------------------------------------------------
    // REQUIREMENT 11: Unauthorized HCW access restrictions
    // HCW2 who did not conduct screening and did not register patient is forbidden
    // -------------------------------------------------------------
    const hcw2User = await userModel.create({
      fullName: { firstName: 'Worker2', lastName: 'Other' },
      email: `hcw2_${suffix}@test.com`,
      password: 'Password@123',
      role: 'healthcare_worker',
      verificationStatus: 'approved',
      isActive: true,
      loginId: `HCW-2026-${String(suffix + 1).slice(-4)}`
    });
    createdUserIds.push(hcw2User._id);
    const hcw2Token = hcw2User.generateAuthToken();

    const unauthorizedDetailRes = await fetch(`${baseUrl}/api/screenings/${assistedScreeningId}`, {
      headers: { Cookie: `token=${hcw2Token}` }
    });
    assert(
      'Unauthorized healthcare worker cannot view screening record (403)',
      unauthorizedDetailRes.status === 403
    );

    // Doctor can view screening details (clinical oversight)
    const docDetailRes = await fetch(`${baseUrl}/api/screenings/${assistedScreeningId}`, {
      headers: { Cookie: `token=${docToken}` }
    });
    assert('Doctor can view screening details for clinical review (200)', docDetailRes.status === 200);

    // -------------------------------------------------------------
    // REQUIREMENT 12, 13: Record claim security
    // Public Patient ID alone CANNOT claim a record; requires Claim Code + corroborating factor
    // -------------------------------------------------------------
    // Register a new patient account who will claim the outreach record
    const claimerUser = await userModel.create({
      fullName: { firstName: 'Outreach', lastName: 'Kisan' },
      email: `claimer_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true
    });
    createdUserIds.push(claimerUser._id);
    const claimerToken = claimerUser.generateAuthToken();

    // Attempt 1: Claim with only Patient ID and wrong code
    const wrongCodeRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${claimerToken}`
      },
      body: JSON.stringify({
        patientId: fieldPatientId,
        claimCode: 'CLM-WRONG1',
        phone: '9876543210'
      })
    });
    assert(
      'Claiming with wrong Claim Code is rejected with 401',
      wrongCodeRes.status === 401
    );

    // Attempt 2: Claim with correct code but wrong phone number
    const wrongPhoneRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${claimerToken}`
      },
      body: JSON.stringify({
        patientId: fieldPatientId,
        claimCode: fieldClaimCode,
        phone: '1111111111'
      })
    });
    assert(
      'Claiming with mismatched contact phone is rejected with 400',
      wrongPhoneRes.status === 400
    );

    // -------------------------------------------------------------
    // REQUIREMENT 14: Concurrent claim attempts prevention
    // -------------------------------------------------------------
    // Attempt 3: Valid claim with correct code and phone
    const validClaimRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${claimerToken}`
      },
      body: JSON.stringify({
        patientId: fieldPatientId,
        claimCode: fieldClaimCode,
        phone: '9876543210',
        dateOfBirth: '1978-06-15'
      })
    });
    const validClaimData = await validClaimRes.json();
    assert(
      'Valid claim succeeds with 200 and links account',
      validClaimRes.status === 200 && validClaimData.success === true
    );

    // Attempt duplicate claim by another account
    const secondClaimer = await userModel.create({
      fullName: { firstName: 'Intruder', lastName: 'X' },
      email: `intruder_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true
    });
    createdUserIds.push(secondClaimer._id);
    const secondClaimerToken = secondClaimer.generateAuthToken();

    const secondClaimRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${secondClaimerToken}`
      },
      body: JSON.stringify({
        patientId: fieldPatientId,
        claimCode: fieldClaimCode,
        phone: '9876543210'
      })
    });
    assert(
      'Subsequent or duplicate claim of an already claimed record is rejected (404/409)',
      secondClaimRes.status === 404 || secondClaimRes.status === 409
    );

    // -------------------------------------------------------------
    // REQUIREMENT 15, 16: Claim preserves existing screening history
    // -------------------------------------------------------------
    const claimerScreeningsRes = await fetch(`${baseUrl}/api/screenings/my`, {
      headers: { Cookie: `token=${claimerToken}` }
    });
    const claimerScreeningsData = await claimerScreeningsRes.json();
    assert(
      'Claimed patient now sees their historical outreach screening in /api/screenings/my',
      claimerScreeningsData.count >= 1 &&
      claimerScreeningsData.data.some(s => s._id === assistedScreeningId)
    );

    const updatedProfile = await PatientProfile.findOne({ userId: claimerUser._id });
    assert(
      'Claimed profile is marked claimed with timestamp and no duplicate profiles created',
      updatedProfile.claimStatus === 'claimed' && !!updatedProfile.claimedAt &&
      (await PatientProfile.countDocuments({ userId: claimerUser._id })) === 1
    );

    // -------------------------------------------------------------
    // REQUIREMENT 17, 18: Screening sync idempotency & duplicate handling
    // -------------------------------------------------------------
    const dupeRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        patientId: fieldPatientId,
        screeningData: {
          id: `SCR-CAMP-${suffix}`, // same reference ID
          classification: { grade: 2, label: 'Moderate DR', confidence: '88%' }
        }
      })
    });
    const dupeData = await dupeRes.json();
    assert(
      'Duplicate sync submission returns existing record idempotently with isDuplicate: true',
      dupeRes.status === 200 && dupeData.isDuplicate === true && dupeData.data._id === assistedScreeningId
    );

    // -------------------------------------------------------------
    // REQUIREMENT 19: Missing confidence is NOT replaced with 0.9 (defaults to 0)
    // -------------------------------------------------------------
    const noConfRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${selfPatToken}`
      },
      body: JSON.stringify({
        screeningData: {
          id: `SCR-NOCONF-${suffix}`,
          classification: { grade: 0, label: 'No DR' }
          // no confidence provided
        }
      })
    });
    const noConfData = await noConfRes.json();
    if (noConfData.data?._id) createdScreeningIds.push(noConfData.data._id);
    assert(
      'Missing confidence defaults to 0 and confidenceScore is 0 (not 0.9)',
      noConfData.data?.aiResult?.confidenceScore === 0,
      `confidenceScore: ${noConfData.data?.aiResult?.confidenceScore}`
    );

    // -------------------------------------------------------------
    // REQUIREMENT 20: AuditLog verification for patient lifecycle actions
    // -------------------------------------------------------------
    const fieldRegAudit = await AuditLog.findOne({
      action: 'FIELD_PATIENT_REGISTERED',
      actorId: hcwUser._id
    });
    const claimAudit = await AuditLog.findOne({
      action: 'PATIENT_RECORD_CLAIMED',
      actorId: claimerUser._id
    });
    assert(
      'Audit log events successfully recorded for registration and record claiming',
      !!fieldRegAudit && !!claimAudit
    );

    console.log(`\n=============================================================`);
    console.log(`Results: ${passedTests}/${totalTests} tests PASSED`);
    console.log(`=============================================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    // Cleanup created test records
    console.log('Cleaning up test fixtures...');
    if (createdScreeningIds.length > 0) {
      await Screening.deleteMany({ _id: { $in: createdScreeningIds } });
    }
    if (createdProfileIds.length > 0) {
      await PatientProfile.deleteMany({ _id: { $in: createdProfileIds } });
    }
    if (createdUserIds.length > 0) {
      await userModel.deleteMany({ _id: { $in: createdUserIds } });
      await AuditLog.deleteMany({ actorId: { $in: createdUserIds } });
    }
    server.close();
    await mongoose.disconnect();
    console.log('Test suite finished.');
  }
}

runPatientLifecycleTests().catch(console.error);
