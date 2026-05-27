import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { withTimeout } from "@/lib/async-timeout";
import { getDb } from "@/lib/db/client";
import { probes, users, waitlistEntries } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const PROBE_COUNT_LIMIT = 50000;

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
          <Link className="submit-btn product-secondary" href="/admin/probes">View all</Link>
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
    const [counts, recentProbes] = await withTimeout(Promise.all([
      getAdminOverviewCounts(db),
      db.select().from(probes).orderBy(desc(probes.createdAt)).limit(6)
    ]), 5000, "The admin database query timed out.");

    return {
      error: "",
      waitlistCount: counts.waitlistCount,
      probeCount: counts.probeCount,
      userCount: counts.userCount,
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

type AdminCountValue = number | string | bigint | null | undefined;

type AdminCountsRow = {
  waitlist_count?: AdminCountValue;
  probe_count?: AdminCountValue;
  user_count?: AdminCountValue;
};

async function getAdminOverviewCounts(db: ReturnType<typeof getDb>) {
  const rows = await db.execute(sql`
    select
      (select count(*)::integer from ${waitlistEntries}) as waitlist_count,
      (select count(*)::integer from (select 1 from ${probes} limit ${PROBE_COUNT_LIMIT + 1}) as counted_probes) as probe_count,
      (select count(*)::integer from ${users}) as user_count
  `);
  const row = rows[0] as AdminCountsRow | undefined;

  return {
    waitlistCount: toCount(row?.waitlist_count),
    probeCount: toBoundedCount(row?.probe_count, PROBE_COUNT_LIMIT),
    userCount: toCount(row?.user_count)
  };
}

function toCount(value: AdminCountValue) {
  const count = Number(value ?? 0);
  return Number.isFinite(count) ? count : 0;
}

function toBoundedCount(value: AdminCountValue, limit: number) {
  const count = toCount(value);
  return count > limit ? `${limit}+` : count;
}
