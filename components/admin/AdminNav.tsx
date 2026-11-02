"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links: [string, string, string][] = [
  ["/admin/", "Dashboard", "fa-chart-simple"],
  ["/admin/posts/", "Posts", "fa-images"],
  ["/admin/blog/", "Blog", "fa-pen-nib"],
  ["/admin/media/", "Media", "fa-photo-film"],
  ["/admin/comments/", "Comments", "fa-comments"],
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="Admin">
      {links.map(([href, label, icon]) => {
        const active = href === "/admin/" ? pathname === "/admin/" || pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>
            <i className={`fas ${icon}`} aria-hidden="true"></i> {label}
          </Link>
        );
      })}
    </nav>
  );
}
