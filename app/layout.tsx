import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "./fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900"
});

const ibmPlexMono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexMono-Medium.woff2", weight: "500", style: "normal" }
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://buffer.lol"),
  title: {
    default: "Free Network & Developer Tools | buffer.lol",
    template: "%s | buffer.lol"
  },
  description:
    "Free tools for network diagnostics, web checks, IP addresses, and private browser-side developer utilities.",
  openGraph: {
    title: "Free Network & Developer Tools | buffer.lol",
    description:
      "Free networking, IP, web, and developer utilities with clear local and server data paths.",
    type: "website",
    url: "https://buffer.lol/",
    siteName: "buffer.lol",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "buffer.lol network diagnostics and developer tools" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Network & Developer Tools | buffer.lol",
    description:
      "Free networking, IP, web, and developer utilities with clear local and server data paths.",
    images: ["/opengraph-image"]
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "48x48" },
      { url: "/favicon.svg?v=3", type: "image/svg+xml" },
      { url: "/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=3", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/favicon.ico?v=3",
    apple: "/apple-touch-icon.png?v=3"
  }
};

export const viewport: Viewport = {
  themeColor: "#0c0c0d",
  colorScheme: "dark"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
