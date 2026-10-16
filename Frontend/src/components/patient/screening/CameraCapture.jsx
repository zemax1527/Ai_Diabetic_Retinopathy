import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle, Sparkles } from 'lucide-react';
import Button from '../common/Button';

export default function CameraCapture({ onCaptureComplete, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedBlobUrl, setCapturedBlobUrl] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize camera stream
  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError(null);
    setCapturedBlobUrl(null);
    setCapturedFile(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer rear camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err) {
      console.error('Camera access error:', err);
      setIsInitializing(false);
      let msg = 'Unable to access your device camera. Please check camera permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser settings or upload an image file instead.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this system. Please use file upload instead.';
      }
      setCameraError(msg);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Capture frame
  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `retinal-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        const url = URL.createObjectURL(blob);
        setCapturedBlobUrl(url);
        setCapturedFile(file);
        stopCamera();
      },
      'image/jpeg',
      0.95
    );
  };

  // Retake
  const handleRetake = () => {
    if (capturedBlobUrl) {
      URL.revokeObjectURL(capturedBlobUrl);
    }
    startCamera();
  };

  // Accept captured image
  const handleConfirm = () => {
    if (capturedFile && onCaptureComplete) {
      onCaptureComplete(capturedFile, capturedBlobUrl);
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Retinal Camera Capture</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="relative aspect-4/3 bg-black rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-800">
        {cameraError ? (
          <div className="p-6 text-center max-w-md space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h4 className="text-sm font-bold text-rose-400">Camera Unavailable</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
            <div className="pt-2 flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={startCamera} className="bg-transparent text-white border-slate-700">
                Retry Camera
              </Button>
              <Button variant="secondary" size="sm" onClick={onCancel}>
                Use File Upload
              </Button>
            </div>
          </div>
        ) : capturedBlobUrl ? (
          <img
            src={capturedBlobUrl}
            alt="Captured Retinal View"
            className="w-full h-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 rounded-full border-2 border-dashed border-cyan-400/70 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border border-cyan-400/40" />
              </div>
            </div>
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] font-semibold text-cyan-300 border border-white/10 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Live Camera Feed
            </div>
          </>
        )}
      </div>

      {/* Camera Guidance Note */}
      {!cameraError && (
        <p className="text-xs text-slate-400 text-center">
          {capturedBlobUrl
            ? 'Review your captured image above. Make sure the retinal area is focused and clear.'
            : 'Center the retina inside the targeting ring and hold steady before pressing capture.'}
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          Cancel
        </Button>

        {!cameraError && (
          <div className="flex items-center gap-2">
            {capturedBlobUrl ? (
              <>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleRetake}
                  icon={RefreshCw}
                  className="bg-transparent text-white border-slate-700 hover:bg-slate-800"
                >
                  Retake Image
                </Button>
                <Button
                  variant="teal"
                  size="md"
                  onClick={handleConfirm}
                  icon={Check}
                >
                  Use Captured Image
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleCapture}
                disabled={isInitializing}
                icon={Camera}
                className="bg-[#2563EB] hover:bg-blue-600 px-6 font-bold"
              >
                Capture Image
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
