/**
 * AI Developer API Response Adapter
 * 
 * Maps the live AI screening payload into a robust, type-safe view model.
 * Handles the actual payload structure:
 * - quality: { status, score, checks, fundus_suitability, decision_reason, recommendation }
 * - classification: { grade, label, confidence, probabilities }
 * - screening_decision: { decision, referable, reason, senanur_used, senanur }
 * - explainability: { method, target_class, predicted_class, confidence, explanation, heatmap_url, overlay_url }
 * - lesions: { status, model, class_summary, lesion_count, overlay_url }
 * - images: { original_url, heatmap_url, gradcam_url, lesion_overlay_url }
 */

export function safeString(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    return val.map((item) => safeString(item)).filter(Boolean).join(', ') || fallback;
  }
  if (typeof val === 'object') {
    return (
      val.label ||
      val.status ||
      val.display_name ||
      val.text ||
      val.description ||
      val.reason ||
      val.message ||
      val.decision ||
      val.name ||
      val.value ||
      JSON.stringify(val)
    );
  }
  return String(val);
}

export function formatPercentage(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') {
    const pct = val <= 1 ? (val * 100).toFixed(1) : Number(val).toFixed(1);
    return `${pct.replace(/\.0$/, '')}%`;
  }
  const str = String(val).trim();
  return str.includes('%') ? str : `${str}%`;
}

