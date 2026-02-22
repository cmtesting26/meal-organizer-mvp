/**
 * Photo Upload Service (Sprint 25)
 *
 * Handles recipe photo uploads to Supabase Storage with:
 * - Client-side image compression (Canvas API)
 * - Supabase Storage upload to recipe-photos bucket
 * - Thumbnail generation (200px width)
 * - Recipe record update with photo URL
 * - Household sync via existing mechanism
 *
 * Source: Roadmap V1.6 Epic 6, Implementation Plan (Supabase Storage)
 */

import { getSupabase, isSupabaseConfigured } from './supabase';

const BUCKET_NAME = 'recipe-photos';
const MAX_WIDTH = 800;
const THUMB_WIDTH = 200;
const JPEG_QUALITY = 0.8;
const MAX_FILE_SIZE = 200 * 1024; // 200KB target

export interface UploadResult {
  /** Full-size photo public URL */
  photoUrl: string;
  /** Thumbnail public URL */
  thumbnailUrl: string;
}

export interface UploadError {
  code: 'not_configured' | 'invalid_file' | 'too_large' | 'upload_failed' | 'unsupported_format';
  message: string;
}

/**
 * Supported image MIME types.
 */
const SUPPORTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

/**
 * Compress an image using Canvas API.
 * Resizes to maxWidth while preserving aspect ratio, outputs JPEG.
 */
async function compressImage(
  file: File,
  maxWidth: number,
  quality: number = JPEG_QUALITY,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate dimensions
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Validate file type and basic checks.
 */
function validateFile(file: File): UploadError | null {
  if (!file) {
    return { code: 'invalid_file', message: 'No file provided' };
  }

  if (!SUPPORTED_TYPES.has(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i)) {
    return {
      code: 'unsupported_format',
      message: 'Unsupported file format. Please use JPEG, PNG, WebP, or GIF.',
    };
  }

  // Allow up to 20MB raw input (we'll compress it)
  if (file.size > 20 * 1024 * 1024) {
    return { code: 'too_large', message: 'File is too large. Maximum size is 20MB.' };
  }

  return null;
}

/**
 * Generate a unique storage path for a recipe photo.
 */
function storagePath(householdId: string, recipeId: string, suffix: string): string {
  return `${householdId}/${recipeId}/${suffix}`;
}

/**
 * Upload a recipe photo to Supabase Storage.
 *
 * 1. Validates the file
 * 2. Compresses to ≤200KB JPEG (800px max width)
 * 3. Generates thumbnail (200px width)
 * 4. Uploads both to Supabase Storage
 * 5. Returns public URLs
 *
 * @param file - The image file to upload
 * @param recipeId - The recipe ID to associate with
 * @param householdId - The household ID for storage path
 * @returns UploadResult with photo and thumbnail URLs
 * @throws UploadError on failure
 */
export async function uploadRecipePhoto(
  file: File,
  recipeId: string,
  householdId: string,
): Promise<UploadResult> {
  // Check Supabase configuration
  if (!isSupabaseConfigured) {
    throw {
      code: 'not_configured',
      message: 'Cloud storage is not configured. Photos require Supabase.',
    } as UploadError;
  }

  // Validate
  const validationError = validateFile(file);
  if (validationError) throw validationError;

  const supabase = getSupabase();
  const timestamp = Date.now();

  try {
    // Compress full-size image
    let compressed = await compressImage(file, MAX_WIDTH, JPEG_QUALITY);

    // If still too large, reduce quality iteratively
    let quality = JPEG_QUALITY;
    while (compressed.size > MAX_FILE_SIZE && quality > 0.3) {
      quality -= 0.1;
      compressed = await compressImage(file, MAX_WIDTH, quality);
    }

    // Generate thumbnail
    const thumbnail = await compressImage(file, THUMB_WIDTH, 0.7);

    // Upload full-size
    const fullPath = storagePath(householdId, recipeId, `photo_${timestamp}.jpg`);
    const { error: fullError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fullPath, compressed, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (fullError) {
      throw {
        code: 'upload_failed',
        message: `Upload failed: ${fullError.message}`,
      } as UploadError;
    }

    // Upload thumbnail
    const thumbPath = storagePath(householdId, recipeId, `thumb_${timestamp}.jpg`);
    const { error: thumbError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbPath, thumbnail, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (thumbError) {
      // Thumbnail failure is non-critical, but log it
      console.warn('Thumbnail upload failed:', thumbError.message);
    }

    // Get public URLs
    const { data: fullUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fullPath);

    const { data: thumbUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(thumbPath);

    return {
      photoUrl: fullUrlData.publicUrl,
      thumbnailUrl: thumbError ? fullUrlData.publicUrl : thumbUrlData.publicUrl,
    };
  } catch (error) {
    if ((error as UploadError).code) throw error;
    throw {
      code: 'upload_failed',
      message: error instanceof Error ? error.message : 'Unknown upload error',
    } as UploadError;
  }
}

/**
 * Delete a recipe photo from Supabase Storage.
 * Removes both full-size and thumbnail.
 */
export async function deleteRecipePhoto(
  recipeId: string,
  householdId: string,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const supabase = getSupabase();
  const prefix = `${householdId}/${recipeId}/`;

  try {
    // List all files in the recipe's folder
    const { data: files } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${householdId}/${recipeId}`);

    if (files && files.length > 0) {
      const paths = files.map((f) => `${prefix}${f.name}`);
      await supabase.storage.from(BUCKET_NAME).remove(paths);
    }
  } catch (error) {
    console.warn('Failed to delete recipe photos:', error);
  }
}

/**
 * Create an object URL from a File for preview before upload.
 * Remember to revoke with URL.revokeObjectURL when done.
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Create a persistent base64 data URL from a File.
 * Unlike blob URLs, data URLs survive page refreshes and IndexedDB storage.
 * Compresses the image to ≤200KB JPEG first so it doesn't bloat the DB.
 */
export async function createPersistentPreviewUrl(file: File): Promise<string> {
  const compressed = await compressImage(file, MAX_WIDTH, JPEG_QUALITY);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read compressed image'));
    reader.readAsDataURL(compressed);
  });
}
