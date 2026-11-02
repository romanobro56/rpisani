import { SiteShell } from "@/components/SiteShell";

export default function NotFound() {
  return (
    <SiteShell>
      <p>
        <a href="/">← Back to Home</a>
      </p>
      <h2>Page not found</h2>
      <p>That page doesn’t exist, or it has moved.</p>
    </SiteShell>
  );
}
