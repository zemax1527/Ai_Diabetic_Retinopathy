const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const PatientProfile = require('../models/patientProfile.model');
const userModel = require('../models/user.model');
const Screening = require('../models/screening.model');
const AuditLog = require('../models/auditLog.model');
const generateLoginId = require('../utils/generateLoginId');
const AppError = require('../utils/app.error');

// Allowed fields a patient can update on their own profile
const ALLOWED_UPDATE_FIELDS = [
  'fullName',
  'dateOfBirth',
  'gender',
  'phone',
  'address',
  'diabetesStatus',
  'diabetesDuration'
]

/**
 * GET /api/patients/me
 * Retrieve the profile belonging to the authenticated patient
 */
async function getMyProfile(req, res) {
  let patientProfile = await PatientProfile.findOne({
    userId: req.user._id
  })
    .populate('userId', 'fullName email loginId role isActive isProfileComplete')
    .populate('registeredBy', 'fullName email loginId role')

  if (!patientProfile && req.user.loginId) {
    patientProfile = await PatientProfile.findOne({
      patientId: req.user.loginId
    })
      .populate('userId', 'fullName email loginId role isActive isProfileComplete')
      .populate('registeredBy', 'fullName email loginId role')
  }

  if (!patientProfile) {
    throw new AppError('Patient profile not found', 404)
  }

  res.status(200).json({
    success: true,
    message: 'Patient profile fetched successfully',
    data: patientProfile
  })
}

/**
 * PATCH /api/patients/me
 * Update personal health details for the authenticated patient
 */
async function updateMyProfile(req, res) {
  // Support canonical top-level fields as well as legacy nested personalDetails
  const input = req.body && typeof req.body === 'object' ? req.body : {}
  const personalDetails = input.personalDetails && typeof input.personalDetails === 'object'
    ? input.personalDetails
    : {}
  const source = { ...personalDetails, ...input }

  // Map legacy flattened location or status if address or diabetesStatus wasn't provided directly
  if (!source.address && (source.village !== undefined || source.district !== undefined)) {
    source.address = {
      village: source.village,
      district: source.district
    }
  }

  if (source.diabetesStatus === undefined && source.hasDiabetes !== undefined) {
    const dLower = String(source.hasDiabetes).toLowerCase()
    source.diabetesStatus = dLower === 'yes' ? 'yes' : dLower === 'no' ? 'no' : 'unknown'
  }

  const updates = {}

  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (source[field] !== undefined) {
      updates[field] = source[field]
    }
  }

  // Sanitize and validate fields
  if (updates.fullName !== undefined) {
    let firstName = ''
    let lastName = ''
    if (typeof updates.fullName === 'object' && updates.fullName !== null) {
      firstName = String(updates.fullName.firstName || '').trim()
      lastName = String(updates.fullName.lastName || '').trim()
    } else if (typeof updates.fullName === 'string') {
      const parts = updates.fullName.trim().split(/\s+/)
      firstName = parts[0] || ''
      lastName = parts.slice(1).join(' ') || ''
    }
    if (!firstName) {
      throw new AppError('First name cannot be empty', 400)
    }
    updates.fullName = { firstName, lastName }
  }

  if (updates.gender !== undefined) {
    const g = String(updates.gender).toLowerCase().trim()
    if (['male', 'female', 'other'].includes(g)) {
      updates.gender = g
    } else {
      throw new AppError('Invalid gender value. Allowed: male, female, other', 400)
    }
  }

  if (updates.diabetesStatus !== undefined) {
    const ds = String(updates.diabetesStatus).toLowerCase().trim()
    if (['yes', 'no', 'unknown'].includes(ds)) {
      updates.diabetesStatus = ds
    } else {
      updates.diabetesStatus = 'unknown'
    }
  }

  if (updates.diabetesDuration !== undefined) {
    if (updates.diabetesDuration === null || updates.diabetesDuration === '') {
      updates.diabetesDuration = undefined
    } else {
      const parsed = Number(String(updates.diabetesDuration).replace(/[^\d.-]/g, ''))
      if (isNaN(parsed) || parsed < 0) {
        throw new AppError('Diabetes duration must be a non-negative number', 400)
      }
      updates.diabetesDuration = parsed
    }
  }

  if (updates.dateOfBirth !== undefined) {
    if (updates.dateOfBirth) {
      const dob = new Date(updates.dateOfBirth)
      if (isNaN(dob.getTime())) {
        throw new AppError('Invalid date of birth', 400)
      }
      updates.dateOfBirth = dob
    }
  }

  if (updates.phone !== undefined) {
    updates.phone = String(updates.phone).trim()
  }

  // Handle address safely with dot-notation to avoid wiping unedited subfields (state, pincode)
  if (updates.address !== undefined) {
    const addr = updates.address
    delete updates.address
    if (typeof addr === 'object' && addr !== null) {
      if (addr.village !== undefined) updates['address.village'] = String(addr.village).trim()
      if (addr.district !== undefined) updates['address.district'] = String(addr.district).trim()
      if (addr.state !== undefined) updates['address.state'] = String(addr.state).trim()
      if (addr.pincode !== undefined) updates['address.pincode'] = String(addr.pincode).trim()
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields provided for update', 400)
  }

  let patientProfile = await PatientProfile.findOneAndUpdate(
    {
      userId: req.user._id
    },
    {
      $set: updates
    },
    {
      returnDocument: 'after',
      runValidators: true
    }
  ).populate('userId', 'fullName email loginId role isActive')

  if (!patientProfile && req.user.loginId) {
    patientProfile = await PatientProfile.findOneAndUpdate(
      {
        patientId: req.user.loginId
      },
      {
        $set: updates
      },
      {
        returnDocument: 'after',
        runValidators: true
      }
    ).populate('userId', 'fullName email loginId role isActive')
  }

  if (!patientProfile) {
    throw new AppError('Patient profile not found', 404)
  }

  // If fullName was updated and linked to a User document, synchronize User.fullName
  if (updates.fullName && req.user._id) {
    await userModel.findByIdAndUpdate(req.user._id, {
      $set: { fullName: updates.fullName }
    })
  }

  res.status(200).json({
    success: true,
    message: 'Patient profile updated successfully',
    data: patientProfile
  })
}

