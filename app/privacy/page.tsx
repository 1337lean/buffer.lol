import type { Metadata } from "next";
import Link from "next/link";
import { SiteChrome } from "@/components/landing/SiteChrome";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy notice for buffer.lol.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return (
    <SiteChrome cta={<a className="header-cta" href="mailto:hello@buffer.lol">Contact</a>} navHomePrefix="/">
      <main className="simple-main" id="main-content">
        <article className="simple-page">
          <span className="section-kicker">Privacy notice</span>
          <h1>Product privacy.</h1>
          <p>buffer.lol collects account, team, waitlist, and diagnostic data needed to operate the media diagnostics workspace.</p>

          <h2>What We Collect</h2>
          <ul>
            <li>Your email address from the waitlist form.</li>
            <li>Basic technical metadata collected by the form host, such as submission time, IP address, user agent, and spam-detection signals.</li>
            <li>Diagnostic URLs, probe events, metrics, and reports created inside your workspace.</li>
          </ul>

          <h2>How We Use It</h2>
          <p>We use submitted data to provide diagnostics, operate accounts, contact teams about access or product updates, and improve reliability. We do not sell waitlist emails.</p>

          <h2>Diagnostic Data</h2>
          <p>Probe runs may store URLs, timing metrics, HTTP metadata, event timelines, and generated reports. Avoid submitting URLs you do not have permission to test.</p>

          <h2>Removal Requests</h2>
          <p>To ask for waitlist or account data removal, email <a href="mailto:hello@buffer.lol">hello@buffer.lol</a> from the address you submitted.</p>

          <h2>Operator</h2>
          <p>For privacy questions, removal requests, or product questions, email <a href="mailto:hello@buffer.lol">hello@buffer.lol</a>.</p>

          <h2>Last Updated</h2>
          <p>May 25, 2026</p>
          <p><Link href="/">Back to buffer.lol</Link></p>
        </article>
      </main>
    </SiteChrome>
  );
}
