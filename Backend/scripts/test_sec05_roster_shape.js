const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const userModel = require('../models/user.model');
const PatientProfile = require('../models/patientProfile.model');
const Screening = require('../models/screening.model');

// Mirror frontend normalization helpers from HealthcareWorkerDashboard.jsx
function getPatientFullName(item) {
  if (!item) return 'Patient';
  if (typeof item.fullName === 'string' && item.fullName.trim()) {
    return item.fullName.trim();
  }
  if (item.fullName && typeof item.fullName === 'object') {
    const fn = `${item.fullName.firstName || ''} ${item.fullName.lastName || ''}`.trim();
    if (fn) return fn;
  }
  if (typeof item.name === 'string' && item.name.trim()) {
    return item.name.trim();
  }
  if (item.userId && typeof item.userId === 'object') {
    if (typeof item.userId.fullName === 'string' && item.userId.fullName.trim()) {
      return item.userId.fullName.trim();
    }
    if (item.userId.fullName && typeof item.userId.fullName === 'object') {
      const fn = `${item.userId.fullName.firstName || ''} ${item.userId.fullName.lastName || ''}`.trim();
      if (fn) return fn;
    }
    if (typeof item.userId.name === 'string' && item.userId.name.trim()) {
      return item.userId.name.trim();
    }
  }
  if (item.profile) {
    if (typeof item.profile.fullName === 'string' && item.profile.fullName.trim()) {
      return item.profile.fullName.trim();
    }
    if (item.profile.fullName && typeof item.profile.fullName === 'object') {
      const fn = `${item.profile.fullName.firstName || ''} ${item.profile.fullName.lastName || ''}`.trim();
      if (fn) return fn;
    }
  }
  if (item.user) {
    if (typeof item.user.fullName === 'string' && item.user.fullName.trim()) {
      return item.user.fullName.trim();
    }
    if (item.user.fullName && typeof item.user.fullName === 'object') {
      const fn = `${item.user.fullName.firstName || ''} ${item.user.fullName.lastName || ''}`.trim();
      if (fn) return fn;
    }
  }
  return 'Patient';
}

function getPatientDisplayId(item) {
  if (!item) return 'N/A';
  if (item.patientId && typeof item.patientId === 'string') {
    return item.patientId;
  }
  if (item.profile?.patientId && typeof item.profile.patientId === 'string') {
    return item.profile.patientId;
  }
  if (item.userId && typeof item.userId === 'object' && item.userId.loginId) {
    return item.userId.loginId;
  }
  if (item.user?.loginId) {
    return item.user.loginId;
  }
  return 'N/A';
}

function isValidMongoId(id) {
  if (!id) return false;
  const str = String(id).trim();
  if (str.startsWith('PAT-') || str.startsWith('HCW-') || str.startsWith('DOC-')) {
    return false;
  }
  return /^[0-9a-fA-F]{24}$/.test(str);
}

function getPatientProfileId(item) {
  if (!item) return null;
  if (item._id && isValidMongoId(item._id)) return String(item._id);
  if (item.profileId && isValidMongoId(item.profileId)) return String(item.profileId);
  if (item.profile?._id && isValidMongoId(item.profile._id)) return String(item.profile._id);
  if (item.id && isValidMongoId(item.id)) return String(item.id);
  return null;
}

function getPatientPhone(item) {
  if (!item) return null;
  return item.phone || (item.userId && typeof item.userId === 'object' ? item.userId.phone : null) || item.profile?.phone || item.user?.phone || null;
}

function formatPatientDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString();
}

