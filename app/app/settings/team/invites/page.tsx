import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { InviteForm } from "@/components/team/InviteForm";
import { requireWorkspace } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { teamInvites } from "@/lib/db/schema";
import { canManageTeam } from "@/lib/teams";

export const dynamic = "force-dynamic";

export default async function TeamInvitesPage() {
  const { workspace } = await requireWorkspace();
  const canCreate = canManageTeam(workspace.role);
  const db = getDb();
  const invites = await db.select().from(teamInvites).where(eq(teamInvites.teamId, workspace.teamId)).orderBy(desc(teamInvites.createdAt)).limit(100);

  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div>
          <span className="section-kicker">Team invites</span>
          <h1>Invite codes.</h1>
          <p>Create and review invite codes for {workspace.teamName}.</p>
        </div>
        <Link className="submit-btn product-secondary" href="/app/settings/team">Team settings</Link>
      </section>

      <section className="product-panel">
        <InviteForm canCreate={canCreate} />
      </section>

      <section className="product-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Code</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Expires</th></tr>
            </thead>
            <tbody>
              {invites.length ? invites.map((invite) => (
                <tr key={invite.id}>
                  <td><code>{invite.code}</code></td>
                  <td>{invite.email || "Any email"}</td>
                  <td>{formatRole(invite.role)}</td>
                  <td><span className={`status-pill status-${inviteStatus(invite)}`}>{inviteStatus(invite)}</span></td>
                  <td>{formatDate(invite.createdAt)}</td>
                  <td>{invite.expiresAt ? formatDate(invite.expiresAt) : "Never"}</td>
                </tr>
              )) : (
                <tr><td colSpan={6}>No invite codes have been created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function inviteStatus(invite: typeof teamInvites.$inferSelect) {
  if (invite.usedAt) return "completed";
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) return "fail";
  return "running";
}

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", minute: "2-digit", hour: "numeric" }).format(value);
}
