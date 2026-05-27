import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://buffer.lol"),
  title: {
    default: "buffer.lol | Video buffering, latency, and CDN diagnostics",
    template: "%s | buffer.lol"
  },
  description:
    "buffer.lol helps media teams test stream buffering, video latency, and CDN edge health from one modern diagnostics workspace.",
  openGraph: {
    title: "buffer.lol",
    description:
      "A modern diagnostics workspace for stream buffering, video latency, and CDN health.",
    type: "website",
    url: "https://buffer.lol/",
    images: [
      {
        url: "/assets/media-dashboard.png",
        width: 1586,
        height: 992,
        alt: "Dark-mode buffer.lol dashboard preview showing media diagnostics panels."
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "buffer.lol",
    description:
      "A modern diagnostics workspace for stream buffering, video latency, and CDN health.",
    images: ["/assets/media-dashboard.png"]
  },
  icons: {
    icon: "/assets/favicon.svg"
  }
};

export const viewport: Viewport = {
  themeColor: "#050609"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
