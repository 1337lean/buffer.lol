import { ImageResponse } from "next/og";
import { getTool } from "@/data/tools";

export const alt = "buffer.lol browser tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ToolOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const tool = getTool((await params).slug);
  const title = tool?.seo.title ?? "Browser tool";
  const category = tool?.category ?? "utility";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", color: "#f5f5f5", background: "#0c0c0d" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30, fontWeight: 600 }}>
        <div style={{ display: "flex" }}>buffer<span style={{ color: "#8f8f98", fontWeight: 400 }}>.lol</span></div>
        <div style={{ display: "flex", padding: "8px 18px", border: "1px solid #333338", borderRadius: 999, color: "#8f8f98", fontSize: 20, fontWeight: 400 }}>{category}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", maxWidth: 960, fontSize: 72, lineHeight: 1.1, letterSpacing: "-3px", fontWeight: 600 }}>{title}</div>
        <div style={{ display: "flex", marginTop: 28, color: "#8f8f98", fontSize: 26 }}>Fast, focused, and free to use.</div>
      </div>
    </div>,
    size
  );
}
