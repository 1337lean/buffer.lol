import Image from "next/image";
import Link from "next/link";
import { SiteChrome } from "@/components/landing/SiteChrome";
import { LandingEnhancements } from "@/components/landing/LandingEnhancements";

const issueCards = [
  ["warn", "Stale manifest", "Player keeps requesting an old playlist window.", "Reports live edge drift and manifest age."],
  ["fail", "Slow first segment", "Startup hangs before the first playable chunk arrives.", "Reports first segment timing and route notes."],
  ["warn", "Edge cache miss", "One region falls back to origin under load.", "Reports CDN response spread by sampled edge."],
  ["fail", "Manifest unavailable", "A player cannot load the entry playlist under launch traffic.", "Reports status, timing, and response headers."],
  ["warn", "Latency drift", "Viewer delay expands during a live event.", "Reports live latency and recovery behavior."],
  ["pass", "Bitrate ladder gap", "Missing mid-tier variant causes jarring quality jumps.", "Reports variant count and ladder spacing."]
];

const features = [
  ["▶", "Buffer testing", "Measure startup delay, rebuffer frequency, segment gaps, and bitrate changes across sample sessions."],
  ["ms", "Latency checks", "Monitor glass-to-glass delay, live edge distance, player drift, and recovery after network pressure."],
  ["↗", "CDN health", "Sample edge availability, cache status, response timing, and regional playback quality."],
  ["hdr", "Manifest safety", "Catch unsafe redirects, oversized manifests, and blocked private-network targets before a run starts."]
];

