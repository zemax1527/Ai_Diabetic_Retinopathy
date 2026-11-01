const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const userModel = require('../models/user.model');
const PatientProfile = require('../models/patientProfile.model');
const Screening = require('../models/screening.model');
const s = require('../utils/schema.validator');

async function runSec10Tests() {
  console.log('=== SEC-10: Centralized Request Validation & Input Sanitization Tests ===\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Screening.init();
  await PatientProfile.init();
  await userModel.init();
  console.log('Model indexes initialized\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on port ${port}\n`);

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
    // SECTION 1: SCHEMA VALIDATOR UNIT TESTS
    // -------------------------------------------------------------
    console.log('--- 1. Schema Validator Unit Tests ---');

    // 1.1 String validator
    const strVal = s.string({ min: 2, max: 10, trim: true, required: true, label: 'name' });
    assert('String: valid trimmed string is accepted', strVal.validate('  Alice  ').valid && strVal.validate('  Alice  ').value === 'Alice');
    assert('String: too short is rejected', !strVal.validate(' A ').valid);
    assert('String: too long is rejected', !strVal.validate('12345678901').valid);
    assert('String: missing required string is rejected', !strVal.validate(undefined).valid);
    assert('String: boolean true is not coerced into string', !strVal.validate(true).valid);
    assert('String: number is not silently coerced into string', !strVal.validate(12345).valid);
    assert('String: object is not coerced into string', !strVal.validate({ name: 'Alice' }).valid);

    // 1.2 Integer validator
    const intVal = s.integer({ min: 0, max: 4, required: true, label: 'grade' });
    assert('Integer: valid integer 0 is accepted', intVal.validate(0).valid && intVal.validate(0).value === 0);
    assert('Integer: valid integer 4 is accepted', intVal.validate(4).valid && intVal.validate(4).value === 4);
    assert('Integer: float 2.5 is rejected', !intVal.validate(2.5).valid);
    assert('Integer: out of bounds 5 is rejected', !intVal.validate(5).valid);
    assert('Integer: negative -1 is rejected', !intVal.validate(-1).valid);
    assert('Integer: boolean true is NOT coerced to 1', !intVal.validate(true).valid);
    assert('Integer: boolean false is NOT coerced to 0', !intVal.validate(false).valid);
    assert('Integer: object is rejected', !intVal.validate({ val: 2 }).valid);
    assert('Integer: array is rejected', !intVal.validate([2]).valid);
    assert('Integer: string is rejected by default (no silent coercion)', !intVal.validate('3').valid);

    // 1.3 Number validator
    const numVal = s.number({ min: 0, max: 100, label: 'duration' });
    assert('Number: valid 0 is accepted', numVal.validate(0).valid && numVal.validate(0).value === 0);
    assert('Number: valid float 3.5 is accepted', numVal.validate(3.5).valid && numVal.validate(3.5).value === 3.5);
    assert('Number: negative is rejected', !numVal.validate(-1).valid);
    assert('Number: boolean is rejected', !numVal.validate(true).valid);

     // 1.4 Date validator

    const dateVal = s.date({ pastOnly: true, minYear: 1900, label: 'dateOfBirth' });

    assert('Date: valid past date is accepted', dateVal.validate('1990-05-15').valid && dateVal.validate('1990-05-15').value instanceof Date);

    assert('Date: invalid string is rejected', !dateVal.validate('invalid-date-string').valid);

    assert('Date: future date is rejected', !dateVal.validate('2099-01-01').valid);

    assert('Date: year before 1900 is rejected', !dateVal.validate('1850-01-01').valid);

    assert('Date: boolean is rejected', !dateVal.validate(true).valid);

    // Date calendar regression tests
    assert('Date: impossible date 2000-02-30 is rejected', !dateVal.validate('2000-02-30').valid);

    assert('Date: invalid leap year 1900-02-29 is rejected', !dateVal.validate('1900-02-29').valid);

    assert('Date: valid leap year 2000-02-29 is accepted', dateVal.validate('2000-02-29').valid);

    assert('Date: non-ISO date format is rejected', !dateVal.validate('20-05-2000').valid);

    // 1.5 ObjectId validator
    const idVal = s.objectId({ label: 'userId' });
    assert('ObjectId: valid 24-hex string is accepted', idVal.validate('507f1f77bcf86cd799439011').valid);
    assert('ObjectId: invalid hex length is rejected', !idVal.validate('507f1f77bcf86cd79943901').valid);
    assert('ObjectId: non-hex characters rejected', !idVal.validate('507f1f77bcf86cd79943901z').valid);
    assert('ObjectId: boolean rejected', !idVal.validate(true).valid);

    // 1.6 Object validator & Allowlist
    const objVal = s.object({
      allowed: s.string({ min: 1 })
    }, { allowUnknown: false });
    assert('Object: valid whitelisted object is accepted', objVal.validate({ allowed: 'ok' }).valid);
    assert('Object: unknown field is rejected', !objVal.validate({ allowed: 'ok', unknownKey: 'evil' }).valid);
    assert('Object: protected field "role" is rejected', !objVal.validate({ allowed: 'ok', role: 'admin' }).valid);
    assert('Object: protected field "claimStatus" is rejected', !objVal.validate({ allowed: 'ok', claimStatus: 'claimed' }).valid);

    // -------------------------------------------------------------
    // SECTION 2: SEED DATA FOR HTTP INTEGRATION TESTS
    // -------------------------------------------------------------
    console.log('\n--- 2. Setting up Test Users and Screenings ---');

    // Create Doctor User
    const doctorUser = await userModel.create({
      fullName: { firstName: 'Dr. Test', lastName: 'Reviewer' },
      email: `doc_sec10_${suffix}@example.com`,
      password: 'Password123!',
      role: 'doctor',
      isActive: true,
      verificationStatus: 'approved',
      specialization: 'Ophthalmology',
      loginId: `DOC-${suffix}`
    });
    createdUserIds.push(doctorUser._id);
    const doctorToken = doctorUser.generateAuthToken();

    // Create Healthcare Worker User
    const hcwUser = await userModel.create({
      fullName: { firstName: 'HCW', lastName: 'Worker' },
      email: `hcw_sec10_${suffix}@example.com`,
      password: 'Password123!',
      role: 'healthcare_worker',
      isActive: true,
      verificationStatus: 'approved',
      loginId: `HCW-${suffix}`
    });
    createdUserIds.push(hcwUser._id);
    const hcwToken = hcwUser.generateAuthToken();

    // Create Patient User
    const patientUser = await userModel.create({
      fullName: { firstName: 'Patient', lastName: 'One' },
      email: `patient_sec10_${suffix}@example.com`,
      password: 'Password123!',
      role: 'patient',
      isActive: true,
      verificationStatus: 'approved',
      loginId: `PAT-${suffix}`
    });
    createdUserIds.push(patientUser._id);
    const patientToken = patientUser.generateAuthToken();

    // Create Admin User
    const adminUser = await userModel.create({
      fullName: { firstName: 'Super', lastName: 'Admin' },
      email: `admin_sec10_${suffix}@example.com`,
      password: 'Password123!',
      role: 'admin',
      isActive: true,
      verificationStatus: 'approved',
      loginId: `ADM-${suffix}`
    });
    createdUserIds.push(adminUser._id);
    const adminToken = adminUser.generateAuthToken();

    // Create Pending Doctor applicant for admin rejection testing
    const pendingApplicant = await userModel.create({
      fullName: { firstName: 'Dr. Pending', lastName: 'Applicant' },
      email: `pending_sec10_${suffix}@example.com`,
      password: 'Password123!',
      role: 'doctor',
      isActive: false,
      verificationStatus: 'pending'
    });
    createdUserIds.push(pendingApplicant._id);

    // Create a Patient Profile & Screening for review testing
    const patientProfile = await PatientProfile.create({
      patientId: `PAT-SEC10-${suffix}`,
      userId: patientUser._id,
      fullName: { firstName: 'Screened', lastName: 'Patient' },
      phone: '9876543210',
      claimStatus: 'claimed'
    });
    createdProfileIds.push(patientProfile._id);

    const screening = await Screening.create({
      patientId: patientProfile._id,
      userId: patientUser._id,
      screeningType: 'self',
      status: 'pending_review',
      screeningReferenceId: `SCR-SEC10-${suffix}`,
      images: {
        originalUrl: 'https://res.cloudinary.com/drishti/image/upload/v1/test.jpg',
        storageProvider: 'cloudinary'
      }
    });
    createdScreeningIds.push(screening._id);

    console.log('Seed data created successfully\n');

    // -------------------------------------------------------------
    // SECTION 3: CLINICAL REVIEW ROUTE VALIDATION (POST /api/reviews/:screeningId)
    // -------------------------------------------------------------
    console.log('--- 3. Clinical Review Route Validation Tests ---');

    // 3.1 Valid review submission -> 200
    const validRevRes = await fetch(`${baseUrl}/api/reviews/${screening._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${doctorToken}`
      },
      body: JSON.stringify({
        clinicalGrade: 2,
        triageLevel: 'priority',
        clinicalNotes: 'Mild NPDR observed with microaneurysms.',
        referralHospital: 'District Eye Center'
      })
    });
    const validRevData = await validRevRes.json();
    assert(
      'Valid clinical review submission returns HTTP 200',
      validRevRes.status === 200 && validRevData.success === true,
      `Status: ${validRevRes.status}`
    );

    // 3.2 Missing required clinicalGrade -> 400
    const missingGradeRes = await fetch(`${baseUrl}/api/reviews/${screening._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${doctorToken}`
      },
      body: JSON.stringify({
        triageLevel: 'priority',
        clinicalNotes: 'Notes without grade'
      })
    });
    const missingGradeData = await missingGradeRes.json();
    assert(
      'Missing clinicalGrade returns HTTP 400 with safe message',
      missingGradeRes.status === 400 && missingGradeData.message === 'Clinical grade (0 to 4) is required',
      `Message: ${missingGradeData.message}`
    );

    // 3.3 Float clinicalGrade (2.5) -> 400
    const floatGradeRes = await fetch(`${baseUrl}/api/reviews/${screening._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${doctorToken}`
      },
      body: JSON.stringify({
        clinicalGrade: 2.5
      })
    });
    const floatGradeData = await floatGradeRes.json();
    assert(
      'Non-integer float grade (2.5) returns HTTP 400',
      floatGradeRes.status === 400 && floatGradeData.message === 'Clinical grade must be an integer between 0 and 4',
      `Message: ${floatGradeData.message}`
    );

    // 3.4 Out-of-range clinicalGrade (5) -> 400
    const highGradeRes = await fetch(`${baseUrl}/api/reviews/${screening._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${doctorToken}`
      },
      body: JSON.stringify({
        clinicalGrade: 5
      })
    });
    assert('Out-of-range grade (5) returns HTTP 400', highGradeRes.status === 400);

    // 3.5 Negative clinicalGrade (-1) -> 400
    const negGradeRes = await fetch(`${baseUrl}/api/reviews/${screening._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${doctorToken}`
      },
      body: JSON.stringify({
        clinicalGrade: -1
      })
    });
    assert('Negative grade (-1) returns HTTP 400', negGradeRes.status === 400);

    // 3.6 Boolean grade (true) -> 400
    const boolGradeRes = await fetch(`${baseUrl}/api/reviews/${screening._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${doctorToken}`
      },
      body: JSON.stringify({
        clinicalGrade: true
      })
    });
    assert('Boolean grade (true) returns HTTP 400 (not coerced to 1)', boolGradeRes.status === 400);

    // 3.7 Invalid triageLevel enum -> 400
    const badTriageRes = await fetch(`${baseUrl}/api/reviews/${screening._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${doctorToken}`
      },
      body: JSON.stringify({
        clinicalGrade: 3,
        triageLevel: 'emergency' // not in routine, priority, urgent
      })
    });
    const badTriageData = await badTriageRes.json();
    assert(
      'Invalid triageLevel returns HTTP 400',
      badTriageRes.status === 400 && badTriageData.message.includes('routine, priority, or urgent'),
      `Message: ${badTriageData.message}`
    );

    // 3.8 Oversized string for clinicalNotes (> 5000 chars) -> 400
    const oversizedNotesRes = await fetch(`${baseUrl}/api/reviews/${screening._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${doctorToken}`
      },
      body: JSON.stringify({
        clinicalGrade: 1,
        clinicalNotes: 'A'.repeat(5001)
      })
    });
    assert('Oversized clinicalNotes (> 5000 chars) returns HTTP 400', oversizedNotesRes.status === 400);

    // 3.9 Unknown field in review body -> 400
    const unknownRevRes = await fetch(`${baseUrl}/api/reviews/${screening._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${doctorToken}`
      },
      body: JSON.stringify({
        clinicalGrade: 1,
        injectedField: 'malicious'
      })
    });
    assert('Unknown field injection in review body returns HTTP 400', unknownRevRes.status === 400);

    // 3.10 Protected field "role" in review body -> 400
    const protectedRevRes = await fetch(`${baseUrl}/api/reviews/${screening._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${doctorToken}`
      },
      body: JSON.stringify({
        clinicalGrade: 1,
        role: 'admin'
      })
    });
    assert('Protected field "role" in review body returns HTTP 400', protectedRevRes.status === 400);

    // 3.11 Malformed screeningId param -> 400
    const malformedIdRes = await fetch(`${baseUrl}/api/reviews/not-a-valid-objectid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${doctorToken}`
      },
      body: JSON.stringify({
        clinicalGrade: 2
      })
    });
    const malformedIdData = await malformedIdRes.json();
    assert(
      'Malformed screeningId param returns HTTP 400 with safe message',
      malformedIdRes.status === 400 && malformedIdData.message === 'Invalid screening ID',
      `Message: ${malformedIdData.message}`
    );

    // 3.12 RBAC preservation: Unauthenticated POST /api/reviews/:id -> 401
    const unauthRevRes = await fetch(`${baseUrl}/api/reviews/${screening._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicalGrade: 2 })
    });
    assert('Unauthenticated review request returns HTTP 401 (auth runs before validation)', unauthRevRes.status === 401);

    // 3.13 RBAC preservation: Healthcare Worker POST /api/reviews/:id -> 403
    const hcwRevRes = await fetch(`${baseUrl}/api/reviews/${screening._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({ clinicalGrade: 2 })
    });
    assert('Healthcare Worker cannot review (HTTP 403, RBAC preserved)', hcwRevRes.status === 403);

    // -------------------------------------------------------------
    // SECTION 4: FIELD PATIENT REGISTRATION VALIDATION (POST /api/patients)
    // -------------------------------------------------------------
    console.log('\n--- 4. Field Patient Registration Validation Tests ---');

    // 4.1 Valid registration with address and duration 0 -> 201
    const validFieldRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'Vimla',
        lastName: 'Devi',
        phone: '9876543210',
        dateOfBirth: '1980-04-12',
        gender: 'female',
        diabetesStatus: 'yes',
        diabetesDuration: 0,
        address: {
          village: 'Rampur',
          district: 'Varanasi',
          state: 'Uttar Pradesh',
          pincode: '221001'
        }
      })
    });
    const validFieldData = await validFieldRes.json();
    if (validFieldData.data?.profileId) createdProfileIds.push(validFieldData.data.profileId);
    assert(
      'Valid field patient registration returns HTTP 201 with claimCode',
      validFieldRes.status === 201 && validFieldData.success === true && !!validFieldData.data?.claimCode,
      `Status: ${validFieldRes.status}`
    );

    // 4.2 Missing firstName -> 400
    const missingFirstRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        lastName: 'Sharma',
        gender: 'male'
      })
    });
    const missingFirstData = await missingFirstRes.json();
    assert(
      'Missing firstName returns HTTP 400',
      missingFirstRes.status === 400 && missingFirstData.message === 'Patient first name is required',
      `Message: ${missingFirstData.message}`
    );

    // 4.3 Whitespace-only firstName -> 400
    const blankFirstRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: '   ',
        lastName: 'Sharma'
      })
    });
    assert('Whitespace-only firstName returns HTTP 400', blankFirstRes.status === 400);

    // 4.4 Wrong type for firstName (number or boolean) -> 400
    const boolFirstRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: true
      })
    });
    assert('Boolean firstName returns HTTP 400 (not coerced to string)', boolFirstRes.status === 400);

    // 4.5 Future date of birth -> 400
    const futureDobRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'Future',
        dateOfBirth: '2099-01-01'
      })
    });
    const futureDobData = await futureDobRes.json();
    assert(
      'Future dateOfBirth returns HTTP 400',
      futureDobRes.status === 400 && futureDobData.message.includes('future'),
      `Message: ${futureDobData.message}`
    );

    // 4.6 Invalid date string -> 400
    const badDateRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'BadDate',
        dateOfBirth: 'not-a-valid-date'
      })
    });
    assert('Invalid dateOfBirth string returns HTTP 400', badDateRes.status === 400);

    // 4.7 Negative diabetes duration -> 400
    const negDurRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'NegDur',
        diabetesDuration: -5
      })
    });
    const negDurData = await negDurRes.json();
    assert(
      'Negative diabetesDuration returns HTTP 400',
      negDurRes.status === 400 && negDurData.message.includes('non-negative'),
      `Message: ${negDurData.message}`
    );

    // 4.8 Wrong type for diabetes duration (boolean) -> 400
    const boolDurRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'BoolDur',
        diabetesDuration: true
      })
    });
    assert('Boolean diabetesDuration returns HTTP 400', boolDurRes.status === 400);

    // 4.9 Invalid gender enum -> 400
    const badGenderRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'BadGender',
        gender: 'alien'
      })
    });
    assert('Invalid gender enum returns HTTP 400', badGenderRes.status === 400);

    // 4.10 Arbitrary nested property in address object -> 400
    const nestedInjectRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'NestedInject',
        address: {
          village: 'ValidVillage',
          arbitraryKey: 'maliciousProperty'
        }
      })
    });
    const nestedInjectData = await nestedInjectRes.json();
    assert(
      'Nested address property injection returns HTTP 400',
      nestedInjectRes.status === 400 && nestedInjectData.message.includes('arbitraryKey'),
      `Message: ${nestedInjectData.message}`
    );

    // 4.11 Non-object address (string instead of object) -> 400
    const strAddressRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'StrAddress',
        address: '123 Village Lane'
      })
    });
    assert('String address instead of object returns HTTP 400', strAddressRes.status === 400);

    // 4.12 Protected field injection: role -> 400
    const roleInjectRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'RoleInject',
        role: 'admin'
      })
    });
    const roleInjectData = await roleInjectRes.json();
    assert(
      'Protected field "role" in registration body returns HTTP 400',
      roleInjectRes.status === 400 && roleInjectData.message.includes('role'),
      `Message: ${roleInjectData.message}`
    );

    // 4.13 Protected field injection: claimStatus -> 400
    const claimInjectRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'ClaimInject',
        claimStatus: 'claimed'
      })
    });
    assert('Protected field "claimStatus" in registration body returns HTTP 400', claimInjectRes.status === 400);

    // 4.14 RBAC preservation: Unauthenticated POST /api/patients -> 401
    const unauthPatRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Unauth' })
    });
    assert('Unauthenticated registration returns HTTP 401', unauthPatRes.status === 401);

    // 4.15 RBAC preservation: Patient role cannot register field patients -> 403
    const patRoleRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${patientToken}`
      },
      body: JSON.stringify({ firstName: 'PatRegister' })
    });
    assert('Patient role cannot register field patients (HTTP 403)', patRoleRes.status === 403);

    // -------------------------------------------------------------
    // SECTION 5: ADMIN VERIFICATION REJECTION ROUTE (PATCH /api/admin/verification/:userId/reject)
    // -------------------------------------------------------------
    console.log('\n--- 5. Admin Verification Rejection Route Validation Tests ---');

    // 5.1 Malformed userId parameter -> 400
    const badAdminIdRes = await fetch(`${baseUrl}/api/admin/verification/invalid-hex-id/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${adminToken}`
      },
      body: JSON.stringify({ reason: 'Invalid credentials' })
    });
    const badAdminIdData = await badAdminIdRes.json();
    assert(
      'Malformed userId param returns HTTP 400 with safe message',
      badAdminIdRes.status === 400 && badAdminIdData.message === 'Invalid user ID',
      `Message: ${badAdminIdData.message}`
    );

    // 5.2 Oversized reason string (> 1000 chars) -> 400
    const longReasonRes = await fetch(`${baseUrl}/api/admin/verification/${pendingApplicant._id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${adminToken}`
      },
      body: JSON.stringify({ reason: 'B'.repeat(1001) })
    });
    const longReasonData = await longReasonRes.json();
    assert(
      'Oversized reason (> 1000 chars) returns HTTP 400',
      longReasonRes.status === 400 && longReasonData.message.includes('1000'),
      `Message: ${longReasonData.message}`
    );

    // 5.3 Unknown field in admin reject body -> 400
    const unknownAdminRes = await fetch(`${baseUrl}/api/admin/verification/${pendingApplicant._id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${adminToken}`
      },
      body: JSON.stringify({
        reason: 'Valid reason',
        maliciousKey: 'attack'
      })
    });
    assert('Unknown field in admin reject body returns HTTP 400', unknownAdminRes.status === 400);

    // 5.4 Protected field "isActive" in admin reject body -> 400
    const protectedAdminRes = await fetch(`${baseUrl}/api/admin/verification/${pendingApplicant._id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${adminToken}`
      },
      body: JSON.stringify({
        reason: 'Valid reason',
        isActive: true
      })
    });
    assert('Protected field "isActive" in admin reject body returns HTTP 400', protectedAdminRes.status === 400);

    // 5.5 Dual mount verification: /api/v1/admin/verification/:userId/reject validates params
    const v1BadIdRes = await fetch(`${baseUrl}/api/v1/admin/verification/bad-id-123/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${adminToken}`
      },
      body: JSON.stringify({ reason: 'Some reason' })
    });
    assert('Dual mount /api/v1/admin route also enforces param validation (HTTP 400)', v1BadIdRes.status === 400);

    // 5.6 RBAC preservation: Non-admin (doctor) cannot reject applicant -> 403
    const docRejectRes = await fetch(`${baseUrl}/api/admin/verification/${pendingApplicant._id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${doctorToken}`
      },
      body: JSON.stringify({ reason: 'Doctor attempt' })
    });
    assert('Non-admin role cannot access reject endpoint (HTTP 403, RBAC preserved)', docRejectRes.status === 403);

    // 5.7 Valid admin rejection -> 200
    const validRejectRes = await fetch(`${baseUrl}/api/admin/verification/${pendingApplicant._id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${adminToken}`
      },
      body: JSON.stringify({ reason: 'Incomplete state medical council registration certificate' })
    });
    const validRejectData = await validRejectRes.json();
    assert(
      'Valid admin rejection succeeds with HTTP 200',
      validRejectRes.status === 200 && validRejectData.success === true,
      `Status: ${validRejectRes.status}`
    );

    // -------------------------------------------------------------
    // SECTION 6: SAFE ERROR ENVELOPE AUDIT
    // -------------------------------------------------------------
    console.log('\n--- 6. Safe Error Envelope Audit ---');
    assert(
      'Error responses use consistent safe envelope { status: "failed", message: "..." }',
      badAdminIdData.status === 'failed' && typeof badAdminIdData.message === 'string'
    );
    assert(
      'Error response contains no stack trace leak',
      badAdminIdData.stack === undefined
    );
    assert(
      'Error response contains no raw Mongoose / Mongo internals',
      !JSON.stringify(badAdminIdData).includes('MongoError') && !JSON.stringify(badAdminIdData).includes('CastError')
    );

  } catch (err) {
    console.error('Unexpected test error in SEC-10 suite:', err);
  } finally {
    // Cleanup created test records
    console.log('\n--- Cleaning up Test Artifacts ---');
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
      console.log('Test artifacts removed.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    server.close();
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');

    console.log(`\n========================================`);
    console.log(`SEC-10 Test Suite Results: ${passedTests} / ${totalTests} passed`);
    console.log(`========================================\n`);

    if (passedTests !== totalTests) {
      process.exit(1);
    }
  }
}

runSec10Tests();
