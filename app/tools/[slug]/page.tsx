import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/landing/SiteChrome";
import { ToolExperience } from "@/components/tools/ToolExperience";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { getTool, tools } from "@/data/tools";
import { safeTargetPrefill } from "@/lib/tool-discovery";

type ToolPageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ target?: string | string[] }> };

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const tool = getTool((await params).slug);
  if (!tool) return {};
  return {
    title: tool.name,
    description: tool.description,
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: {
      title: `${tool.name} | buffer.lol`,
      description: tool.description,
      url: `/tools/${tool.slug}`,
      type: "website"
    }
  };
}

export default async function ToolPage({ params, searchParams }: ToolPageProps) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();
  const target = tool.supportsTargetPrefill ? safeTargetPrefill((await searchParams).target) : "";

  return (
    <SiteChrome navHomePrefix="/">
      <ToolLayout tool={tool} target={target}><ToolExperience tool={tool} initialTarget={target} /></ToolLayout>
    </SiteChrome>
  );
}
