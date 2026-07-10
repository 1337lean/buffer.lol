import type { MetadataRoute } from "next";
import { tools } from "@/data/tools";

const baseUrl = "https://buffer.lol";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const staticRoutes = ["", "/privacy", "/terms"];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified,
      changeFrequency: route ? "yearly" as const : "weekly" as const,
      priority: route ? 0.3 : 1
    })),
    ...tools.map((tool) => ({
      url: `${baseUrl}/tools/${tool.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
