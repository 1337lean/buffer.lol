import { requireWorkspace } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TeamSettingsPage() {
  const { workspace } = await requireWorkspace();

  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div>
          <span className="section-kicker">Team settings</span>
          <h1>{workspace.teamName}.</h1>
          <p>Team profile and membership controls are intentionally narrow until invites and billing are added.</p>
        </div>
      </section>
      <section className="product-panel">
        <div className="metric-grid product-detail-grid">
          <div><span>Team slug</span><strong>{workspace.teamSlug}</strong></div>
          <div><span>Your role</span><strong>{workspace.role}</strong></div>
        </div>
        <p className="empty-state">Invite links, role management, and billing controls are reserved for the next operations pass.</p>
      </section>
    </main>
  );
}
