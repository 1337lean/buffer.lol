import { toolSeoContent } from "./tool-seo";
import { toolCatalog, type Tool, type ToolCategory } from "./tool-catalog";

export { categoryMeta } from "./tool-catalog";
export type { Tool, ToolCategory, ToolSeo, ToolSeoSection, ToolSeoFaq } from "./tool-catalog";

// Keep long-form help content on the server; browser search uses tool-catalog.
export const tools: Tool[] = toolCatalog.map((tool) => ({
  ...tool,
  seo: toolSeoContent[tool.slug]
}));

export function getToolsByCategory(category: ToolCategory) {
  return tools.filter((tool) => tool.category === category);
}

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}
