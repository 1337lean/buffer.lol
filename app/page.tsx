import { LandingEnhancements } from "@/components/landing/LandingEnhancements";
import { SiteChrome } from "@/components/landing/SiteChrome";

const resultCards = [
  ["pass", "4K streaming", "25+ Mbps down", "Enough headroom for high-bitrate video and fast app updates."],
  ["pass", "Video calls", "10+ Mbps up", "Stable upload keeps screen shares and camera feeds crisp."],
  ["warn", "Gaming", "<40 ms ping", "Low latency matters more than raw download speed."],
  ["warn", "Busy homes", "<20 ms jitter", "Jitter hints at calls, games, and streams competing for airtime."],
  ["fail", "Buffer risk", "<8 Mbps down", "Streaming and large downloads may stall during peak hours."],
  ["fail", "Work upload", "<3 Mbps up", "Large files and backups can crawl when upload is constrained."]
];

const features = [
  ["↓", "Download", "Pulls same-origin test payloads and calculates Mbps from transferred bytes."],
  ["↑", "Upload", "Posts a capped local payload back to buffer.lol and measures throughput."],
  ["ms", "Latency", "Samples repeated pings to estimate round-trip time and jitter."],
  ["log", "History", "Keeps recent runs in this browser so you can compare rooms, routers, or plans."]
];

const comparisons = [
  ["Browsing", "5 Mbps", "Basic pages, email, and lightweight apps."],
  ["HD video", "15 Mbps", "Reliable 1080p streaming with some room for background traffic."],
  ["4K video", "25 Mbps", "A practical floor for one 4K stream."],
  ["Remote work", "10 Mbps up", "Video calls, screen sharing, and steady file sync."],
  ["Low-lag play", "<40 ms", "Good latency for realtime games and voice chat."]
];

