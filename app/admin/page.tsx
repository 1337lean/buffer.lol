import Link from "next/link";
import { count, desc } from "drizzle-orm";
import { withTimeout } from "@/lib/async-timeout";
import { getDb } from "@/lib/db/client";
import { probes, users, waitlistEntries } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getAdminDashboardData();

  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div>
          <span className="section-kicker">Admin</span>
          <h1>Operations.</h1>
          <p>Monitor waitlist activity, probe diagnostics, users, and job health.</p>
        </div>
      </section>
      {data.error ? (
        <section className="product-panel admin-warning">
          <span className="section-kicker">Data unavailable</span>
          <p>{data.error}</p>
        </section>
      ) : null}
      <section className="admin-metrics product-metrics">
        <div><span>Waitlist</span><strong>{data.waitlistCount}</strong></div>
        <div><span>Probes</span><strong>{data.probeCount}</strong></div>
        <div><span>Users</span><strong>{data.userCount}</strong></div>
      </section>
      <section className="product-panel">
        <div className="admin-panel-header">
          <div><span className="section-kicker">Recent probes</span><h2>Latest diagnostics.</h2></div>
          <Link className="text-action" href="/admin/probes">View all</Link>
        </div>
        <div className="activity-list product-list">
          {data.recentProbes.length ? data.recentProbes.map((probe) => (
            <article key={probe.id}>
              <span className={`status-pill status-${probe.status}`}>{probe.status}</span>
              <div>
                <strong>{probe.summary || probe.url}</strong>
                <p>{probe.probeType.toUpperCase()} / {probe.region} / {probe.url}</p>
              </div>
            </article>
          )) : <p className="empty-state">No recent probes to show.</p>}
        </div>
      </section>
    </main>
  );
}

async function getAdminDashboardData() {
  try {
    const db = getDb();
    const [[waitlist], [probeCount], [userCount], recentProbes] = await withTimeout(Promise.all([
      db.select({ value: count() }).from(waitlistEntries),
      db.select({ value: count() }).from(probes),
      db.select({ value: count() }).from(users),
      db.select().from(probes).orderBy(desc(probes.createdAt)).limit(6)
    ]), 3500, "The admin database query timed out.");

    return {
      error: "",
      waitlistCount: waitlist.value,
      probeCount: probeCount.value,
      userCount: userCount.value,
      recentProbes
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Admin data could not be loaded.",
      waitlistCount: "--",
      probeCount: "--",
      userCount: "--",
      recentProbes: [] as Array<typeof probes.$inferSelect>
    };
  }
}
