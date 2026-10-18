const dns = require('dns')
dns.setServers(['8.8.8.8', '1.1.1.1'])
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const http = require('http')
const mongoose = require('mongoose')
const app = require('../app')
const userModel = require('../models/user.model')
const PatientProfile = require('../models/patientProfile.model')
const Screening = require('../models/screening.model')
const AuditLog = require('../models/auditLog.model')

async function runSec08Tests() {
  console.log('=== SEC-08: Screening Reference Uniqueness & Concurrency Safety Tests ===\n')

  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  // Ensure indexes are built in MongoDB development instance
  await Screening.init()
  console.log('Screening model indexes initialized\n')

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://localhost:${port}`
  console.log(`Test server running on port ${port}\n`)

  const suffix = Date.now()
  const createdUserIds = []
  const createdProfileIds = []
  const createdScreeningIds = []
  const createdAuditLogIds = []

  let passedTests = 0
  let totalTests = 0

  function assert(title, condition, extraInfo = '') {
    totalTests++
    if (condition) {
      passedTests++
      console.log(`PASS [Test ${totalTests}]: ${title} ${extraInfo ? `(${extraInfo})` : ''}`)
    } else {
      console.error(`FAIL [Test ${totalTests}]: ${title} ${extraInfo ? `(${extraInfo})` : ''}`)
    }
  }

  try {
    // -------------------------------------------------------------
    // SETUP: Create actors
    // -------------------------------------------------------------
    // Healthcare Worker
    const hcwUser = await userModel.create({
      fullName: { firstName: 'Worker', lastName: 'SEC08' },
      email: `hcw_sec08_${suffix}@test.com`,
      password: 'Password@123',
      role: 'healthcare_worker',
      verificationStatus: 'approved',
      isActive: true,
      loginId: `HCW-2026-${String(suffix).slice(-4)}`
    })
    createdUserIds.push(hcwUser._id)
    const hcwToken = hcwUser.generateAuthToken()

    // Patient 1
    const patient1User = await userModel.create({
      fullName: { firstName: 'PatientOne', lastName: 'SEC08' },
      email: `pat1_sec08_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true,
      loginId: `PAT-2026-${String(suffix + 1).slice(-4)}`
    })
    createdUserIds.push(patient1User._id)
    const patient1Token = patient1User.generateAuthToken()

    const patient1Profile = await PatientProfile.create({
      userId: patient1User._id,
      patientId: patient1User.loginId,
      fullName: { firstName: 'PatientOne', lastName: 'SEC08' },
      phone: '9876500001',
      claimStatus: 'claimed',
      registrationType: 'self'
    })
    createdProfileIds.push(patient1Profile._id)

    // Patient 2
    const patient2User = await userModel.create({
      fullName: { firstName: 'PatientTwo', lastName: 'SEC08' },
      email: `pat2_sec08_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true,
      loginId: `PAT-2026-${String(suffix + 2).slice(-4)}`
    })
    createdUserIds.push(patient2User._id)
    const patient2Token = patient2User.generateAuthToken()

    const patient2Profile = await PatientProfile.create({
      userId: patient2User._id,
      patientId: patient2User.loginId,
      fullName: { firstName: 'PatientTwo', lastName: 'SEC08' },
      phone: '9876500002',
      claimStatus: 'claimed',
      registrationType: 'self'
    })
    createdProfileIds.push(patient2Profile._id)

    // -------------------------------------------------------------
    // TEST 1: Inspect MongoDB Index Definition
    // -------------------------------------------------------------
    const db = mongoose.connection.db
    const screeningIndexes = await db.collection('screenings').indexes()
    const compoundIndex = screeningIndexes.find(
      (idx) => idx.key && idx.key.patientId === 1 && idx.key.screeningReferenceId === 1
    )

    assert(
      'Compound index on { patientId: 1, screeningReferenceId: 1 } exists in database',
      Boolean(compoundIndex)
    )
    assert(
      'Compound index has unique: true',
      compoundIndex?.unique === true
    )
    assert(
      'Compound index has partialFilterExpression matching screeningReferenceId type string',
      compoundIndex?.partialFilterExpression?.screeningReferenceId?.$type === 'string'
    )
    assert(
      'Compound index does not set sparse: true (no sparse/partial conflict)',
      !compoundIndex?.sparse
    )

    // -------------------------------------------------------------
    // TEST 2: Valid unique screening record creation via API
    // -------------------------------------------------------------
    const sharedRefId = `CAMP-REF-${suffix}`

    const syncRes1 = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patient1Profile._id.toString(),
        screeningData: {
          screeningId: sharedRefId,
          classification: { grade: 2, label: 'Moderate DR', confidence: '89%' },
          decision: { decision: 'REFERABLE', referable: true, reason: 'Exudates noted' }
        }
      })
    })
    const syncJson1 = await syncRes1.json()

    assert(
      'Valid initial screening sync succeeds with HTTP 201',
      syncRes1.status === 201 && syncJson1.success === true
    )
    if (syncJson1.data?._id) createdScreeningIds.push(syncJson1.data._id)
    assert(
      'Stored screening document contains correct patientId and trimmed screeningReferenceId',
      syncJson1.data?.patientId?.toString() === patient1Profile._id.toString() &&
      syncJson1.data?.screeningReferenceId === sharedRefId
    )

    // -------------------------------------------------------------
    // TEST 3: Duplicate submission for SAME patient via API (Idempotency)
    // -------------------------------------------------------------
    const syncResDuplicate = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patient1Profile._id.toString(),
        screeningData: {
          screeningId: sharedRefId,
          classification: { grade: 2, label: 'Moderate DR', confidence: '89%' }
        }
      })
    })
    const syncJsonDuplicate = await syncResDuplicate.json()

    assert(
      'Sequential duplicate sync for same patient returns HTTP 200 with isDuplicate: true',
      syncResDuplicate.status === 200 &&
      syncJsonDuplicate.success === true &&
      syncJsonDuplicate.isDuplicate === true
    )
    assert(
      'Duplicate sync response returns existing screening record ID',
      syncJsonDuplicate.data?._id?.toString() === syncJson1.data?._id?.toString()
    )

    // -------------------------------------------------------------
    // TEST 4: Direct DB insertion of duplicate pair is rejected by MongoDB E11000
    // -------------------------------------------------------------
    let directDuplicateRejected = false
    let directDuplicateErrorCode = null
    try {
      await Screening.create({
        patientId: patient1Profile._id,
        userId: patient1User._id,
        screeningType: 'self',
        screeningReferenceId: sharedRefId,
        status: 'completed'
      })
    } catch (dbErr) {
      directDuplicateRejected = true
      directDuplicateErrorCode = dbErr.code
    }

    assert(
      'Direct duplicate insertion for same patient is rejected by database constraint',
      directDuplicateRejected === true
    )
    assert(
      'Rejection error code is MongoDB E11000 (duplicate key)',
      directDuplicateErrorCode === 11000
    )

    // -------------------------------------------------------------
    // TEST 5: Graceful E11000 race-condition handling in syncScreening
    // (Simulate race where findOne misses, but create catches E11000)
    // -------------------------------------------------------------
    // We test this by creating a screening directly in DB first with a new refId,
    // then invoking syncScreening to verify the response handling.
    const raceRefId = `RACE-REF-${suffix}`
    const directScr = await Screening.create({
      patientId: patient1Profile._id,
      userId: patient1User._id,
      screeningType: 'assisted',
      conductedBy: hcwUser._id,
      screeningReferenceId: raceRefId,
      status: 'completed'
    })
    createdScreeningIds.push(directScr._id)

    const syncRaceRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patient1Profile._id.toString(),
        screeningData: {
          id: raceRefId,
          classification: { grade: 0, label: 'No DR', confidence: '99%' }
        }
      })
    })
    const syncRaceJson = await syncRaceRes.json()

    assert(
      'syncScreening gracefully returns HTTP 200 with isDuplicate: true when record exists',
      syncRaceRes.status === 200 &&
      syncRaceJson.isDuplicate === true &&
      syncRaceJson.data?._id?.toString() === directScr._id.toString()
    )

    // -------------------------------------------------------------
    // TEST 6: Same screeningReferenceId for a DIFFERENT patient is ALLOWED
    // -------------------------------------------------------------
    const syncPatient2Res = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patient2Profile._id.toString(),
        screeningData: {
          screeningId: sharedRefId, // Same reference ID as Patient 1
          classification: { grade: 1, label: 'Mild NPDR', confidence: '91%' },
          decision: { decision: 'NON-REFERABLE', referable: false }
        }
      })
    })
    const syncPatient2Json = await syncPatient2Res.json()

    assert(
      'Different patient can use the same screeningReferenceId without conflict (HTTP 201)',
      syncPatient2Res.status === 201 && syncPatient2Json.success === true
    )
    if (syncPatient2Json.data?._id) createdScreeningIds.push(syncPatient2Json.data._id)
    assert(
      'Patient 2 screening is linked to Patient 2 profile',
      syncPatient2Json.data?.patientId?.toString() === patient2Profile._id.toString() &&
      syncPatient2Json.data?._id?.toString() !== syncJson1.data?._id?.toString()
    )

    // -------------------------------------------------------------
    // TEST 7: Missing / null screeningReferenceId behavior (Partial index test)
    // Multiple records with null or missing screeningReferenceId for the same patient must NOT conflict
    // -------------------------------------------------------------
    let nullRef1, nullRef2, missingRef1, missingRef2
    let nullRefAllowed = false

    try {
      nullRef1 = await Screening.create({
        patientId: patient1Profile._id,
        userId: patient1User._id,
        screeningType: 'self',
        screeningReferenceId: null,
        status: 'completed'
      })
      createdScreeningIds.push(nullRef1._id)

      nullRef2 = await Screening.create({
        patientId: patient1Profile._id,
        userId: patient1User._id,
        screeningType: 'self',
        screeningReferenceId: null,
        status: 'completed'
      })
      createdScreeningIds.push(nullRef2._id)

      missingRef1 = await Screening.create({
        patientId: patient1Profile._id,
        userId: patient1User._id,
        screeningType: 'self',
        status: 'completed'
      })
      createdScreeningIds.push(missingRef1._id)

      missingRef2 = await Screening.create({
        patientId: patient1Profile._id,
        userId: patient1User._id,
        screeningType: 'self',
        status: 'completed'
      })
      createdScreeningIds.push(missingRef2._id)

      nullRefAllowed = true
    } catch (nullErr) {
      console.error('Error creating null/missing reference records:', nullErr)
      nullRefAllowed = false
    }

    assert(
      'Multiple records with screeningReferenceId: null for same patient do not conflict (partial filter works)',
      nullRefAllowed && nullRef1?._id && nullRef2?._id && nullRef1._id.toString() !== nullRef2._id.toString()
    )
    assert(
      'Multiple records with missing/undefined screeningReferenceId for same patient do not conflict',
      nullRefAllowed && missingRef1?._id && missingRef2?._id && missingRef1._id.toString() !== missingRef2._id.toString()
    )

    // -------------------------------------------------------------
    // TEST 8: Self-screening by patient via API
    // -------------------------------------------------------------
    const selfSyncRef = `SELF-REF-${suffix}`
    const selfSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        screeningData: {
          screeningId: selfSyncRef,
          classification: { grade: 0, label: 'No DR', confidence: '97%' },
          decision: { decision: 'NON-REFERABLE', referable: false }
        }
      })
    })
    const selfSyncJson = await selfSyncRes.json()

    assert(
      'Patient self-screening sync succeeds with HTTP 201',
      selfSyncRes.status === 201 && selfSyncJson.success === true
    )
    if (selfSyncJson.data?._id) createdScreeningIds.push(selfSyncJson.data._id)
    assert(
      'Self-screening records screeningType "self" and conductedBy null',
      selfSyncJson.data?.screeningType === 'self' && selfSyncJson.data?.conductedBy === null
    )

    // -------------------------------------------------------------
    // TEST 9: Unrelated screening query endpoints continue to function
    // -------------------------------------------------------------
    // GET /api/screenings/my as patient
    const myScreeningsRes = await fetch(`${baseUrl}/api/screenings/my`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    })
    const myScreeningsJson = await myScreeningsRes.json()

    assert(
      'GET /api/screenings/my succeeds with HTTP 200 for patient',
      myScreeningsRes.status === 200 && myScreeningsJson.success === true
    )
    assert(
      'GET /api/screenings/my returns patient history array',
      Array.isArray(myScreeningsJson.data) && myScreeningsJson.count > 0
    )

    // GET /api/screenings/:id
    const singleScreeningRes = await fetch(`${baseUrl}/api/screenings/${syncJson1.data._id}`, {
      headers: { Authorization: `Bearer ${hcwToken}` }
    })
    const singleScreeningJson = await singleScreeningRes.json()

    assert(
      'GET /api/screenings/:id succeeds with HTTP 200 for authorized HCW',
      singleScreeningRes.status === 200 && singleScreeningJson.success === true
    )
    assert(
      'Single screening detail includes populated patientId object',
      singleScreeningJson.data?.patientId && typeof singleScreeningJson.data.patientId === 'object'
    )

    // -------------------------------------------------------------
    // TEST 10: RBAC security is not regressed
    // -------------------------------------------------------------
    const unauthSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screeningData: { id: `UNAUTH-${suffix}` } })
    })
    assert(
      'Unauthenticated screening sync request is rejected with HTTP 401',
      unauthSyncRes.status === 401
    )

    // Cross-patient unauthorized spoofing attempt
    const spoofSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        patientId: patient2Profile._id.toString(), // Patient 1 tries to submit for Patient 2
        screeningData: { id: `SPOOF-${suffix}` }
      })
    })
    assert(
      'Patient attempting to submit screening for another patient is rejected with HTTP 403',
      spoofSyncRes.status === 403
    )

    console.log(`\n=============================================================`)
    console.log(`Results: ${passedTests}/${totalTests} tests PASSED`)
    console.log(`=============================================================\n`)
  } catch (err) {
    console.error('Unexpected error during SEC-08 tests:', err)
  } finally {
    console.log('Cleaning up test fixtures...')
    try {
      if (createdScreeningIds.length > 0) {
        await Screening.deleteMany({ _id: { $in: createdScreeningIds } })
      }
      if (createdProfileIds.length > 0) {
        await PatientProfile.deleteMany({ _id: { $in: createdProfileIds } })
      }
      if (createdUserIds.length > 0) {
        await userModel.deleteMany({ _id: { $in: createdUserIds } })
      }
      await AuditLog.deleteMany({ 'details.referenceId': { $regex: String(suffix) } })
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message)
    }
    await mongoose.disconnect()
    server.close()
    console.log('Test suite finished.')
  }
}

runSec08Tests()
