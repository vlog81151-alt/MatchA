import type { Metadata, Viewport } from "next";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MatchA - Real connections, royal energy",
    template: "%s | MatchA"
  },
  description:
    "MatchA is a luxury Jaipur-inspired dating platform for safer matches, instant dates, concert buddies, and meaningful chemistry.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "MatchA",
    description: "A premium dating platform inspired by Jaipur heritage.",
    siteName: "MatchA",
    type: "website",
    url: "/"
  },
  twitter: {
    card: "summary_large_image",
    title: "MatchA",
    description: "Less cringe, more chemistry."
  }
};

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fff7ec",
  width: "device-width"
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
