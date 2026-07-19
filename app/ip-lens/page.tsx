import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AppScreenshotFrame } from "@/components/ip-lens/AppScreenshotFrame";
import { AppStoreCTA } from "@/components/ip-lens/AppStoreCTA";
import { IPLensFeatureCard } from "@/components/ip-lens/IPLensFeatureCard";
import { SiteChrome } from "@/components/landing/SiteChrome";
import { ipLensConfig } from "@/data/ip-lens";

const description =
  "IP Lens is a focused iPhone networking toolkit for IP lookup, DNS records, registration data, subnet calculations, batch analysis, and more—with no ads or subscription.";

export const metadata: Metadata = {
  title: { absolute: "IP Lens — Networking Tools for iPhone | buffer.lol" },
  description,
  alternates: { canonical: "/ip-lens" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "IP Lens — Networking Tools for iPhone",
    description,
    type: "website",
    url: "/ip-lens",
    siteName: "buffer.lol"
  },
  twitter: {
    card: "summary",
    title: "IP Lens — Networking Tools for iPhone",
    description
  }
};

const sampleFields = [
  ["Address", "203.0.113.42"],
  ["IP version", "IPv4"],
  ["ASN", "AS64500 · sample"],
  ["Provider", "Example Network"],
  ["Reverse DNS", "host-42.example.test"],
  ["Network range", "203.0.113.0/24"],
  ["Approximate region", "Example region"]
] as const;

function SectionHeader({ id, number, label, title, text }: { id: string; number: string; label: string; title: string; text: string }) {
  return (
    <header className="product-section-header">
      <div>
        <span className="category-number">{number}</span>
        <span className="section-kicker">{label}</span>
        <h2 id={id}>{title}</h2>
      </div>
      <p>{text}</p>
    </header>
  );
}

