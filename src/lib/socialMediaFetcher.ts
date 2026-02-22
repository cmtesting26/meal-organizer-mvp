/**
 * Social Media Caption Fetcher
 *
 * Fetches post metadata (caption, title, thumbnail) from Instagram and TikTok URLs.
 *
 * Strategy:
 * 1. oEmbed API (primary) — returns structured metadata including title/thumbnail
 * 2. CORS proxy + HTML scraping (fallback) — extracts Open Graph tags and caption from page HTML
 *
 * Implementation Plan Phase 18 · Roadmap V1.3 Epic 2
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SocialPlatform = 'instagram' | 'tiktok';

export interface SocialMediaPost {
  /** The raw caption / description text */
  caption: string;
  /** Detected platform */
  platform: SocialPlatform;
  /** Post title (from oEmbed or og:title) */
  postTitle?: string;
  /** Thumbnail / cover image URL */
  imageUrl?: string;
  /** Original URL that was fetched */
  sourceUrl: string;
}

export interface SocialMediaFetchError {
  type:
    | 'unsupported_url'
    | 'private_post'
    | 'empty_caption'
    | 'network_error'
    | 'parse_error';
  message: string;
}

// ---------------------------------------------------------------------------
// URL detection
// ---------------------------------------------------------------------------

const INSTAGRAM_PATTERNS = [
  /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\/[\w-]+/i,
  /^https?:\/\/(www\.)?instagr\.am\/(p|reel)\/[\w-]+/i,
];

const TIKTOK_PATTERNS = [
  /^https?:\/\/(www\.|vm\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
  /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w-]+/i,
  /^https?:\/\/vm\.tiktok\.com\/[\w-]+/i,
];

/**
 * Detect whether a URL is a supported social media recipe post.
 * Returns the platform name or `null` if unsupported.
 */
export function detectSocialPlatform(url: string): SocialPlatform | null {
  if (INSTAGRAM_PATTERNS.some((r) => r.test(url))) return 'instagram';
  if (TIKTOK_PATTERNS.some((r) => r.test(url))) return 'tiktok';
  return null;
}

/**
 * Quick boolean helper used by the import page to show the social-import UI.
 */
export function isSocialMediaUrl(url: string): boolean {
  return detectSocialPlatform(url) !== null;
}

// ---------------------------------------------------------------------------
// oEmbed endpoints
// ---------------------------------------------------------------------------

const OEMBED_ENDPOINTS: Record<SocialPlatform, string> = {
  instagram: 'https://graph.facebook.com/v22.0/instagram_oembed',
  tiktok: 'https://www.tiktok.com/oembed',
};

/**
 * Build app access token for Meta Graph API.
 * Requires VITE_META_APP_ID and VITE_META_APP_SECRET env vars.
 * Returns null if not configured.
 */
function getMetaAppToken(): string | null {
  const appId = typeof import.meta !== 'undefined'
    ? import.meta?.env?.VITE_META_APP_ID
    : undefined;
  const appSecret = typeof import.meta !== 'undefined'
    ? import.meta?.env?.VITE_META_APP_SECRET
    : undefined;

  if (appId && appSecret) {
    return `${appId}|${appSecret}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// CORS proxy (reuses the same strategy as recipeParser.ts)
// ---------------------------------------------------------------------------

function getProxies(): { name: string; buildUrl: (u: string) => string }[] {
  const proxies: { name: string; buildUrl: (u: string) => string }[] = [];

  const customProxy =
    typeof import.meta !== 'undefined'
      ? import.meta?.env?.VITE_CORS_PROXY_URL
      : undefined;

  if (customProxy) {
    proxies.push({
      name: 'custom',
      buildUrl: (u) => `${customProxy}?url=${encodeURIComponent(u)}`,
    });
  }

  proxies.push({
    name: 'cloudflare-worker',
    buildUrl: (u) =>
      `https://meal-organizer-cors-proxy.cmtesting26.workers.dev?url=${encodeURIComponent(u)}`,
  });

  proxies.push({
    name: 'allorigins',
    buildUrl: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  });

  return proxies;
}

async function fetchViaProxy(url: string): Promise<string> {
  const proxies = getProxies();

  for (const proxy of proxies) {
    try {
      const proxiedUrl = proxy.buildUrl(url);
      const response = await fetch(proxiedUrl, { signal: AbortSignal.timeout(15_000) });
      if (response.ok) {
        return await response.text();
      }
    } catch {
      continue;
    }
  }

  throw new Error('All proxies failed to fetch the URL.');
}

