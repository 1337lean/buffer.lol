import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { InviteForm } from "@/components/team/InviteForm";
import { MemberRoleSelect } from "@/components/team/MemberRoleSelect";
import { TeamSettingsForm } from "@/components/team/TeamSettingsForm";
import { requireWorkspace } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { teamInvites, teamMembers, users } from "@/lib/db/schema";
import { canManageTeam } from "@/lib/teams";

export const dynamic = "force-dynamic";

export default async function TeamSettingsPage() {
  const { workspace } = await requireWorkspace();
  const canEdit = canManageTeam(workspace.role);
  const db = getDb();
  const [members, invites] = await Promise.all([
    db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
        role: teamMembers.role,
        joinedAt: teamMembers.createdAt
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, workspace.teamId))
      .orderBy(asc(teamMembers.createdAt)),
    db.select().from(teamInvites).where(eq(teamInvites.teamId, workspace.teamId)).orderBy(desc(teamInvites.createdAt)).limit(50)
  ]);

  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div>
          <span className="section-kicker">Team settings</span>
          <h1>{workspace.teamName}.</h1>
          <p>Manage the workspace profile, members, roles, and invite codes for this team.</p>
        </div>
        <Link className="submit-btn product-secondary" href="/app/settings/team/invites">Invites</Link>
      </section>

      <section className="settings-grid">
        <div className="product-panel">
          <div className="admin-panel-header">
            <div>
              <span className="section-kicker">Profile</span>
              <h2>Team details.</h2>
            </div>
            <span className="status-pill status-idle">{formatRole(workspace.role)}</span>
          </div>
          <TeamSettingsForm name={workspace.teamName} slug={workspace.teamSlug} canEdit={canEdit} />
        </div>

        <div className="product-panel">
          <div className="admin-panel-header">
            <div>
              <span className="section-kicker">Invites</span>
              <h2>Invite codes.</h2>
            </div>
          </div>
          <InviteForm canCreate={canEdit} />
        </div>
      </section>

      <section className="product-panel">
        <div className="admin-panel-header">
          <div>
            <span className="section-kicker">Members</span>
            <h2>Team roles.</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Email</th><th>Name</th><th>Role</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.userId}>
                  <td>{member.email}</td>
                  <td>{member.name || "--"}</td>
                  <td><MemberRoleSelect userId={member.userId} role={member.role} canEdit={canEdit} /></td>
                  <td>{formatDate(member.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="product-panel">
        <div className="admin-panel-header">
          <div>
            <span className="section-kicker">Invite history</span>
            <h2>Recent codes.</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Code</th><th>Email</th><th>Role</th><th>Status</th><th>Expires</th></tr>
            </thead>
            <tbody>
              {invites.length ? invites.map((invite) => (
                <tr key={invite.id}>
                  <td><code>{invite.code}</code></td>
                  <td>{invite.email || "Any email"}</td>
                  <td>{formatRole(invite.role)}</td>
                  <td><span className={`status-pill status-${inviteStatus(invite)}`}>{inviteStatus(invite)}</span></td>
                  <td>{invite.expiresAt ? formatDate(invite.expiresAt) : "Never"}</td>
                </tr>
              )) : (
                <tr><td colSpan={5}>No invite codes have been created yet.</td></tr>
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
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(value);
}
