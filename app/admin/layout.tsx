import Link from "next/link";
import { requireAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="grid-overlay" aria-hidden="true" />
      <header className="site-header product-header admin-header">
        <Link className="brand" href="/admin" aria-label="buffer.lol admin">
          <span className="brand-mark" aria-hidden="true" />
          buffer<span>.lol</span>
        </Link>
        <nav className="nav-links" aria-label="Admin navigation">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/waitlist">Waitlist</Link>
          <Link href="/admin/probes">Probes</Link>
          <Link href="/admin/users">Users</Link>
        </nav>
        <Link className="header-cta" href="/app">Workspace</Link>
      </header>
      {children}
    </>
  );
}
