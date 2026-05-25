import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { probes } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminProbesPage() {
  const db = getDb();
  const rows = await db.select().from(probes).orderBy(desc(probes.createdAt)).limit(200);

  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div><span className="section-kicker">Admin</span><h1>Probes.</h1><p>Inspect recent diagnostic runs across all teams.</p></div>
      </section>
      <section className="product-panel table-wrap">
        <table>
          <thead><tr><th>Status</th><th>URL</th><th>Type</th><th>Region</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map((probe) => (
              <tr key={probe.id}>
                <td><span className={`status-pill status-${probe.status}`}>{probe.status}</span></td>
                <td><Link href={`/app/probes/${probe.id}`}>{probe.url}</Link></td>
                <td>{probe.probeType.toUpperCase()}</td>
                <td>{probe.region}</td>
                <td>{formatDate(probe.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(value);
}
