"use client";

import { useState } from "react";

/** Copies a post's full URL to the clipboard. */
export function ShareButton({ path, className }: { path: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = new URL(path, location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers and non-secure contexts: copy through a hidden field.
      const field = document.createElement("textarea");
      field.value = url;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button type="button" className={`link-copy${className ? ` ${className}` : ""}`} onClick={copy}>
      <i className={`fas ${copied ? "fa-check" : "fa-link"}`} aria-hidden="true"></i>{" "}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
