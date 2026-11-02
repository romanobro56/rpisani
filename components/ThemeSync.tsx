"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    __siteTheme?: { apply: () => void };
  }
}

/** Re-applies the saved theme after client-side navigations. */
export function ThemeSync() {
  const pathname = usePathname();
  useEffect(() => {
    window.__siteTheme?.apply();
  }, [pathname]);
  return null;
}
