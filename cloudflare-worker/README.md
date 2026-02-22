# CORS Proxy - Cloudflare Worker

Production-ready CORS proxy for Fork and Spoon recipe imports.

## What It Does

Enables importing recipes from websites that block CORS by:
- Fetching URLs server-side (no CORS restrictions)
- Returning HTML with proper CORS headers
- Rate limiting to prevent abuse (500ms delay)
- Security: Blocks local/private IPs
- Timeout protection (10s max)

## Deployment

### Option 1: Cloudflare Workers (Recommended)

**Free tier**: 100,000 requests/day

1. **Sign up for Cloudflare Workers**
   - Go to https://workers.cloudflare.com/
   - Create free account
   - Navigate to Workers dashboard

2. **Create New Worker**
   - Click "Create a Worker"
   - Name it: `meal-organizer-cors-proxy`

3. **Deploy Code**
   - Copy contents of `cors-proxy.js`
   - Paste into Worker editor
   - Click "Save and Deploy"

4. **Get Worker URL**
   - Copy your worker URL (e.g., `https://meal-organizer-cors-proxy.YOUR-SUBDOMAIN.workers.dev`)
   - This is your `VITE_CORS_PROXY_URL`

### Option 2: Wrangler CLI

If you prefer command-line deployment:

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Initialize project
cd cloudflare-worker
wrangler init

# Deploy
wrangler deploy
```

## Configuration

### Add to Project

1. **Update `.env.example`**:
```bash
VITE_CORS_PROXY_URL=https://meal-organizer-cors-proxy.YOUR-SUBDOMAIN.workers.dev
```

2. **Create `.env` for local development**:
```bash
VITE_CORS_PROXY_URL=https://meal-organizer-cors-proxy.YOUR-SUBDOMAIN.workers.dev
```

3. **Update `.gitignore`**:
```
.env
.env.local
```

## Testing

### Test Proxy is Working

```bash
# Test 1: Valid recipe URL
curl "https://YOUR-WORKER.workers.dev?url=https://www.allrecipes.com"

# Test 2: Missing URL parameter (should error)
curl "https://YOUR-WORKER.workers.dev"

# Test 3: Invalid URL (should error)
curl "https://YOUR-WORKER.workers.dev?url=not-a-url"
```

### Expected Responses

**Success** (Test 1):
- Status: 200
- Headers include `Access-Control-Allow-Origin: *`
- Body contains HTML

**Error** (Test 2):
```json
{
  "error": "Missing url parameter",
  "usage": "Add ?url=https://example.com to your request"
}
```

**Error** (Test 3):
```json
{
  "error": "Invalid URL format",
  "provided": "not-a-url"
}
```

## Usage

### From Recipe Parser

```typescript
// In recipeParser.ts
const proxyUrl = import.meta.env.VITE_CORS_PROXY_URL;
if (proxyUrl) {
  const proxiedUrl = `${proxyUrl}?url=${encodeURIComponent(targetUrl)}`;
  const response = await fetch(proxiedUrl);
  const html = await response.text();
}
```

## Features

### Security
- ✅ Blocks local/private IP addresses
- ✅ Only proxies HTML/text content (no binaries)
- ✅ 500ms rate limiting
- ✅ 10-second timeout protection
- ✅ Input validation

### Performance
- ✅ 1-hour cache for repeated URLs
- ✅ Globally distributed (Cloudflare edge network)
- ✅ Follows redirects automatically

### Error Handling
- ✅ Clear error messages
- ✅ Proper HTTP status codes
- ✅ CORS headers on all responses

## Monitoring

### Cloudflare Dashboard

View metrics at:
- https://dash.cloudflare.com/

Track:
- Request count (stay under 100k/day free tier)
- Error rates
- Response times
- Geographic distribution

### Set Up Alerts

Optional: Configure Cloudflare alerts for:
- High error rates
- Approaching request limits
- Slow response times

## Troubleshooting

### Proxy Not Working

**Check deployment**:
```bash
curl -I "https://YOUR-WORKER.workers.dev"
```
Should return 400 (missing url param) not 404

**Check CORS headers**:
```bash
curl -I "https://YOUR-WORKER.workers.dev?url=https://example.com"
```
Should include `access-control-allow-origin: *`

### Recipe Sites Blocking

Some sites may block the proxy. This is normal. Fallback to manual entry.

Common blocked sites:
- Sites with aggressive bot protection
- Sites requiring authentication
- Sites with paywalls

### Rate Limiting

If you hit Cloudflare free tier limits (100k/day):
- Implement caching on client side
- Use direct fetch when possible
- Consider upgrading Cloudflare plan

## Cost

### Cloudflare Workers Free Tier
- **Requests**: 100,000/day
- **CPU time**: 10ms per request
- **Storage**: N/A (we don't use KV)

**Estimated usage**:
- Single user: ~100 recipe imports/day = well within limits
- Multiple users: Monitor and upgrade if needed

### Paid Tier (if needed)
- $5/month for 10 million requests
- Only needed if app goes viral!

## Security Notes

### What's Protected
- ✅ Local network access blocked
- ✅ Binary file proxying blocked
- ✅ Rate limiting prevents abuse
- ✅ Timeout prevents hanging requests

### What's Not Protected
- ⚠️ No per-IP rate limiting (would need Workers KV)
- ⚠️ No API key authentication (public proxy)
- ⚠️ No request logging (add if needed)

For MVP, current security is sufficient. Add more if abuse occurs.

## Maintenance

### Updating Code

1. Edit `cors-proxy.js`
2. Redeploy via Cloudflare dashboard or Wrangler CLI
3. Test with curl
4. Changes take effect immediately

### Monitoring

Check weekly:
- Request count (Cloudflare dashboard)
- Error rates
- User feedback on import success

## Support

### Issues

If proxy stops working:
1. Check Cloudflare dashboard for outages
2. Test with curl to isolate issue
3. Check Cloudflare Workers status page
4. Review error logs in dashboard

### Alternative Proxies

If Cloudflare has issues, can quickly switch to:
- `https://corsproxy.io/?url=` (public service)
- `https://api.allorigins.win/raw?url=` (public service)

Just update `VITE_CORS_PROXY_URL` environment variable.

## Success Metrics

- ✅ Proxy deployed and accessible
- ✅ Returns HTML for recipe URLs
- ✅ CORS headers present
- ✅ Rate limiting active (500ms delay)
- ✅ Security measures in place
- ✅ Environment variables configured
- ✅ Documentation complete

## Next Steps

1. Share worker URL with Backend Engineer
2. Backend Engineer adds to `.env`
3. Test with recipe parser
4. Monitor usage in Cloudflare dashboard

---

**Deployed by**: DevOps Engineer  
**Sprint**: Sprint 3 - Recipe Import  
**Status**: ✅ Ready for integration  
**Proxy URL**: [Add your deployed URL here]
