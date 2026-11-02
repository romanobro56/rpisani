import type { Metadata } from "next";
import { logout } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { site } from "@/lib/site";
import { storageMode } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: `Admin | ${site.title}`, template: `%s | Admin` },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const localStorageMode = storageMode() === "local";
  return (
    <div className="admin">
      <aside className="admin-side">
        <a href="/" className="image avatar" title="View site">
          <img src={site.avatar} alt="" />
        </a>
        <div className="admin-side__title">Admin</div>
        <AdminNav />
        <div className="admin-side__foot">
          <a href="/" target="_blank" rel="noopener">
            View site <i className="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
          </a>
          <form action={logout}>
            <button type="submit" className="admin-link-button">
              Log out
            </button>
          </form>
          <button className="theme-toggle" type="button" role="switch" aria-checked="false" aria-label="Dark mode" suppressHydrationWarning>
            <i className="fas fa-sun" aria-hidden="true"></i>
            <i className="fas fa-moon" aria-hidden="true"></i>
            <span className="theme-toggle-knob"></span>
          </button>
        </div>
      </aside>
      <main className="admin-main">
        {localStorageMode && (
          <p className="admin-notice">
            Media is being saved to <code>.data/uploads</code> on this computer. Set the R2 variables in{" "}
            <code>.env.local</code> to store it in Cloudflare R2.
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
