import Link from "next/link";
import { ToolLauncher } from "@/components/tools/ToolDiscovery";
import { ipLensConfig } from "@/data/ip-lens";

type SiteChromeProps = {
  children: React.ReactNode;
  navHomePrefix?: string;
};

export function SiteHeader({ navHomePrefix = "" }: Omit<SiteChromeProps, "children">) {
  const prefix = navHomePrefix || "/";
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL;

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
        <Link href="/ip-lens">IP Lens</Link>
        {docsUrl && <a href={docsUrl}>Docs</a>}
      </nav>
      <ToolLauncher />
    </header>
  );
}

export function SiteFooter() {
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL;

  return (
    <footer className="site-footer">
      <div className="footer-brand"><Link className="brand" href="/"><span className="brand-prompt">&gt;_</span>buffer<span>.lol</span></Link><p>Fast, simple networking tools.</p></div>
      <div className="footer-links"><Link href="/#networking">Networking</Link><Link href="/#ip">IP tools</Link><Link href="/#developer">Developer</Link><Link href="/ip-lens">IP Lens</Link>{docsUrl && <a href={docsUrl}>Docs</a>}</div>
      <div className="footer-links"><Link href="/ip-lens/privacy">IP Lens privacy</Link><Link href="/ip-lens/terms">IP Lens terms</Link><Link href="/ip-lens/support">Support &amp; feature requests</Link>{ipLensConfig.appStoreUrl && <a href={ipLensConfig.appStoreUrl} rel="noreferrer" target="_blank">App Store ↗</a>}<a href="https://github.com/1337lean/buffer.lol" rel="noreferrer" target="_blank">GitHub ↗</a><Link href="/privacy">Site privacy</Link><Link href="/terms">Site terms</Link></div>
      <div className="footer-bottom"><span>© 2026 buffer.lol</span><span>Built for the curious.</span></div>
    </footer>
  );
}

export function SiteChrome({ children, navHomePrefix }: SiteChromeProps) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="grid-overlay" aria-hidden="true" />
      <SiteHeader navHomePrefix={navHomePrefix} />
      {children}
      <SiteFooter />
    </>
  );
}
