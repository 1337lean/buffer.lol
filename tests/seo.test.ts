import { describe, expect, it } from "vitest";
import sitemap from "../app/sitemap";
import { tools } from "../data/tools";
import { buildToolMetadata, homeStructuredData, serializeJsonLd, siteUrl, toolStructuredData } from "../lib/seo";

function visibleSeoWords(tool: (typeof tools)[number]) {
  const copy = [
    tool.seo.intro,
    ...tool.seo.sections.flatMap((section) => [...section.paragraphs, ...(section.bullets ?? [])]),
    ...tool.seo.faq.flatMap((item) => [item.question, item.answer])
  ].join(" ");
  return copy.trim().split(/\s+/).length;
}

describe("tool SEO content", () => {
  it("has complete, unique search metadata and substantive visible guidance", () => {
    expect(tools).toHaveLength(27);
    expect(new Set(tools.map((tool) => tool.seo.title)).size).toBe(tools.length);
    expect(new Set(tools.map((tool) => tool.seo.metaDescription)).size).toBe(tools.length);

    for (const tool of tools) {
      expect(tool.seo.title.length, `${tool.slug} title`).toBeGreaterThanOrEqual(15);
      expect(tool.seo.title.length, `${tool.slug} title`).toBeLessThanOrEqual(60);
      expect(tool.seo.metaDescription.length, `${tool.slug} description`).toBeGreaterThanOrEqual(100);
      expect(tool.seo.metaDescription.length, `${tool.slug} description`).toBeLessThanOrEqual(180);
      expect(tool.seo.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(tool.seo.sections).toHaveLength(3);
      expect(tool.seo.faq.length).toBeGreaterThanOrEqual(2);
      expect(visibleSeoWords(tool), `${tool.slug} visible SEO words`).toBeGreaterThanOrEqual(250);
    }
  });

  it("builds canonical and social metadata without target query parameters", () => {
    const tool = tools.find((item) => item.slug === "dns-lookup")!;
    const metadata = buildToolMetadata(tool);
    expect(metadata.alternates).toEqual({ canonical: "/tools/dns-lookup" });
    expect(metadata.openGraph).toMatchObject({ url: "/tools/dns-lookup", siteName: "buffer.lol" });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(JSON.stringify(metadata)).not.toContain("target=");
  });
});

describe("structured data", () => {
  it("lists every tool on the homepage", () => {
    const data = homeStructuredData(tools);
    const itemList = data["@graph"][1];
    expect(itemList.numberOfItems).toBe(27);
    expect(itemList.itemListElement).toHaveLength(27);
  });

  it("describes a free web application, breadcrumbs, and visible FAQs", () => {
    const tool = tools[0];
    const data = toolStructuredData(tool);
    expect(data["@graph"].map((item) => item["@type"])).toEqual(["WebApplication", "BreadcrumbList", "FAQPage"]);
    expect(data["@graph"][0]).toMatchObject({ url: `${siteUrl}/tools/${tool.slug}`, isAccessibleForFree: true });
    expect(data["@graph"][2].mainEntity).toHaveLength(tool.seo.faq.length);
  });

  it("escapes opening tags before JSON-LD is embedded in HTML", () => {
    expect(serializeJsonLd({ value: "</script><script>" })).toContain("\\u003c/script>");
    expect(serializeJsonLd({ value: "</script><script>" })).not.toContain("</script>");
  });
});

describe("sitemap", () => {
  it("contains one canonical URL per indexable page with stable date strings", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(34);
    expect(new Set(entries.map((entry) => entry.url)).size).toBe(entries.length);
    expect(entries.filter((entry) => entry.url.startsWith(`${siteUrl}/tools/`))).toHaveLength(27);
    for (const entry of entries) {
      expect(entry.url).not.toContain("www.");
      expect(entry.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry).not.toHaveProperty("priority");
      expect(entry).not.toHaveProperty("changeFrequency");
    }
  });
});
