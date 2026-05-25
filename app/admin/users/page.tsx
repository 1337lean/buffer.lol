import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const db = getDb();
  const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(200);

  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div><span className="section-kicker">Admin</span><h1>Users.</h1><p>Review recently created accounts.</p></div>
      </section>
      <section className="product-panel table-wrap">
        <table>
          <thead><tr><th>Email</th><th>Name</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.name || "--"}</td>
                <td>{formatDate(user.createdAt)}</td>
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