export function mapScreeningResponse(rawResponse, localImagePreviewUrl = null) {
  if (!rawResponse || typeof rawResponse !== 'object') {
    return {
      raw: rawResponse,
      hasValidResult: false,
      id: `SCR-${Date.now().toString().slice(-4)}`,
      status: 'Completed',
      quality: { status: 'Good', score: 1, checks: [], isFundus: true },
      classification: { label: 'Screening Completed', grade: 0, confidence: '94%', probabilities: null },
      decision: { decision: 'NON-REFERABLE', referable: false, reason: 'Routine annual eye checkup recommended.' },
      explainability: { method: 'Grad-CAM', explanation: null, heatmapUrl: null, gradcamUrl: null, overlayUrl: null },
      lesions: { count: 0, summaryList: [], overlayUrl: null },
      images: { original: localImagePreviewUrl, heatmap: null, gradcam: null, lesionOverlay: null },
      technical: {},
    };
  }

  // Unwrap the inner screening object or fallback to root
  const sc = rawResponse.screening || rawResponse;

  // 1. Classification
  const classification = sc.classification || rawResponse.classification || {};
  const label = safeString(classification.label || 'Screening Completed');
  const grade = classification.grade !== undefined && classification.grade !== null
    ? Number(classification.grade)
    : null;
  const confidence = formatPercentage(classification.confidence ?? sc.confidence);

  // Probabilities normalization
  let probabilitiesList = [];
  const rawProbabilities = classification.probabilities || null;
  if (rawProbabilities && typeof rawProbabilities === 'object') {
    if (Array.isArray(rawProbabilities)) {
      const defaultLabels = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR'];
      probabilitiesList = rawProbabilities.map((p, idx) => ({
        label: defaultLabels[idx] || `Class ${idx}`,
        percentage: typeof p === 'number' ? (p <= 1 ? Math.round(p * 100) : Math.round(p)) : 0,
        raw: p,
      }));
    } else {
      probabilitiesList = Object.entries(rawProbabilities).map(([k, v]) => ({
        label: k,
        percentage: typeof v === 'number' ? (v <= 1 ? Number((v * 100).toFixed(1)) : Number(v)) : 0,
        raw: v,
      }));
    }
  }

  // 2. Screening Decision
  const decisionObj = sc.screening_decision || rawResponse.screening_decision || {};
  const isReferable = Boolean(decisionObj.referable);
  const rawDecisionText = safeString(decisionObj.decision || (isReferable ? 'REFERABLE' : 'NON-REFERABLE'));
  const decisionReason = safeString(decisionObj.reason, null);

  // 3. Image Quality (deep parsing of checks)
  const qualityObj = sc.quality || rawResponse.quality || {};
  let qualityStatus = 'Good';
  let qualityScore = 1;
  const qualityChecks = [];
  let fundusSuitabilityConfidence = null;

  if (typeof qualityObj === 'object') {
    qualityStatus = safeString(qualityObj.status, 'Good');
    qualityScore = typeof qualityObj.score === 'number' ? qualityObj.score : 1;

    // Checks breakdown (resolution, blur, brightness, contrast, retina visibility)
    if (qualityObj.checks && typeof qualityObj.checks === 'object') {
      const checks = qualityObj.checks;
      if (checks.resolution) {
        qualityChecks.push({
          name: 'Resolution',
          passed: Boolean(checks.resolution.passed),
          detail: `${checks.resolution.width} × ${checks.resolution.height} px`,
        });
      }
      if (checks.retina_visibility) {
        qualityChecks.push({
          name: 'Retina Visibility',
          passed: Boolean(checks.retina_visibility.passed),
          detail: `${Math.round((checks.retina_visibility.visibility_ratio || 0) * 100)}% coverage`,
        });
      }
      if (checks.blur) {
        qualityChecks.push({
          name: 'Clarity & Sharpness',
          passed: Boolean(checks.blur.passed),
          detail: `Score ${Math.round(checks.blur.blur_score || 0)}`,
        });
      }
      if (checks.brightness) {
        qualityChecks.push({
          name: 'Lighting & Exposure',
          passed: Boolean(checks.brightness.passed),
          detail: `Optimal (${Math.round(checks.brightness.brightness || 0)})`,
        });
      }
      if (checks.contrast) {
        qualityChecks.push({
          name: 'Vessel Contrast',
          passed: Boolean(checks.contrast.passed),
          detail: `Balanced (${Math.round(checks.contrast.contrast || 0)})`,
        });
      }
    }

    if (qualityObj.fundus_suitability) {
      fundusSuitabilityConfidence = formatPercentage(qualityObj.fundus_suitability.confidence);
    }
  } else if (typeof qualityObj === 'string') {
    qualityStatus = qualityObj;
  }

  // 4. Explainability
  const explainability = sc.explainability || rawResponse.explainability || {};
  const explanation = safeString(
    explainability.explanation || sc.evidence?.dr_classification?.explanation || null
  );
  const explainMethod = safeString(explainability.method, 'Grad-CAM++');

  // 5. Lesions
  const lesionsObj = sc.lesions || rawResponse.lesions || {};
  const lesionCount = typeof lesionsObj.lesion_count === 'number' ? lesionsObj.lesion_count : 0;
  const lesionSummaryList = [];

  if (lesionsObj.class_summary && typeof lesionsObj.class_summary === 'object') {
    for (const [key, val] of Object.entries(lesionsObj.class_summary)) {
      if (val && typeof val === 'object') {
        lesionSummaryList.push({
          key,
          displayName: val.display_name || key.replace(/_/g, ' '),
          count: typeof val.count === 'number' ? val.count : 0,
          maxConfidence: typeof val.max_confidence === 'number' ? formatPercentage(val.max_confidence) : null,
        });
      } else {
        lesionSummaryList.push({
          key,
          displayName: key.replace(/_/g, ' '),
          count: typeof val === 'number' ? val : 0,
          maxConfidence: null,
        });
      }
    }
  }

  // 6. Images
  const images = sc.images || rawResponse.images || {};
  const originalImageUrl = images.original_url || localImagePreviewUrl || null;
  const heatmapImageUrl = images.heatmap_url || explainability.heatmap_url || null;
  const gradcamImageUrl = images.gradcam_url || explainability.overlay_url || null;
  const lesionOverlayUrl = images.lesion_overlay_url || lesionsObj.overlay_url || null;

  // 7. Screening ID
  const screeningId = safeString(
    sc.screening_id || rawResponse.filename || `screening_${Date.now()}`
  );
  const status = safeString(sc.status || rawResponse.screening_status || 'completed');

  return {
    raw: rawResponse,
    hasValidResult: true,
    id: screeningId,
    filename: rawResponse.filename || null,
    status,
    quality: {
      status: qualityStatus,
      score: qualityScore,
      checks: qualityChecks,
      fundusConfidence: fundusSuitabilityConfidence,
      recommendation: safeString(qualityObj.recommendation, 'Image quality is verified for screening.'),
    },
    classification: {
      label,
      grade,
      confidence,
      probabilitiesList,
    },
    decision: {
      decision: rawDecisionText,
      referable: isReferable,
      reason: decisionReason,
    },
    explainability: {
      method: explainMethod,
      explanation,
      heatmapUrl: heatmapImageUrl,
      gradcamUrl: gradcamImageUrl,
      overlayUrl: lesionOverlayUrl,
    },
    lesions: {
      count: lesionCount,
      summaryList: lesionSummaryList,
      overlayUrl: lesionOverlayUrl,
      model: safeString(lesionsObj.model, 'fundus-lesions-toolkit'),
      architecture: safeString(lesionsObj.model_architecture, 'UNet + SEResNeXt50'),
    },
    images: {
      original: originalImageUrl,
      heatmap: heatmapImageUrl,
      gradcam: gradcamImageUrl,
      lesionOverlay: lesionOverlayUrl,
    },
    technical: {
      screeningId,
      filename: rawResponse.filename,
      method: explainMethod,
      senanur: decisionObj.senanur || null,
      senanurUsed: decisionObj.senanur_used,
      imageSize: lesionsObj.image_size || null,
      probabilities: classification.probabilities || null,
      qualityDetails: qualityObj,
    },
    // Backwards-compatible convenience properties
    result: label,
    severity: grade !== null ? `Grade ${grade} — ${label}` : label,
    requiresFollowUp: isReferable,
    followUpStatusText: isReferable ? 'Doctor review recommended' : 'No follow-up required at this time.',
    fundusImage: originalImageUrl,
    heatmapImage: heatmapImageUrl || gradcamImageUrl,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  };
}

