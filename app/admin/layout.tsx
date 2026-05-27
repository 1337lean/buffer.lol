import Link from "next/link";
import { requireAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const glassHeaderStyle = {
  background: "rgba(5, 6, 9, 0.54)",
  backdropFilter: "blur(18px) saturate(1.18)",
  WebkitBackdropFilter: "blur(18px) saturate(1.18)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="grid-overlay" aria-hidden="true" />
      <header className="site-header product-header admin-header" style={glassHeaderStyle}>
        <Link className="brand" href="/" aria-label="buffer.lol home">
          <span className="brand-mark" aria-hidden="true" />
          buffer<span className="brand-suffix">.lol</span>
        </Link>
        <nav className="nav-links" aria-label="Admin navigation">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/waitlist">Waitlist</Link>
          <Link href="/admin/probes">Probes</Link>
          <Link href="/admin/users">Users</Link>
        </nav>
        <Link className="header-cta" href="/app">Open app</Link>
      </header>
      {children}
    </>
  );
}
