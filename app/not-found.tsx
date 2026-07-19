import Link from "next/link";
import type { Metadata } from "next";
import { SiteChrome } from "@/components/landing/SiteChrome";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false }
};

export default function NotFoundPage() {
  return (
    <SiteChrome navHomePrefix="/">
      <main className="simple-main" id="main-content">
        <article className="simple-page">
          <span className="section-kicker">404 / Not found</span>
          <h1>That route dropped a packet.</h1>
          <p>The page may have moved, or the address may be incomplete.</p>
          <p><Link href="/">Return to the toolbox</Link></p>
        </article>
      </main>
    </SiteChrome>
  );
}
