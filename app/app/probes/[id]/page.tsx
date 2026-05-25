import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { probeEvents, probeMetrics, probes, reports } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProbeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const db = getDb();
  const [probe] = await db.select().from(probes).where(and(eq(probes.id, id), eq(probes.teamId, workspace.teamId))).limit(1);
  if (!probe) notFound();

  const [events, metricsRows, reportRows] = await Promise.all([
    db.select().from(probeEvents).where(eq(probeEvents.probeId, id)).orderBy(asc(probeEvents.createdAt)),
    db.select().from(probeMetrics).where(eq(probeMetrics.probeId, id)).limit(1),
    db.select().from(reports).where(eq(reports.probeId, id)).limit(1)
  ]);
  const metrics = metricsRows[0];
  const report = reportRows[0];

  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div>
          <span className="section-kicker">Probe detail</span>
          <h1>{probe.probeType.toUpperCase()} probe.</h1>
          <p>{probe.url}</p>
        </div>
        <span className={`status-pill status-${probe.status}`}>{probe.status}</span>
      </section>

      <section className="metric-grid product-detail-grid">
        <div><span>Manifest fetch</span><strong>{metrics?.manifestFetchMs ? `${metrics.manifestFetchMs}ms` : "--"}</strong></div>
        <div><span>First segment</span><strong>{metrics?.firstSegmentFetchMs ? `${metrics.firstSegmentFetchMs}ms` : "--"}</strong></div>
        <div><span>CDN response</span><strong>{metrics?.cdnResponseMs ? `${metrics.cdnResponseMs}ms` : "--"}</strong></div>
        <div><span>Variants</span><strong>{metrics?.bitrateVariantCount ?? "--"}</strong></div>
      </section>

      <section className="probe-workspace product-detail-layout">
        <div className="console-box probe-log-box">
          <div className="console-header"><span /><span /><span /><strong>probe-events.log</strong></div>
          <div className="console-body">
            {events.length ? events.map((event) => (
              <div className={`console-line ${event.level === "error" || event.level === "fail" ? "warn-line" : event.level === "pass" ? "success-line" : "system-line"}`} key={event.id}>
                [{event.level}] {event.message}
              </div>
            )) : <div className="console-line system-line">[sys] waiting for worker events</div>}
          </div>
        </div>

        <aside className="report-panel">
          <div className="report-header">
            <div>
              <span className="section-kicker">Report</span>
              <h3>{report?.title || probe.summary || "Queued for diagnostics"}</h3>
            </div>
            <span className={`status-pill status-${report?.status || probe.status}`}>{report?.status || probe.status}</span>
          </div>
          <p className="report-text">{report?.reportText || "The worker is not connected yet. This run has been persisted and is ready for Phase 4 processing."}</p>
          <Link className="text-action" href="/app/probes">Back to history</Link>
        </aside>
      </section>
    </main>
  );
}
