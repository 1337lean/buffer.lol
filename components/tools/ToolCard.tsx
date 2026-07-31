import Link from "next/link";
import type { Tool } from "@/data/tools";

const runtimeLabels: Record<Tool["runtime"], string> = {
  local: "Local",
  browser: "Browser",
  server: "Server",
  worker: "Worker"
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
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
    </Link>
  );
}
