import type { MetadataRoute } from "next";
import { tools } from "@/data/tools";

const baseUrl = "https://buffer.lol";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const staticRoutes = ["", "/privacy", "/terms", "/ip-lens", "/ip-lens/privacy", "/ip-lens/terms", "/ip-lens/support"];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified,
      changeFrequency: route === "/ip-lens" ? "monthly" as const : route ? "yearly" as const : "weekly" as const,
      priority: route === "/ip-lens" ? 0.8 : route ? 0.3 : 1
    })),
    ...tools.map((tool) => ({
      url: `${baseUrl}/tools/${tool.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
