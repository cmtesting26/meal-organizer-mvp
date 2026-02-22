/**
 * OCR Processor (Sprint 14 — S14-01)
 *
 * Client-side OCR using Tesseract.js.
 * Supports English and German text recognition.
 * Provides progress callbacks, confidence scores, and image preprocessing.
 *
 * @module ocrProcessor
 */

import Tesseract from 'tesseract.js';

/** OCR processing progress event */
export interface OcrProgress {
  /** Current stage: 'loading' | 'recognizing' | 'done' */
  stage: 'loading' | 'recognizing' | 'done';
  /** Progress percentage 0-100 */
  progress: number;
  /** Human-readable status message */
  message: string;
}

/** Raw OCR result before recipe parsing */
export interface OcrResult {
  /** Whether OCR succeeded */
  success: boolean;
  /** Extracted raw text */
  text: string;
  /** Tesseract confidence score (0-100) */
  confidence: number;
  /** Detected language */
  language: string;
  /** Error message if failed */
  error?: string;
}

/** Supported OCR languages */
export type OcrLanguage = 'eng' | 'deu' | 'eng+deu';

/**
 * Preprocess an image for better OCR accuracy.
 *
 * Uses an offscreen canvas to:
 * - Resize large images to max 2000px (faster processing)
 * - Convert to grayscale for better text contrast
 * - Apply simple contrast enhancement
 *
 * @param imageSource - File, Blob, or image URL
 * @returns Preprocessed image as Blob
 */
export async function preprocessImage(imageSource: File | Blob | string): Promise<Blob> {
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image for preprocessing'));

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });

  // Determine target dimensions (max 2000px on longest side)
  const MAX_DIM = 2000;
  let { width, height } = img;
  if (width > MAX_DIM || height > MAX_DIM) {
    const scale = MAX_DIM / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to grayscale + enhance contrast
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Weighted grayscale (luminosity method)
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // Simple contrast stretch (1.3x contrast, centered at 128)
    const enhanced = Math.min(255, Math.max(0, 128 + (gray - 128) * 1.3));

    data[i] = enhanced;     // R
    data[i + 1] = enhanced; // G
    data[i + 2] = enhanced; // B
    // Alpha stays the same
  }

  ctx.putImageData(imageData, 0, 0);

  // Clean up object URL if we created one
  if (typeof imageSource !== 'string') {
    URL.revokeObjectURL(img.src);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png'
    );
  });
}

/**
 * Perform OCR on an image.
 *
 * @param imageSource - File, Blob, or data URL of the image
 * @param language - OCR language(s): 'eng', 'deu', or 'eng+deu' (default)
 * @param onProgress - Progress callback for UI updates
 * @returns OCR result with extracted text and confidence
 */
export async function performOcr(
  imageSource: File | Blob | string,
  language: OcrLanguage = 'eng+deu',
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  try {
    // Step 1: Preprocess image
    onProgress?.({
      stage: 'loading',
      progress: 10,
      message: 'Preprocessing image…',
    });

    let processedImage: File | Blob | string;
    try {
      processedImage = await preprocessImage(imageSource);
    } catch {
      // If preprocessing fails, use original image
      processedImage = imageSource;
    }

    onProgress?.({
      stage: 'loading',
      progress: 20,
      message: 'Loading OCR engine…',
    });

    // Step 2: Run Tesseract
    const result = await Tesseract.recognize(processedImage, language, {
      logger: (m: Tesseract.LoggerMessage) => {
        if (m.status === 'recognizing text') {
          const pct = Math.round(20 + (m.progress ?? 0) * 70); // 20-90%
          onProgress?.({
            stage: 'recognizing',
            progress: pct,
            message: 'Recognizing text…',
          });
        }
      },
    });

    onProgress?.({
      stage: 'done',
      progress: 100,
      message: 'OCR complete',
    });

    const text = result.data.text.trim();
    const confidence = result.data.confidence ?? 0;

    if (!text) {
      return {
        success: false,
        text: '',
        confidence: 0,
        language,
        error: 'No text detected in image. Try a clearer photo with printed text.',
      };
    }

    return {
      success: true,
      text,
      confidence,
      language,
    };
  } catch (error) {
    onProgress?.({
      stage: 'done',
      progress: 100,
      message: 'OCR failed',
    });

    return {
      success: false,
      text: '',
      confidence: 0,
      language,
      error: error instanceof Error ? error.message : 'OCR processing failed',
    };
  }
}
