import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/landing/SiteChrome";
import { ToolExperience } from "@/components/tools/ToolExperience";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { TargetAwareToolExperience } from "@/components/tools/TargetAwareTools";
import { getTool, tools } from "@/data/tools";
import { buildToolMetadata, toolStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

type ToolPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const tool = getTool((await params).slug);
  if (!tool) return {};
  return buildToolMetadata(tool);
}

export default async function ToolPage({ params }: ToolPageProps) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();

  return (
    <>
      <StructuredData data={toolStructuredData(tool)} />
      <SiteChrome navHomePrefix="/">
        <ToolLayout tool={tool}>
          <Suspense fallback={<ToolExperience tool={tool} />}>
            <TargetAwareToolExperience tool={tool} />
          </Suspense>
        </ToolLayout>
      </SiteChrome>
    </>
  );
}
