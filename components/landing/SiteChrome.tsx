import Link from "next/link";
import { getCurrentAuthUser, getCurrentWorkspace } from "@/lib/auth";

const glassHeaderStyle = {
  background: "rgba(5, 6, 9, 0.54)",
  backdropFilter: "blur(18px) saturate(1.18)",
  WebkitBackdropFilter: "blur(18px) saturate(1.18)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
};

type SiteChromeProps = {
  children: React.ReactNode;
  cta?: React.ReactNode;
  navHomePrefix?: string;
};

export async function SiteHeader({ cta, navHomePrefix = "" }: Omit<SiteChromeProps, "children">) {
  const { user, workspace } = await getHeaderAuthState();

  return (
    <header className="site-header" style={glassHeaderStyle}>
      <Link className="brand" href="/" aria-label="buffer.lol home">
        <span className="brand-mark" aria-hidden="true" />
        buffer<span className="brand-suffix">.lol</span>
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        <Link href={`${navHomePrefix}#probe`}>Probe</Link>
        <Link href={`${navHomePrefix}#workflow`}>Tests</Link>
        <Link href={`${navHomePrefix}#access`}>Access</Link>
      </nav>
      <div className="header-actions">
        {cta ?? (user ? (
          <>
            <Link className="header-cta" href={workspace ? "/app" : "/onboarding/team"}>{workspace ? "Open app" : "Set up team"}</Link>
            <a className="header-cta header-cta-secondary" href="/logout">Logout</a>
          </>
        ) : (
          <>
            <Link className="header-cta header-cta-secondary" href="/login">Log in</Link>
            <Link className="header-cta" href="/signup">Sign up</Link>
          </>
        ))}
      </div>
    </header>
  );
}

async function getHeaderAuthState() {
  try {
    const user = await getCurrentAuthUser();
    const workspace = user ? await getCurrentWorkspace(user.id) : null;
    return { user, workspace };
  } catch {
    return { user: null, workspace: null };
  }
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
