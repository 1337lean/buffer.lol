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
    <SiteChrome navHomePrefix="/">
      <main className="simple-main" id="main-content">
        <article className="simple-page">
          <span className="section-kicker">Terms</span>
          <h1>Product terms.</h1>
          <p>buffer.lol provides browser-based networking and developer utilities. Tool output is offered for practical informational use and is not a guarantee of network performance, availability, identity, or security.</p>

          <h2>Acceptable Use</h2>
          <p>Do not attempt to disrupt the site, bypass controls, automate abusive traffic, scrape submissions, or interfere with other visitors.</p>

          <h2>No Warranty</h2>
          <p>The service is provided as-is and may change. Network results can be affected by routing, VPNs, browser behavior, server distance, caching, firewalls, and temporary congestion.</p>

          <h2>Contact</h2>
          <p>For questions about these terms, email <a href="mailto:hello@buffer.lol">hello@buffer.lol</a>.</p>

          <h2>Last Updated</h2>
          <p>June 22, 2026</p>
          <p><Link href="/">Back to buffer.lol</Link></p>
        </article>
      </main>
    </SiteChrome>
  );
}
