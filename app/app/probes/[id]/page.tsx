import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { probeEvents, probeMetrics, probes, reports } from "@/lib/db/schema";
import { ProbeReportActions } from "@/components/probes/ProbeReportActions";

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
  const checks = normalizeChecks(report?.checks);
  const actions = normalizeActions(report?.recommendedActions);
  const reportText = report?.reportText || "Diagnostics are queued. Refresh this page to see worker events, metrics, and report checks as they arrive.";

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
                [{formatDateTime(event.createdAt)}] [{event.level}] {event.message}
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
          {checks.length ? (
            <ul className="report-checks report-check-table">
              {checks.map((check) => (
                <li key={`${check.label}-${check.detail}`}>
                  <span className={check.status}>{check.status}</span>
                  <div>
                    <strong>{check.label}</strong>
                    <p>{check.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="report-text">{reportText}</p>
          )}
          {actions.length ? (
            <div className="report-actions-list">
              <strong>Recommended next actions</strong>
              <ul>
                {actions.map((action) => <li key={action}>{action}</li>)}
              </ul>
            </div>
          ) : null}
          <ProbeReportActions reportText={reportText} url={probe.url} probeType={probe.probeType} region={probe.region} />
          <Link className="submit-btn report-action-button report-action-secondary report-back-action" href="/app/probes">
            <span>Back to history</span>
            <BackIcon />
          </Link>
        </aside>
      </section>
    </main>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

function normalizeChecks(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const check = item as Record<string, unknown>;
    if (typeof check.status !== "string" || typeof check.label !== "string" || typeof check.detail !== "string") return [];
    if (!["pass", "warn", "fail"].includes(check.status)) return [];
    return [{ status: check.status as "pass" | "warn" | "fail", label: check.label, detail: check.detail }];
  });
}

function normalizeActions(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(value);
}
