import React, { useState } from 'react';
import ScreeningInstructions from './ScreeningInstructions';
import FundusImageUploader from './FundusImageUploader';
import CameraCapture from './CameraCapture';
import ImagePreview from './ImagePreview';
import LanguageSelector from './LanguageSelector';
import ScreeningSubmit from './ScreeningSubmit';
import ScreeningLoader from './ScreeningLoader';
import ScreeningResult from './ScreeningResult';
import ErrorState from '../common/ErrorState';
import { screenFundusImage, SCREENING_ENDPOINT } from '../../../services/screeningApi';
import { mapScreeningResponse } from '../../../services/screeningAdapter';

// Sample contract response generator matching the AI Developer API contract
function getSampleContractResponse(userId, previewUrl) {
  return {
    filename: '00cc2b75cddd.png',
    user_id: userId || 'test_user_01',
    screening_status: 'completed',
    quality: {
      status: 'good',
      score: 1,
      checks: {
        resolution: { passed: true, width: 1050, height: 1050 },
        blur: { passed: true, blur_score: 80.1 },
        brightness: { passed: true, brightness: 77.17 },
        contrast: { passed: true, contrast: 41.75 },
        retina_visibility: { passed: true, visibility_ratio: 0.791 },
      },
      fundus_suitability: {
        label: 'fundus',
        is_fundus: true,
        confidence: 0.9991210103034973,
        fundus_probability: 0.9991210103034973,
        not_fundus_probability: 0.0008789896965026855,
        threshold: 0.5,
      },
      screening_ready: true,
      quality_decision: 'accept',
      decision_reason: 'The image is identified as a fundus image and its technical quality is sufficient for screening.',
      recommendation: 'Fundus image detected and image quality is sufficient for screening.',
    },
    screening: {
      screening_id: 'screening_20261007_142729_a281',
      user_id: userId || 'test_user_01',
      status: 'completed',
      quality: {
        status: 'good',
        score: 1,
        checks: {
          resolution: { passed: true, width: 1050, height: 1050 },
          blur: { passed: true, blur_score: 80.1 },
          brightness: { passed: true, brightness: 77.17 },
          contrast: { passed: true, contrast: 41.75 },
          retina_visibility: { passed: true, visibility_ratio: 0.791 },
        },
      },
      classification: {
        grade: 1,
        label: 'Mild',
        confidence: 0.4574,
        probabilities: {
          'No DR': 0.4057,
          'Mild': 0.4574,
          'Moderate': 0.1166,
          'Severe': 0.0095,
          'Proliferative DR': 0.0108,
        },
      },
      screening_decision: {
        decision: 'NON-REFERABLE',
        referable: false,
        reason: 'DrishtiAI predicted Grade 1 and the Senanur safety check did not indicate referable DR.',
        senanur_used: true,
        senanur: {
          enabled: true,
          model: 'Senanur 5-fold EfficientNet-B0 ONNX ensemble',
          raw_score: -0.012,
          grade: 0,
          label: 'No DR',
          referable: false,
          fold_spread: 0.1647,
          fold_scores: [-0.1267, 0.2629, -0.2251, 0.0205, 0.0085],
          thresholds: [0.668, 1.132, 2.324, 3.3],
        },
      },
      explainability: {
        method: 'Grad-CAM++',
        target_class: 1,
        predicted_class: 1,
        confidence: 0.4574,
        explanation: 'Grad-CAM++ highlights image regions that contributed to the selected DR classification. The highlighted regions represent model attention and should not be interpreted as individual lesions without supporting lesion detection evidence.',
        heatmap_url: 'https://res.cloudinary.com/k1jr6lth/image/upload/v1791363455/drishti-ai/screenings/screening_20261007_142729_a281/heatmap.jpg',
        overlay_url: 'https://res.cloudinary.com/k1jr6lth/image/upload/v1791363456/drishti-ai/screenings/screening_20261007_142729_a281/gradcam_overlay.jpg',
      },
      lesions: {
        status: 'success',
        model: 'ClementP fundus-lesions-toolkit',
        model_architecture: 'UNet + SEResNeXt50-32x4d',
        model_training_variant: 'ALL',
        image_size: { width: 1050, height: 1050 },
        confidence_threshold: 0.4,
        class_summary: {
          cotton_wool_spot: { display_name: 'Cotton Wool Spot', count: 0, max_confidence: 0 },
          exudate: { display_name: 'Exudate', count: 0, max_confidence: 0 },
          hemorrhage: { display_name: 'Hemorrhage', count: 0, max_confidence: 0 },
          microaneurysm: { display_name: 'Microaneurysm', count: 0, max_confidence: 0 },
        },
        lesion_count: 0,
        lesions: [],
        overlay_url: 'https://res.cloudinary.com/k1jr6lth/image/upload/v1791363457/drishti-ai/screenings/screening_20261007_142729_a281/lesion_overlay.jpg',
      },
      evidence: {
        dr_classification: {
          grade: 1,
          label: 'Mild',
          confidence: 0.4574,
        },
        language: 'English',
        preferred_language: 'English',
      },
      images: {
        original_url: previewUrl || 'https://res.cloudinary.com/k1jr6lth/image/upload/v1791363454/drishti-ai/screenings/screening_20261007_142729_a281/original.jpg',
        heatmap_url: 'https://res.cloudinary.com/k1jr6lth/image/upload/v1791363455/drishti-ai/screenings/screening_20261007_142729_a281/heatmap.jpg',
        gradcam_url: 'https://res.cloudinary.com/k1jr6lth/image/upload/v1791363456/drishti-ai/screenings/screening_20261007_142729_a281/gradcam_overlay.jpg',
        lesion_overlay_url: 'https://res.cloudinary.com/k1jr6lth/image/upload/v1791363457/drishti-ai/screenings/screening_20261007_142729_a281/lesion_overlay.jpg',
      },
    },
  };
}

