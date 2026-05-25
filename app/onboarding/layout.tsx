import Link from "next/link";

const glassHeaderStyle = {
  background: "rgba(5, 6, 9, 0.54)",
  backdropFilter: "blur(18px) saturate(1.18)",
  WebkitBackdropFilter: "blur(18px) saturate(1.18)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="grid-overlay" aria-hidden="true" />
      <header className="site-header product-header" style={glassHeaderStyle}>
        <Link className="brand" href="/" aria-label="buffer.lol home">
          <span className="brand-mark" aria-hidden="true" />
          buffer<span className="brand-suffix">.lol</span>
        </Link>
        <nav className="nav-links" aria-label="Onboarding navigation">
          <Link href="/">Home</Link>
          <Link href="/app">App</Link>
        </nav>
        <a className="header-cta" href="/logout">Logout</a>
      </header>
      {children}
    </>
  );
}
