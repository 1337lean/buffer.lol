import Link from "next/link";
import { requireWorkspace } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const { workspace } = await requireWorkspace();

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="grid-overlay" aria-hidden="true" />
      <header className="site-header product-header">
        <Link className="brand" href="/app" aria-label="buffer.lol app home">
          <span className="brand-mark" aria-hidden="true" />
          buffer<span>.lol</span>
        </Link>
        <nav className="nav-links" aria-label="Workspace navigation">
          <Link href="/app">Overview</Link>
          <Link href="/app/probes">Probes</Link>
          <Link href="/app/probes/new">New probe</Link>
          <Link href="/app/settings/team">Team</Link>
        </nav>
        <div className="product-team">
          <span>{workspace.teamName}</span>
          <Link className="header-cta" href="/logout">Logout</Link>
        </div>
      </header>
      {children}
    </>
  );
}
