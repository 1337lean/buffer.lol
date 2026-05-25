import Link from "next/link";
import { count, desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { probes, users, waitlistEntries } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const db = getDb();
  const [[waitlist], [probeCount], [userCount], recentProbes] = await Promise.all([
    db.select({ value: count() }).from(waitlistEntries),
    db.select({ value: count() }).from(probes),
    db.select({ value: count() }).from(users),
    db.select().from(probes).orderBy(desc(probes.createdAt)).limit(6)
  ]);

  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div>
          <span className="section-kicker">Admin</span>
          <h1>Operations.</h1>
          <p>Monitor waitlist activity, probe diagnostics, users, and job health.</p>
        </div>
      </section>
      <section className="admin-metrics product-metrics">
        <div><span>Waitlist</span><strong>{waitlist.value}</strong></div>
        <div><span>Probes</span><strong>{probeCount.value}</strong></div>
        <div><span>Users</span><strong>{userCount.value}</strong></div>
      </section>
      <section className="product-panel">
        <div className="admin-panel-header">
          <div><span className="section-kicker">Recent probes</span><h2>Latest diagnostics.</h2></div>
          <Link className="text-action" href="/admin/probes">View all</Link>
        </div>
        <div className="activity-list product-list">
          {recentProbes.map((probe) => (
            <article key={probe.id}>
              <span className={`status-pill status-${probe.status}`}>{probe.status}</span>
              <div>
                <strong>{probe.summary || probe.url}</strong>
                <p>{probe.probeType.toUpperCase()} / {probe.region} / {probe.url}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
