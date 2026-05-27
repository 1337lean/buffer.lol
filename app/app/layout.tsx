import Link from "next/link";
import { requireWorkspace } from "@/lib/auth";
import { ProductNav } from "@/components/product/ProductNav";

export const dynamic = "force-dynamic";

const glassHeaderStyle = {
  background: "rgba(5, 6, 9, 0.54)",
  backdropFilter: "blur(18px) saturate(1.18)",
  WebkitBackdropFilter: "blur(18px) saturate(1.18)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
};

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const { workspace } = await requireWorkspace();

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="grid-overlay" aria-hidden="true" />
      <header className="site-header product-header" style={glassHeaderStyle}>
        <Link className="brand" href="/" aria-label="buffer.lol home">
          <span className="brand-mark" aria-hidden="true" />
          buffer<span className="brand-suffix">.lol</span>
        </Link>
        <ProductNav />
        <div className="product-team">
          <span>{workspace.teamName}</span>
          <a className="header-cta" href="/logout">Logout</a>
        </div>
      </header>
      {children}
    </>
  );
}
