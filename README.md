# buffer.lol

A static alpha product preview for buffer.lol, a media diagnostics concept focused on stream buffering, video latency, CDN health, and upload processing.

## Files

- `index.html` - public preview markup, probe demo, use cases, diagnostics cards, and waitlist entry points
- `admin.html` - static demo admin dashboard for waitlist and probe activity
- `style.css` - visual design, responsive styles, and admin-specific styling
- `app.js` - interactions, waitlist modal, simulated probes, report copy, tabs, local storage, and admin controls
- `assets/` - dashboard images and favicon

## Notes

The waitlist and probe demo store browser-local preview data in `localStorage`:

- `buffer_lol_waitlist`
- `buffer_lol_probe_runs`
- `buffer_lol_admin_statuses`

The admin preview is protected only by a demo session gate. Use `buffer` as the password.
