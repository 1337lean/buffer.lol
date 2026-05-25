import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireWorkspace } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { probes } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const { workspace } = await requireWorkspace();
  const db = getDb();
  const recentProbes = await db.select().from(probes).where(eq(probes.teamId, workspace.teamId)).orderBy(desc(probes.createdAt)).limit(5);
  const queuedCount = recentProbes.filter((probe) => probe.status === "queued" || probe.status === "running").length;
  const warningCount = recentProbes.filter((probe) => ["warn", "fail", "error"].includes(probe.status)).length;

  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div>
          <span className="section-kicker">Dashboard</span>
          <h1>Media diagnostics workspace.</h1>
          <p>Queue HLS and DASH URL probes, then track each run as worker-backed diagnostics come online.</p>
        </div>
        <Link className="submit-btn product-primary" href="/app/probes/new">New probe</Link>
      </section>

      <section className="admin-metrics product-metrics" aria-label="Workspace metrics">
        <div><span>Recent probes</span><strong>{recentProbes.length}</strong></div>
        <div><span>Queued/running</span><strong>{queuedCount}</strong></div>
        <div><span>Warnings</span><strong>{warningCount}</strong></div>
      </section>

      <section className="product-panel">
        <div className="admin-panel-header">
          <div>
            <span className="section-kicker">Recent activity</span>
            <h2>Latest probe runs.</h2>
          </div>
          <Link className="submit-btn product-secondary" href="/app/probes">View all</Link>
        </div>
        <ProbeList rows={recentProbes} />
      </section>
    </main>
  );
}

function ProbeList({ rows }: { rows: Array<typeof probes.$inferSelect> }) {
  if (!rows.length) {
    return <p className="empty-state">No probes yet. Queue your first URL probe to start building history.</p>;
  }

  return (
    <div className="activity-list product-list">
      {rows.map((probe) => (
        <article key={probe.id}>
          <span className={`status-pill status-${probe.status}`}>{probe.status}</span>
          <div>
            <Link href={`/app/probes/${probe.id}`}>{probe.url}</Link>
            <p>{probe.probeType.toUpperCase()} / {formatRegion(probe.region)} / {formatDate(probe.createdAt)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(value);
}

function formatRegion(value: string) {
  return value.split("-").map((part) => part.toUpperCase()).join(" ");
}
