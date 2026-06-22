import type { Metadata, Viewport } from "next";
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
    icon: "/assets/favicon.svg"
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
      </body>
    </html>
  );
}
