# buffer.lol

Static alpha preview for buffer.lol, a media diagnostics concept focused on stream buffering, video latency, CDN health, and upload processing.

## Status

This is a public-preview static site. The diagnostics probe is simulated in the browser and is intended to communicate the product direction, not to provide real stream analysis.

The waitlist forms are wired for Netlify Forms. Local development stores preview submissions in browser `localStorage`; production submissions should be handled by the configured form provider.

## Files

- `index.html` - public preview, simulated probe, use cases, diagnostics cards, and waitlist forms
- `privacy.html` - privacy notice for waitlist collection
- `admin.html` - local-only static admin mockup for preview data
- `style.css` - visual design, responsive styles, and admin-specific styling
- `app.js` - interactions, waitlist submission handling, simulated probes, local storage, and admin mockup controls
- `robots.txt` and `sitemap.xml` - crawl metadata for the public site
- `_headers` - security and indexing headers for hosts that support Netlify-style headers
- `assets/` - dashboard image and favicon

## Local Development

Open `index.html` directly, or serve the directory with any static server:

```sh
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

Local preview data is stored in these browser keys:

- `buffer_lol_waitlist`
- `buffer_lol_probe_runs`
- `buffer_lol_admin_statuses`

## Waitlist Configuration

The waitlist forms use:

- `data-netlify="true"`
- `method="POST"`
- `data-signup-endpoint="/"`

On Netlify, enable Forms for the site and submissions will be posted to the static form endpoint. If you deploy elsewhere, replace `data-signup-endpoint` on both waitlist forms in `index.html` with the provider endpoint and confirm that provider is designed for public client-side submissions.

Before launch, verify duplicate handling, spam controls, and notification settings in the form provider. The current client avoids duplicate local-preview entries only; production deduplication belongs in the form provider or backend.

## Deployment

Deploy the repository as a static site with the production URL `https://buffer.lol/`.

Recommended checks before publishing:

- Confirm `index.html`, `privacy.html`, `robots.txt`, and `sitemap.xml` are reachable.
- Confirm waitlist submissions appear in the form provider.
- Confirm `admin.html` is not linked publicly and is marked `noindex`.
- Confirm Open Graph metadata resolves with the absolute image URL.
- Run a mobile and desktop smoke test.

## Security Notes

`admin.html` is a local static demo only. Its session gate and demo password are not authentication, authorization, or data protection. Do not treat it as a secure admin surface.

The `_headers` file includes a basic Content Security Policy, frame blocking, referrer policy, and `nosniff`. If the host does not support `_headers`, configure equivalent headers in that platform.

## License

All rights reserved. See `LICENSE`.
