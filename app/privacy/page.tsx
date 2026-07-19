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
          <p>buffer.lol provides browser-based networking and developer utilities. Browser-ready tools process their input locally unless a tool clearly states otherwise.</p>

          <h2>What We Collect</h2>
          <ul>
            <li>Input used in browser-ready developer tools is processed on your device and is not submitted to buffer.lol.</li>
            <li>Server-backed network and IP tools process the target you submit, the request metadata needed to complete the check, and short-lived diagnostic results.</li>
            <li>Your email address and message content if you contact us.</li>
            <li>Basic technical metadata collected by the hosting platform, such as request time, IP address, user agent, and abuse-prevention signals.</li>
            <li>Aggregate page-view, referrer, device, country, and performance measurements produced by Cloudflare Web Analytics without site-set analytics cookies or advertising identifiers.</li>
          </ul>

          <h2>How We Use It</h2>
          <p>We use submitted data to provide requested tools, respond to messages, prevent abuse, understand aggregate site usage, and improve reliability and navigation. We do not sell contact emails or analytics data.</p>

          <h2>Tool Data</h2>
          <p>JSON, Base64, hashing, UUID, timestamp, URL parsing, JWT decoding, regex testing, CIDR calculations, and user-agent utilities run locally in your browser. Ping and packet-loss/stability tests send repeated HTTPS requests from your browser to buffer.lol. Server-backed DNS, HTTP, TLS, uptime, port, RDAP, redirect, robots/sitemap, public IP, geolocation, ASN, and traceroute tools send the target to buffer.lol only to produce the requested result. Traceroute checks are handled by a restricted diagnostics worker.</p>

          <h2>Removal Requests</h2>
          <p>To ask for contact data removal, email <a href="mailto:hello@buffer.lol">hello@buffer.lol</a> from the address you used.</p>

          <h2>Operator</h2>
          <p>For privacy questions, removal requests, or product questions, email <a href="mailto:hello@buffer.lol">hello@buffer.lol</a>.</p>

          <h2>Last Updated</h2>
          <p>July 19, 2026</p>
          <p><Link href="/">Back to buffer.lol</Link></p>
        </article>
      </main>
    </SiteChrome>
  );
}
