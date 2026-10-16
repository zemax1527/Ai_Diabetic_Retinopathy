const mongoose = require('mongoose');
const Screening = require('../models/screening.model');
const AuditLog = require('../models/auditLog.model');
const AppError = require('../utils/app.error');

/**
 * GET /api/reviews/queue
 * Returns list of screenings waiting for clinical doctor review
 */
async function getReviewQueue(req, res) {
  const { status, severity, page = 1, limit = 20 } = req.query;

  const query = {
    $or: [
      { status: 'pending_review' },
      { 'aiResult.screeningDecision.referable': true, status: { $ne: 'reviewed' } }
    ]
  };

  if (status && status !== 'all') {
    query.status = status;
  }

  if (severity && severity !== 'all') {
    query['aiResult.grade'] = Number(severity);
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

  const [screenings, total] = await Promise.all([
    Screening.find(query)
      .sort({ 'aiResult.grade': -1, createdAt: 1 }) // Highest DR grade first, then oldest
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'fullName email loginId')
      .populate('patientId')
      .populate('conductedBy', 'fullName email loginId'),
    Screening.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
    data: screenings
  });
}

/**
 * POST /api/reviews/:screeningId
 * Doctor submits clinical review & referral
 */
async function submitClinicalReview(req, res) {
  const { screeningId } = req.params;
  const { clinicalGrade, clinicalNotes, triageLevel, referralHospital } = req.body;

  if (!mongoose.Types.ObjectId.isValid(screeningId)) {
    throw new AppError('Invalid screening ID', 400);
  }

  if (clinicalGrade === undefined || clinicalGrade === null) {
    throw new AppError('Clinical grade (0 to 4) is required', 400);
  }

  const numericGrade = Number(clinicalGrade);
  if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 4) {
    throw new AppError('Clinical grade must be an integer between 0 and 4', 400);
  }

  const validTriage = ['routine', 'priority', 'urgent'];
  if (triageLevel && !validTriage.includes(triageLevel)) {
    throw new AppError('Invalid triage level. Must be routine, priority, or urgent', 400);
  }

  const screening = await Screening.findById(screeningId);
  if (!screening) {
    throw new AppError('Screening record not found', 404);
  }

  // Update review subdocument and status
  screening.review = {
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
    clinicalGrade: numericGrade,
    clinicalNotes: clinicalNotes || '',
    triageLevel: triageLevel || (numericGrade >= 3 ? 'urgent' : numericGrade >= 1 ? 'priority' : 'routine'),
    referralHospital: referralHospital || ''
  };

  screening.status = 'reviewed';
  await screening.save();

  // Audit log entry
  try {
    await AuditLog.create({
      actorId: req.user._id,
      action: 'DOCTOR_SUBMIT_REVIEW',
      targetId: screening.userId,
      targetResource: `Screening:${screening._id}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: {
        screeningId: screening._id,
        clinicalGrade: numericGrade,
        triageLevel: screening.review.triageLevel,
        referralHospital: screening.review.referralHospital
      }
    });
  } catch (err) {
    console.error('Failed to create audit log for review:', err.message);
  }

  const updatedScreening = await Screening.findById(screeningId)
    .populate('userId', 'fullName email loginId')
    .populate('patientId')
    .populate('review.reviewedBy', 'fullName email specialization');

  res.status(200).json({
    success: true,
    message: 'Clinical review submitted successfully',
    data: updatedScreening
  });
}

/**
 * GET /api/reviews/history
 * Screenings reviewed by the authenticated doctor
 */
async function getDoctorReviewHistory(req, res) {
  const screenings = await Screening.find({
    'review.reviewedBy': req.user._id
  })
    .sort({ 'review.reviewedAt': -1 })
    .populate('userId', 'fullName email loginId')
    .populate('patientId');

  res.status(200).json({
    success: true,
    count: screenings.length,
    data: screenings
  });
}

module.exports = {
  getReviewQueue,
  submitClinicalReview,
  getDoctorReviewHistory
};
