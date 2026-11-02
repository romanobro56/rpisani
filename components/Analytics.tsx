"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackView } from "@/app/actions/track";

/** Records one page view per navigation. No cookies, so no consent banner is needed. */
export function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    // Only the first view carries the external referrer; later ones are internal navigations.
    const referrer = first.current ? document.referrer : "";
    first.current = false;
    trackView(pathname, referrer).catch(() => {});
  }, [pathname]);
  return null;
}
