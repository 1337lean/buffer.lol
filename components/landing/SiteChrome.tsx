import Link from "next/link";

type SiteChromeProps = {
  children: React.ReactNode;
  navHomePrefix?: string;
};

export function SiteHeader({ navHomePrefix = "" }: Omit<SiteChromeProps, "children">) {
  const prefix = navHomePrefix || "/";
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="buffer.lol home">
        <span className="brand-prompt" aria-hidden="true">&gt;_</span>
        buffer<span>.lol</span>
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        <Link href={`${prefix}#networking`}>Networking</Link>
        <Link href={`${prefix}#ip`}>IP tools</Link>
        <Link href={`${prefix}#developer`}>Developer</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><Link className="brand" href="/"><span className="brand-prompt">&gt;_</span>buffer<span>.lol</span></Link><p>Fast, simple networking tools.</p></div>
      <div className="footer-links"><Link href="/#networking">Networking</Link><Link href="/#ip">IP tools</Link><Link href="/#developer">Developer</Link></div>
      <div className="footer-links"><a href="#" aria-label="GitHub link coming soon">GitHub ↗</a><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      <div className="footer-bottom"><span>© 2026 buffer.lol</span><span className="system-status"><i /> All systems nominal</span><span>Built for the curious.</span></div>
    </footer>
  );
}

export function SiteChrome({ children, navHomePrefix }: SiteChromeProps) {
  return (
    <>
      <div className="grid-overlay" aria-hidden="true" />
      <SiteHeader navHomePrefix={navHomePrefix} />
      {children}
      <SiteFooter />
    </>
  );
}
