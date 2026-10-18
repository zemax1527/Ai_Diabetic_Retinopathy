const dns = require('dns')
dns.setServers(['8.8.8.8', '1.1.1.1'])
require('dotenv').config()

const http = require('http')
const mongoose = require('mongoose')
const app = require('../app')
const userModel = require('../models/user.model')
const PatientProfile = require('../models/patientProfile.model')
const Screening = require('../models/screening.model')

async function runSec07Tests() {
  console.log('=============================================================')
  console.log('   SEC-07 Patient Portal Claim Flow Regression Suite')
  console.log('=============================================================\n')

  await mongoose.connect(process.env.MONGO_URI)
  console.log('✓ Connected to MongoDB')

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://localhost:${port}`
  console.log(`✓ Test server running on port ${port}\n`)

  const suffix = Date.now()
  const createdUserIds = []
  const createdProfileIds = []
  const createdScreeningIds = []

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
    // 1. Create Healthcare Worker actor
    const hcwUser = await userModel.create({
      fullName: { firstName: 'Worker', lastName: 'Sunita' },
      email: `hcw_sec07_${suffix}@test.com`,
      password: 'Password@123',
      role: 'healthcare_worker',
      verificationStatus: 'approved',
      isActive: true
    })
    createdUserIds.push(hcwUser._id)
    const hcwToken = hcwUser.generateAuthToken()

    // 2. Healthcare worker registers a field outreach patient
    const regRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'Meera',
        lastName: 'Jadhav',
        phone: '9822012345',
        dateOfBirth: '1979-08-20',
        gender: 'female',
        address: { village: 'Shirur', district: 'Pune', state: 'Maharashtra' }
      })
    })
    const regData = await regRes.json()
    assert('Field patient registered successfully via HCW (201)', regRes.status === 201, `Status: ${regRes.status}`)
    const fieldPatientId = regData.data?.patientId
    const fieldClaimCode = regData.data?.claimCode
    const fieldProfileId = regData.data?.profileId || regData.data?._id
    createdProfileIds.push(fieldProfileId)

    assert('Field registration returns unique patientId format', /^PAT-\d{4}-\d+$/.test(fieldPatientId), `patientId: ${fieldPatientId}`)
    assert('Field registration returns plaintext claim code for physical slip', /^CLM-[A-F0-9]{6}$/.test(fieldClaimCode), `claimCode: ${fieldClaimCode}`)

    // 3. HCW conducts an assisted screening for this field patient
    const scrRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        patientId: fieldPatientId,
        screeningData: {
          id: `SCR-SEC07-${suffix}`,
          classification: { grade: 2, label: 'Moderate DR', confidence: '88%' },
          decision: { decision: 'REFERABLE', referable: true, reason: 'Microaneurysms detected in macula' },
          quality: { status: 'Good', score: 1 },
          images: { original: 'http://cloudinary.test/original.jpg' }
        }
      })
    })
    const scrData = await scrRes.json()
    assert('Outreach assisted screening submitted for field patient (201)', scrRes.status === 201 && scrData.success === true, `Status: ${scrRes.status}`)
    createdScreeningIds.push(scrData.data?._id)

    // 4. Create newly registered online patient account (claimant)
    const patientUser = await userModel.create({
      fullName: { firstName: 'Meera', lastName: 'Jadhav' },
      email: `meera_sec07_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true,
      loginId: `PAT-CLAIMANT-${suffix.toString().slice(-4)}`
    })
    createdUserIds.push(patientUser._id)
    const patientToken = patientUser.generateAuthToken()

    // Create an initial placeholder profile for this online patient
    const initialProfile = await PatientProfile.create({
      userId: patientUser._id,
      patientId: patientUser.loginId,
      fullName: { firstName: 'Meera', lastName: 'Jadhav' },
      phone: '9822012345',
      registrationType: 'self',
      claimStatus: 'claimed'
    })
    createdProfileIds.push(initialProfile._id)

    // Before claim: online patient has zero screenings in /api/screenings/my
    const myScrBeforeRes = await fetch(`${baseUrl}/api/screenings/my`, {
      headers: { Cookie: `token=${patientToken}` }
    })
    const myScrBefore = await myScrBeforeRes.json()
    assert('Before claiming, patient account has 0 screenings', myScrBefore.data?.length === 0, `Count: ${myScrBefore.data?.length}`)

    // ─── TEST A: Authentication & Role Enforcement ────────────────────────────
    {
      const unauthRes = await fetch(`${baseUrl}/api/patients/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: fieldPatientId, claimCode: fieldClaimCode })
      })
      assert('Unauthenticated claim attempt returns 401', unauthRes.status === 401, `Status: ${unauthRes.status}`)

      const hcwClaimRes = await fetch(`${baseUrl}/api/patients/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${hcwToken}`
        },
        body: JSON.stringify({ patientId: fieldPatientId, claimCode: fieldClaimCode })
      })
      assert('Non-patient role (HCW) claim attempt returns 403', hcwClaimRes.status === 403, `Status: ${hcwClaimRes.status}`)
    }

    // ─── TEST B: Required Field Validation ───────────────────────────────────
    {
      const missingCodeRes = await fetch(`${baseUrl}/api/patients/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({ patientId: fieldPatientId })
      })
      assert('Claim request with missing claimCode returns 400', missingCodeRes.status === 400, `Status: ${missingCodeRes.status}`)

      const missingIdRes = await fetch(`${baseUrl}/api/patients/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({ claimCode: fieldClaimCode })
      })
      assert('Claim request with missing patientId returns 400', missingIdRes.status === 400, `Status: ${missingIdRes.status}`)
    }

    // ─── TEST C: Anti-Enumeration & Generic Error Protection ──────────────────
    {
      // 1. Nonexistent patient ID
      const fakeIdRes = await fetch(`${baseUrl}/api/patients/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({
          patientId: 'PAT-1999-9999',
          claimCode: 'CLM-000000',
          phone: '9822012345'
        })
      })
      const fakeIdData = await fakeIdRes.json()
      assert('Nonexistent patient ID returns HTTP 400', fakeIdRes.status === 400, `Status: ${fakeIdRes.status}`)
      assert('Nonexistent patient ID returns generic failure message', fakeIdData.message === 'Unable to claim this patient record. Verify the supplied details or contact support.')

      // 2. Wrong claim code for valid patient ID
      const wrongCodeRes = await fetch(`${baseUrl}/api/patients/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({
          patientId: fieldPatientId,
          claimCode: 'CLM-WRONG1',
          phone: '9822012345'
        })
      })
      const wrongCodeData = await wrongCodeRes.json()
      assert('Wrong claim code returns HTTP 400', wrongCodeRes.status === 400, `Status: ${wrongCodeRes.status}`)
      assert('Wrong claim code returns identical generic failure message', wrongCodeData.message === fakeIdData.message)

      // 3. Mismatched phone corroboration
      const wrongPhoneRes = await fetch(`${baseUrl}/api/patients/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({
          patientId: fieldPatientId,
          claimCode: fieldClaimCode,
          phone: '9999999999'
        })
      })
      const wrongPhoneData = await wrongPhoneRes.json()
      assert('Mismatched phone returns HTTP 400', wrongPhoneRes.status === 400, `Status: ${wrongPhoneRes.status}`)
      assert('Mismatched phone returns identical generic failure message', wrongPhoneData.message === fakeIdData.message)
    }

    // ─── TEST D: Successful Claim via UI Payload Contract ────────────────────
    {
      // Frontend LinkPatientRecordCard sends: { patientId, claimCode, phone, dateOfBirth }
      const claimPayload = {
        patientId: fieldPatientId,
        claimCode: fieldClaimCode,
        phone: '9822012345',
        dateOfBirth: '1979-08-20'
      }

      const claimRes = await fetch(`${baseUrl}/api/patients/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify(claimPayload)
      })
      const claimData = await claimRes.json()

      assert('Valid claim request returns HTTP 200', claimRes.status === 200, `Status: ${claimRes.status}`)
      assert('Claim response success flag is true', claimData.success === true)
      assert('Claimed profile patientId matches target', claimData.data?.patientId === fieldPatientId)
      assert('Claimed profile claimStatus is claimed', claimData.data?.claimStatus === 'claimed')

      // Verify database state:
      const updatedFieldProfile = await PatientProfile.findById(fieldProfileId).select('+claimCodeHash')
      assert('Database record now links userId to patient User ID', updatedFieldProfile.userId.toString() === patientUser._id.toString())
      assert('claimCodeHash is securely unset from database', updatedFieldProfile.claimCodeHash === undefined)
      assert('claimedAt timestamp is set', updatedFieldProfile.claimedAt !== null)

      // Verify User document isProfileComplete is updated
      const updatedUser = await userModel.findById(patientUser._id)
      assert('User document marked isProfileComplete = true', updatedUser.isProfileComplete === true)

      // Verify historical screening is now linked to this user
      const updatedScreening = await Screening.findById(scrData.data?._id)
      assert('Historical outreach screening now has userId set to patient User ID', updatedScreening.userId.toString() === patientUser._id.toString())
    }

    // ─── TEST E: Verification of Post-Claim Portal Refresh ────────────────────
    {
      // 1. GET /api/patients/me now returns the claimed outreach record
      const meRes = await fetch(`${baseUrl}/api/patients/me`, {
        headers: { Cookie: `token=${patientToken}` }
      })
      const meData = await meRes.json()
      assert('GET /api/patients/me returns the claimed outreach record', meData.data?.patientId === fieldPatientId, `patientId: ${meData.data?.patientId}`)
      assert('Profile registrationType is field_worker', meData.data?.registrationType === 'field_worker')

      // 2. GET /api/screenings/my now returns the historical screening
      const myScrAfterRes = await fetch(`${baseUrl}/api/screenings/my`, {
        headers: { Cookie: `token=${patientToken}` }
      })
      const myScrAfter = await myScrAfterRes.json()
      assert('GET /api/screenings/my now includes historical camp screening', myScrAfter.data?.length === 1, `Count: ${myScrAfter.data?.length}`)
      assert('Screening prediction matches camp scan', myScrAfter.data?.[0]?.aiResult?.label === 'Moderate DR')
    }

    // ─── TEST F: Prevention of Duplicate Claims & Invalidation ────────────────
    {
      // 1. Cannot claim already claimed record (claimCodeHash was unset)
      const reClaimRes = await fetch(`${baseUrl}/api/patients/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({
          patientId: fieldPatientId,
          claimCode: fieldClaimCode,
          phone: '9822012345'
        })
      })
      assert('Re-claiming already claimed record returns generic 400', reClaimRes.status === 400, `Status: ${reClaimRes.status}`)

      // 2. Account already linked with screening history cannot claim another record
      const secondFieldPatient = await PatientProfile.create({
        patientId: `PAT-SECOND-${suffix.toString().slice(-4)}`,
        userId: null,
        fullName: { firstName: 'Second', lastName: 'Patient' },
        phone: '9822099999',
        claimStatus: 'unclaimed',
        claimCodeHash: 'dummyhash'
      })
      createdProfileIds.push(secondFieldPatient._id)

      const blockedRes = await fetch(`${baseUrl}/api/patients/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({
          patientId: secondFieldPatient.patientId,
          claimCode: 'CLM-ANY',
          phone: '9822099999'
        })
      })
      assert('Account already linked with screening history is prevented from claiming another record (400)', blockedRes.status === 400, `Status: ${blockedRes.status}`)
    }

  } finally {
    console.log('\nCleaning up fixtures...')
    if (createdScreeningIds.length > 0) {
      await Screening.deleteMany({ _id: { $in: createdScreeningIds } })
    }
    if (createdProfileIds.length > 0) {
      await PatientProfile.deleteMany({ _id: { $in: createdProfileIds } })
    }
    if (createdUserIds.length > 0) {
      await userModel.deleteMany({ _id: { $in: createdUserIds } })
    }
    server.close()
    await mongoose.disconnect()
    console.log('Test server closed and DB disconnected.')
  }

  console.log(`\n=============================================================`)
  console.log(`   SEC-07 Suite Results: ${passedTests} / ${totalTests} Passed`)
  console.log(`=============================================================`)

  if (passedTests !== totalTests) {
    process.exit(1)
  }
}

runSec07Tests().catch((err) => {
  console.error('Fatal error in SEC-07 test runner:', err)
  process.exit(1)
})