// ---------------------------------------------------------------------------
// oEmbed fetch
// ---------------------------------------------------------------------------

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
  // Instagram-specific: the HTML embed often contains the caption
}

async function fetchOEmbed(
  url: string,
  platform: SocialPlatform
): Promise<OEmbedResponse | null> {
  const endpoint = OEMBED_ENDPOINTS[platform];
  let oembedUrl = `${endpoint}?url=${encodeURIComponent(url)}&format=json`;

  // Meta Graph API requires an access token for Instagram oEmbed
  if (platform === 'instagram') {
    const token = getMetaAppToken();
    if (!token) {
      console.log('[SocialFetcher] No Meta App credentials configured — skipping oEmbed');
      return null;
    }
    oembedUrl += `&access_token=${encodeURIComponent(token)}`;
  }

  try {
    // oEmbed endpoints are typically CORS-friendly, try direct fetch first
    const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(10_000) });
    if (response.ok) {
      return (await response.json()) as OEmbedResponse;
    }
    console.log(`[SocialFetcher] oEmbed direct fetch failed: HTTP ${response.status}`);
  } catch {
    // Direct fetch failed — try via proxy
  }

  try {
    const text = await fetchViaProxy(oembedUrl);
    return JSON.parse(text) as OEmbedResponse;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// HTML scraping fallback — extract OG tags & caption from page HTML
// ---------------------------------------------------------------------------

function extractMetaContent(html: string, property: string): string | undefined {
  // Handles both property="..." and name="..." and content before property
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      'i'
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return undefined;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)));
}

/**
 * Extract caption from Instagram's page HTML.
 * Instagram embeds the caption in og:description and in JSON-LD data.
 */
function extractCaptionFromInstagramHtml(html: string): string | undefined {
  // Try og:description first — Instagram puts caption here
  const ogDesc = extractMetaContent(html, 'og:description');
  if (ogDesc && ogDesc.length > 30) {
    // Instagram og:description format:
    // "13K likes, 81 comments - username on November 24, 2025: "caption text""
    // Extract the quoted caption if present (handle various quote chars)
    const captionMatch = ogDesc.match(/:\s*[""\u201c\u201d](.+)[""\u201c\u201d]?\s*$/s);
    if (captionMatch?.[1]) return captionMatch[1];

    // Try stripping the engagement stats prefix directly
    const stripped = ogDesc
      // Full format: "13K likes, 81 comments - username on November 24, 2025: "
      .replace(
        /^[\d.,]+[KkMm]?\s*likes?,?\s*[\d.,]+[KkMm]?\s*comments?\s*[-\u2013\u2014]\s*\S+\s+on\s+[A-Za-z]+\s+\d{1,2},?\s*\d{4}\s*:\s*/i,
        '',
      )
      // Simpler variant: "123 likes, 45 comments - "
      .replace(
        /^[\d.,]+[KkMm]?\s*likes?,?\s*[\d.,]+[KkMm]?\s*comments?\s*[-\u2013\u2014]\s*/i,
        '',
      )
      // Strip leading/trailing quote marks
      .replace(/^[""\u201c\u201d]+/, '')
      .replace(/[""\u201c\u201d]+\.*$/, '')
      .trim();

    if (stripped.length > 30) return stripped;

    // Fallback: use full description
    return ogDesc;
  }

  // Try to find caption in JSON-LD or inline script data
  const jsonLdMatch = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (jsonLdMatch?.[1]) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data?.articleBody) return data.articleBody;
      if (data?.description) return data.description;
      if (data?.caption) return data.caption;
    } catch {
      // JSON parse failed
    }
  }

  // Last resort: twitter:description
  return extractMetaContent(html, 'twitter:description');
}

/**
 * Extract caption from TikTok's page HTML.
 * TikTok puts the caption in og:description and also in a SIGI_STATE / __UNIVERSAL_DATA_FOR_REHYDRATION__ script.
 */
