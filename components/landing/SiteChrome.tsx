import Link from "next/link";

type SiteChromeProps = {
  children: React.ReactNode;
  cta?: React.ReactNode;
  navHomePrefix?: string;
};

export function SiteHeader({ cta, navHomePrefix = "" }: Omit<SiteChromeProps, "children">) {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="buffer.lol home">
        <span className="brand-mark" aria-hidden="true" />
        buffer<span>.lol</span>
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        <Link href={`${navHomePrefix}#probe`}>Probe</Link>
        <Link href={`${navHomePrefix}#workflow`}>Tests</Link>
        <Link href={`${navHomePrefix}#access`}>Access</Link>
      </nav>
      {cta ?? (
        <button className="header-cta" id="waitlist-modal-open" type="button">
          Join waitlist
        </button>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>&copy; 2026 buffer.lol</span>
      <Link href="/privacy">Privacy</Link>
      <Link href="/terms">Terms</Link>
      <a href="mailto:hello@buffer.lol">hello@buffer.lol</a>
    </footer>
  );
}

export function SiteChrome({ children, cta, navHomePrefix }: SiteChromeProps) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <canvas className="particle-canvas" id="particle-canvas" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />
      <SiteHeader cta={cta} navHomePrefix={navHomePrefix} />
      {children}
      <SiteFooter />
    </>
  );
}