/**
 * POST /api/patients
 * Healthcare Worker / Doctor / Admin registers an outreach field patient.
 * Creates an authorized PatientProfile record with a unique Patient ID and secure claim code.
 * DOES NOT create a fake login account (User document).
 */
async function registerFieldPatient(req, res) {
  const {
    firstName,
    lastName = '',
    phone,
    dateOfBirth,
    gender,
    address,
    diabetesStatus,
    diabetesDuration
  } = req.body;

  if (!firstName || !firstName.trim()) {
    throw new AppError('Patient first name is required', 400);
  }

  // 1. Generate unique Patient ID using atomic sequence (e.g. PAT-2026-0001)
  const patientId = await generateLoginId('patient');

  // 2. Generate a secure, one-time claim code for outreach physical slip
  // Format: CLM-XXXXXX (6 alphanumeric hex chars)
  const rawClaimCode = `CLM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const claimCodeHash = await bcrypt.hash(rawClaimCode, 10);

  // 3. Create PatientProfile directly without creating a User document
  const patientProfile = await PatientProfile.create({
    patientId,
    userId: null, // No login account until claimed
    fullName: {
      firstName: firstName.trim(),
      lastName: (lastName || '').trim()
    },
    phone: phone ? phone.trim() : '',
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    gender: gender || 'other',
    address: address || {},
    diabetesStatus: diabetesStatus || 'unknown',
    diabetesDuration: diabetesDuration ? Number(diabetesDuration) : undefined,
    registrationType: 'field_worker',
    registeredBy: req.user._id,
    claimStatus: 'unclaimed',
    claimCodeHash
  });

  // 4. Record audit log event
  try {
    await AuditLog.create({
      actorId: req.user._id,
      action: 'FIELD_PATIENT_REGISTERED',
      targetId: req.user._id,
      targetResource: 'PatientProfile',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success',
      details: {
        patientId,
        profileId: patientProfile._id,
        registeredBy: req.user._id
      }
    });
  } catch (err) {
    console.error('AuditLog error in registerFieldPatient:', err.message);
  }

  // 5. Return success with the one-time claim code to be printed on the outreach card
  res.status(201).json({
    success: true,
    message: 'Patient registered successfully in outreach system. Issue the Patient ID and Claim Code on the patient screening slip.',
    data: {
      patientId: patientProfile.patientId,
      profileId: patientProfile._id,
      fullName: patientProfile.fullName,
      phone: patientProfile.phone,
      claimCode: rawClaimCode, // Given to the patient on physical card
      claimStatus: patientProfile.claimStatus,
      registrationType: patientProfile.registrationType,
      registeredBy: req.user._id
    }
  });
}

// Generic claim failure message to prevent patient record enumeration (SEC-02)
const GENERIC_CLAIM_FAILURE_MESSAGE = 'Unable to claim this patient record. Verify the supplied details or contact support.';
const DUMMY_CLAIM_HASH = '$2b$10$SdUzyke21JUzXTzVDqzvCerVPYkP/M3r97kMQoNiMEFmPvyP3efvu';

/**
 * POST /api/patients/claim
 * Allows an authenticated patient to claim an existing outreach/field patient record
 * using their Patient ID, Claim Code, and corroborating demographic verification.
 */
async function claimPatientRecord(req, res) {
  const { patientId, claimCode, phone, dateOfBirth } = req.body;

  if (!patientId || !claimCode) {
    throw new AppError('Patient ID and Claim Code are required to claim a record', 400);
  }

  // Caller must be an authenticated patient
  if (req.user.role !== 'patient') {
    throw new AppError('Only patients can claim a patient record', 403);
  }

  const normalizedPatientId = patientId.trim().toUpperCase();

  // Check if caller already has an active claimed profile with historical screenings
  const existingProfile = await PatientProfile.findOne({ userId: req.user._id });
  if (existingProfile) {
    const existingScreenings = await Screening.countDocuments({ patientId: existingProfile._id });
    if (existingProfile.claimStatus === 'claimed' && existingScreenings > 0) {
      throw new AppError('Your account is already linked to an active patient record with screening history', 400);
    }
  }

  // Find target unclaimed profile (explicitly select +claimCodeHash)
  const targetProfile = await PatientProfile.findOne({
    patientId: normalizedPatientId,
    claimStatus: 'unclaimed',
    userId: null
  }).select('+claimCodeHash');

  if (!targetProfile || !targetProfile.claimCodeHash) {
    // Constant-time mitigation: perform dummy bcrypt check to prevent timing-based enumeration
    await bcrypt.compare(claimCode.trim(), DUMMY_CLAIM_HASH).catch(() => {});

    try {
      await AuditLog.create({
        actorId: req.user._id,
        action: 'PATIENT_CLAIM_FAILED',
        targetId: req.user._id,
        targetResource: 'PatientProfile',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'failed',
        details: {
          patientId: normalizedPatientId,
          reason: !targetProfile ? 'record_not_found_or_claimed' : 'missing_claim_code'
        }
      });
    } catch (_) {}

    throw new AppError(GENERIC_CLAIM_FAILURE_MESSAGE, 400);
  }

  // 1. Verify claim code
  const isMatch = await bcrypt.compare(claimCode.trim(), targetProfile.claimCodeHash);
  if (!isMatch) {
    try {
      await AuditLog.create({
        actorId: req.user._id,
        action: 'PATIENT_CLAIM_FAILED',
        targetId: req.user._id,
        targetResource: 'PatientProfile',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'failed',
        details: { patientId: normalizedPatientId, reason: 'invalid_claim_code' }
      });
    } catch (_) {}
    throw new AppError(GENERIC_CLAIM_FAILURE_MESSAGE, 400);
  }

  // 2. Verify corroborating factor (phone or date of birth)
  let corroborated = false;
  if (targetProfile.phone && targetProfile.phone.trim()) {
    const rawTargetPhone = targetProfile.phone.replace(/\D/g, '');
    const rawInputPhone = (phone ? String(phone) : '').replace(/\D/g, '');
    if (!rawInputPhone || rawTargetPhone !== rawInputPhone) {
      try {
        await AuditLog.create({
          actorId: req.user._id,
          action: 'PATIENT_CLAIM_FAILED',
          targetId: req.user._id,
          targetResource: 'PatientProfile',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          status: 'failed',
          details: { patientId: normalizedPatientId, reason: 'phone_mismatch' }
        });
      } catch (_) {}
      throw new AppError(GENERIC_CLAIM_FAILURE_MESSAGE, 400);
    }
    corroborated = true;
  }

  if (targetProfile.dateOfBirth) {
    if (dateOfBirth) {
      const targetDob = new Date(targetProfile.dateOfBirth).toISOString().slice(0, 10);
      const inputDob = new Date(dateOfBirth).toISOString().slice(0, 10);
      if (targetDob !== inputDob) {
        try {
          await AuditLog.create({
            actorId: req.user._id,
            action: 'PATIENT_CLAIM_FAILED',
            targetId: req.user._id,
            targetResource: 'PatientProfile',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'failed',
            details: { patientId: normalizedPatientId, reason: 'dob_mismatch' }
          });
        } catch (_) {}
        throw new AppError(GENERIC_CLAIM_FAILURE_MESSAGE, 400);
      }
      corroborated = true;
    } else if (!corroborated) {
      try {
        await AuditLog.create({
          actorId: req.user._id,
          action: 'PATIENT_CLAIM_FAILED',
          targetId: req.user._id,
          targetResource: 'PatientProfile',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          status: 'failed',
          details: { patientId: normalizedPatientId, reason: 'missing_corroboration' }
        });
      } catch (_) {}
      throw new AppError(GENERIC_CLAIM_FAILURE_MESSAGE, 400);
    }
  }

  // 3. Atomic claim to prevent concurrent claims of the same record
  // If caller had an empty initial placeholder profile without screenings, unlink its userId first so unique index is not violated
  if (existingProfile && existingProfile._id.toString() !== targetProfile._id.toString()) {
    await PatientProfile.findByIdAndUpdate(existingProfile._id, { $set: { userId: null } })
  }

  const claimedProfile = await PatientProfile.findOneAndUpdate(
    {
      _id: targetProfile._id,
      claimStatus: 'unclaimed',
      userId: null
    },
    {
      $set: {
        userId: req.user._id,
        claimStatus: 'claimed',
        claimedAt: new Date()
      },
      $unset: {
        claimCodeHash: 1
      }
    },
    { returnDocument: 'after' }
  )

  if (!claimedProfile) {
    // Restore userId on existing placeholder profile if atomic claim failed
    if (existingProfile && existingProfile._id.toString() !== targetProfile._id.toString()) {
      await PatientProfile.findByIdAndUpdate(existingProfile._id, { $set: { userId: req.user._id } })
    }

    try {
      await AuditLog.create({
        actorId: req.user._id,
        action: 'PATIENT_CLAIM_FAILED',
        targetId: req.user._id,
        targetResource: 'PatientProfile',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'failed',
        details: { patientId: normalizedPatientId, reason: 'concurrent_claim_conflict' }
      })
    } catch (_) {}
    throw new AppError(GENERIC_CLAIM_FAILURE_MESSAGE, 400)
  }

  // Remove the unlinked initial placeholder profile now that target is claimed
  if (existingProfile && existingProfile._id.toString() !== claimedProfile._id.toString()) {
    await PatientProfile.findByIdAndDelete(existingProfile._id)
  }

  // 4. Seamlessly link any historical screenings conducted at outreach camps to this patient account
  await Screening.updateMany(
    { patientId: claimedProfile._id, userId: null },
    { $set: { userId: req.user._id } }
  );

  // 5. Update User model to mark profile complete
  await userModel.findByIdAndUpdate(req.user._id, { $set: { isProfileComplete: true } });

  // 6. Record audit log
  try {
    await AuditLog.create({
      actorId: req.user._id,
      action: 'PATIENT_RECORD_CLAIMED',
      targetId: req.user._id,
      targetResource: 'PatientProfile',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success',
      details: {
        patientId: claimedProfile.patientId,
        profileId: claimedProfile._id,
        claimedAt: claimedProfile.claimedAt
      }
    });
  } catch (err) {
    console.error('AuditLog error in claimPatientRecord:', err.message);
  }

  res.status(200).json({
    success: true,
    message: 'Patient record successfully claimed and linked to your account.',
    data: claimedProfile
  });
}

/**
 * GET /api/patients
 * Search / List patient records for authorized healthcare workers, doctors, and admins.
 */
async function searchPatients(req, res) {
  const { search, district, page = 1, limit = 20 } = req.query;

  const profileQuery = {};

  if (district && district.trim()) {
    profileQuery['address.district'] = { $regex: district.trim(), $options: 'i' };
  }

  if (search && search.trim()) {
    const term = search.trim();
    profileQuery.$or = [
      { 'fullName.firstName': { $regex: term, $options: 'i' } },
      { 'fullName.lastName': { $regex: term, $options: 'i' } },
      { patientId: { $regex: term.toUpperCase(), $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } }
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

  const [profiles, total] = await Promise.all([
    PatientProfile.find(profileQuery)
      .populate('userId', 'fullName email loginId role isActive isProfileComplete')
      .populate('registeredBy', 'fullName email loginId role')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    PatientProfile.countDocuments(profileQuery)
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
    data: profiles
  });
}

/**
 * GET /api/patients/:patientId
 * Get single patient details by PatientProfile ID, patientId (PAT-...), or User ID
 */
async function getPatientById(req, res) {
  const { patientId } = req.params;

  let profile = null;

  if (mongoose.Types.ObjectId.isValid(patientId)) {
    profile = await PatientProfile.findById(patientId)
      .populate('userId', 'fullName email loginId role isActive isProfileComplete')
      .populate('registeredBy', 'fullName email loginId role');

    if (!profile) {
      profile = await PatientProfile.findOne({ userId: patientId })
        .populate('userId', 'fullName email loginId role isActive isProfileComplete')
        .populate('registeredBy', 'fullName email loginId role');
    }
  } else {
    profile = await PatientProfile.findOne({ patientId: patientId.toUpperCase() })
      .populate('userId', 'fullName email loginId role isActive isProfileComplete')
      .populate('registeredBy', 'fullName email loginId role');

    if (!profile) {
      const user = await userModel.findOne({ loginId: patientId.toUpperCase() });
      if (user) {
        profile = await PatientProfile.findOne({ userId: user._id })
          .populate('userId', 'fullName email loginId role isActive isProfileComplete')
          .populate('registeredBy', 'fullName email loginId role');
      }
    }
  }

  if (!profile) {
    throw new AppError('Patient not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      profile,
      user: profile.userId || null
    }
  });
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  registerFieldPatient,
  claimPatientRecord,
  searchPatients,
  getPatientById
};