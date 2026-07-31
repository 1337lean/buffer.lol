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
      <Link className="wordmark" href="/" aria-label="buffer.lol home">
        buffer<span>.lol</span>
      </Link>
      <nav className="site-nav" aria-label="Primary navigation">
        <Link href={`${prefix}#networking`}>Networking</Link>
        <Link href={`${prefix}#ip`}>IP tools</Link>
        <Link href={`${prefix}#developer`}>Developer</Link>
        <Link href="/ip-lens">IP Lens</Link>
        {docsUrl && <a href={docsUrl}>Docs</a>}
        <ToolLauncher />
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL;

  return (
    <footer className="site-footer">
      <div>
        <Link className="wordmark" href="/">buffer<span>.lol</span></Link>
        <p>Network and developer tools. No sign-up.</p>
      </div>
      <nav aria-label="Site and legal links">
        <Link href="/#networking">Networking</Link>
        <Link href="/#ip">IP tools</Link>
        <Link href="/#developer">Developer</Link>
        <Link href="/ip-lens">IP Lens</Link>
        {docsUrl && <a href={docsUrl}>Docs</a>}
        {ipLensConfig.appStoreUrl && <a href={ipLensConfig.appStoreUrl} rel="noreferrer" target="_blank">App Store</a>}
        <Link href="/ip-lens/support">Support</Link>
        <Link href="/ip-lens/privacy">IP Lens privacy</Link>
        <Link href="/ip-lens/terms">IP Lens terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href="https://github.com/1337lean/buffer.lol" rel="noreferrer" target="_blank">GitHub</a>
      </nav>
      <p className="footer-fineprint">© 2026 buffer.lol · Built for the curious</p>
    </footer>
  );
}

export function SiteChrome({ children, navHomePrefix }: SiteChromeProps) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <SiteHeader navHomePrefix={navHomePrefix} />
      {children}
      <SiteFooter />
    </>
  );
}
