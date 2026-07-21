import type { Metadata, Viewport } from "next";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MatchA Admin",
    template: "%s | MatchA Admin"
  },
  description: "Admin, moderation, analytics, and safety console for MatchA."
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#fff7ec",
  width: "device-width"
};

export default function AdminRootLayout({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
