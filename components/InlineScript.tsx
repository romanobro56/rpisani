// Runs synchronously during HTML parsing on full page loads. On the client the
// type flips to text/plain so React never re-executes or warns about it.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
