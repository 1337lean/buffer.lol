import type { MetadataRoute } from "next";
import { tools } from "../data/tools";
import { siteUrl } from "../lib/seo";

const staticRoutes = [
  { path: "", updatedAt: "2026-07-19" },
  { path: "/privacy", updatedAt: "2026-07-19" },
  { path: "/terms", updatedAt: "2026-06-22" },
  { path: "/ip-lens", updatedAt: "2026-07-19" },
  { path: "/ip-lens/privacy", updatedAt: "2026-07-19" },
  { path: "/ip-lens/terms", updatedAt: "2026-07-19" },
  { path: "/ip-lens/support", updatedAt: "2026-07-19" }
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route.path}`,
      lastModified: route.updatedAt
    })),
    ...tools.map((tool) => ({
      url: `${siteUrl}/tools/${tool.slug}`,
      lastModified: tool.seo.updatedAt
    }))
  ];
}
