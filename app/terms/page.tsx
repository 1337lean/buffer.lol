import type { Metadata } from "next";
import Link from "next/link";
import { SiteChrome } from "@/components/landing/SiteChrome";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using buffer.lol.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <SiteChrome cta={<a className="header-cta" href="mailto:hello@buffer.lol">Contact</a>} navHomePrefix="/">
      <main className="simple-main" id="main-content">
        <article className="simple-page">
          <span className="section-kicker">Terms</span>
          <h1>Product terms.</h1>
          <p>buffer.lol provides media diagnostics for stream URLs and delivery workflows. Diagnostic results are operational guidance, not a guarantee of viewer experience.</p>

          <h2>Acceptable Use</h2>
          <p>Do not submit URLs, content, or information that you do not have permission to test, share, or process. Do not attempt to disrupt the site, bypass controls, scrape submissions, or access another team&apos;s diagnostics.</p>

          <h2>No Warranty</h2>
          <p>The service is provided as-is and may change. Diagnostic reports can be incomplete or affected by network conditions, provider behavior, or user-submitted URL constraints.</p>

          <h2>Accounts</h2>
          <p>You are responsible for account access, submitted URLs, and keeping team diagnostics within authorized use.</p>

          <h2>Contact</h2>
          <p>For questions about these terms, email <a href="mailto:hello@buffer.lol">hello@buffer.lol</a>.</p>

          <h2>Last Updated</h2>
          <p>May 25, 2026</p>
          <p><Link href="/">Back to buffer.lol</Link></p>
        </article>
      </main>
    </SiteChrome>
  );
}
