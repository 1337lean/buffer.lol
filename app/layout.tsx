import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://buffer.lol"),
  title: {
    default: "Free Network & Developer Tools | buffer.lol",
    template: "%s | buffer.lol"
  },
  description:
    "Free browser-based tools for network diagnostics, web checks, IP addresses, and developer utilities.",
  openGraph: {
    title: "Free Network & Developer Tools | buffer.lol",
    description:
      "Fast browser-based networking, IP, web, and developer utilities with no sign-up.",
    type: "website",
    url: "https://buffer.lol/",
    siteName: "buffer.lol",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "buffer.lol network and developer tools" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Network & Developer Tools | buffer.lol",
    description:
      "Fast browser-based networking, IP, web, and developer utilities with no sign-up.",
    images: ["/opengraph-image"]
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "48x48" },
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      { url: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=2", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/apple-touch-icon.png?v=2"
  }
};

export const viewport: Viewport = {
  themeColor: "#08080d"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
      </body>
    </html>
  );
}
