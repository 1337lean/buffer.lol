# SEO deployment checklist

## Canonical host

1. In Cloudflare, create a permanent redirect from `www.buffer.lol/*` to `https://buffer.lol/${1}` while preserving the path and query string.
2. Keep the existing HTTP-to-HTTPS redirect.
3. Confirm `curl -I https://www.buffer.lol/tools/dns-lookup` returns a permanent redirect to the apex URL.

The application also contains a host-based permanent redirect as a fallback. The Cloudflare rule avoids serving the duplicate hostname at the edge.

## Cloudflare Web Analytics

1. Open **Cloudflare → Web Analytics → Add a site** and select `buffer.lol`.
2. Use the automatic setup for the proxied hostname.
3. After deployment, confirm `beacon.min.js` loads and a request reaches `cloudflareinsights.com` without a Content Security Policy error.
4. Confirm page views appear without enabling cookies or advertising integrations.

## Google Search Console

1. Add a Domain property for `buffer.lol`.
2. Add the provided DNS TXT verification record in Cloudflare DNS and leave it in place.
3. Submit `https://buffer.lol/sitemap.xml` in the Sitemaps report.
4. Use URL Inspection to request initial indexing for:
   - `https://buffer.lol/`
   - `https://buffer.lol/tools/dns-lookup`
   - `https://buffer.lol/tools/json-formatter`
   - `https://buffer.lol/tools/my-ip`
   - `https://buffer.lol/tools/ssl-checker`
   - `https://buffer.lol/tools/http-headers`
5. Review Page Indexing and Search Performance weekly for the first month, then monthly. Record impressions, clicks, click-through rate, average position, indexed tool count, and queries by landing page.
