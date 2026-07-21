import Link from "next/link";
import type { Tool } from "@/data/tools";

const runtimeLabels: Record<Tool["runtime"], string> = {
  local: "Runs locally",
  browser: "Browser check",
  server: "Server diagnostic",
  worker: "Worker diagnostic"
};

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link className="tool-card" href={`/tools/${tool.slug}`}>
      <div className="tool-card-topline">
        <span className="command-icon" aria-hidden="true">{tool.command}</span>
        <span className={`availability runtime-${tool.runtime}`}>
          {runtimeLabels[tool.runtime]}
        </span>
      </div>
      <div>
        <h3>{tool.name}</h3>
        <p>{tool.description}</p>
      </div>
      <span className="card-link">
        Open tool <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
