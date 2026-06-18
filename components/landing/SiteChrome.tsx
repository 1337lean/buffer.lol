import Link from "next/link";

const docsUrl =
  process.env.NEXT_PUBLIC_DOCS_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3333" : "https://docs.buffer.lol");

type SiteChromeProps = {
  children: React.ReactNode;
  navHomePrefix?: string;
};

export function SiteHeader({ navHomePrefix = "" }: Omit<SiteChromeProps, "children">) {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="buffer.lol home">
        <span className="brand-mark" aria-hidden="true" />
        buffer<span className="brand-suffix">.lol</span>
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        <Link href={`${navHomePrefix}#speed-test`}>Test</Link>
        <Link href={`${navHomePrefix}#results`}>Results</Link>
        <Link href={`${navHomePrefix}#workflow`}>Method</Link>
        <a href={docsUrl}>Docs</a>
      </nav>
      <Link className="header-cta" href={`${navHomePrefix}#speed-test`}>
        Run test
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>&copy; 2026 buffer.lol</span>
      <a href={docsUrl}>Docs</a>
      <Link href="/privacy">Privacy</Link>
      <Link href="/terms">Terms</Link>
      <a href="mailto:hello@buffer.lol">hello@buffer.lol</a>
    </footer>
  );
}

export function SiteChrome({ children, navHomePrefix }: SiteChromeProps) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <canvas className="particle-canvas" id="particle-canvas" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />
      <SiteHeader navHomePrefix={navHomePrefix} />
      {children}
      <SiteFooter />
    </>
  );
}
