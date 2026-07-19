import { ImageResponse } from "next/og";

export const alt = "buffer.lol network and developer tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", color: "#f5f3ff", background: "radial-gradient(circle at 80% 20%, #3f2a79 0, #08080d 42%)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 700 }}>
        <span style={{ display: "flex", padding: "10px 14px", marginRight: 18, border: "2px solid #9b87f5", borderRadius: 12, color: "#b9a9ff" }}>&gt;_</span>
        buffer<span style={{ color: "#b9a9ff" }}>.lol</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", maxWidth: 950, fontSize: 74, lineHeight: 1.05, letterSpacing: "-4px", fontWeight: 700 }}>Free network &amp; developer tools.</div>
        <div style={{ display: "flex", marginTop: 26, color: "#aaa5b6", fontSize: 28 }}>Fast diagnostics and utilities. No sign-up.</div>
      </div>
    </div>,
    size
  );
}
