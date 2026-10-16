const mongoose = require('mongoose');
const userModel = require('../models/user.model');
const HealthcareWorkerProfile = require('../models/healthCare.model');
const DoctorProfile = require('../models/doctorProfile.model');
const PatientProfile = require('../models/patientProfile.model');
const Screening = require('../models/screening.model');
const AuditLog = require('../models/auditLog.model');
const AppError = require('../utils/app.error');
const generateLoginId = require('../utils/generateLoginId');

// Roles that go through the verification flow
const VERIFIABLE_ROLES = ['healthcare_worker', 'doctor'];

// Get all pending verifications
async function getPendingVerifications(req, res) {
  const pendingUsers = await userModel.find({
    verificationStatus: 'pending',
    role: { $in: VERIFIABLE_ROLES }
  })
    .sort({ createdAt: -1 })
    .select('_id fullName email role verificationStatus isActive createdAt');

  return res.status(200).json({
    success: true,
    message: 'Pending verifications fetched successfully',
    count: pendingUsers.length,
    data: pendingUsers
  });
}

// Get verification details for a single applicant
async function getVerificationDetails(req, res) {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const user = await userModel.findById(userId).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!VERIFIABLE_ROLES.includes(user.role)) {
    throw new AppError('This user is not a verifiable applicant', 400);
  }

  let profile = null;

  if (user.role === 'healthcare_worker') {
    profile = await HealthcareWorkerProfile.findOne({ userId: user._id });
  }

  if (user.role === 'doctor') {
    profile = await DoctorProfile.findOne({ userId: user._id });
  }

  return res.status(200).json({
    success: true,
    message: 'Verification details fetched successfully',
    data: {
      user,
      profile
    }
  });
}

// Approve verification
async function approveVerification(req, res) {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const user = await userModel.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role === 'patient') {
    throw new AppError('Patient accounts do not require verification', 400);
  }

  if (user.role === 'admin') {
    throw new AppError('Admin accounts cannot be approved through this endpoint', 400);
  }

  if (!VERIFIABLE_ROLES.includes(user.role)) {
    throw new AppError('This user role is not eligible for verification', 400);
  }

  if (user.verificationStatus === 'approved') {
    throw new AppError('User is already approved', 400);
  }

  if (user.verificationStatus !== 'pending') {
    throw new AppError(
      `Cannot approve user with verification status: ${user.verificationStatus}`,
      400
    );
  }

  let loginId = user.loginId;
  if (!loginId) {
    loginId = await generateLoginId(user.role);
  }

  const updatedUser = await userModel.findOneAndUpdate(
    { _id: user._id, verificationStatus: 'pending' },
    {
      $set: {
        verificationStatus: 'approved',
        isActive: true,
        loginId: loginId
      }
    },
    { returnDocument: 'after' }
  );

  if (!updatedUser) {
    throw new AppError('User is already processed or status is no longer pending', 400);
  }

  // Audit log entry
  try {
    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADMIN_APPROVE_USER',
      targetId: user._id,
      targetResource: `User:${user.role}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: {
        assignedLoginId: loginId,
        userRole: user.role
      }
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }

  return res.status(200).json({
    success: true,
    message: 'Verification approved successfully',
    data: {
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      loginId: updatedUser.loginId,
      verificationStatus: updatedUser.verificationStatus,
      isActive: updatedUser.isActive
    }
  });
}

// Reject verification
async function rejectVerification(req, res) {
  const { userId } = req.params;
  const { reason } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const user = await userModel.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role === 'patient') {
    throw new AppError('Patient accounts do not require verification', 400);
  }

  if (user.role === 'admin') {
    throw new AppError('Admin accounts cannot be rejected through this endpoint', 400);
  }

  if (!VERIFIABLE_ROLES.includes(user.role)) {
    throw new AppError('This user role is not eligible for verification', 400);
  }

  if (user.verificationStatus === 'approved') {
    throw new AppError('Cannot reject an already approved user', 400);
  }

  if (user.verificationStatus === 'rejected') {
    throw new AppError('User is already rejected', 400);
  }

  if (user.verificationStatus !== 'pending') {
    throw new AppError(
      `Cannot reject user with verification status: ${user.verificationStatus}`,
      400
    );
  }

  const updatedUser = await userModel.findOneAndUpdate(
    { _id: user._id, verificationStatus: 'pending' },
    {
      $set: {
        verificationStatus: 'rejected',
        isActive: false
      }
    },
    { returnDocument: 'after' }
  );

  if (!updatedUser) {
    throw new AppError('User is already processed or status is no longer pending', 400);
  }

  // Audit log entry
  try {
    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADMIN_REJECT_USER',
      targetId: user._id,
      targetResource: `User:${user.role}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: {
        userRole: user.role,
        reason: reason || 'Not specified'
      }
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }

  return res.status(200).json({
    success: true,
    message: 'Verification rejected successfully',
    data: {
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      verificationStatus: updatedUser.verificationStatus,
      isActive: updatedUser.isActive,
      rejectionReason: reason || null
    }
  });
}

