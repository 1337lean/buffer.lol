"use client";

import { useSearchParams } from "next/navigation";
import type { Tool } from "@/data/tools";
import { safeTargetPrefill } from "@/lib/tool-discovery";
import { RelatedTools } from "./ToolDiscovery";
import { ToolExperience } from "./ToolExperience";

export function TargetAwareToolExperience({ tool }: { tool: Tool }) {
  const searchParams = useSearchParams();
  const target = tool.supportsTargetPrefill ? safeTargetPrefill(searchParams.get("target") ?? undefined) : "";
  return <ToolExperience tool={tool} initialTarget={target} />;
}

export function TargetAwareRelatedTools({ related, allowTarget }: { related: Tool[]; allowTarget: boolean }) {
  const searchParams = useSearchParams();
  const target = allowTarget ? safeTargetPrefill(searchParams.get("target") ?? undefined) : "";
  return <RelatedTools related={related} target={target} />;
}
