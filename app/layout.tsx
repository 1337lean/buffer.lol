import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://buffer.lol"),
  title: {
    default: "buffer.lol | Internet speed test",
    template: "%s | buffer.lol"
  },
  description:
    "buffer.lol is a browser-based internet speed test for checking download speed, upload speed, ping, and jitter.",
  openGraph: {
    title: "buffer.lol",
    description:
      "A browser-based internet speed test for download speed, upload speed, ping, and jitter.",
    type: "website",
    url: "https://buffer.lol/"
  },
  twitter: {
    card: "summary",
    title: "buffer.lol",
    description:
      "A browser-based internet speed test for download speed, upload speed, ping, and jitter."
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
