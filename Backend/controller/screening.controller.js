const mongoose = require('mongoose');
const Screening = require('../models/screening.model');
const PatientProfile = require('../models/patientProfile.model');
const User = require('../models/user.model');
const AuditLog = require('../models/auditLog.model');
const AppError = require('../utils/app.error');
const { validateScreeningImages } = require('../utils/storage.validator');

/**
 * POST /api/screenings/sync
 * Sync/persist an AI screening result into MongoDB.
 * Strictly checks actor authorization, links to target patient record,
 * records actor separately from patient, and provides concurrency-safe idempotency.
 */
async function syncScreening(req, res) {
  const body = req.body || {};
  // Screening data could be in body.screeningData, body.screening, body.data, or directly in body
  const payload = body.screeningData || body.screening || body.data || body;
  // If raw AI response was attached or is available
  const rawAi = body.rawAiResponse || payload.raw || (payload.screening ? payload : null);
  const sc = rawAi?.screening || rawAi || {};

  let targetUserId = null;
  let patientProfile = null;
  let conductedBy = null;
  let screeningType = 'self';

  // Assisted screening performed by healthcare worker or doctor
  if (['healthcare_worker', 'doctor'].includes(req.user.role)) {
    const rawPatientId = body.patientId || body.userId || payload.userId || payload.patientId;
    if (!rawPatientId) {
      throw new AppError('Healthcare workers and doctors must specify a target patientId', 400);
    }

    screeningType = 'assisted';
    conductedBy = req.user._id;

    // 1. Try to find existing PatientProfile directly (by _id or patientId)
    if (mongoose.Types.ObjectId.isValid(rawPatientId)) {
      patientProfile = await PatientProfile.findById(rawPatientId);
      if (!patientProfile) {
        // Check if rawPatientId is a User with role 'patient'
        const userDoc = await User.findById(rawPatientId);
        if (userDoc) {
          if (userDoc.role !== 'patient') {
            throw new AppError('Assisted screening target must be a registered patient', 400);
          }
          targetUserId = userDoc._id;
          patientProfile = await PatientProfile.findOne({ userId: userDoc._id });
        }
      }
    } else {
      // Look up by human-readable patientId (e.g., PAT-2026-0001)
      patientProfile = await PatientProfile.findOne({ patientId: rawPatientId.toUpperCase() });
      if (!patientProfile) {
        const userDoc = await User.findOne({ loginId: rawPatientId.toUpperCase(), role: 'patient' });
        if (userDoc) {
          targetUserId = userDoc._id;
          patientProfile = await PatientProfile.findOne({ userId: userDoc._id });
        }
      }
    }

    if (!patientProfile) {
      throw new AppError('Specified patient record was not found', 404);
    }

    targetUserId = patientProfile.userId || targetUserId;
  } else if (req.user.role === 'patient') {
    // Self-screening: target is strictly the authenticated patient
    targetUserId = req.user._id;
    screeningType = 'self';
    conductedBy = null;

    // Reject client attempt to submit screening for someone else
    if (body.patientId && String(body.patientId) !== String(req.user._id)) {
      const existingProf = await PatientProfile.findOne({ userId: req.user._id });
      if (!existingProf || String(body.patientId) !== String(existingProf._id) && String(body.patientId) !== String(existingProf.patientId)) {
        throw new AppError('Patients cannot submit screenings on behalf of other patients', 403);
      }
    }

    patientProfile = await PatientProfile.findOne({ userId: targetUserId });
    if (!patientProfile) {
      patientProfile = await PatientProfile.create({
        userId: targetUserId,
        patientId: req.user.loginId,
        fullName: req.user.fullName,
        registrationType: 'self',
        claimStatus: 'claimed',
        claimedAt: new Date()
      });
    }
  } else {
    throw new AppError('Your role is not authorized to create screening records', 403);
  }

  // Extract reference ID for idempotency
  const rawRef =
    payload.id ||
    payload.screeningId ||
    payload.screening_id ||
    sc.screening_id ||
    rawAi?.screening_id ||
    payload.technical?.screeningId;

  const trimmedRef = (rawRef !== undefined && rawRef !== null) ? String(rawRef).trim() : '';
  const screeningReferenceId = trimmedRef || `SCR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Idempotency check: if already recorded for this patient profile, return existing record
  const existingScreening = await Screening.findOne({
    patientId: patientProfile._id,
    screeningReferenceId
  });
  if (existingScreening) {
    return res.status(200).json({
      success: true,
      message: 'Screening result already recorded',
      data: existingScreening,
      isDuplicate: true
    });
  }

  // Extract classification details (handles mapped view model, raw AI response, and fallback)
  const classification = payload.classification || sc.classification || rawAi?.classification || {};
  let grade = 0;
  if (classification.grade !== undefined && classification.grade !== null) {
    grade = Number(classification.grade);
  } else if (payload.grade !== undefined && payload.grade !== null) {
    grade = Number(payload.grade);
  } else if (sc.classification?.grade !== undefined) {
    grade = Number(sc.classification.grade);
  }

  const label = classification.label || payload.label || payload.result || sc.classification?.label || 'No Diabetic Retinopathy';
  const confidence = String(classification.confidence || payload.confidence || sc.classification?.confidence || '0%');
  const probabilities = classification.probabilities || classification.probabilitiesList || sc.classification?.probabilities || {};

  // Compute normalized confidenceScore (0.0 to 1.0, defaulting to 0)
  let confidenceScore = 0;
  if (typeof payload.confidenceScore === 'number') {
    confidenceScore = payload.confidenceScore;
  } else if (typeof classification.confidence === 'number') {
    confidenceScore = classification.confidence <= 1 ? classification.confidence : classification.confidence / 100;
  } else if (typeof sc.classification?.confidence === 'number') {
    confidenceScore = sc.classification.confidence <= 1 ? sc.classification.confidence : sc.classification.confidence / 100;
  } else if (typeof confidence === 'string' && confidence.includes('%')) {
    const parsed = parseFloat(confidence);
    if (!isNaN(parsed)) {
      confidenceScore = parsed <= 1 ? parsed : parsed / 100;
    }
  }

  // Extract decision
  const decisionObj = payload.decision || payload.screening_decision || sc.screening_decision || rawAi?.screening_decision || {};
  const isReferable = Boolean(decisionObj.referable ?? (grade >= 2));
  const decisionText = decisionObj.decision || (isReferable ? 'REFERABLE' : 'NON-REFERABLE');
  const decisionReason = decisionObj.reason || '';

  // Extract quality
  const qualityObj = payload.quality || rawAi?.quality || {};
  let qualityChecks = [];
  if (Array.isArray(qualityObj.checks)) {
    qualityChecks = qualityObj.checks;
  } else if (qualityObj.checks && typeof qualityObj.checks === 'object') {
    qualityChecks = Object.entries(qualityObj.checks).map(([key, checkData]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      passed: Boolean(checkData?.passed),
      detail: checkData && typeof checkData === 'object'
        ? (checkData.detail || Object.entries(checkData).filter(([k]) => k !== 'passed').map(([k, v]) => `${k}: ${v}`).join(', '))
        : String(checkData || '')
    }));
  }

  // Extract explainability & lesions
  const explainObj = payload.explainability || sc.explainability || rawAi?.explainability || {};
  const lesionsObj = payload.lesions || sc.lesions || rawAi?.lesions || {};

  let lesionCount = 0;
  if (typeof lesionsObj.count === 'number') lesionCount = lesionsObj.count;
  else if (typeof lesionsObj.lesion_count === 'number') lesionCount = lesionsObj.lesion_count;

  let summaryList = [];
  if (Array.isArray(lesionsObj.summaryList)) {
    summaryList = lesionsObj.summaryList;
  } else if (lesionsObj.class_summary && typeof lesionsObj.class_summary === 'object') {
    summaryList = Object.entries(lesionsObj.class_summary).map(([key, val]) => ({
      key,
      displayName: val?.display_name || key.replace(/_/g, ' '),
      count: typeof val?.count === 'number' ? val.count : (typeof val === 'number' ? val : 0),
      maxConfidence: val?.max_confidence !== undefined ? String(val.max_confidence) : null
    }));
  }

  // Extract and validate images (SEC-09)
  const imageValidation = validateScreeningImages({
    originalUrl: [
      payload.images?.originalUrl,
      payload.images?.original_url,
      payload.images?.original,
      payload.originalUrl,
      payload.fundusImage,
      sc.images?.original_url,
      sc.images?.original,
      rawAi?.images?.original_url,
      rawAi?.images?.original
    ],
    heatmapUrl: [
      payload.images?.heatmapUrl,
      payload.images?.heatmap_url,
      payload.images?.heatmap,
      payload.heatmapImage,
      explainObj.heatmap_url,
      explainObj.heatmapUrl,
      sc.images?.heatmap_url,
      rawAi?.images?.heatmap_url
    ],
    gradcamUrl: [
      payload.images?.gradcamUrl,
      payload.images?.gradcam_url,
      payload.images?.gradcam,
      explainObj.overlay_url,
      explainObj.gradcamUrl,
      sc.images?.gradcam_url,
      rawAi?.images?.gradcam_url
    ],
    lesionOverlayUrl: [
      payload.images?.lesionOverlayUrl,
      payload.images?.lesion_overlay_url,
      payload.images?.lesionOverlay,
      lesionsObj.overlay_url,
      sc.images?.lesion_overlay_url,
      rawAi?.images?.lesion_overlay_url
    ]
  });

  if (!imageValidation.valid) {
    throw new AppError('Invalid screening image URL. Only secure URLs from approved storage providers are permitted.', 400);
  }

  const { sanitizedImages, storageProvider, providers } = imageValidation;
  const { originalUrl, heatmapUrl, gradcamUrl, lesionOverlayUrl } = sanitizedImages;

  // Default initial status
  const screeningStatus = isReferable ? 'pending_review' : 'completed';

  let newScreening;
  try {
    newScreening = await Screening.create({
      patientId: patientProfile._id,
      userId: targetUserId,
      screeningType,
      conductedBy,
      status: screeningStatus,
      screeningReferenceId,
      images: {
        originalUrl,
        heatmapUrl,
        gradcamUrl,
        lesionOverlayUrl,
        storageProvider,
        providers
      },
      quality: {
        status: qualityObj.status || 'Good',
        score: typeof qualityObj.score === 'number' ? qualityObj.score : 1,
        isFundus: qualityObj.isFundus !== undefined ? Boolean(qualityObj.isFundus) : true,
        recommendation: qualityObj.recommendation || '',
        checks: qualityChecks
      },
      aiResult: {
        grade,
        label,
        confidence,
        confidenceScore,
        probabilities,
        screeningDecision: {
          decision: decisionText,
          referable: isReferable,
          reason: decisionReason
        }
      },
      explainability: {
        method: explainObj.method || 'Grad-CAM++',
        explanation: explainObj.explanation || '',
        heatmapUrl,
        overlayUrl: gradcamUrl
      },
      lesions: {
        count: lesionCount,
        summaryList,
        model: lesionsObj.model || 'fundus-lesions-toolkit'
      }
    });
  } catch (err) {
    // Gracefully handle E11000 duplicate-key race condition
    if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
      const existingAfterRace = await Screening.findOne({
        patientId: patientProfile._id,
        screeningReferenceId
      });
      if (existingAfterRace) {
        return res.status(200).json({
          success: true,
          message: 'Screening result already recorded',
          data: existingAfterRace,
          isDuplicate: true
        });
      }
    }
    throw err;
  }

  // Record audit event
  try {
    await AuditLog.create({
      actorId: req.user._id,
      action: 'SCREENING_SYNCED',
      targetId: targetUserId || patientProfile.registeredBy || req.user._id,
      targetResource: 'Screening',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success',
      details: {
        screeningId: newScreening._id,
        referenceId: screeningReferenceId,
        patientId: patientProfile.patientId,
        profileId: patientProfile._id,
        screeningType,
        isReferable
      }
    });
  } catch (err) {
    console.error('AuditLog error in syncScreening:', err.message);
  }

  res.status(201).json({
    success: true,
    message: 'Screening result synchronized successfully',
    data: newScreening
  });
}

/**
 * GET /api/screenings/my
 * Returns screening history for authenticated patient (including claimed field screenings)
 */
async function getMyScreenings(req, res) {
  const patientProfile = await PatientProfile.findOne({ userId: req.user._id });

  const queryOr = [{ userId: req.user._id }];
  if (patientProfile) {
    queryOr.push({ patientId: patientProfile._id });
  }

  const screenings = await Screening.find({ $or: queryOr })
    .sort({ createdAt: -1 })
    .populate('conductedBy', 'fullName email loginId role')
    .populate('review.reviewedBy', 'fullName email specialization');

  res.status(200).json({
    success: true,
    count: screenings.length,
    data: screenings
  });
}

/**
 * GET /api/screenings/:id
 * Returns single screening record with full details.
 * Strictly verifies ownership and role authorization.
 */
async function getScreeningById(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError('Invalid screening ID', 400);
  }

  const screening = await Screening.findById(req.params.id)
    .populate('patientId')
    .populate('userId', 'fullName email loginId')
    .populate('conductedBy', 'fullName email loginId role')
    .populate('review.reviewedBy', 'fullName email specialization');

  if (!screening) {
    throw new AppError('Screening record not found', 404);
  }

  // Access check:
  // 1. Patient owner
  const isUserOwner = screening.userId && (screening.userId._id?.toString() === req.user._id.toString() || screening.userId.toString() === req.user._id.toString());
  const isProfileOwner = screening.patientId && screening.patientId.userId && screening.patientId.userId.toString() === req.user._id.toString();
  const isOwner = isUserOwner || isProfileOwner;

  // 2. Healthcare worker who conducted the screening
  const isConductor = screening.conductedBy && (screening.conductedBy._id?.toString() === req.user._id.toString() || screening.conductedBy.toString() === req.user._id.toString());

  // 3. Healthcare worker who registered the patient
  const isRegistrar = screening.patientId && screening.patientId.registeredBy && screening.patientId.registeredBy.toString() === req.user._id.toString();

  // 4. Clinical reviewer (Doctor or Admin)
  const isDoctorOrAdmin = ['doctor', 'admin'].includes(req.user.role);

  if (!isOwner && !isConductor && !isRegistrar && !isDoctorOrAdmin) {
    throw new AppError('You are not authorized to view this screening record', 403);
  }

  res.status(200).json({
    success: true,
    data: screening
  });
}

/**
 * GET /api/screenings/patient/:patientId
 * View screenings for a specific patient.
 * Doctors & Admins have clinical oversight.
 * Healthcare workers can view if they registered the patient or conducted screenings.
 */
async function getPatientScreenings(req, res) {
  const { patientId } = req.params;

  let targetUserId = null;
  let targetProfile = null;

  if (mongoose.Types.ObjectId.isValid(patientId)) {
    targetProfile = await PatientProfile.findById(patientId);
    if (!targetProfile) {
      const userDoc = await User.findById(patientId);
      if (userDoc) {
        targetUserId = userDoc._id;
        targetProfile = await PatientProfile.findOne({ userId: userDoc._id });
      }
    } else {
      targetUserId = targetProfile.userId;
    }
  } else {
    targetProfile = await PatientProfile.findOne({ patientId: patientId.toUpperCase() });
    if (!targetProfile) {
      const userDoc = await User.findOne({ loginId: patientId.toUpperCase() });
      if (userDoc) {
        targetUserId = userDoc._id;
        targetProfile = await PatientProfile.findOne({ userId: userDoc._id });
      }
    } else {
      targetUserId = targetProfile.userId;
    }
  }

  if (!targetProfile && !targetUserId) {
    throw new AppError('Patient not found', 404);
  }

  // Healthcare worker authorization check: must have registered the patient or conducted a screening for them
  if (req.user.role === 'healthcare_worker') {
    const isRegistrar = targetProfile && targetProfile.registeredBy && targetProfile.registeredBy.toString() === req.user._id.toString();
    const hasConducted = targetProfile ? await Screening.exists({ patientId: targetProfile._id, conductedBy: req.user._id }) : false;

    if (!isRegistrar && !hasConducted) {
      throw new AppError('Healthcare workers can only access screenings for patients registered or screened within their workflow', 403);
    }
  }

  const queryOr = [];
  if (targetUserId) queryOr.push({ userId: targetUserId });
  if (targetProfile) queryOr.push({ patientId: targetProfile._id });

  const screenings = await Screening.find({ $or: queryOr })
    .sort({ createdAt: -1 })
    .populate('conductedBy', 'fullName email loginId')
    .populate('review.reviewedBy', 'fullName email specialization');

  res.status(200).json({
    success: true,
    count: screenings.length,
    data: screenings
  });
}

module.exports = {
  syncScreening,
  getMyScreenings,
  getScreeningById,
  getPatientScreenings
};
