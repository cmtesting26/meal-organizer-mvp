/**
 * PhotoCapture Component (Sprint 14 — S14-03)
 *
 * Camera capture + file upload for OCR import.
 * Mobile-optimized viewfinder, handles camera permission denial gracefully.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, X, RotateCcw, Aperture } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { extractRecipeWithVision, type ClaudeVisionResult } from '@/lib/claudeVisionOcr';
import { performOcr, type OcrProgress } from '@/lib/ocrProcessor';
import type { OcrResult } from '@/lib/ocrProcessor';

/** Combined result: either a structured Vision result or raw OCR text */
export interface PhotoCaptureResult {
  type: 'vision' | 'ocr';
  vision?: ClaudeVisionResult;
  ocr?: OcrResult;
  imageUrl: string | null;
}

interface PhotoCaptureProps {
  /** Called when extraction completes */
  onComplete: (result: PhotoCaptureResult) => void;
  /** Called to close the capture UI */
  onClose: () => void;
  /** When true, renders only inner content (no overlay, card, or header). Use when embedded inside a Sheet. */
  embedded?: boolean;
}

export function PhotoCapture({ onComplete, onClose, embedded = false }: PhotoCaptureProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<'choose' | 'camera' | 'preview' | 'processing'>('choose');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [progress, setProgress] = useState<OcrProgress | null>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setMode('camera');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access denied';
      if (message.includes('Permission') || message.includes('NotAllowed')) {
        setCameraError(t('ocr.cameraPermissionDenied'));
      } else if (message.includes('NotFound') || message.includes('DevicesNotFound')) {
        setCameraError(t('ocr.noCameraFound'));
      } else {
        setCameraError(t('ocr.cameraError'));
      }
      setMode('choose');
    }
  }, [t]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setCapturedImage(dataUrl);
    stopCamera();
    setMode('preview');
  }, [stopCamera]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setMode('preview');
    };
    reader.readAsDataURL(file);
  }, []);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setMode('choose');
  }, []);

  const processImage = useCallback(async () => {
    if (!capturedImage) return;

    setMode('processing');
    setProgress({ stage: 'loading', progress: 0, message: 'Starting…' });

    // Try Claude Vision first (much better quality)
    try {
      const visionResult = await extractRecipeWithVision(capturedImage, (p) => {
        setProgress(p);
      });

      if (visionResult.success) {
        onComplete({ type: 'vision', vision: visionResult, imageUrl: capturedImage });
        return;
      }
    } catch {
      // Vision failed — fall through to Tesseract
    }

    // Fallback to Tesseract OCR
    setProgress({ stage: 'loading', progress: 10, message: 'Falling back to local OCR…' });
    const ocrResult = await performOcr(capturedImage, 'eng+deu', (p) => {
      setProgress(p);
    });

    onComplete({ type: 'ocr', ocr: ocrResult, imageUrl: capturedImage });
  }, [capturedImage, onComplete]);

  // Inner content shared by both modes
  const innerContent = (
    <>
      {/* Mode: Choose */}
          {mode === 'choose' && (
            <div className="space-y-4">
              {!embedded && (
                <p className="text-sm" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>
                  {t('ocr.chooseSource')}
                </p>
              )}

              {cameraError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {cameraError}
                </div>
              )}

              {/* ButtonRow — gap: 12, fill */}
              <div className="flex" style={{ gap: 12 }}>
                <button
                  className="flex-1 flex flex-col items-center justify-center transition-colors hover:bg-[var(--fs-hover-bg)]"
                  style={{
                    height: 100,
                    borderRadius: 14,
                    border: '1px solid var(--fs-border-default, #C5B5AB)',
                    backgroundColor: '#FFFFFF',
                    gap: 8,
                  }}
                  onClick={startCamera}
                >
                  <Camera style={{ width: 28, height: 28, color: 'var(--fs-accent, #D4644E)' }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--fs-text-primary, #2D2522)' }}>
                    {t('ocr.useCamera')}
                  </span>
                </button>

                <button
                  className="flex-1 flex flex-col items-center justify-center transition-colors hover:bg-[var(--fs-hover-bg)]"
                  style={{
                    height: 100,
                    borderRadius: 14,
                    border: '1px solid var(--fs-border-default, #C5B5AB)',
                    backgroundColor: '#FFFFFF',
                    gap: 8,
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload style={{ width: 28, height: 28, color: 'var(--fs-accent, #D4644E)' }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--fs-text-primary, #2D2522)' }}>
                    {t('ocr.uploadPhoto')}
                  </span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Mode: Camera */}
          {mode === 'camera' && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Viewfinder overlay */}
                <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none" />
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => { stopCamera(); setMode('choose'); }}>
                  <X className="w-4 h-4 mr-2" />
                  {t('common.cancel')}
                </Button>
                <Button onClick={capturePhoto} size="lg" className="rounded-full w-16 h-16">
                  <Aperture className="w-8 h-8" />
                </Button>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Mode: Preview */}
          {mode === 'preview' && capturedImage && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--fs-bg-card-inner, #FAF6F3)' }}>
                <img
                  src={capturedImage}
                  alt={t('ocr.capturedPhoto')}
                  className="w-full max-h-80 object-contain"
                />
              </div>

              <p className="text-sm text-center" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>
                {t('ocr.previewHint')}
              </p>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={retake}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('ocr.retake')}
                </Button>
                <Button className="flex-1" onClick={processImage}>
                  {t('ocr.processImage')}
                </Button>
              </div>
            </div>
          )}

          {/* Mode: Processing */}
          {mode === 'processing' && (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm font-medium" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>
                  {progress?.message || t('ocr.processing')}
                </p>
              </div>

              {/* Progress bar */}
              {progress && (
                <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--fs-bg-card-inner, #FAF6F3)' }}>
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              )}

              <p className="text-xs text-center" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>
                {t('ocr.processingHint')}
              </p>
            </div>
          )}
    </>
  );

  // Embedded mode: just the content, no overlay/card/header
  if (embedded) {
    return <div className="space-y-4">{innerContent}</div>;
  }

  // Standalone mode: full overlay + card + header
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {t('ocr.title')}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {innerContent}
        </CardContent>
      </Card>
    </div>
  );
}
