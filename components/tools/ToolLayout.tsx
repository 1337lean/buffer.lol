import Link from "next/link";
import type { ReactNode } from "react";
import { categoryMeta, type Tool } from "@/data/tools";

export function ToolLayout({ tool, children }: { tool: Tool; children: ReactNode }) {
  const category = categoryMeta[tool.category];

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

      <div className="tool-workspace">{children}</div>
    </main>
  );
}
