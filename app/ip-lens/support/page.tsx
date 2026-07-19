import type { Metadata } from "next";
import Link from "next/link";
import { SiteChrome } from "@/components/landing/SiteChrome";
import { ipLensConfig } from "@/data/ip-lens";

export const metadata: Metadata = {
  title: "IP Lens Support",
  description: "Troubleshooting, bug reports, and feature requests for IP Lens.",
  alternates: { canonical: "/ip-lens/support" },
  openGraph: {
    title: "IP Lens Support | buffer.lol",
    description: "Get help with IP Lens or send a focused bug report or feature request.",
    url: "/ip-lens/support",
    type: "website"
  }
};

export default function IPLensSupportPage() {
  return (
    <SiteChrome navHomePrefix="/">
      <main className="simple-main" id="main-content">
        <article className="simple-page product-legal-page">
          <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/ip-lens">IP Lens</Link><span>/</span><strong>Support</strong></nav>
          <span className="section-kicker">IP Lens / Support</span>
          <h1>Clear reports help.</h1>
          <p>For help with IP Lens, email <a href={`mailto:${ipLensConfig.supportEmail}`}>{ipLensConfig.supportEmail}</a>. A concise description and a few technical details are usually enough to begin.</p>

          <aside className="support-warning">
            <span aria-hidden="true">!</span>
            <p><strong>Keep sensitive data out of support requests.</strong> Do not submit API keys or private, internal, or personally identifying IP information unless it is necessary to explain the problem.</p>
          </aside>

          <h2>Common Troubleshooting</h2>
          <ul>
            <li>Confirm the iPhone has a working internet connection before running an online lookup.</li>
            <li>Check the address or domain for extra spaces and typing errors.</li>
            <li>Try the request again after a short delay if a provider is temporarily unavailable.</li>
            <li>For DNS issues, confirm whether Cloudflare or Quad9 is selected in Settings.</li>
            <li>Install the latest available IP Lens and iOS updates, then restart the app.</li>
          </ul>

          <h2>Report a Bug</h2>
          <p>Include what you tried, what you expected, what happened instead, and whether the issue repeats. Add the lookup type and record type when relevant, but redact sensitive targets.</p>

          <h2>Version Information</h2>
          <p>In IP Lens, open Settings and note the Version shown under About. Include that value and your iOS version from Settings → General → About. Mention your iPhone model only when it appears relevant to the issue.</p>

          <h2>Request a Feature</h2>
          <p>Describe the networking task, the input you start with, and the result you need. A short real-world workflow is more useful than a broad feature name.</p>

          <h2>Contact</h2>
          <p><a className="secondary-button inline-support-button" href={`mailto:${ipLensConfig.supportEmail}?subject=IP%20Lens%20Support`}>Email IP Lens support</a></p>
          <p><Link href="/ip-lens">Back to IP Lens</Link> · <Link href="/ip-lens/privacy">Read the privacy notice</Link></p>
        </article>
      </main>
    </SiteChrome>
  );
}