export default function PatientScreeningFlow({
  currentUser,
  onScreeningCompleted,
  onBackToDashboard,
  onRequestDoctorReview,
}) {
  // Screening workflow phases: 'instructions' | 'upload' | 'camera' | 'loading' | 'result' | 'error'
  const [phase, setPhase] = useState('instructions');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedEye, setSelectedEye] = useState('Both Eyes');
  const [activeResult, setActiveResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Validate user ID
  const userId =
    currentUser?.id ||
    currentUser?._id ||
    currentUser?.userId ||
    currentUser?.loginId ||
    null;

  // Handle image selected via file picker
  const handleImageSelected = (file, url) => {
    setSelectedFile(file);
    setPreviewUrl(url);
  };

  // Handle image captured via camera
  const handleCameraCapture = (file, url) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    setPhase('upload');
  };

  // Remove selected image
  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // Start AI screening API submission
  const handleStartScreening = async () => {
    if (!userId) {
      setErrorMessage('User session not found. Please log in before submitting a screening.');
      setPhase('error');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Please upload or capture a fundus image before submitting.');
      setPhase('error');
      return;
    }

    setPhase('loading');
    setErrorMessage(null);

    try {
      console.log('[Drishti] Initiating screening for user:', userId);
      // Direct call to AI Developer API via SCREENING_ENDPOINT
      const rawResponse = await screenFundusImage({
        userId,
        file: selectedFile,
        language: selectedLanguage,
      });

      console.log('[Drishti] Received AI response:', rawResponse);

      // Map response dynamically according to the contract
      const mapped = mapScreeningResponse(rawResponse, previewUrl);
      mapped.rawAiResponse = rawResponse;
      mapped.raw = rawResponse;
      mapped.eye = selectedEye;
      mapped.language = selectedLanguage;
      mapped.id = mapped.id || `SCR-${Date.now().toString().slice(-4)}`;

      console.log('[Drishti] Mapped screening result:', mapped);
      setActiveResult(mapped);
      setPhase('result');

      // Notify parent to append to session history
      if (onScreeningCompleted) {
        onScreeningCompleted(mapped);
      }
    } catch (err) {
      console.error('[Drishti] Screening submission error:', err);
      let userFriendlyMsg = `Unable to reach AI screening service at ${SCREENING_ENDPOINT}. ${err.message || ''}`;
      setErrorMessage(userFriendlyMsg);
      setPhase('error');
    }
  };

  // Fallback to preview contract result if server is offline/lagging
  const handlePreviewContractResult = () => {
    const sample = getSampleContractResponse(userId || 'preview_user', previewUrl);
    const mapped = mapScreeningResponse(sample, previewUrl);
    mapped.rawAiResponse = sample;
    mapped.raw = sample;
    mapped.eye = selectedEye;
    mapped.language = selectedLanguage;
    setActiveResult(mapped);
    setPhase('result');
    if (onScreeningCompleted) {
      onScreeningCompleted(mapped);
    }
  };

  // Reset to perform another screening
  const handleStartNewScreening = () => {
    handleRemoveImage();
    setActiveResult(null);
    setErrorMessage(null);
    setPhase('instructions');
  };

  // ── Render according to active phase ──

  if (phase === 'instructions') {
    return (
      <ScreeningInstructions
        onContinue={() => setPhase('upload')}
        onCancel={onBackToDashboard}
      />
    );
  }

  if (phase === 'camera') {
    return (
      <CameraCapture
        onCaptureComplete={handleCameraCapture}
        onCancel={() => setPhase('upload')}
      />
    );
  }

  if (phase === 'loading') {
    return (
      <ScreeningLoader
        onCancel={() => setPhase('upload')}
      />
    );
  }

  if (phase === 'error') {
    return (
      <ErrorState
        title="Screening Service Notice"
        message={errorMessage || 'Unable to connect to the AI model on 192.168.137.145:8000.'}
        onRetry={() => {
          setErrorMessage(null);
          setPhase('upload');
        }}
        onBack={onBackToDashboard}
        onPreviewResult={handlePreviewContractResult}
      />
    );
  }

  if (phase === 'result' && activeResult) {
    return (
      <ScreeningResult
        resultData={activeResult}
        onStartNewScreening={handleStartNewScreening}
        onBackToDashboard={onBackToDashboard}
        onRequestDoctorReview={onRequestDoctorReview}
      />
    );
  }

  // Phase: 'upload'
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E] tracking-tight">
            Retinal Fundus Image Screening
          </h2>
          <p className="text-xs sm:text-sm text-[#718096] mt-1">
            Target AI API: <span className="font-mono text-[#0E2F76] font-semibold">{SCREENING_ENDPOINT}</span>
          </p>
        </div>

        {selectedFile && (
          <button
            type="button"
            onClick={handlePreviewContractResult}
            className="text-xs text-[#2563EB] hover:text-[#0E2F76] font-semibold underline self-start sm:self-auto cursor-pointer"
          >
            Preview Result Layout →
          </button>
        )}
      </div>

      {/* Either show Uploader or Image Preview */}
      {!selectedFile ? (
        <FundusImageUploader
          onImageSelected={handleImageSelected}
          onOpenCamera={() => setPhase('camera')}
        />
      ) : (
        <ImagePreview
          imageFile={selectedFile}
          previewUrl={previewUrl}
          selectedEye={selectedEye}
          onEyeChange={setSelectedEye}
          onRemove={handleRemoveImage}
          onReplace={handleRemoveImage}
        />
      )}

      {/* Language Selector */}
      <LanguageSelector
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />

      {/* Submit Action */}
      <ScreeningSubmit
        hasImage={Boolean(selectedFile)}
        hasUserId={Boolean(userId)}
        isSubmitting={false}
        onSubmit={handleStartScreening}
        onCancel={onBackToDashboard}
      />
    </div>
  );
}
