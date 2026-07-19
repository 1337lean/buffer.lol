import type { Metadata } from "next";
import Link from "next/link";
import { SiteChrome } from "@/components/landing/SiteChrome";
import { ipLensConfig } from "@/data/ip-lens";

export const metadata: Metadata = {
  title: "IP Lens Privacy",
  description: "Privacy notice for the IP Lens iPhone app.",
  alternates: { canonical: "/ip-lens/privacy" },
  openGraph: {
    title: "IP Lens Privacy | buffer.lol",
    description: "How IP Lens sends lookup requests and uses third-party data providers.",
    url: "/ip-lens/privacy",
    type: "website"
  }
};

export default function IPLensPrivacyPage() {
  return (
    <SiteChrome navHomePrefix="/">
      <main className="simple-main" id="main-content">
        <article className="simple-page product-legal-page">
          <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/ip-lens">IP Lens</Link><span>/</span><strong>Privacy</strong></nav>
          <span className="section-kicker">IP Lens / Privacy</span>
          <h1>Your lookups are yours.</h1>
          <p>IP Lens is a native iPhone networking utility. It has no accounts, advertising, analytics, tracking, attribution SDK, developer-operated backend, or recurring subscription.</p>

          <h2>How Lookups Work</h2>
          <p>IP Lens does not operate its own lookup backend. Automatic current-IP lookups and addresses you enter are sent directly from your device to the selected IP data provider. Other network utilities disclose their destination before sending a request.</p>

          <h2>Third-Party Providers</h2>
          <ul>
            <li>Free IP lookups use {ipLensConfig.providers.freeIPData}. Personal-key mode uses {ipLensConfig.providers.personalIPData}.</li>
            <li>DNS queries go only to the resolver selected in the app: {ipLensConfig.providers.dns}.</li>
            <li>Domain, IP, and ASN registration queries use {ipLensConfig.providers.bootstrap} and go directly to the {ipLensConfig.providers.registration}.</li>
          </ul>
          <p>These services receive the submitted query and ordinary connection metadata, including your public source IP, needed to respond. Their handling of that information is governed by their own terms and privacy policies.</p>

          <h2>Data Stored on Your iPhone</h2>
          <p>Successful IP lookups enter a history of up to 100 recent unique addresses. Favorites and explicitly saved DNS, RDAP, and batch captures remain in the app&apos;s on-device SwiftData store until you delete them. Resolver, API mode, appearance, and onboarding preferences use on-device settings. IP Lens does not use iCloud sync.</p>

          <h2>Personal Provider Keys and Exports</h2>
          <p>An optional personal ipwhois.pro API key is stored in Apple Keychain. It is not included in preferences, lookup snapshots, exports, or logs. CSV and JSON exports are prepared locally; IP Lens sends them only to the destination you choose through the iOS share sheet.</p>

          <h2>Offline and Location Behavior</h2>
          <p>The IPv4/IPv6 subnet calculator runs entirely on-device. Saved results remain available offline. IP Lens does not request GPS or Core Location permission; map positions come from approximate provider-supplied coordinates.</p>

          <h2>Accounts, Ads, and Purchases</h2>
          <p>IP Lens does not require an account and does not include advertisements, subscriptions, or in-app StoreKit purchases. It is planned as a one-time paid App Store download.</p>

          <h2>Location Accuracy</h2>
          <p>IP geolocation is approximate. It describes an estimated network location and should not be treated as the exact physical location of a device or person.</p>

          <h2>Deletion</h2>
          <p>You can delete individual favorites and saved captures or use Settings → Clear History and Saved Utilities. Removing the app deletes its app-container data. Remove a personal provider key in Settings before uninstalling if you want it explicitly removed from Keychain.</p>

          <h2>Contact</h2>
          <p>For privacy questions, email <a href={`mailto:${ipLensConfig.supportEmail}`}>{ipLensConfig.supportEmail}</a> or visit <Link href="/ip-lens/support">IP Lens support</Link>.</p>

          <h2>Last Updated</h2>
          <p>July 18, 2026</p>
          <p><Link href="/ip-lens">Back to IP Lens</Link></p>
        </article>
      </main>
    </SiteChrome>
  );
}
