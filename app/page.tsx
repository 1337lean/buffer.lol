import Link from "next/link";
import type { Metadata } from "next";
import { Fragment } from "react";
import { IPLensPromo } from "@/components/ip-lens/IPLensPromo";
import { HeroTerminal } from "@/components/landing/HeroTerminal";
import { SiteChrome } from "@/components/landing/SiteChrome";
import { ToolCard } from "@/components/tools/ToolCard";
import { HeroToolSearch, QuickAccess } from "@/components/tools/ToolDiscovery";
import { categoryMeta, getToolsByCategory, tools, type ToolCategory } from "@/data/tools";
import { StructuredData } from "@/components/StructuredData";
import { homeStructuredData } from "@/lib/seo";

const categories: ToolCategory[] = ["networking", "ip", "developer"];

const networkingGroups = [
  {
    id: "connectivity",
    title: "Connectivity",
    description: "Test reachability, stability, routes, uptime, and public ports.",
    slugs: ["ping", "packet-loss", "traceroute", "uptime", "port-checker"]
  },
  {
    id: "dns-and-email",
    title: "DNS & email",
    description: "Inspect records, compare resolvers, and validate mail configuration.",
    slugs: ["dns-lookup", "dns-resolver-check", "email-dns-health", "whois-lookup"]
  },
  {
    id: "web-and-security",
    title: "Web & security",
    description: "Review certificates, redirects, response metadata, and browser protections.",
    slugs: ["http-headers", "ssl-checker", "redirect-checker", "robots-sitemap", "security-headers"]
  },
  {
    id: "addressing",
    title: "Addressing",
    description: "Calculate IPv4 networks, ranges, masks, and host counts locally.",
    slugs: ["cidr-calculator"]
  }
] as const;

export const metadata: Metadata = {
  title: { absolute: "Free Network & Developer Tools | buffer.lol" },
  description: "Free tools for DNS, HTTP, SSL, IP addresses, network diagnostics, JSON, Base64, UUIDs, timestamps, and more.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Free Network & Developer Tools | buffer.lol",
    description: "Free networking, IP, web, and developer utilities with clear local and server data paths.",
    url: "/",
    type: "website",
    siteName: "buffer.lol",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "buffer.lol network diagnostics and developer tools" }]
  }
};

export default function HomePage() {
  return (
    <>
      <StructuredData data={homeStructuredData(tools)} />
      <SiteChrome>
        <main id="main-content">
          <section className="home-hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <div className="eyebrow"><span className="live-dot" /> Browser-based network utilities</div>
              <h1 id="hero-title">Network <span>&amp; developer</span> tools.</h1>
              <p className="hero-subtitle">Diagnose networks and transform data—without the clutter.</p>
              <p className="hero-description">Find the right network check, web diagnostic, or developer utility and get a clear result in seconds.</p>
              <HeroToolSearch />
              <div className="hero-browse-actions">
                <Link href="#networking">Browse every tool <span aria-hidden="true">↓</span></Link>
                <Link href="/tools/json-formatter">Open JSON formatter <span aria-hidden="true">→</span></Link>
              </div>
              <div className="hero-trust"><span>◉ No sign-up</span><span>◉ Clear data paths</span><span>◉ Zero clutter</span></div>
            </div>

            <HeroTerminal />
          </section>

          <QuickAccess />

          <section className="tool-intro" aria-labelledby="toolbox-heading">
            <div><span className="section-kicker">The toolbox</span><h2 id="toolbox-heading">Everything you need.<br />Nothing you don&apos;t.</h2></div>
            <p>From quick network checks to everyday data transforms. Browser-ready tools stay local; live diagnostics run through a restricted same-origin API.</p>
          </section>

          <nav className="mobile-tool-nav" aria-label="Tool categories">
            {categories.map((category) => {
              const meta = categoryMeta[category];
              const tools = getToolsByCategory(category);

              return (
                <Link href={`#${category}`} key={category}>
                  <span>{meta.title.replace(" tools", "")}</span>
                  <strong>{tools.length}</strong>
                </Link>
              );
            })}
          </nav>

          {categories.map((category, index) => {
            const meta = categoryMeta[category];
            const categoryTools = getToolsByCategory(category);
            return (
              <Fragment key={category}>
                <section className="category-section" id={category}>
                  <header className="category-header">
                    <div><span className="category-number">0{index + 1}</span><h2>{meta.title}</h2></div>
                    <p>{meta.description}</p>
                  </header>
                  {category === "networking" ? (
                    <div className="tool-groups">
                      {networkingGroups.map((group) => (
                        <section className="tool-group" key={group.id} aria-labelledby={`tool-group-${group.id}`}>
                          <header>
                            <div><h3 id={`tool-group-${group.id}`}>{group.title}</h3><span>{group.slugs.length}</span></div>
                            <p>{group.description}</p>
                          </header>
                          <div className="tools-grid">{group.slugs.map((slug) => {
                            const tool = categoryTools.find((item) => item.slug === slug);
                            return tool ? <ToolCard tool={tool} key={tool.slug} /> : null;
                          })}</div>
                        </section>
                      ))}
                    </div>
                  ) : (
                    <div className="tools-grid">{categoryTools.map((tool) => <ToolCard tool={tool} key={tool.slug} />)}</div>
                  )}
                </section>
                {category === "networking" && <IPLensPromo />}
              </Fragment>
            );
          })}

          <section className="launch-strip">
            <div><span className="live-dot" /><strong>Built for the open web</strong></div>
            <p>Small tools. Clear results. No accounts, dashboards, or mystery.</p>
            <Link href="/tools/uuid-generator">Generate a UUID <span>→</span></Link>
          </section>
        </main>
      </SiteChrome>
    </>
  );
}
