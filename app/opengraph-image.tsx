import { ImageResponse } from "next/og";

export const alt = "buffer.lol network and developer tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", color: "#f5f5f5", background: "#0c0c0d" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 600 }}>
        buffer<span style={{ color: "#8f8f98", fontWeight: 400 }}>.lol</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900, fontSize: 76, lineHeight: 1.1, letterSpacing: "-3px", fontWeight: 600 }}>
          <span>Network tools.</span>
          <span style={{ color: "#8f8f98" }}>Developer tools.</span>
        </div>
        <div style={{ display: "flex", marginTop: 28, color: "#8f8f98", fontSize: 26 }}>
          Clear results in seconds. No sign-up.
        </div>
      </div>
    </div>,
    size
  );
}
