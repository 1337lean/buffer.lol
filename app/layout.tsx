import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://buffer.lol"),
  title: {
    default: "buffer.lol | Networking & developer tools",
    template: "%s | buffer.lol"
  },
  description:
    "Fast, simple browser-based tools for network diagnostics, web checks, and developer utilities.",
  openGraph: {
    title: "buffer.lol",
    description:
      "Fast, simple browser-based networking and developer tools.",
    type: "website",
    url: "https://buffer.lol/"
  },
  twitter: {
    card: "summary",
    title: "buffer.lol",
    description:
      "Fast, simple browser-based networking and developer tools."
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
    <html lang="en">
      <body>
        {children}
        <Script src="/bufferdash.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