export default function HomePage() {
  return (
    <SiteChrome>
      <main id="main-content">
        <section className="hero-section reveal-on-scroll" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" aria-hidden="true" />Media diagnostics workspace</div>
            <h1 id="hero-title">Find the buffer before viewers do.</h1>
            <p className="hero-lede">
              buffer.lol tests live streams and CDN paths from one clean workspace so media teams can catch latency spikes, stalled segments, and delivery failures before they hit production.
            </p>
            <div className="hero-actions" aria-label="Account actions">
              <Link className="submit-btn" href="/signup"><span>Create account</span><ArrowIcon /></Link>
              <Link className="submit-btn hero-secondary-action" href="/login"><span>Log in</span><ArrowIcon /></Link>
            </div>
            <div className="hero-meta" aria-label="Product highlights">
              <span>Stream buffering</span>
              <span>Video latency</span>
              <span>CDN edge health</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="buffer.lol media diagnostics preview">
            <Image src="/assets/media-dashboard.png" width={1586} height={992} alt="Dark-mode buffer.lol dashboard preview showing video buffering, latency, CDN health, and probe report panels." priority />
            <div className="visual-status">
              <button className="buffer-button" id="buffer-button" type="button" aria-label="Replay stream buffer test">
                <svg className="buffer-svg" viewBox="0 0 120 120" aria-hidden="true">
                  <circle className="buffer-track" cx="60" cy="60" r="52" />
                  <circle className="buffer-fill" id="buffer-fill" cx="60" cy="60" r="52" />
                </svg>
                <span><strong id="percentage-counter">00</strong>%</span>
              </button>
              <div>
                <span className="status-label">Stream buffer</span>
                <strong id="status-main">initializing probe</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section probe-section reveal-on-scroll" id="probe" aria-labelledby="probe-title">
          <div className="section-heading probe-heading">
            <div>
              <span className="section-kicker">Run a probe</span>
              <h2 id="probe-title">Preview a diagnostics report.</h2>
            </div>
            <p>Create an account to run server-side HLS and DASH diagnostics against real URLs.</p>
          </div>

          <div className="probe-workspace">
            <form className="probe-panel" id="probe-form" aria-label="Run a sample media probe">
              <label htmlFor="probe-url">Stream manifest URL</label>
              <input type="url" id="probe-url" name="probe-url" placeholder="https://example.com/live/master.m3u8" defaultValue="https://demo.buffer.lol/live/master.m3u8" required />

              <div className="probe-controls">
                <label><span>Probe type</span><select id="probe-type" name="probe-type"><option>HLS</option><option>DASH</option></select></label>
                <label><span>Requested region</span><select id="probe-region" name="probe-region"><option>US East</option><option>US West</option><option>EU West</option><option>APAC</option></select></label>
              </div>

              <button className="submit-btn probe-submit" id="probe-submit" type="submit">
                <span>Run probe</span><ArrowIcon />
              </button>
            </form>

            <div className="probe-results" aria-live="polite">
              <div className="probe-status-row">
                <div><span className="status-label">Probe status</span><strong id="probe-status-text">idle</strong></div>
                <span className="status-pill status-idle" id="probe-status-pill">sample</span>
              </div>
              <div className="probe-stages" id="probe-stages" aria-label="Probe progress">
                <span>Fetching manifest</span><span>Sampling CDN edge</span><span>Measuring latency</span><span>Checking buffer stability</span>
              </div>
              <div className="metric-grid" id="probe-metrics">
                {["Startup delay", "Rebuffers", "Live latency", "Manifest fetch", "CDN response", "Variants"].map((metric) => (
                  <div key={metric}><span>{metric}</span><strong>--</strong></div>
                ))}
              </div>
              <div className="console-box probe-log-box" aria-label="Probe event timeline">
                <ConsoleHeader title="probe-preview.log" />
                <div className="console-body" id="probe-log"><div className="console-line system-line">[sys] waiting for sample probe</div></div>
              </div>
            </div>

            <aside className="report-panel" aria-label="Sample report preview">
              <div className="report-header">
                <div><span className="section-kicker">Sample report</span><h3 id="report-title">No probe run yet</h3></div>
                <span className="status-pill status-idle" id="report-status">preview</span>
              </div>
              <ul className="report-checks" id="report-checks">
                <li><span>Pass</span>Manifest and segment checks will appear here.</li>
                <li><span>Warn</span>Latency and CDN notes update after a run.</li>
              </ul>
              <div className="report-actions-list" id="report-actions-list">
                <strong>Recommended next actions</strong>
                <p>Run a sample probe to generate targeted follow-up steps.</p>
              </div>
              <button className="submit-btn report-action-button report-action-secondary" id="copy-report" type="button">
                <span>Copy report</span>
                <CopyIcon />
              </button>
              <p className="form-feedback" id="copy-feedback" role="status" aria-live="polite" />
            </aside>
          </div>
        </section>

        <section className="metrics-strip reveal-on-scroll" aria-label="Media diagnostics metrics">
          <div><strong>2.4s</strong><span>startup buffer target</span></div>
          <div><strong>18</strong><span>edge regions sampled</span></div>
          <div><strong>&lt;450ms</strong><span>glass-to-glass target</span></div>
        </section>

        <section className="section split-section reveal-on-scroll" id="workflow">
          <div><span className="section-kicker">Workflow</span><h2>Run a media health check in minutes.</h2></div>
          <div className="workflow-list">
            <article><span>01</span><h3>Point at a stream</h3><p>Test HLS and DASH manifests with the same repeatable probe setup.</p></article>
            <article><span>02</span><h3>Watch playback pressure</h3><p>Track startup time, rebuffer events, dropped frames, bitrate shifts, and latency drift.</p></article>
            <article><span>03</span><h3>Compare the delivery path</h3><p>See which CDN edges, regions, or processing steps are causing slow starts and failed playback.</p></article>
          </div>
        </section>

        <section className="section use-case-section reveal-on-scroll" id="use-cases">
          <div className="section-heading"><div><span className="section-kicker">Use cases</span><h2>Diagnostics shaped around the media workflow.</h2></div></div>
          <div className="tab-shell">
            <div className="tab-list" role="tablist" aria-label="Media workflow use cases">
              {[
                ["tab-live", "live", "Live streaming"],
                ["tab-manifests", "manifests", "Manifest health"],
                ["tab-courses", "courses", "Course platforms"],
                ["tab-creator", "creator", "Creator tools"],
                ["tab-libraries", "libraries", "Internal media libraries"]
              ].map(([id, key, label], index) => (
                <button className={`tab-button${index === 0 ? " is-active" : ""}`} id={id} key={key} type="button" role="tab" aria-selected={index === 0} aria-controls="use-case-panel" tabIndex={index === 0 ? 0 : -1} data-use-case={key}>{label}</button>
              ))}
            </div>
            <div className="tab-panel" id="use-case-panel" role="tabpanel" aria-labelledby="tab-live" tabIndex={0}>
              <div><h3 id="use-case-title">Live streaming</h3><p id="use-case-copy">Watch live edge distance, segment health, player startup, and drift before the audience sees the stall.</p></div>
              <div className="tab-detail-grid">
                <div><strong>Key metrics</strong><ul id="use-case-metrics" /></div>
                <div><strong>Common failure modes</strong><ul id="use-case-failures" /></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section reveal-on-scroll" id="what-we-catch">
          <div className="section-heading"><div><span className="section-kicker">What we catch</span><h2>Concrete issues, not vague health scores.</h2></div></div>
          <div className="issue-grid">
            {issueCards.map(([severity, title, copy, detail]) => (
              <article key={title}><span className={`severity ${severity}`}>{severity}</span><h3>{title}</h3><p>{copy}</p><strong>{detail}</strong></article>
            ))}
          </div>
        </section>

        <section className="section reveal-on-scroll" id="features">
          <div className="section-heading"><span className="section-kicker">Features</span><h2>Built for the fragile parts of video delivery.</h2></div>
          <div className="feature-grid">
            {features.map(([icon, title, copy]) => (
              <article className="feature-card reveal-on-scroll" key={title}><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </section>

        <section className="integration-strip reveal-on-scroll" aria-label="Modern media workflows">
          <span>Built around modern media workflows</span>
          <div>{["HLS", "DASH", "WebRTC", "Mux", "Cloudflare", "Fastly", "AWS MediaConvert", "S3", "ffmpeg"].map((item) => <strong key={item}>{item}</strong>)}</div>
        </section>

        <section className="section access-section reveal-on-scroll" id="access">
          <div><span className="section-kicker">Access</span><h2>Bring your video pipeline into buffer.lol.</h2><p>Create an account to run diagnostics now, or use the access form if you want help bringing a larger media workflow into the product.</p></div>
          <div className="console-box" aria-label="Live media diagnostics log">
            <ConsoleHeader title="stream-probe.log" />
            <div className="console-body" id="console-body">
              <div className="console-line system-line">[sys] stream probe initialized</div>
              <div className="console-line success-line">[ok] manifest parsed: 6 bitrate variants</div>
            </div>
          </div>
        </section>
      </main>
      <LandingEnhancements />

      <div className="waitlist-modal" id="waitlist-modal" aria-hidden="true" inert>
        <div className="modal-backdrop" data-modal-close />
        <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button className="modal-close" type="button" data-modal-close aria-label="Close waitlist form">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
          <span className="section-kicker">Workspace access</span>
          <h2 id="modal-title">Join the waitlist.</h2>
          <WaitlistForm idPrefix="modal-" />
        </section>
      </div>

      <noscript><div className="noscript-banner">buffer.lol works best with JavaScript enabled for the live preview and waitlist feedback.</div></noscript>
    </SiteChrome>
  );
}

function WaitlistForm({ idPrefix }: { idPrefix: "" | "modal-" }) {
  const isModal = idPrefix === "modal-";
  const formId = isModal ? "modal-signup-form" : "signup-form";
  const inputId = isModal ? "modal-email-input" : "email-input";
  const feedbackId = isModal ? "modal-form-feedback" : "form-feedback";
  const buttonId = isModal ? "modal-submit-btn" : "submit-btn";

  return (
    <form className={`signup-form${isModal ? " modal-signup-form" : ""}`} id={formId} name={isModal ? "buffer-waitlist-modal" : "buffer-waitlist"} method="POST" data-netlify="true" data-netlify-honeypot="bot-field" data-signup-endpoint="/api/waitlist" aria-label="Join the waitlist">
      <input type="hidden" name="form-name" value={isModal ? "buffer-waitlist-modal" : "buffer-waitlist"} />
      <input type="hidden" name="source" value={isModal ? "landing-modal" : "landing-hero"} />
      <p className="sr-only"><label>Do not fill this out if you are human: <input name="bot-field" /></label></p>
      <label className="sr-only" htmlFor={inputId}>Email address</label>
      <div className="input-row">
        <input type="email" id={inputId} name="email" className="email-input" placeholder="you@company.com" autoComplete="email" aria-describedby={feedbackId} required />
        <button type="submit" className="submit-btn" id={buttonId}><span>Request access</span><ArrowIcon /></button>
      </div>
      <p className="form-privacy">By requesting access, you agree that we can use your email for product access communication. Read the <Link href="/privacy">privacy notice</Link>.</p>
      <p className="form-feedback" id={feedbackId} role="status" aria-live="polite" />
    </form>
  );
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 8h10v12H8z" />
      <path d="M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

function ConsoleHeader({ title }: { title: string }) {
  return (
    <div className="console-header">
      <span /><span /><span />
      <strong>{title}</strong>
    </div>
  );
}
