import Link from "next/link";
import type { Metadata } from "next";
import { IPLensPromo } from "@/components/ip-lens/IPLensPromo";
import { HeroTerminal } from "@/components/landing/HeroTerminal";
import { SiteChrome } from "@/components/landing/SiteChrome";
import { ToolCard } from "@/components/tools/ToolCard";
import { QuickAccess } from "@/components/tools/ToolDiscovery";
import { categoryMeta, getToolsByCategory, type ToolCategory } from "@/data/tools";

const categories: ToolCategory[] = ["networking", "ip", "developer"];

export const metadata: Metadata = {
  alternates: { canonical: "/" }
};

export default function HomePage() {
  return (
    <SiteChrome>
      <main id="main-content">
        <section className="home-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" /> Browser-based network utilities</div>
            <h1 id="hero-title">buffer<span>.lol</span></h1>
            <p className="hero-subtitle">Fast, simple networking tools.</p>
            <p className="hero-description">A focused toolbox for network diagnostics, web checks, and developer utilities—built to be quick, clear, and useful without getting in your way.</p>
            <div className="hero-actions">
              <Link className="primary-button" href="#networking">Explore tools <span>↓</span></Link>
              <Link className="secondary-button" href="/tools/json-formatter">Try JSON formatter</Link>
            </div>
            <div className="hero-trust"><span>◉ No sign-up</span><span>◉ Browser-first</span><span>◉ Zero clutter</span></div>
          </div>

          <HeroTerminal />
        </section>

        <QuickAccess />

        <IPLensPromo />

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
          return (
            <section className="category-section" id={category} key={category}>
              <header className="category-header">
                <div><span className="category-number">0{index + 1}</span><h2>{meta.title}</h2></div>
                <p>{meta.description}</p>
              </header>
              <div className="tools-grid">{getToolsByCategory(category).map((tool) => <ToolCard tool={tool} key={tool.slug} />)}</div>
            </section>
          );
        })}

        <section className="launch-strip">
          <div><span className="live-dot" /><strong>Built for the open web</strong></div>
          <p>Small tools. Clear results. No accounts, dashboards, or mystery.</p>
          <Link href="/tools/uuid-generator">Generate a UUID <span>→</span></Link>
        </section>
      </main>
    </SiteChrome>
  );
}
