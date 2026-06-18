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
    <SiteChrome navHomePrefix="/">
      <main className="simple-main" id="main-content">
        <article className="simple-page">
          <span className="section-kicker">Privacy notice</span>
          <h1>Product privacy.</h1>
          <p>buffer.lol runs browser-based internet speed tests and keeps recent public-test history in your browser.</p>

          <h2>What We Collect</h2>
          <ul>
            <li>Speed-test timing results that your browser stores locally for recent-run history.</li>
            <li>Temporary download and upload payload metadata needed to complete a test, such as byte counts and request timing.</li>
            <li>Your email address and message content if you contact us.</li>
            <li>Basic technical metadata collected by the hosting platform, such as request time, IP address, user agent, and abuse-prevention signals.</li>
          </ul>

          <h2>How We Use It</h2>
          <p>We use submitted data to run the tester, respond to requests, prevent abuse, and improve reliability. We do not sell contact emails.</p>

          <h2>Speed Test Data</h2>
          <p>Test payloads are generated only to measure transfer speed and are discarded after the request. Recent result history is stored in local storage on your device.</p>

          <h2>Removal Requests</h2>
          <p>To ask for contact data removal, email <a href="mailto:hello@buffer.lol">hello@buffer.lol</a> from the address you used.</p>

          <h2>Operator</h2>
          <p>For privacy questions, removal requests, or product questions, email <a href="mailto:hello@buffer.lol">hello@buffer.lol</a>.</p>

          <h2>Last Updated</h2>
          <p>June 18, 2026</p>
          <p><Link href="/">Back to buffer.lol</Link></p>
        </article>
      </main>
    </SiteChrome>
  );
}