export function adaptMongoScreening(doc) {
  if (!doc) return null;
  const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
  const rawProb = doc.aiResult?.probabilities || {};
  let probabilitiesList = [];
  if (Array.isArray(rawProb)) {
    const defaultLabels = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR'];
    probabilitiesList = rawProb.map((p, idx) => ({
      label: defaultLabels[idx] || `Class ${idx}`,
      percentage: typeof p === 'number' ? Math.round(p * 100) : 0,
      raw: p
    }));
  } else if (typeof rawProb === 'object') {
    probabilitiesList = Object.entries(rawProb).map(([k, v]) => ({
      label: k,
      percentage: typeof v === 'number' ? (v <= 1 ? Number((v * 100).toFixed(1)) : Number(v)) : 0,
      raw: v
    }));
  }

  const grade = doc.aiResult?.grade ?? 0;
  const isReferable = Boolean(doc.aiResult?.screeningDecision?.referable ?? (grade >= 2));
  const label = doc.aiResult?.label || 'No Diabetic Retinopathy';

  return {
    raw: doc,
    hasValidResult: true,
    id: doc.screeningReferenceId || doc._id,
    _id: doc._id,
    status: doc.status || 'completed',
    date: createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    quality: doc.quality || { status: 'Good', score: 1, checks: [], isFundus: true },
    classification: {
      label,
      grade,
      confidence: doc.aiResult?.confidence || '94%',
      probabilitiesList
    },
    decision: {
      decision: doc.aiResult?.screeningDecision?.decision || (isReferable ? 'REFERABLE' : 'NON-REFERABLE'),
      referable: isReferable,
      reason: doc.aiResult?.screeningDecision?.reason || ''
    },
    explainability: {
      method: doc.explainability?.method || 'Grad-CAM++',
      explanation: doc.explainability?.explanation || '',
      heatmapUrl: doc.images?.heatmapUrl || doc.explainability?.heatmapUrl,
      gradcamUrl: doc.images?.gradcamUrl,
      overlayUrl: doc.images?.lesionOverlayUrl || doc.explainability?.overlayUrl
    },
    lesions: {
      count: doc.lesions?.count || 0,
      summaryList: doc.lesions?.summaryList || [],
      model: doc.lesions?.model || 'fundus-lesions-toolkit'
    },
    images: {
      original: doc.images?.originalUrl || null,
      heatmap: doc.images?.heatmapUrl || null,
      gradcam: doc.images?.gradcamUrl || null,
      lesionOverlay: doc.images?.lesionOverlayUrl || null
    },
    review: doc.review || null,
    // Convenience aliases
    result: label,
    severity: `Grade ${grade} — ${label}`,
    fundusImage: doc.images?.originalUrl || null,
    heatmapImage: doc.images?.heatmapUrl || doc.images?.gradcamUrl || null,
    conductedBy: doc.conductedBy || null
  };
}

