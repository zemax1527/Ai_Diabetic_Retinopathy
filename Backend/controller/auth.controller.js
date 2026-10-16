const mongoose = require('mongoose')
const userModel = require('../models/user.model')
const PatientProfile = require('../models/patientProfile.model')
const HealthcareWorkerProfile = require('../models/healthCare.model')
const DoctorProfile = require('../models/doctorProfile.model')
const AppError = require('../utils/app.error')
const generateLoginId = require('../utils/generateLoginId')

// ─── Allowed public roles ────────────────────────────────────────────────────

const PUBLIC_ROLES = [
  'patient',
  'healthcare_worker',
  'doctor'
]

// ─── Password validation ────────────────────────────────────────────────────

function validatePassword(password) {
  if (typeof password !== 'string') {
    return false
  }

  if (password.length < 8) {
    return false
  }

  // lowercase
  if (!/[a-z]/.test(password)) {
    return false
  }

  // uppercase
  if (!/[A-Z]/.test(password)) {
    return false
  }

  // number
  if (!/\d/.test(password)) {
    return false
  }

  // special character
  if (!/[^A-Za-z0-9]/.test(password)) {
    return false
  }

  return true
}

// ─── Registration ────────────────────────────────────────────────────────────

async function userRegistration(req, res) {

  const {
    fullName,
    email,
    password,
    role,
    personalDetails,
    professionalDetails,
    verificationDetails
  } = req.body

  // ─── Basic validation ──────────────────────────────────────────────────────

  if (!fullName || !fullName.firstName?.trim()) {
    throw new AppError('First name is required', 400)
  }

  if (!email || typeof email !== 'string') {
    throw new AppError('Email is required', 400)
  }

  if (!password || typeof password !== 'string') {
    throw new AppError('Password is required', 400)
  }

  // IMPORTANT:
  // Prevent Mongoose from returning this as a 500 validation error.
  if (!validatePassword(password)) {
    throw new AppError(
      'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      400
    )
  }

  if (!role || !PUBLIC_ROLES.includes(role)) {
    throw new AppError(
      `Invalid role. Allowed roles: ${PUBLIC_ROLES.join(', ')}`,
      400
    )
  }

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase()

  // ─── Duplicate email ──────────────────────────────────────────────────────

  const emailAlreadyExists = await userModel.findOne({
    email: normalizedEmail
  })

  if (emailAlreadyExists) {
    throw new AppError('Email already exists', 409)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATIENT
  // ═══════════════════════════════════════════════════════════════════════════

  if (role === 'patient') {

    const loginId = await generateLoginId('patient')

    const user = await userModel.create({
      fullName: {
        firstName: fullName.firstName.trim(),
        lastName: fullName.lastName?.trim() || ''
      },

      email: normalizedEmail,

      // DO NOT HASH HERE.
      // user.model.js pre-save hook handles bcrypt hashing.
      password,

      loginId,
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true
    })

    // ─── Patient profile ─────────────────────────────────────────────────────

    const patientData = {
      userId: user._id,
      patientId: user.loginId,
      fullName: {
        firstName: user.fullName.firstName,
        lastName: user.fullName.lastName || ''
      },
      registrationType: 'self',
      claimStatus: 'claimed',
      claimedAt: new Date()
    }

    if (personalDetails) {

      if (personalDetails.dateOfBirth !== undefined) {
        patientData.dateOfBirth = personalDetails.dateOfBirth
      }

      if (personalDetails.gender !== undefined) {
        patientData.gender = personalDetails.gender
      }

      if (personalDetails.phone !== undefined) {
        patientData.phone = personalDetails.phone
      }

      if (personalDetails.address !== undefined) {
        patientData.address = personalDetails.address
      }

      if (personalDetails.diabetesStatus !== undefined) {
        patientData.diabetesStatus = personalDetails.diabetesStatus
      }

      if (personalDetails.diabetesDuration !== undefined) {
        patientData.diabetesDuration = personalDetails.diabetesDuration
      }
    }

    await PatientProfile.create(patientData)

    // ─── Cookie ──────────────────────────────────────────────────────────────

    const token = user.generateAuthToken()

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.status(201).json({
      status: 'success',
      message: 'Patient registration successful. You can now log in.',

      user: {
        id: user._id,
        loginId: user.loginId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        isActive: user.isActive
      }
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTHCARE WORKER
  // ═══════════════════════════════════════════════════════════════════════════

  if (role === 'healthcare_worker') {

    // ── Build profile data before starting the transaction ──────────────────
    // (no DB calls here — pure object construction)

    const profile = {}

    // ─── Personal details ────────────────────────────────────────────────────

    if (personalDetails) {

      if (personalDetails.dateOfBirth !== undefined) {
        profile.dateOfBirth = personalDetails.dateOfBirth
      }

      if (personalDetails.gender !== undefined) {
        profile.gender = personalDetails.gender
      }

      if (personalDetails.phone !== undefined) {
        profile.phone = personalDetails.phone
      }

      if (personalDetails.address !== undefined) {
        profile.address = personalDetails.address
      }
    }

    // ─── Professional details ────────────────────────────────────────────────

    if (professionalDetails) {

      if (professionalDetails.designation !== undefined) {
        profile.designation = professionalDetails.designation
      }

      if (professionalDetails.department !== undefined) {
        profile.department = professionalDetails.department
      }

      if (professionalDetails.qualification !== undefined) {
        profile.qualification = professionalDetails.qualification
      }

      if (professionalDetails.yearsOfExperience !== undefined) {
        profile.yearsOfExperience =
          professionalDetails.yearsOfExperience
      }

      if (professionalDetails.employeeId !== undefined) {
        profile.employeeId = professionalDetails.employeeId
      }

      if (professionalDetails.institution !== undefined) {
        profile.institution = professionalDetails.institution
      }
    }

    // ─── Verification documents ─────────────────────────────────────────────

    if (verificationDetails) {

      profile.documents = {}

      if (verificationDetails.idProof !== undefined) {
        profile.documents.idProof = verificationDetails.idProof
      }

      if (verificationDetails.employmentProof !== undefined) {
        profile.documents.employmentProof =
          verificationDetails.employmentProof
      }

      if (
        verificationDetails.qualificationCertificate !== undefined
      ) {
        profile.documents.qualificationCertificate =
          verificationDetails.qualificationCertificate
      }
    }

    // ── Atomic: create User + Profile in a single transaction ────────────────
    // If profile creation fails (validation, duplicate, schema error),
    // the User document is rolled back automatically. No orphan records.

    const session = await mongoose.startSession()
    let createdUser

    try {
      await session.withTransaction(async () => {
        const [user] = await userModel.create(
          [
            {
              fullName: {
                firstName: fullName.firstName.trim(),
                lastName: fullName.lastName?.trim() || ''
              },
              email: normalizedEmail,
              // Hashing handled by User model pre-save hook.
              password,
              // loginId assigned only after admin approval.
              role: 'healthcare_worker',
              verificationStatus: 'pending',
              isActive: false
            }
          ],
          { session }
        )

        await HealthcareWorkerProfile.create(
          [{ userId: user._id, ...profile }],
          { session }
        )

        createdUser = user
      })
    } finally {
      session.endSession()
    }

    // ── No cookie or JWT for pending registrations ───────────────────────────
    // createdUser.isActive === false; login will be blocked until approved.

    return res.status(201).json({
      status: 'success',
      message:
        'Healthcare worker registration submitted. Your account is pending admin approval.',

      user: {
        id: createdUser._id,
        fullName: createdUser.fullName,
        email: createdUser.email,
        role: createdUser.role,
        verificationStatus: createdUser.verificationStatus,
        isActive: createdUser.isActive
      }
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCTOR
  // ═══════════════════════════════════════════════════════════════════════════

  if (role === 'doctor') {

    // ── Build profile data before starting the transaction ──────────────────
    // (no DB calls here — pure object construction)

    const profile = {}

    // ─── Personal details ────────────────────────────────────────────────────

    if (personalDetails) {

      if (personalDetails.dateOfBirth !== undefined) {
        profile.dateOfBirth = personalDetails.dateOfBirth
      }

      if (personalDetails.gender !== undefined) {
        profile.gender = personalDetails.gender
      }

      if (personalDetails.phone !== undefined) {
        profile.phone = personalDetails.phone
      }

      if (personalDetails.address !== undefined) {
        profile.address = personalDetails.address
      }
    }

    // ─── Professional details ────────────────────────────────────────────────

    if (professionalDetails) {

      if (professionalDetails.qualification !== undefined) {
        profile.qualification =
          professionalDetails.qualification
      }

      if (professionalDetails.specialization !== undefined) {
        profile.specialization =
          professionalDetails.specialization
      }

      if (professionalDetails.yearsOfExperience !== undefined) {
        profile.yearsOfExperience =
          professionalDetails.yearsOfExperience
      }

      if (professionalDetails.institution !== undefined) {
        profile.institution =
          professionalDetails.institution
      }
    }

    // ─── Verification details ────────────────────────────────────────────────

    if (verificationDetails) {

      if (
        verificationDetails.medicalRegistrationNumber !== undefined
      ) {
        profile.medicalRegistrationNumber =
          verificationDetails.medicalRegistrationNumber
      }

      if (
        verificationDetails.registrationCouncil !== undefined
      ) {
        profile.registrationCouncil =
          verificationDetails.registrationCouncil
      }

      if (
        verificationDetails.registrationYear !== undefined
      ) {
        profile.registrationYear =
          verificationDetails.registrationYear
      }

      if (verificationDetails.documents) {

        profile.documents = {}

        if (verificationDetails.documents.idProof !== undefined) {
          profile.documents.idProof =
            verificationDetails.documents.idProof
        }

        if (
          verificationDetails.documents.medicalDegree !== undefined
        ) {
          profile.documents.medicalDegree =
            verificationDetails.documents.medicalDegree
        }

        if (
          verificationDetails.documents
            .medicalRegistrationCertificate !== undefined
        ) {
          profile.documents.medicalRegistrationCertificate =
            verificationDetails.documents
              .medicalRegistrationCertificate
        }

        if (
          verificationDetails.documents.experienceCertificate !== undefined
        ) {
          profile.documents.experienceCertificate =
            verificationDetails.documents.experienceCertificate
        }
      }
    }

    // ── Atomic: create User + Profile in a single transaction ────────────────
    // If DoctorProfile.create() fails, the User document is rolled back.
    // No orphan records left in the database.

    const session = await mongoose.startSession()
    let createdUser

    try {
      await session.withTransaction(async () => {
        const [user] = await userModel.create(
          [
            {
              fullName: {
                firstName: fullName.firstName.trim(),
                lastName: fullName.lastName?.trim() || ''
              },
              email: normalizedEmail,
              // Hashing handled by User model pre-save hook.
              password,
              // loginId assigned only after admin approval.
              role: 'doctor',
              verificationStatus: 'pending',
              isActive: false
            }
          ],
          { session }
        )

        await DoctorProfile.create(
          [{ userId: user._id, ...profile }],
          { session }
        )

        createdUser = user
      })
    } finally {
      session.endSession()
    }

    // ── No cookie or JWT for pending registrations ───────────────────────────
    // createdUser.isActive === false; login will be blocked until approved.

    return res.status(201).json({
      status: 'success',
      message:
        'Doctor registration submitted. Your account is pending admin approval.',

      user: {
        id: createdUser._id,
        fullName: createdUser.fullName,
        email: createdUser.email,
        role: createdUser.role,
        verificationStatus: createdUser.verificationStatus,
        isActive: createdUser.isActive
      }
    })
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════

async function userLogin(req, res) {

  const {
    loginInput,
    password
  } = req.body

  if (
    !loginInput ||
    typeof loginInput !== 'string' ||
    !password ||
    typeof password !== 'string'
  ) {
    throw new AppError(
      'Email or login ID and password are required',
      400
    )
  }

  const normalizedLoginInput = loginInput.trim()

  const user = await userModel
    .findOne({
      $or: [
        {
          email: normalizedLoginInput.toLowerCase()
        },
        {
          loginId: normalizedLoginInput.toUpperCase()
        }
      ]
    })
    .select('+password')

  if (!user) {
    throw new AppError(
      'Invalid email/login ID or password',
      401
    )
  }

  const match = await user.comparePassword(password)

  if (!match) {
    throw new AppError(
      'Invalid email/login ID or password',
      401
    )
  }

  if (user.role === 'admin' && !user.isActive) {
    throw new AppError('Administrative account is disabled.', 403)
  }

  if (user.verificationStatus === 'rejected') {
    throw new AppError(
      'Your account application has been rejected by the administrator',
      403
    )
  }

  if (!user.isActive) {
    throw new AppError(
      'Your account is pending admin approval. You will be notified once approved.',
      403
    )
  }

  const token = user.generateAuthToken()

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  return res.status(200).json({
    status: 'success',
    message: 'User logged in successfully',

    user: {
      id: user._id,
      loginId: user.loginId,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  })
}


// ═══════════════════════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════════════════════

async function userLogout(req, res) {

  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  return res.status(200).json({
    status: 'success',
    message: 'User logged out successfully'
  })
}


// ─── CHECK EMAIL AVAILABILITY ─────────────────────────────────────────────

async function checkEmail(req, res) {
  const { email } = req.body

  if (!email || typeof email !== 'string') {
    throw new AppError('Email is required', 400)
  }

  const normalizedEmail = email.trim().toLowerCase()

  const emailAlreadyExists = await userModel.findOne({
    email: normalizedEmail
  })

  if (emailAlreadyExists) {
    throw new AppError('Email already exists', 409)
  }

  return res.status(200).json({
    status: 'success',
    message: 'Email is available'
  })
}

async function googleCallback(req, res) {
  const token = req.user.generateAuthToken()

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  // After Google OAuth, the browser follows a redirect chain.
  // We must redirect to the frontend — NOT return JSON.
  // The frontend's /auth/google/success page will call /api/auth/me
  // to restore user session from the HTTP-only cookie.
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
  return res.redirect(`${FRONTEND_URL}/auth/google/success`)
}

async function getMe(req, res) {
  const user = req.user

  let isProfileComplete = user.isProfileComplete

  // Check actual role profile document if not explicitly flagged
  if (!isProfileComplete) {
    if (user.role === 'patient') {
      const p = await PatientProfile.findOne({ userId: user._id })
      isProfileComplete = !!p
    } else if (user.role === 'doctor') {
      const p = await DoctorProfile.findOne({ userId: user._id })
      isProfileComplete = !!p
    } else if (user.role === 'healthcare_worker') {
      const p = await HealthcareWorkerProfile.findOne({ userId: user._id })
      isProfileComplete = !!p
    } else if (user.role === 'admin') {
      isProfileComplete = true
    }

    if (isProfileComplete && !user.isProfileComplete) {
      user.isProfileComplete = true
      await user.save()
    }
  }

  return res.status(200).json({
    status: 'success',
    user: {
      id: user._id,
      loginId: user.loginId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      isActive: user.isActive,
      isProfileComplete
    }
  })
}

async function completeProfile(req, res) {
  const user = req.user
  const { role, personalDetails, professionalDetails, verificationDetails } = req.body

  if (!PUBLIC_ROLES.includes(role)) {
    throw new AppError('Invalid role specified. Must be patient, healthcare_worker, or doctor', 400)
  }

  if (req.body.fullName && req.body.fullName.firstName) {
    user.fullName = {
      firstName: req.body.fullName.firstName.trim(),
      lastName: req.body.fullName.lastName ? req.body.fullName.lastName.trim() : ''
    }
  }

  // Patient profile completion
  if (role === 'patient') {
    if (!user.loginId) {
      user.loginId = await generateLoginId('patient')
    }
    user.role = 'patient'
    user.verificationStatus = 'not_required'
    user.isActive = true
    user.isProfileComplete = true
    await user.save()

    const patientData = { userId: user._id }
    if (personalDetails) {
      if (personalDetails.dateOfBirth !== undefined) patientData.dateOfBirth = personalDetails.dateOfBirth
      if (personalDetails.gender !== undefined) patientData.gender = personalDetails.gender
      if (personalDetails.phone !== undefined) patientData.phone = personalDetails.phone
      if (personalDetails.address !== undefined) patientData.address = personalDetails.address
      if (personalDetails.diabetesStatus !== undefined) patientData.diabetesStatus = personalDetails.diabetesStatus
      if (personalDetails.diabetesDuration !== undefined) patientData.diabetesDuration = personalDetails.diabetesDuration
    }

    await PatientProfile.findOneAndUpdate(
      { userId: user._id },
      { $set: patientData },
      { upsert: true, new: true }
    )

    return res.status(200).json({
      status: 'success',
      message: 'Patient profile completed successfully',
      redirectTo: '/patient',
      user: {
        id: user._id,
        loginId: user.loginId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        isActive: user.isActive,
        isProfileComplete: true
      }
    })
  }

  // Healthcare worker profile completion
  if (role === 'healthcare_worker') {
    // loginId is NOT assigned here — it is generated only at admin approval
    // (see admin.controller.js::approveVerification)
    user.role = 'healthcare_worker'
    user.verificationStatus = 'pending'
    user.isActive = false
    user.isProfileComplete = true
    await user.save()

    const profileData = { userId: user._id }
    if (personalDetails) {
      if (personalDetails.dateOfBirth !== undefined) profileData.dateOfBirth = personalDetails.dateOfBirth
      if (personalDetails.gender !== undefined) profileData.gender = personalDetails.gender
      if (personalDetails.phone !== undefined) profileData.phone = personalDetails.phone
      if (personalDetails.address !== undefined) profileData.address = personalDetails.address
    }
    if (professionalDetails) {
      if (professionalDetails.designation !== undefined) profileData.designation = professionalDetails.designation
      if (professionalDetails.department !== undefined) profileData.department = professionalDetails.department
      if (professionalDetails.qualification !== undefined) profileData.qualification = professionalDetails.qualification
      if (professionalDetails.yearsOfExperience !== undefined) profileData.yearsOfExperience = professionalDetails.yearsOfExperience
      if (professionalDetails.employeeId !== undefined) profileData.employeeId = professionalDetails.employeeId
      if (professionalDetails.institution !== undefined) profileData.institution = professionalDetails.institution
    }
    if (verificationDetails) {
      profileData.documents = {}
      if (verificationDetails.idProof !== undefined) profileData.documents.idProof = verificationDetails.idProof
      if (verificationDetails.employmentProof !== undefined) profileData.documents.employmentProof = verificationDetails.employmentProof
      if (verificationDetails.qualificationCertificate !== undefined) profileData.documents.qualificationCertificate = verificationDetails.qualificationCertificate
    }

    await HealthcareWorkerProfile.findOneAndUpdate(
      { userId: user._id },
      { $set: profileData },
      { upsert: true, new: true }
    )

    return res.status(200).json({
      status: 'success',
      message: 'Healthcare worker profile submitted for administrator verification',
      redirectTo: '/pending',
      user: {
        id: user._id,
        loginId: user.loginId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        isActive: user.isActive,
        isProfileComplete: true
      }
    })
  }

  // Doctor profile completion
  if (role === 'doctor') {
    // loginId is NOT assigned here — it is generated only at admin approval
    // (see admin.controller.js::approveVerification)
    user.role = 'doctor'
    user.verificationStatus = 'pending'
    user.isActive = false
    user.isProfileComplete = true
    await user.save()

    const profileData = { userId: user._id }
    if (personalDetails) {
      if (personalDetails.dateOfBirth !== undefined) profileData.dateOfBirth = personalDetails.dateOfBirth
      if (personalDetails.gender !== undefined) profileData.gender = personalDetails.gender
      if (personalDetails.phone !== undefined) profileData.phone = personalDetails.phone
      if (personalDetails.address !== undefined) profileData.address = personalDetails.address
    }
    if (professionalDetails) {
      if (professionalDetails.specialization !== undefined) profileData.specialization = professionalDetails.specialization
      if (professionalDetails.qualification !== undefined) profileData.qualification = professionalDetails.qualification
      if (professionalDetails.yearsOfExperience !== undefined) profileData.yearsOfExperience = professionalDetails.yearsOfExperience
      if (professionalDetails.institution !== undefined) profileData.institution = professionalDetails.institution
      if (professionalDetails.medicalRegistrationNumber !== undefined) profileData.medicalRegistrationNumber = professionalDetails.medicalRegistrationNumber
      if (professionalDetails.registrationCouncil !== undefined) profileData.registrationCouncil = professionalDetails.registrationCouncil
      if (professionalDetails.registrationYear !== undefined) profileData.registrationYear = professionalDetails.registrationYear
    }
    if (verificationDetails) {
      profileData.documents = {}
      if (verificationDetails.idProof !== undefined) profileData.documents.idProof = verificationDetails.idProof
      if (verificationDetails.medicalDegree !== undefined) profileData.documents.medicalDegree = verificationDetails.medicalDegree
      if (verificationDetails.medicalRegistrationCertificate !== undefined) profileData.documents.medicalRegistrationCertificate = verificationDetails.medicalRegistrationCertificate
      if (verificationDetails.experienceCertificate !== undefined) profileData.documents.experienceCertificate = verificationDetails.experienceCertificate
    }

    await DoctorProfile.findOneAndUpdate(
      { userId: user._id },
      { $set: profileData },
      { upsert: true, new: true }
    )

    return res.status(200).json({
      status: 'success',
      message: 'Doctor credentials submitted for administrator verification',
      redirectTo: '/pending',
      user: {
        id: user._id,
        loginId: user.loginId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        isActive: user.isActive,
        isProfileComplete: true
      }
    })
  }
}

module.exports = {
  checkEmail,
  userRegistration,
  userLogin,
  userLogout,
  googleCallback,
  getMe,
  completeProfile
}