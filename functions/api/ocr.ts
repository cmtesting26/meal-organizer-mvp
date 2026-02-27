/**
 * Cloudflare Pages Function — /api/ocr
 *
 * Proxies recipe extraction requests to the Claude Vision API.
 * Keeps the ANTHROPIC_API_KEY server-side so it never reaches the client.
 *
 * Expects a JSON body: { image: string (base64), mediaType: string }
 * Returns: { success, title, ingredients, instructions, confidence, error? }
 */

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface OcrRequestBody {
  image: string;
  mediaType: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { success: false, error: 'OCR service is not configured.' },
      { status: 503 },
    );
  }

  let body: OcrRequestBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json(
      { success: false, error: 'Invalid request body.' },
      { status: 400 },
    );
  }

  const { image, mediaType } = body;
  if (!image || !mediaType) {
    return Response.json(
      { success: false, error: 'Missing image or mediaType.' },
      { status: 400 },
    );
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
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
                  data: image,
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

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Claude API error:', response.status, errorBody);
      return Response.json(
        { success: false, error: `AI service error (${response.status}).` },
        { status: 502 },
      );
    }

    const result: any = await response.json();
    const textContent = result.content
      ?.filter((c: any) => c.type === 'text')
      ?.map((c: any) => c.text)
      ?.join('') || '';

    const cleaned = textContent.replace(/```json\s*|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const title = parsed.title || '';
    const ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients.filter(Boolean) : [];
    const instructions = Array.isArray(parsed.instructions) ? parsed.instructions.filter(Boolean) : [];
    const success = Boolean(title && (ingredients.length > 0 || instructions.length > 0));

    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (!title || ingredients.length === 0 || instructions.length === 0) confidence = 'medium';
    if (!title && ingredients.length === 0) confidence = 'low';

    return Response.json({
      success,
      title,
      ingredients,
      instructions,
      confidence,
      error: success ? undefined : 'Could not extract recipe from image.',
    });
  } catch (error) {
    const message = error instanceof SyntaxError
      ? 'Could not parse recipe from image. Try a clearer photo.'
      : 'Recipe extraction failed. Please try again.';

    return Response.json({ success: false, error: message }, { status: 500 });
  }
};