// GET /api/v1/admin/analytics/overview
async function getSystemOverview(req, res) {
  const [
    totalUsers,
    totalPatients,
    totalHealthcareWorkers,
    totalDoctors,
    pendingVerifications,
    totalScreenings,
    referableScreenings,
    reviewedScreenings
  ] = await Promise.all([
    userModel.countDocuments(),
    userModel.countDocuments({ role: 'patient' }),
    userModel.countDocuments({ role: 'healthcare_worker' }),
    userModel.countDocuments({ role: 'doctor' }),
    userModel.countDocuments({ verificationStatus: 'pending' }),
    Screening.countDocuments(),
    Screening.countDocuments({ 'aiResult.screeningDecision.referable': true }),
    Screening.countDocuments({ status: 'reviewed' })
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        patients: totalPatients,
        healthcareWorkers: totalHealthcareWorkers,
        doctors: totalDoctors,
        pendingVerifications
      },
      screenings: {
        total: totalScreenings,
        referable: referableScreenings,
        nonReferable: Math.max(0, totalScreenings - referableScreenings),
        reviewed: reviewedScreenings,
        pendingReview: Math.max(0, referableScreenings - reviewedScreenings)
      }
    }
  });
}

// GET /api/v1/admin/analytics/districts
async function getDistrictAnalytics(req, res) {
  // Aggregate screenings joined with patient profiles to compute district metrics
  const districtData = await Screening.aggregate([
    {
      $lookup: {
        from: 'patientprofiles',
        localField: 'patientId',
        foreignField: '_id',
        as: 'profile'
      }
    },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$profile.address.district', 'Unassigned District'] },
        totalScreenings: { $sum: 1 },
        referableCount: {
          $sum: {
            $cond: [{ $eq: ['$aiResult.screeningDecision.referable', true] }, 1, 0]
          }
        },
        mildCount: {
          $sum: { $cond: [{ $eq: ['$aiResult.grade', 1] }, 1, 0] }
        },
        moderateCount: {
          $sum: { $cond: [{ $eq: ['$aiResult.grade', 2] }, 1, 0] }
        },
        severeCount: {
          $sum: { $cond: [{ $eq: ['$aiResult.grade', 3] }, 1, 0] }
        },
        proliferativeCount: {
          $sum: { $cond: [{ $eq: ['$aiResult.grade', 4] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        district: '$_id',
        _id: 0,
        totalScreenings: 1,
        referableCount: 1,
        referralRate: {
          $cond: [
            { $gt: ['$totalScreenings', 0] },
            { $round: [{ $multiply: [{ $divide: ['$referableCount', '$totalScreenings'] }, 100] }, 1] },
            0
          ]
        },
        grades: {
          mild: '$mildCount',
          moderate: '$moderateCount',
          severe: '$severeCount',
          proliferative: '$proliferativeCount'
        }
      }
    },
    { $sort: { totalScreenings: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: districtData
  });
}

// GET /api/v1/admin/audit-logs
async function getAuditLogs(req, res) {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

  const [logs, total] = await Promise.all([
    AuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('actorId', 'fullName email role loginId')
      .populate('targetId', 'fullName email role loginId'),
    AuditLog.countDocuments()
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
    data: logs
  });
}

module.exports = {
  getPendingVerifications,
  getVerificationDetails,
  approveVerification,
  rejectVerification,
  getSystemOverview,
  getDistrictAnalytics,
  getAuditLogs
};
