import type { Metadata } from "next";
import "./globals.css";

import { Analytics } from "@vercel/analytics/react";

import SchemaMarkup from "./components/SchemaMarkup";

export const metadata: Metadata = {
  title: "Roman Pisani – Software Engineer",
  description: "I'm a versatile software engineer building meaningful projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="keywords" content="Roman Pisani, Software Engineer, Web Developer, Mobile Developer, Mobile Engineer, Engineer, Full Stack, JavaScript, TypeScript" />
        <meta property="og:title" content="Roman Pisani – Software Engineer" />
        <meta property="og:description" content="I'm a versatile software engineer building meaningful projects." />
        <meta property="og:url" content="https://www.rpisani.dev" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Roman Pisani – Software Engineer" />
        <meta name="twitter:description" content="I'm a versatile software engineer building meaningful projects." />
        <SchemaMarkup />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
