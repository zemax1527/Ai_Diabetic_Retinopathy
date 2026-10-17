const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

// Set lower threshold for testing rate limiter directly
process.env.CLAIM_RATE_LIMIT_MAX = '3';

const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const userModel = require('../models/user.model');
const PatientProfile = require('../models/patientProfile.model');

async function runClaimRateLimitTests() {
  console.log('=== Starting Dedicated Claim Rate Limiter Test Suite ===\n');

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
    // Setup patient and HCW actors
    const patientUser = await userModel.create({
      fullName: { firstName: 'RateLimit', lastName: 'Patient' },
      email: `rl_pat_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true,
      loginId: `PAT-2026-${String(suffix).slice(-4)}`
    });
    createdUserIds.push(patientUser._id);
    const patientToken = patientUser.generateAuthToken();

    const patProfile = await PatientProfile.create({
      userId: patientUser._id,
      patientId: patientUser.loginId,
      fullName: patientUser.fullName,
      registrationType: 'self',
      claimStatus: 'claimed'
    });
    createdProfileIds.push(patProfile._id);

    const hcwUser = await userModel.create({
      fullName: { firstName: 'HCW', lastName: 'RateLimit' },
      email: `rl_hcw_${suffix}@test.com`,
      password: 'Password@123',
      role: 'healthcare_worker',
      verificationStatus: 'approved',
      isActive: true,
      loginId: `HCW-2026-${String(suffix).slice(-4)}`
    });
    createdUserIds.push(hcwUser._id);
    const hcwToken = hcwUser.generateAuthToken();

    // -------------------------------------------------------------
    // TEST 1: Unauthenticated request to /claim is rejected with 401
    // -------------------------------------------------------------
    const unauthRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: 'PAT-2026-9999', claimCode: 'CLM-AAAAAA' })
    });
    assert('Unauthenticated request to POST /claim returns HTTP 401', unauthRes.status === 401);

    // -------------------------------------------------------------
    // TEST 2: Non-patient role (healthcare_worker) to /claim is rejected with 403
    // -------------------------------------------------------------
    const hcwClaimRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({ patientId: 'PAT-2026-9999', claimCode: 'CLM-AAAAAA' })
    });
    assert('Non-patient role attempting POST /claim returns HTTP 403', hcwClaimRes.status === 403);

    // -------------------------------------------------------------
    // TEST 3: Authenticated patient normal profile route works (not blocked by claim rate limiter)
    // -------------------------------------------------------------
    const profileRes = await fetch(`${baseUrl}/api/patients/me`, {
      headers: { Cookie: `token=${patientToken}` }
    });
    assert('Authenticated patient can access GET /api/patients/me (HTTP 200)', profileRes.status === 200);

    // -------------------------------------------------------------
    // TEST 4, 5, 6: Patient attempts claims up to limit (3 attempts allowed)
    // -------------------------------------------------------------
    for (let i = 1; i <= 3; i++) {
      const attemptRes = await fetch(`${baseUrl}/api/patients/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({ patientId: 'PAT-2026-0001', claimCode: `CLM-FAIL0${i}`, phone: '9999999999' })
      });
      assert(
        `Attempt ${i} within limit is processed (not rate-limited)`,
        attemptRes.status !== 429,
        `HTTP Status: ${attemptRes.status}`
      );
    }

    // -------------------------------------------------------------
    // TEST 7: 4th attempt exceeds limit and is blocked with HTTP 429
    // -------------------------------------------------------------
    const blockedRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${patientToken}`
      },
      body: JSON.stringify({ patientId: 'PAT-2026-0001', claimCode: 'CLM-FAIL04', phone: '9999999999' })
    });
    const blockedData = await blockedRes.json();
    assert(
      'Repeated claim attempts exceeding limit return HTTP 429 Too Many Requests',
      blockedRes.status === 429,
      `HTTP Status: ${blockedRes.status}`
    );
    assert(
      'Rate-limit response body contains generic safe message',
      blockedData.status === 'failed' && blockedData.message.includes('Too many claim attempts'),
      `Message: "${blockedData.message}"`
    );

    // -------------------------------------------------------------
    // TEST 8: Other patient routes (e.g. GET /api/patients/me) are NOT blocked by /claim rate limit
    // -------------------------------------------------------------
    const postRateLimitProfileRes = await fetch(`${baseUrl}/api/patients/me`, {
      headers: { Cookie: `token=${patientToken}` }
    });
    assert(
      'Normal patient APIs (GET /api/patients/me) remain operational and not affected by claim rate limit',
      postRateLimitProfileRes.status === 200
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

runClaimRateLimitTests().catch(console.error);
