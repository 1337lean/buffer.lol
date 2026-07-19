import type { Metadata } from "next";
import Link from "next/link";
import { SiteChrome } from "@/components/landing/SiteChrome";
import { ipLensConfig } from "@/data/ip-lens";

export const metadata: Metadata = {
  title: "IP Lens Terms",
  description: "Terms of use for the IP Lens iPhone app.",
  alternates: { canonical: "/ip-lens/terms" },
  openGraph: {
    title: "IP Lens Terms | buffer.lol",
    description: "Terms for using IP Lens and its third-party network data.",
    url: "/ip-lens/terms",
    type: "website"
  }
};

export default function IPLensTermsPage() {
  return (
    <SiteChrome navHomePrefix="/">
      <main className="simple-main" id="main-content">
        <article className="simple-page product-legal-page">
          <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/ip-lens">IP Lens</Link><span>/</span><strong>Terms</strong></nav>
          <span className="section-kicker">IP Lens / Terms</span>
          <h1>Informational network tools.</h1>
          <p>IP Lens provides IP geolocation, DNS, registration, subnet, and related network information for practical informational use. Results may be incomplete, delayed, or inaccurate and are not a guarantee of identity, ownership, location, availability, or security.</p>

          <h2>Important Limitations</h2>
          <p>Do not use IP Lens results for emergency response, safety-critical decisions, legal conclusions, employment, housing, credit, eligibility, surveillance, or access-control decisions. Approximate IP geolocation does not identify the precise location of a device or person.</p>

          <h2>Acceptable Use</h2>
          <p>Use IP Lens only for addresses, domains, and networks you are authorized to inspect. Do not use it to disrupt services, evade controls, automate abusive traffic, or violate provider, registry, resolver, or network acceptable-use limits.</p>

          <h2>Third-Party Services</h2>
          <p>Online lookups depend on third-party providers, resolvers, and registries disclosed in the app. Those services have their own terms and privacy policies and may change, rate-limit, reject, or stop serving requests. IP Lens does not promise uninterrupted availability.</p>

          <h2>Purchase</h2>
          <p>IP Lens is planned as a one-time paid App Store download. It requires no IP Lens account or recurring subscription. App Store purchasing and refunds are handled under Apple&apos;s applicable terms.</p>

          <h2>No Warranty</h2>
          <p>IP Lens is provided as-is to the extent permitted by applicable law, without warranties that its output will be accurate, complete, current, or suitable for a particular purpose.</p>

          <h2>Contact</h2>
          <p>For questions about these terms, email <a href={`mailto:${ipLensConfig.supportEmail}`}>{ipLensConfig.supportEmail}</a>.</p>

          <h2>Last Updated</h2>
          <p>July 19, 2026</p>
          <p><Link href="/ip-lens">Back to IP Lens</Link> · <Link href="/ip-lens/privacy">Read the privacy notice</Link></p>
        </article>
      </main>
    </SiteChrome>
  );
}