export default function IPLensPage() {
  const [heroScreenshot, ...galleryScreenshots] = ipLensConfig.screenshots;

  return (
    <SiteChrome navHomePrefix="/">
      <main className="ip-lens-page" id="main-content">
        <section className="product-hero" aria-labelledby="ip-lens-title">
          <div className="product-hero-copy">
            <div className="eyebrow"><span className="live-dot" /> native://ios</div>
            <div className="product-identity">
              <Image className="product-app-icon" src={ipLensConfig.appIcon} width={144} height={144} alt="IP Lens app icon" priority />
              <p className="product-name">{ipLensConfig.appName}<span>IP lookup and network tools</span></p>
            </div>
            <h1 id="ip-lens-title">See the network more clearly.</h1>
            <p className="product-hero-description">IP lookup, DNS inspection, registration data, subnet calculations, and more—built into one focused networking toolkit for iPhone.</p>
            <div className="hero-actions">
              <AppStoreCTA />
              <Link className="secondary-button" href="#features">Explore features <span aria-hidden="true">↓</span></Link>
            </div>
            <ul className="product-badges" aria-label="Product highlights">
              {ipLensConfig.badges.map((badge) => <li key={badge}><i aria-hidden="true" />{badge}</li>)}
            </ul>
          </div>
          <div className="hero-app-preview">
            <div className="preview-orbit" aria-hidden="true" />
            <AppScreenshotFrame screenshot={heroScreenshot} featured />
          </div>
        </section>

        <section className="product-section screenshot-section" aria-labelledby="preview-heading">
          <SectionHeader
            id="preview-heading"
            number="01"
            label="App preview"
            title="Built for the screen in your hand."
            text="A native, focused workspace for moving from an address or domain to the details that matter—across individual lookups, DNS records, batch analysis, and offline subnet math."
          />
          <div className="screenshot-gallery">
            {galleryScreenshots.map((screenshot) => <AppScreenshotFrame screenshot={screenshot} key={screenshot.id} />)}
          </div>
        </section>

        <section className="product-section" id="features" aria-labelledby="features-heading">
          <SectionHeader
            id="features-heading"
            number="02"
            label="The toolkit"
            title="Related tools. One place."
            text="Inspect an address, resolve a domain, review registration data, or calculate a network without jumping between disconnected utilities."
          />
          <div className="ip-lens-feature-grid">
            {ipLensConfig.features.map((feature) => <IPLensFeatureCard feature={feature} key={feature.command} />)}
          </div>
        </section>

        <section className="product-section workflow-section" aria-labelledby="workflow-heading">
          <SectionHeader
            id="workflow-heading"
            number="03"
            label="Focused workflow"
            title="One address. A clearer picture."
            text="IP Lens organizes related network details into a compact hierarchy, so the next useful signal is close to the first."
          />
          <div className="sample-workflow">
            <div className="sample-workflow-bar">
              <span className="terminal-dots" aria-hidden="true"><i /><i /><i /></span>
              <strong>Illustrative sample</strong>
              <span className="status-success">reserved address</span>
            </div>
            <div className="sample-workflow-body">
              <div className="sample-address">
                <span>lookup://sample</span>
                <strong>203.0.113.42</strong>
                <p>Reserved documentation address. The values below are fictional and demonstrate layout only.</p>
              </div>
              <dl>
                {sampleFields.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}
              </dl>
            </div>
          </div>
        </section>

        <section className="product-section privacy-section" aria-labelledby="privacy-heading">
          <SectionHeader
            id="privacy-heading"
            number="04"
            label="Privacy"
            title="Your lookups are yours."
            text="IP Lens keeps the request path direct and understandable. It does not operate its own lookup backend."
          />
          <div className="privacy-callout">
            <div className="privacy-copy">
              <span className="privacy-signal"><i aria-hidden="true" /> device → provider</span>
              <h3>Requests go directly from your device.</h3>
              <p>Free IP lookups go to {ipLensConfig.providers.freeIPData}; personal-key lookups go to {ipLensConfig.providers.personalIPData}. DNS queries go only to the selected {ipLensConfig.providers.dns} resolver, while registration queries go directly to the {ipLensConfig.providers.registration}.</p>
              <div className="privacy-links">
                <Link href="/ip-lens/privacy">Read the IP Lens privacy notice <span aria-hidden="true">→</span></Link>
                <Link href="/ip-lens/support">Contact support <span aria-hidden="true">→</span></Link>
              </div>
            </div>
            <ul className="privacy-facts">
              <li><span>01</span><strong>No account required</strong></li>
              <li><span>02</span><strong>No advertisements</strong></li>
              <li><span>03</span><strong>No analytics or tracking</strong></li>
              <li><span>04</span><strong>No IP Lens lookup proxy</strong></li>
              <li><span>05</span><strong>Saved data stays on-device</strong></li>
              <li><span>06</span><strong>No GPS permission</strong></li>
            </ul>
          </div>
        </section>

        <section className="product-section audience-section" aria-labelledby="audience-heading">
          <SectionHeader
            id="audience-heading"
            number="05"
            label="Built for"
            title="Technical tools, without the ceremony."
            text="For people who want a useful answer without an account, a dashboard, or an ad between them and the result."
          />
          <ul className="audience-list">
            {ipLensConfig.audiences.map((audience, index) => <li key={audience}><span>0{index + 1}</span>{audience}</li>)}
          </ul>
        </section>

        <section className="product-section pricing-section" aria-labelledby="pricing-heading">
          <SectionHeader
            id="pricing-heading"
            number="06"
            label="Pricing"
            title="One purchase. No recurring bill."
            text="IP Lens is planned as a $4.99 paid App Store download. One purchase, with no advertising, StoreKit upsells, or recurring subscription."
          />
          <div className="pricing-panel">
            <div>
              <span className="pricing-status">{ipLensConfig.releaseStatus}</span>
              <h3>{ipLensConfig.priceText}</h3>
              <p>{ipLensConfig.priceStatus}</p>
              <AppStoreCTA className="secondary-button" />
            </div>
            <ul>
              {ipLensConfig.purchaseIncludes.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}
            </ul>
          </div>
        </section>

        <section className="product-section faq-section" aria-labelledby="faq-heading">
          <SectionHeader
            id="faq-heading"
            number="07"
            label="FAQ"
            title="Short answers."
            text="What to expect from IP Lens before it reaches the App Store."
          />
          <div className="faq-list">
            {ipLensConfig.faq.map((item, index) => (
              <details key={item.question}>
                <summary><span>{String(index + 1).padStart(2, "0")}</span>{item.question}</summary>
                <div>
                  <p>{item.answer}</p>
                  {index === ipLensConfig.faq.length - 1 && <Link href="/ip-lens/support">Open support <span aria-hidden="true">→</span></Link>}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="product-final-cta" aria-labelledby="final-cta-heading">
          <div>
            <span className="section-kicker">native://ios</span>
            <h2 id="final-cta-heading">A clearer view of the network.</h2>
            <p>Focused tools, native performance, and no recurring subscription.</p>
          </div>
          <div className="hero-actions">
            <AppStoreCTA />
            <Link className="secondary-button" href="/ip-lens/support">Request a feature</Link>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
