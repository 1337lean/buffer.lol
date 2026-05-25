import { NewProbeForm } from "@/components/probes/NewProbeForm";

export const dynamic = "force-dynamic";

export default function NewProbePage() {
  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div>
          <span className="section-kicker">New probe</span>
          <h1>Queue a URL probe.</h1>
          <p>Submit an HLS or DASH URL. Phase 3 persists the queued run while the worker remains stubbed.</p>
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
            <li><span>Queue</span>Rows are stored as queued probes before worker execution.</li>
            <li><span>Next</span>The worker will fetch manifests and write metrics in Phase 4.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
