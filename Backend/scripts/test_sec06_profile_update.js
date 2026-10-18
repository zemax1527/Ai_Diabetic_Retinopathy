const dns = require('dns')
dns.setServers(['8.8.8.8', '1.1.1.1'])
require('dotenv').config()

const http = require('http')
const mongoose = require('mongoose')
const app = require('../app')
const userModel = require('../models/user.model')
const PatientProfile = require('../models/patientProfile.model')

async function runSec06Tests() {
  console.log('=============================================================')
  console.log('   SEC-06 Patient Profile Update Payload Regression Suite')
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
    // 1. Create Patient User & Profile fixture
    const patientUser = await userModel.create({
      fullName: { firstName: 'Aarav', lastName: 'Deshmukh' },
      email: `aarav_sec06_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true,
      loginId: `PAT-${suffix.toString().slice(-4)}`
    })
    createdUserIds.push(patientUser._id)

    const patientProfile = await PatientProfile.create({
      userId: patientUser._id,
      patientId: patientUser.loginId,
      fullName: { firstName: 'Aarav', lastName: 'Deshmukh' },
      phone: '9876543210',
      gender: 'male',
      dateOfBirth: new Date('1985-06-15'),
      address: {
        village: 'Khed',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '410501'
      },
      diabetesStatus: 'no',
      diabetesDuration: 0,
      claimStatus: 'claimed'
    })
    createdProfileIds.push(patientProfile._id)

    const patientToken = patientUser.generateAuthToken()

    // Create a Doctor user to test RBAC rejection on /api/patients/me
    const doctorUser = await userModel.create({
      fullName: { firstName: 'Dr. Sunita', lastName: 'Rao' },
      email: `doctor_sec06_${suffix}@test.com`,
      password: 'Password@123',
      role: 'doctor',
      verificationStatus: 'approved',
      isActive: true
    })
    createdUserIds.push(doctorUser._id)
    const doctorToken = doctorUser.generateAuthToken()

    // ─── TEST 1: Authentication & Authorization ──────────────────────────────
    {
      const unauthRes = await fetch(`${baseUrl}/api/patients/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '9999900000' })
      })
      assert('Unauthenticated PATCH /api/patients/me returns 401', unauthRes.status === 401, `Status: ${unauthRes.status}`)

      const doctorRes = await fetch(`${baseUrl}/api/patients/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${doctorToken}`
        },
        body: JSON.stringify({ phone: '9999900000' })
      })
      assert('Non-patient role (doctor) PATCH /api/patients/me returns 403', doctorRes.status === 403, `Status: ${doctorRes.status}`)
    }

    // ─── TEST 2: Empty update payload rejection ──────────────────────────────
    {
      const emptyRes = await fetch(`${baseUrl}/api/patients/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({})
      })
      assert('Empty payload returns 400', emptyRes.status === 400, `Status: ${emptyRes.status}`)
    }

    // ─── TEST 3: Canonical top-level payload from ProfileView ─────────────────
    {
      const canonicalPayload = {
        fullName: {
          firstName: 'Aarav-Updated',
          lastName: 'Deshmukh-Updated'
        },
        phone: '9123456780',
        gender: 'male',
        dateOfBirth: '1985-06-20',
        address: {
          village: 'Wakad',
          district: 'Pune'
        },
        diabetesStatus: 'yes',
        diabetesDuration: 3
      }

      const updateRes = await fetch(`${baseUrl}/api/patients/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify(canonicalPayload)
      })
      const updateData = await updateRes.json()

      assert('Canonical top-level update returns 200', updateRes.status === 200, `Status: ${updateRes.status}`)
      assert('PatientProfile fullName was updated', updateData.data?.fullName?.firstName === 'Aarav-Updated' && updateData.data?.fullName?.lastName === 'Deshmukh-Updated')
      assert('PatientProfile phone was updated', updateData.data?.phone === '9123456780')
      assert('PatientProfile diabetesStatus was updated', updateData.data?.diabetesStatus === 'yes')
      assert('PatientProfile diabetesDuration was updated', updateData.data?.diabetesDuration === 3)
      assert('PatientProfile address village was updated', updateData.data?.address?.village === 'Wakad')
      assert('PatientProfile unedited address state was preserved', updateData.data?.address?.state === 'Maharashtra')
      assert('PatientProfile unedited address pincode was preserved', updateData.data?.address?.pincode === '410501')

      // Verify User document fullName synchronization
      const refreshedUser = await userModel.findById(patientUser._id)
      assert('User.fullName synchronized with PatientProfile.fullName', refreshedUser.fullName.firstName === 'Aarav-Updated' && refreshedUser.fullName.lastName === 'Deshmukh-Updated')
    }

    // ─── TEST 4: Backward compatibility with legacy nested personalDetails ───
    {
      const legacyPayload = {
        personalDetails: {
          phone: '9888877777',
          village: 'Hadapsar',
          district: 'Pune',
          hasDiabetes: 'Yes',
          gender: 'Male'
        }
      }

      const legacyRes = await fetch(`${baseUrl}/api/patients/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify(legacyPayload)
      })
      const legacyData = await legacyRes.json()

      assert('Legacy personalDetails payload returns 200', legacyRes.status === 200, `Status: ${legacyRes.status}`)
      assert('Legacy phone correctly mapped', legacyData.data?.phone === '9888877777')
      assert('Legacy address.village correctly mapped', legacyData.data?.address?.village === 'Hadapsar')
      assert('Legacy hasDiabetes correctly mapped to diabetesStatus: yes', legacyData.data?.diabetesStatus === 'yes')
      assert('Legacy gender correctly normalized to lowercase: male', legacyData.data?.gender === 'male')
    }

    // ─── TEST 5: Input validation error handling ──────────────────────────────
    {
      // 5a. Invalid gender
      const badGenderRes = await fetch(`${baseUrl}/api/patients/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({ gender: 'alien' })
      })
      assert('Invalid gender value returns 400', badGenderRes.status === 400, `Status: ${badGenderRes.status}`)

      // 5b. Negative diabetes duration
      const badDurationRes = await fetch(`${baseUrl}/api/patients/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({ diabetesDuration: -5 })
      })
      assert('Negative diabetesDuration returns 400', badDurationRes.status === 400, `Status: ${badDurationRes.status}`)

      // 5c. Invalid date of birth
      const badDobRes = await fetch(`${baseUrl}/api/patients/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({ dateOfBirth: 'not-a-real-date' })
      })
      assert('Invalid dateOfBirth returns 400', badDobRes.status === 400, `Status: ${badDobRes.status}`)

      // 5d. Empty first name
      const emptyNameRes = await fetch(`${baseUrl}/api/patients/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify({ fullName: { firstName: '   ', lastName: 'Deshmukh' } })
      })
      assert('Empty first name returns 400', emptyNameRes.status === 400, `Status: ${emptyNameRes.status}`)
    }

    // ─── TEST 6: Protected fields immutability ─────────────────────────────────
    {
      const maliciousPayload = {
        phone: '9555544444',
        role: 'admin',
        isActive: false,
        verificationStatus: 'approved',
        patientId: 'HACKED-ID-9999',
        userId: new mongoose.Types.ObjectId(),
        claimStatus: 'unclaimed',
        claimCodeHash: 'fakehash123',
        registrationType: 'field_worker',
        registeredBy: new mongoose.Types.ObjectId()
      }

      const exploitRes = await fetch(`${baseUrl}/api/patients/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${patientToken}`
        },
        body: JSON.stringify(maliciousPayload)
      })
      assert('Request with protected fields accepted for valid field (phone)', exploitRes.status === 200, `Status: ${exploitRes.status}`)

      // Verify User document was NOT mutated with protected fields
      const userInDb = await userModel.findById(patientUser._id)
      assert('User.role was NOT changed to admin', userInDb.role === 'patient', `Role: ${userInDb.role}`)
      assert('User.isActive was NOT changed to false', userInDb.isActive === true, `isActive: ${userInDb.isActive}`)
      assert('User.verificationStatus was NOT changed', userInDb.verificationStatus === 'not_required')

      // Verify PatientProfile was NOT mutated with protected fields
      const profileInDb = await PatientProfile.findById(patientProfile._id)
      assert('PatientProfile.patientId was NOT changed', profileInDb.patientId === patientUser.loginId, `patientId: ${profileInDb.patientId}`)
      assert('PatientProfile.userId was NOT changed', profileInDb.userId.toString() === patientUser._id.toString())
      assert('PatientProfile.claimStatus was NOT changed to unclaimed', profileInDb.claimStatus === 'claimed')
      assert('PatientProfile.registrationType was NOT changed to field_worker', profileInDb.registrationType === 'self')
      assert('PatientProfile.phone was correctly updated', profileInDb.phone === '9555544444')
    }

  } finally {
    console.log('\nCleaning up fixtures...')
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
  console.log(`   SEC-06 Suite Results: ${passedTests} / ${totalTests} Passed`)
  console.log(`=============================================================`)

  if (passedTests !== totalTests) {
    process.exit(1)
  }
}

runSec06Tests().catch((err) => {
  console.error('Fatal error in SEC-06 test runner:', err)
  process.exit(1)
})
