/**
 * OCR shared types
 *
 * @module ocrProcessor
 */

/** OCR processing progress event */
export interface OcrProgress {
  /** Current stage: 'loading' | 'recognizing' | 'done' */
  stage: 'loading' | 'recognizing' | 'done';
  /** Progress percentage 0-100 */
  progress: number;
  /** Human-readable status message */
  message: string;
}
