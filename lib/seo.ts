import type { Metadata } from "next";
import type { Tool } from "../data/tools";

export const siteUrl = "https://buffer.lol";

const categoryNames: Record<Tool["category"], string> = {
  networking: "NetworkApplication",
  ip: "UtilitiesApplication",
  developer: "DeveloperApplication"
};

export function buildToolMetadata(tool: Tool): Metadata {
  const path = `/tools/${tool.slug}`;
  const image = `${path}/opengraph-image`;

  return {
    title: tool.seo.title,
    description: tool.seo.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      title: `${tool.seo.title} | buffer.lol`,
      description: tool.seo.metaDescription,
      url: path,
      type: "website",
      siteName: "buffer.lol",
      images: [{ url: image, width: 1200, height: 630, alt: `${tool.seo.title} — buffer.lol` }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.seo.title} | buffer.lol`,
      description: tool.seo.metaDescription,
      images: [image]
    }
  };
}

export function homeStructuredData(tools: Tool[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "buffer.lol",
        description: "Free browser-based networking and developer tools."
      },
      {
        "@type": "ItemList",
        name: "Networking and developer tools",
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.name,
          url: `${siteUrl}/tools/${tool.slug}`
        }))
      }
    ]
  };
}

export function toolStructuredData(tool: Tool) {
  const url = `${siteUrl}/tools/${tool.slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${url}/#application`,
        name: tool.seo.title,
        url,
        description: tool.seo.metaDescription,
        applicationCategory: categoryNames[tool.category],
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript and a modern web browser.",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Tools", item: siteUrl },
          { "@type": "ListItem", position: 2, name: tool.name, item: url }
        ]
      },
      {
        "@type": "FAQPage",
        mainEntity: tool.seo.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer }
        }))
      }
    ]
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
