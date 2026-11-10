import type { NextConfig } from "next";

// Sent with every page. The policy is limited to rules the site already follows: no other site may
// frame these pages (clickjacking), no <base> or plugin injection, and forms only post back here.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Jekyll served every page with a trailing slash (/blog/, /posts/<slug>/); keep those URLs stable.
  trailingSlash: true,
  serverExternalPackages: ["@electric-sql/pglite"],
  async redirects() {
    return [
      { source: "/resume", destination: "/assets/files/Roman_Pisani_resume.pdf", permanent: false },
      { source: "/blog/index.html", destination: "/blog/", permanent: true },
    ];
  },
};

export default nextConfig;
