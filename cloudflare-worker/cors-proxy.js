/**
 * CORS Proxy - Cloudflare Worker
 * Fork and Spoon (formerly Meal Organizer MVP) - Sprint 3 / Updated Sprint 15
 * 
 * Enables recipe imports from websites that block CORS.
 * Deployed to Cloudflare Workers (free tier: 100k requests/day)
 * 
 * Usage: https://your-worker.workers.dev?url=https://example.com/recipe
 */

export default {
  async fetch(request) {
    // Handle OPTIONS preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get URL from query parameter
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing url parameter',
          usage: 'Add ?url=https://example.com to your request'
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // Validate URL format
    let validatedUrl;
    try {
      validatedUrl = new URL(targetUrl);
      
      // Security: Block local/private IPs
      const hostname = validatedUrl.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname === '0.0.0.0'
      ) {
        return new Response('Access to local URLs is not allowed', { 
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid URL format',
          provided: targetUrl
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // Simple rate limiting: 500ms delay to prevent abuse
    // In production, use Cloudflare Workers KV for per-IP rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Fetch the target URL
      const response = await fetch(validatedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (ForkAndSpoon-Bot/1.4)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        // Follow redirects
        redirect: 'follow',
        // Timeout after 10 seconds
        signal: AbortSignal.timeout(10000)
      });
      
      // Check if response is OK
      if (!response.ok) {
        return new Response(
          JSON.stringify({ 
            error: `Target server returned ${response.status}`,
            url: targetUrl,
            statusText: response.statusText
          }), 
          { 
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
      
      // Get content type
      const contentType = response.headers.get('content-type') || 'text/html';
      
      // Only proxy HTML/text content (security: prevent binary abuse)
      if (!contentType.includes('text') && !contentType.includes('html')) {
        return new Response(
          JSON.stringify({ 
            error: 'Only HTML/text content is supported',
            contentType: contentType
          }), 
          { 
            status: 415,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
      
      // Get the HTML/text content
      const content = await response.text();
      
      // Return with CORS headers
      return new Response(content, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': contentType,
          'X-Proxied-By': 'Meal-Organizer-CORS-Proxy',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      });
      
    } catch (error) {
      // Handle fetch errors
      let errorMessage = 'Failed to fetch target URL';
      let statusCode = 500;
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (>10s)';
        statusCode = 504;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          url: targetUrl
        }), 
        { 
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
  }
};
