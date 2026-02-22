/**
 * Claude Vision Recipe Extractor (Sprint 14 — S14-01 improvement)
 *
 * Uses Claude's vision capabilities via the Anthropic API to extract
 * recipes from photos. Far more accurate than Tesseract for:
 * - Decorative/handwritten fonts
 * - Complex layouts with images mixed in
 * - Understanding recipe structure (title, ingredients, instructions)
 *
 * Falls back to Tesseract if the API is unavailable.
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
 * Extract a recipe from an image using Claude Vision API.
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

    // Convert image to base64
    const { data, mediaType } = await imageToBase64(imageSource);

    onProgress?.({
      stage: 'recognizing',
      progress: 30,
      message: 'Analyzing recipe with AI…',
    });

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data,
                },
              },
              {
                type: 'text',
                text: `Extract the recipe from this image. Return ONLY valid JSON with no other text, in this exact format:
{"title":"Recipe Name","ingredients":["ingredient 1","ingredient 2"],"instructions":["step 1","step 2"]}

Rules:
- Extract the actual recipe title, not decorative text like "Today Recipe"
- Include quantities and units with each ingredient (e.g. "1 1/2 cups flour")
- Each instruction should be a complete step
- If text is partially illegible, make your best guess based on context
- Return valid JSON only, no markdown backticks`,
              },
            ],
          },
        ],
      }),
    });

    onProgress?.({
      stage: 'recognizing',
      progress: 80,
      message: 'Parsing results…',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn('Claude Vision API error:', response.status, errorBody);
      return {
        success: false,
        title: '',
        ingredients: [],
        instructions: [],
        confidence: 'low',
        error: `API error (${response.status}). Falling back to local OCR.`,
      };
    }

    const result = await response.json();
    const textContent = result.content
      ?.filter((c: any) => c.type === 'text')
      ?.map((c: any) => c.text)
      ?.join('') || '';

    // Parse the JSON response
    const cleaned = textContent.replace(/```json\s*|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    onProgress?.({
      stage: 'done',
      progress: 100,
      message: 'Recipe extracted',
    });

    // Validate
    const title = parsed.title || '';
    const ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients.filter(Boolean) : [];
    const instructions = Array.isArray(parsed.instructions) ? parsed.instructions.filter(Boolean) : [];

    const success = Boolean(title && (ingredients.length > 0 || instructions.length > 0));

    // Determine confidence based on completeness
    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (!title || ingredients.length === 0 || instructions.length === 0) {
      confidence = 'medium';
    }
    if (!title && ingredients.length === 0) {
      confidence = 'low';
    }

    return {
      success,
      title,
      ingredients,
      instructions,
      confidence,
      error: success ? undefined : 'Could not extract recipe from image',
    };
  } catch (error) {
    onProgress?.({
      stage: 'done',
      progress: 100,
      message: 'Extraction failed',
    });

    // JSON parse errors usually mean Claude returned unexpected format
    if (error instanceof SyntaxError) {
      return {
        success: false,
        title: '',
        ingredients: [],
        instructions: [],
        confidence: 'low',
        error: 'Could not parse recipe from image. Try a clearer photo.',
      };
    }

    return {
      success: false,
      title: '',
      ingredients: [],
      instructions: [],
      confidence: 'low',
      error: error instanceof Error ? error.message : 'Vision extraction failed',
    };
  }
}
