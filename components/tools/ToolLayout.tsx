import Link from "next/link";
import type { ReactNode } from "react";
import { categoryMeta, type Tool } from "@/data/tools";
import { getTool, getToolsByCategory } from "@/data/tools";
import { RelatedTools, ToolVisitTracker } from "./ToolDiscovery";

export function ToolLayout({ tool, children, target }: { tool: Tool; children: ReactNode; target?: string }) {
  const category = categoryMeta[tool.category];
  const related = (tool.relatedSlugs?.map(getTool).filter((item): item is Tool => Boolean(item))
    ?? getToolsByCategory(tool.category).filter((item) => item.slug !== tool.slug)).slice(0, 3);

  return (
    <main className="tool-page" id="main-content">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Tools</Link><span>/</span>
        <Link href={`/#${tool.category}`}>{category.title}</Link><span>/</span>
        <strong>{tool.name}</strong>
      </nav>

      <header className="tool-page-header">
        <div>
          <span className="section-kicker">{category.eyebrow}</span>
          <h1>{tool.name}</h1>
          <p>{tool.description}</p>
        </div>
        <div className="tool-command"><span>$</span> {tool.command}<i aria-hidden="true" /></div>
      </header>

      <ToolVisitTracker slug={tool.slug} />
      <div className="tool-workspace">{children}</div>
      <RelatedTools related={related} target={target} />
    </main>
  );
}
