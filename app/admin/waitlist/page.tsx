import { desc } from "drizzle-orm";
import { WaitlistStatusForm } from "@/components/admin/WaitlistStatusForm";
import { getDb } from "@/lib/db/client";
import { waitlistEntries } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  const db = getDb();
  const rows = await db.select().from(waitlistEntries).orderBy(desc(waitlistEntries.createdAt)).limit(200);

  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div><span className="section-kicker">Admin</span><h1>Waitlist.</h1><p>Review and update access status for inbound teams.</p></div>
      </section>
      <section className="product-panel table-wrap">
        <table>
          <thead><tr><th>Email</th><th>Source</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.email}</td>
                <td>{entry.source}</td>
                <td><WaitlistStatusForm id={entry.id} status={entry.status} /></td>
                <td>{formatDate(entry.createdAt)}</td>
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
