import type { Metadata } from "next";
import { Fragment } from "react";
import { IPLensPromo } from "@/components/ip-lens/IPLensPromo";
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
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "buffer.lol network diagnostics and developer tools" }]
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
              <h1 id="hero-title">Network tools.<span>Developer tools.</span></h1>
              <p className="hero-lede">
                Find the right network check, web diagnostic, or developer utility and get a clear
                result in seconds.
              </p>
              <HeroToolSearch />
              <QuickAccess />
              <p className="hero-fineprint">No sign-up · Browser-ready tools stay local · Live diagnostics run through a restricted same-origin API</p>
            </div>
          </section>

          <section className="trust-strip" aria-label="Toolbox at a glance">
            <div><strong>{tools.length}</strong><span>Tools</span></div>
            {categories.map((category) => (
              <div key={category}>
                <strong>{getToolsByCategory(category).length}</strong>
                <span>{categoryMeta[category].title}</span>
              </div>
            ))}
          </section>

          {categories.map((category, index) => {
            const meta = categoryMeta[category];
            const categoryTools = getToolsByCategory(category);
            return (
              <Fragment key={category}>
                <section className="category-section" id={category}>
                  <header className="category-header">
                    <span className="category-number">0{index + 1}</span>
                    <h2>{meta.title}</h2>
                    <p>{meta.description}</p>
                  </header>
                  {category === "networking" ? (
                    <div className="tool-groups">
                      {networkingGroups.map((group) => (
                        <section className="tool-group" key={group.id} aria-labelledby={`tool-group-${group.id}`}>
                          <header>
                            <h3 id={`tool-group-${group.id}`}>{group.title}</h3>
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
        </main>
      </SiteChrome>
    </>
  );
}
