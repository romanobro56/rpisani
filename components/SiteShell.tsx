import { SiteHeader } from "./SiteHeader";

/** The theme's two-column page: fixed header on the left, content <section> on the right. */
export function SiteShell({ linkHome = true, children }: { linkHome?: boolean; children: React.ReactNode }) {
  return (
    <div className="wrapper">
      <SiteHeader linkHome={linkHome} />
      <section>
        {children}
        <br />
      </section>
      <footer></footer>
    </div>
  );
}
