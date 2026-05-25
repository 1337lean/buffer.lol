import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireWorkspace } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { probes } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function ProbesPage() {
  const { workspace } = await requireWorkspace();
  const db = getDb();
  const rows = await db.select().from(probes).where(eq(probes.teamId, workspace.teamId)).orderBy(desc(probes.createdAt)).limit(50);

  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div>
          <span className="section-kicker">Probe history</span>
          <h1>Probe runs.</h1>
          <p>Queued and completed URL diagnostics for your current team.</p>
        </div>
        <Link className="submit-btn product-primary" href="/app/probes/new">New probe</Link>
      </section>

      <section className="product-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>URL</th>
                <th>Type</th>
                <th>Region</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((probe) => (
                <tr key={probe.id}>
                  <td><span className={`status-pill status-${probe.status}`}>{probe.status}</span></td>
                  <td><Link href={`/app/probes/${probe.id}`}>{probe.url}</Link></td>
                  <td>{probe.probeType.toUpperCase()}</td>
                  <td>{probe.region}</td>
                  <td>{formatDate(probe.createdAt)}</td>
                </tr>
              )) : (
                <tr><td colSpan={5}>No probes have been queued yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(value);
}
