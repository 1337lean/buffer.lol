import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/landing/SiteChrome";
import { ToolExperience } from "@/components/tools/ToolExperience";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { getTool, tools } from "@/data/tools";

type ToolPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const tool = getTool((await params).slug);
  if (!tool) return {};
  return { title: tool.name, description: tool.description };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();

  return (
    <SiteChrome navHomePrefix="/">
      <ToolLayout tool={tool}><ToolExperience tool={tool} /></ToolLayout>
    </SiteChrome>
  );
}