export default function HomePage() {
  return (
    <SiteChrome>
      <main id="main-content">
        <section className="hero-section speed-hero reveal-on-scroll" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" aria-hidden="true" />Internet speed tester</div>
            <h1 id="hero-title">Test your connection in seconds.</h1>
            <p className="hero-lede">
              buffer.lol measures download speed, upload speed, ping, and jitter from your browser, then turns the numbers into plain-English connection notes.
            </p>
            <div className="hero-actions" aria-label="Speed test actions">
              <a className="submit-btn" href="#speed-test" id="speed-start-hero"><span>Start test</span><ArrowIcon /></a>
              <a className="submit-btn hero-secondary-action" href="#results"><span>Read results</span><ArrowIcon /></a>
            </div>
            <div className="hero-meta" aria-label="Measured speed metrics">
              <span>Download Mbps</span>
              <span>Upload Mbps</span>
              <span>Ping + jitter</span>
            </div>
          </div>

          <section className="speed-card" id="speed-test" aria-labelledby="speed-test-title">
            <div className="speed-card-header">
              <div>
                <span className="section-kicker">Live test</span>
                <h2 id="speed-test-title">Run a browser speed check.</h2>
              </div>
              <span className="status-pill status-idle" id="speed-status-pill">ready</span>
            </div>

            <div className="speed-gauge" aria-label="Current speed test progress">
              <button className="buffer-button speed-gauge-button" id="buffer-button" type="button" aria-label="Start internet speed test">
                <svg className="buffer-svg" viewBox="0 0 120 120" aria-hidden="true">
                  <circle className="buffer-track" cx="60" cy="60" r="52" />
                  <circle className="buffer-fill" id="buffer-fill" cx="60" cy="60" r="52" />
                </svg>
                <span><strong id="percentage-counter">00</strong>%</span>
              </button>
              <div>
                <span className="status-label">Connection</span>
                <strong id="status-main">ready to test</strong>
              </div>
            </div>

            <form className="speed-test-form" id="speed-test-form" aria-label="Run internet speed test">
              <label htmlFor="speed-profile">Test size</label>
              <select id="speed-profile" name="speed-profile">
                <option value="standard">Standard</option>
                <option value="light">Light</option>
                <option value="heavy">Heavy</option>
              </select>
              <button className="submit-btn speed-submit" id="start-speed-test" type="submit">
                <span>Start speed test</span><ArrowIcon />
              </button>
            </form>

            <p className="speed-note">Uses temporary same-origin payloads. Results depend on your device, Wi-Fi, VPN, and server distance.</p>
          </section>
        </section>

        <section className="section results-section reveal-on-scroll" aria-labelledby="results-title">
          <div className="section-heading results-heading">
            <div>
              <span className="section-kicker">Results</span>
              <h2 id="results-title">The numbers that shape the feel of the internet.</h2>
            </div>
            <p>Run the test a few times from the same room to spot congestion, weak Wi-Fi, or plan limits.</p>
          </div>

          <div className="speed-layout" id="results">
            <div className="speed-results" aria-live="polite">
              <div className="speed-status-row">
                <div><span className="status-label">Test status</span><strong id="speed-status-text">idle</strong></div>
                <span className="status-pill status-idle" id="speed-quality-pill">waiting</span>
              </div>
              <div className="speed-stages" id="speed-stages" aria-label="Speed test progress">
                <span>Ping</span><span>Download</span><span>Upload</span><span>Review</span>
              </div>
              <div className="speed-metrics-grid" id="speed-metrics">
                {["Download", "Upload", "Ping", "Jitter", "Test server", "Saved runs"].map((metric) => (
                  <div key={metric}><span>{metric}</span><strong>--</strong></div>
                ))}
              </div>
              <div className="console-box speed-log-box" aria-label="Speed test event timeline">
                <ConsoleHeader title="speed-test.log" />
                <div className="console-body" id="speed-log"><div className="console-line system-line">[sys] waiting for speed test</div></div>
              </div>
            </div>

            <aside className="speed-report" aria-label="Speed test report">
              <div className="speed-report-header">
                <div><span className="section-kicker">Connection report</span><h3 id="speed-summary-title">No run yet</h3></div>
                <span className="status-pill status-idle" id="speed-summary-status">preview</span>
              </div>
              <ul className="speed-report-checks" id="speed-summary-checks">
                <li><span>Info</span>Run a test to see what your connection can comfortably handle.</li>
                <li><span>Info</span>Ping and jitter explain responsiveness, not just speed.</li>
              </ul>
              <div className="speed-report-actions" id="speed-summary-actions">
                <strong>Helpful next checks</strong>
                <p>Try one run near your router and one where you usually work or stream.</p>
              </div>
              <button className="submit-btn speed-action speed-secondary" id="copy-results" type="button">
                <span>Copy results</span>
                <CopyIcon />
              </button>
              <p className="form-feedback" id="copy-feedback" role="status" aria-live="polite" />
            </aside>
          </div>
        </section>

        <section className="metrics-strip reveal-on-scroll" aria-label="Connection targets">
          <div><strong data-count-target="25" data-count-suffix="+">25+</strong><span>Mbps for one 4K stream</span></div>
          <div><strong data-count-target="40" data-count-prefix="&lt;" data-count-suffix="ms">&lt;40ms</strong><span>responsive gaming ping</span></div>
          <div><strong data-count-target="10" data-count-suffix="+">10+</strong><span>Mbps upload for calls</span></div>
        </section>

        <section className="section split-section reveal-on-scroll" id="workflow">
          <div><span className="section-kicker">Method</span><h2>Measure the connection you actually have right now.</h2></div>
          <div className="workflow-list">
            <article><span>01</span><h3>Sample latency</h3><p>Multiple small requests estimate ping and jitter before larger transfers begin.</p></article>
            <article><span>02</span><h3>Move real bytes</h3><p>The browser downloads and uploads temporary payloads, then converts timing into Mbps.</p></article>
            <article><span>03</span><h3>Translate the result</h3><p>buffer.lol summarizes what the connection is ready for and where it may struggle.</p></article>
          </div>
        </section>

        <section className="section use-case-section reveal-on-scroll" id="compare">
          <div className="section-heading"><div><span className="section-kicker">Compare</span><h2>What different activities usually need.</h2></div></div>
          <div className="tab-shell comparison-shell">
            {comparisons.map(([title, target, copy]) => (
              <article className="comparison-row" key={title}>
                <span>{title}</span>
                <strong>{target}</strong>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section reveal-on-scroll" id="what-we-catch">
          <div className="section-heading"><div><span className="section-kicker">Interpretation</span><h2>Useful thresholds, not mystery scores.</h2></div></div>
          <div className="issue-grid">
            {resultCards.map(([severity, title, copy, detail]) => (
              <article key={title}><span className={`severity ${severity}`}>{severity}</span><h3>{title}</h3><p>{copy}</p><strong>{detail}</strong></article>
            ))}
          </div>
        </section>

        <section className="section reveal-on-scroll" id="features">
          <div className="section-heading"><span className="section-kicker">Features</span><h2>Small enough to trust, practical enough to repeat.</h2></div>
          <div className="feature-grid">
            {features.map(([icon, title, copy]) => (
              <article className="feature-card reveal-on-scroll" key={title}><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </section>

        <section className="integration-strip reveal-on-scroll" aria-label="Network contexts">
          <span>Useful for checking</span>
          <div>{["Fiber", "Cable", "5G", "Public Wi-Fi", "VPN", "Mesh Wi-Fi", "Hotspots", "Offices", "Dorms"].map((item) => <strong key={item}>{item}</strong>)}</div>
        </section>

        <section className="section access-section reveal-on-scroll" id="access">
          <div><span className="section-kicker">Keep testing</span><h2>Compare your connection over time.</h2><p>Recent runs stay in this browser so you can test after moving rooms, changing VPNs, rebooting hardware, or calling your provider.</p></div>
          <div className="console-box" aria-label="Recent speed test log">
            <ConsoleHeader title="recent-runs.log" />
            <div className="console-body" id="console-body">
              <div className="console-line system-line">[sys] run a speed test to start local history</div>
            </div>
          </div>
        </section>
      </main>
      <LandingEnhancements />

      <noscript><div className="noscript-banner">buffer.lol needs JavaScript enabled to run a browser speed test.</div></noscript>
    </SiteChrome>
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