async function runSec05Tests() {
  console.log('=============================================================');
  console.log('   SEC-05 Patient Roster Shape & Normalization Test Suite');
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
    // 1. Create Healthcare Worker actor
    const hcwUser = await userModel.create({
      fullName: { firstName: 'Sarita', lastName: 'Devi' },
      email: `hcw_sec05_${suffix}@test.com`,
      password: 'Password@123',
      role: 'healthcare_worker',
      verificationStatus: 'approved',
      isActive: true,
      loginId: `HCW-2026-${String(suffix).slice(-4)}`
    });
    createdUserIds.push(hcwUser._id);
    const hcwToken = hcwUser.generateAuthToken();

    // 2. Create a self-registered / claimed Patient actor (has User document + linked PatientProfile)
    const claimedPatientUser = await userModel.create({
      fullName: { firstName: 'Vikram', lastName: 'Singh' },
      email: `pat_sec05_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      isActive: true,
      loginId: `PAT-2026-${String(suffix + 1).slice(-4)}`
    });
    createdUserIds.push(claimedPatientUser._id);
    const patientToken = claimedPatientUser.generateAuthToken();

    const claimedProfile = await PatientProfile.create({
      userId: claimedPatientUser._id,
      patientId: claimedPatientUser.loginId,
      fullName: { firstName: 'Vikram', lastName: 'Singh' },
      phone: '9876543210',
      gender: 'male',
      dateOfBirth: new Date('1985-05-15'),
      address: { village: 'Sonpur', district: 'Varanasi', state: 'UP', pincode: '221001' },
      diabetesStatus: 'yes',
      diabetesDuration: 5,
      claimStatus: 'claimed',
      registrationType: 'self'
    });
    createdProfileIds.push(claimedProfile._id);

    // 3. Healthcare Worker registers an outreach field patient (NO User document, userId = null)
    const registerFieldRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'Anjali',
        lastName: 'Kumari',
        phone: '9123456780',
        gender: 'female',
        dateOfBirth: '1992-08-20',
        address: { village: 'Baragaon', district: 'Varanasi', state: 'UP', pincode: '221204' },
        diabetesStatus: 'no'
      })
    });
    const fieldJson = await registerFieldRes.json();
    if (registerFieldRes.status !== 201) {
      console.error('Register failed:', registerFieldRes.status, fieldJson);
    }
    assert('Field patient registered successfully via POST /api/patients', registerFieldRes.status === 201 && fieldJson.success);
    const fieldProfileId = fieldJson.data?.profileId;
    const fieldPatientId = fieldJson.data?.patientId;
    if (fieldProfileId) createdProfileIds.push(fieldProfileId);

    // 4. Test GET /api/patients as Healthcare Worker (patient roster)
    const rosterRes = await fetch(`${baseUrl}/api/patients?district=Varanasi`, {
      headers: { Authorization: `Bearer ${hcwToken}` }
    });
    const rosterJson = await rosterRes.json();
    assert('GET /api/patients succeeds with HTTP 200 for Healthcare Worker', rosterRes.status === 200 && rosterJson.success);
    assert('Roster data is an array of PatientProfile documents', Array.isArray(rosterJson.data) && rosterJson.data.length >= 2);

    // Locate both test records in roster
    const fieldDoc = rosterJson.data.find((p) => p._id.toString() === fieldProfileId.toString());
    const claimedDoc = rosterJson.data.find((p) => p._id.toString() === claimedProfile._id.toString());

    assert('Field patient document is present in roster', Boolean(fieldDoc));
    assert('Claimed patient document is present in roster', Boolean(claimedDoc));

    // Verify Field Patient document structure
    assert('Field patient userId is strictly null (no User login account created)', fieldDoc.userId === null);
    assert('Field patient contains human-readable patientId (PAT-YYYY-####)', typeof fieldDoc.patientId === 'string' && fieldDoc.patientId.startsWith('PAT-'));
    assert('Field patient contains direct fullName object', fieldDoc.fullName?.firstName === 'Anjali' && fieldDoc.fullName?.lastName === 'Kumari');
    assert('Field patient claimStatus is "unclaimed"', fieldDoc.claimStatus === 'unclaimed');
    assert('Field patient does not expose claimCode or claimCodeHash', fieldDoc.claimCode === undefined && fieldDoc.claimCodeHash === undefined);

    // Verify Claimed Patient document structure
    assert('Claimed patient has populated userId object', fieldDoc.userId !== claimedDoc.userId && typeof claimedDoc.userId === 'object' && claimedDoc.userId !== null);
    assert('Claimed patient userId contains User details', claimedDoc.userId.email === `pat_sec05_${suffix}@test.com` && claimedDoc.userId.role === 'patient');
    assert('Claimed patient claimStatus is "claimed"', claimedDoc.claimStatus === 'claimed');

    // 5. Test Frontend Normalizers for Field Patient (userId = null)
    const fieldName = getPatientFullName(fieldDoc);
    const fieldDisplayId = getPatientDisplayId(fieldDoc);
    const resolvedFieldProfileId = getPatientProfileId(fieldDoc);
    const fieldPhone = getPatientPhone(fieldDoc);
    const fieldDob = formatPatientDob(fieldDoc.dateOfBirth);

    assert('getPatientFullName resolves "Anjali Kumari" for field patient without crashing on null userId', fieldName === 'Anjali Kumari');
    assert('getPatientDisplayId resolves human-readable PAT-YYYY-#### for field patient', fieldDisplayId === fieldPatientId);
    assert('getPatientProfileId resolves PatientProfile._id (not User._id or undefined)', resolvedFieldProfileId === fieldProfileId.toString());
    assert('getPatientPhone resolves "9123456780"', fieldPhone === '9123456780');
    assert('formatPatientDob correctly formats valid ISO date', Boolean(fieldDob) && fieldDob !== 'Invalid Date');

    // 6. Test Frontend Normalizers for Claimed Patient (populated userId)
    const claimedName = getPatientFullName(claimedDoc);
    const claimedDisplayId = getPatientDisplayId(claimedDoc);
    const resolvedClaimedProfileId = getPatientProfileId(claimedDoc);

    assert('getPatientFullName resolves "Vikram Singh" for claimed patient', claimedName === 'Vikram Singh');
    assert('getPatientDisplayId resolves patientId for claimed patient', claimedDisplayId === claimedPatientUser.loginId);
    assert('getPatientProfileId resolves PatientProfile._id (NEVER User._id)', resolvedClaimedProfileId === claimedProfile._id.toString() && resolvedClaimedProfileId !== claimedPatientUser._id.toString());

    // 7. Test Edge Case Normalizations: String fullName, legacy shapes, and null/undefined handling
    assert('getPatientFullName handles string fullName', getPatientFullName({ fullName: 'Priya Sharma' }) === 'Priya Sharma');
    assert('getPatientFullName handles legacy { user: { fullName: "Test" } }', getPatientFullName({ user: { fullName: { firstName: 'Raj', lastName: 'Kumar' } } }) === 'Raj Kumar');
    assert('getPatientFullName handles null safely without exception', getPatientFullName(null) === 'Patient');
    assert('getPatientDisplayId handles null safely', getPatientDisplayId(null) === 'N/A');
    assert('getPatientProfileId handles null safely', getPatientProfileId(null) === null);
    assert('getPatientProfileId strictly rejects human-readable PAT-YYYY-#### code', getPatientProfileId({ patientId: 'PAT-2026-0044' }) === null);
    assert('getPatientProfileId strictly rejects user._id', getPatientProfileId({ user: { _id: '6ad3b027e3f2ce84d61566f0' } }) === null);
    assert('getPatientProfileId strictly rejects userId._id', getPatientProfileId({ userId: { _id: '6ad3b027e3f2ce84d61566f0' } }) === null);
    assert('formatPatientDob handles invalid dates safely', formatPatientDob('not-a-date') === null);

    // 8. Assisted Screening Submission using normalized profile identifier
    const syncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: resolvedFieldProfileId, // Frontend resolved identifier for field patient
        screeningData: {
          referenceId: `REF-SEC05-${suffix}`,
          classification: { grade: 1, label: 'Mild NPDR', confidence: '88%' }
        }
      })
    });
    const syncJson = await syncRes.json();
    assert('Assisted screening submission with resolved profile ID succeeds (HTTP 201)', syncRes.status === 201 && syncJson.success);
    if (syncJson.data?._id) createdScreeningIds.push(syncJson.data._id);

    // Verify stored screening in DB
    const storedScreening = await Screening.findById(syncJson.data._id);
    assert('Stored screening references target PatientProfile._id', storedScreening?.patientId?.toString() === fieldProfileId.toString());
    assert('Stored screening records conductedBy as HCW and userId as null (unclaimed field patient)', storedScreening?.conductedBy?.toString() === hcwUser._id.toString() && storedScreening?.userId === null);

    // 9. Authorization checks
    const unauthRes = await fetch(`${baseUrl}/api/patients`);
    assert('Unauthenticated request to GET /api/patients returns HTTP 401', unauthRes.status === 401);

    const forbiddenPatientRes = await fetch(`${baseUrl}/api/patients`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert('Patient role is prohibited from accessing GET /api/patients (HTTP 403)', forbiddenPatientRes.status === 403);

    console.log(`\n=============================================================`);
    console.log(`Results: ${passedTests}/${totalTests} tests PASSED`);
    console.log(`=============================================================\n`);
  } catch (err) {
    console.error('Unexpected error during SEC-05 tests:', err);
  } finally {
    console.log('Cleaning up test fixtures...');
    try {
      if (createdScreeningIds.length > 0) {
        await Screening.deleteMany({ _id: { $in: createdScreeningIds } });
      }
      if (createdProfileIds.length > 0) {
        await PatientProfile.deleteMany({ _id: { $in: createdProfileIds } });
      }
      if (createdUserIds.length > 0) {
        await userModel.deleteMany({ _id: { $in: createdUserIds } });
      }
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }
    await mongoose.disconnect();
    server.close();
    console.log('Test suite finished.');
  }
}

runSec05Tests();
