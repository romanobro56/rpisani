import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { InlineScript } from "@/components/InlineScript";
import { ThemeSync } from "@/components/ThemeSync";
import { site } from "@/lib/site";
import { themeScript } from "@/lib/theme-script";

// Same stylesheets, in the same order, as the Jekyll layouts.
import "@/styles/font_sans_serif.css";
import "@/styles/minimal-light.scss";
import "@/styles/projects.css";
// New pages (feed, gallery, comments) and the admin.
import "@/styles/site.scss";
import "@/styles/admin.scss";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" suppressHydrationWarning>
      <head>
        <link rel="icon" media="(prefers-color-scheme:dark)" href={site.faviconDark} type="image/png" />
        <link rel="icon" media="(prefers-color-scheme:light)" href={site.favicon} type="image/png" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/academicons/1.8.6/css/academicons.min.css"
          integrity="sha256-uFVgMKfistnJAfoCUQigIl+JfUaP47GrRKjf6CTPVmw="
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
          integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        <InlineScript html={themeScript} />
        {children}
        <ThemeSync />
        <Script src="/assets/js/favicon-switcher.js" strategy="afterInteractive" />
        <Script src="/assets/js/scale.fix.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
