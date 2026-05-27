import { NewProbeForm } from "@/components/probes/NewProbeForm";

export const dynamic = "force-dynamic";

export default function NewProbePage() {
  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div>
          <span className="section-kicker">New probe</span>
          <h1>Queue a URL probe.</h1>
          <p>Submit a public HLS or DASH manifest. Private networks, unsafe redirects, and oversized responses are rejected before diagnostics run.</p>
        </div>
      </section>
      <section className="probe-workspace product-new-probe">
        <NewProbeForm />
        <aside className="report-panel">
          <div className="report-header">
            <div>
              <span className="section-kicker">Safety checks</span>
              <h3>Bounded by default</h3>
            </div>
            <span className="status-pill status-idle">ready</span>
          </div>
          <ul className="report-checks">
            <li><span>Block</span>Localhost, private IP ranges, and link-local networks are rejected.</li>
            <li><span>Queue</span>Runs are persisted before worker execution.</li>
            <li><span>Report</span>Completed diagnostics write structured checks, events, and metrics.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
