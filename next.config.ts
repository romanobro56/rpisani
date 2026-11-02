import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