function extractCaptionFromTiktokHtml(html: string): string | undefined {
  // TikTok's og:description typically contains the caption directly
  const ogDesc = extractMetaContent(html, 'og:description');
  if (ogDesc && ogDesc.length > 20) return ogDesc;

  // Try twitter:description
  const twitterDesc = extractMetaContent(html, 'twitter:description');
  if (twitterDesc && twitterDesc.length > 20) return twitterDesc;

  // Try extracting from page title (TikTok embeds caption in title)
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    const title = decodeHtmlEntities(titleMatch[1].trim());
    // TikTok title format: "caption text | TikTok"
    const captionPart = title.replace(/\s*\|\s*TikTok$/i, '').trim();
    if (captionPart.length > 20) return captionPart;
  }

  return undefined;
}

async function fetchCaptionViaHtmlScraping(
  url: string,
  platform: SocialPlatform
): Promise<{
  caption?: string;
  title?: string;
  imageUrl?: string;
}> {
  const html = await fetchViaProxy(url);

  const title =
    extractMetaContent(html, 'og:title') ||
    extractMetaContent(html, 'twitter:title');

  const imageUrl =
    extractMetaContent(html, 'og:image') ||
    extractMetaContent(html, 'twitter:image');

  const caption =
    platform === 'instagram'
      ? extractCaptionFromInstagramHtml(html)
      : extractCaptionFromTiktokHtml(html);

  return { caption, title, imageUrl };
}

// ---------------------------------------------------------------------------
// Main public API
// ---------------------------------------------------------------------------

/**
 * Fetch a social media post's caption and metadata.
 *
 * @param url  Instagram or TikTok post URL
 * @returns    Structured post data with caption text
 * @throws     SocialMediaFetchError-shaped object on failure
 */
export async function fetchSocialMediaPost(
  url: string
): Promise<SocialMediaPost> {
  // 1. Detect platform
  const platform = detectSocialPlatform(url);
  if (!platform) {
    throw {
      type: 'unsupported_url',
      message:
        'This URL is not a supported Instagram or TikTok post. Please paste a link to a specific post or reel.',
    } satisfies SocialMediaFetchError;
  }

  let caption: string | undefined;
  let postTitle: string | undefined;
  let imageUrl: string | undefined;

  // 2. Try oEmbed first (lighter, structured)
  try {
    const oembed = await fetchOEmbed(url, platform);
    if (oembed) {
      imageUrl = oembed.thumbnail_url;

      // For TikTok, the oEmbed title often IS the caption
      if (platform === 'tiktok' && oembed.title && oembed.title.length > 20) {
        caption = oembed.title;
        postTitle = oembed.author_name;
      } else if (platform === 'tiktok') {
        postTitle = oembed.title || oembed.author_name;
      }

      // For Instagram, oEmbed "title" is actually the full caption text
      if (platform === 'instagram') {
        if (oembed.title && oembed.title.length > 20) {
          caption = oembed.title;
        }
        // Use author_name for display, not the caption-as-title
        postTitle = oembed.author_name;

        // Also check the embedded HTML for caption
        if (!caption && oembed.html) {
          const captionMatch = oembed.html.match(
            /class="Caption"[^>]*>([\s\S]*?)<\/div>/i
          );
          if (captionMatch?.[1]) {
            caption = captionMatch[1].replace(/<[^>]+>/g, '').trim();
          }
        }
      }
    }
  } catch {
    // oEmbed failed, will fall back to scraping
  }

  // 3. If no caption from oEmbed, try HTML scraping
  if (!caption) {
    try {
      const scraped = await fetchCaptionViaHtmlScraping(url, platform);
      caption = caption || scraped.caption;
      postTitle = postTitle || scraped.title;
      imageUrl = imageUrl || scraped.imageUrl;
    } catch (err) {
      // Both methods failed
      throw {
        type: 'network_error',
        message:
          'Could not fetch this post. It may be private, deleted, or the platform is blocking access. Try adding the recipe manually.',
      } satisfies SocialMediaFetchError;
    }
  }

  // 4. Validate we got a caption
  if (!caption || caption.trim().length < 10) {
    throw {
      type: 'empty_caption',
      message:
        'This post doesn\'t appear to have a text caption, or the caption is too short to contain a recipe. Try adding the recipe manually.',
    } satisfies SocialMediaFetchError;
  }

  return {
    caption: decodeHtmlEntities(caption.trim()),
    platform,
    postTitle: postTitle ? decodeHtmlEntities(postTitle.trim()) : undefined,
    imageUrl,
    sourceUrl: url,
  };
}
