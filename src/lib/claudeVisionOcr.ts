/**
 * Claude Vision Recipe Extractor
 *
 * Calls the /api/ocr Cloudflare Pages Function which proxies
 * requests to the Claude Vision API server-side.
 *
 * @module claudeVisionOcr
 */

import type { OcrProgress } from './ocrProcessor';

/** Structured recipe result from Claude Vision */
export interface ClaudeVisionResult {
  success: boolean;
  title: string;
  ingredients: string[];
  instructions: string[];
  confidence: 'high' | 'medium' | 'low';
  error?: string;
}

/**
 * Convert an image source to a base64 data string.
 */
async function imageToBase64(imageSource: File | Blob | string): Promise<{ data: string; mediaType: string }> {
  // If already a data URL
  if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
    const [header, data] = imageSource.split(',');
    const mediaType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
    return { data, mediaType };
  }

  // If a URL, fetch it first
  if (typeof imageSource === 'string') {
    const response = await fetch(imageSource);
    const blob = await response.blob();
    return blobToBase64(blob);
  }

  return blobToBase64(imageSource);
}

function blobToBase64(blob: Blob): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(',');
      const mediaType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
      resolve({ data, mediaType });
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Extract a recipe from an image using the /api/ocr Pages Function.
 *
 * @param imageSource - File, Blob, or data URL
 * @param onProgress - Progress callback
 * @returns Structured recipe data
 */
export async function extractRecipeWithVision(
  imageSource: File | Blob | string,
  onProgress?: (progress: OcrProgress) => void
): Promise<ClaudeVisionResult> {
  try {
    onProgress?.({
      stage: 'loading',
      progress: 10,
      message: 'Preparing image…',
    });

    const { data, mediaType } = await imageToBase64(imageSource);

    onProgress?.({
      stage: 'recognizing',
      progress: 30,
      message: 'Analyzing recipe with AI…',
    });

    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: data, mediaType }),
    });

    onProgress?.({
      stage: 'recognizing',
      progress: 80,
      message: 'Parsing results…',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        title: '',
        ingredients: [],
        instructions: [],
        confidence: 'low',
        error: result.error || `Server error (${response.status}).`,
      };
    }

    onProgress?.({
      stage: 'done',
      progress: 100,
      message: 'Recipe extracted',
    });

    return {
      success: result.success,
      title: result.title,
      ingredients: result.ingredients,
      instructions: result.instructions,
      confidence: result.confidence,
    };
  } catch (error) {
    onProgress?.({
      stage: 'done',
      progress: 100,
      message: 'Extraction failed',
    });

    return {
      success: false,
      title: '',
      ingredients: [],
      instructions: [],
      confidence: 'low',
      error: error instanceof Error ? error.message : 'Recipe extraction failed',
    };
  }
}
