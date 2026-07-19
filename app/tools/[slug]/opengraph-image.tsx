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
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", color: "#f5f3ff", background: "radial-gradient(circle at 80% 20%, #3f2a79 0, #08080d 42%)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30, fontWeight: 700 }}>
        <div style={{ display: "flex", alignItems: "center" }}><span style={{ color: "#b9a9ff" }}>&gt;_&nbsp;</span>buffer<span style={{ color: "#b9a9ff" }}>.lol</span></div>
        <div style={{ display: "flex", padding: "10px 16px", border: "1px solid #514866", borderRadius: 9, color: "#aaa5b6", fontSize: 20, textTransform: "uppercase" }}>{category}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", maxWidth: 980, fontSize: 76, lineHeight: 1.04, letterSpacing: "-4px", fontWeight: 700 }}>{title}</div>
        <div style={{ display: "flex", marginTop: 26, color: "#aaa5b6", fontSize: 27 }}>Fast, focused, and free to use.</div>
      </div>
    </div>,
    size
  );
}
