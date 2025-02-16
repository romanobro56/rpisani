import type { Metadata } from "next";
import "./globals.css";

import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: "Roman Pisani",
  description: "Roman Pisani's Site",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
