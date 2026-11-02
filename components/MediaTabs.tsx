/** Header shared by /feed/ and /gallery/: back link, title, and a switch between the two views. */
export function MediaTabs({ active }: { active: "feed" | "gallery" }) {
  return (
    <>
      <p>
        <a href="/">← Back to Home</a>
      </p>
      <h2 id={active}>{active === "feed" ? "Feed" : "Gallery"}</h2>
      <nav className="page-nav page-nav--tabs" aria-label="Feed views">
        <div className="page-nav__links">
          <a href="/feed/" className="nav-link" aria-current={active === "feed" ? "page" : undefined}>
            All posts
          </a>
          <span aria-hidden="true">|</span>
          <a href="/gallery/" className="nav-link" aria-current={active === "gallery" ? "page" : undefined}>
            Photos &amp; videos
          </a>
          <span aria-hidden="true">|</span>
          <a href="/blog/" className="nav-link">
            Blog
          </a>
        </div>
      </nav>
    </>
  );
}

export function Pager({ base, page, hasMore }: { base: string; page: number; hasMore: boolean }) {
  if (page <= 1 && !hasMore) return null;
  return (
    <nav className="pager" aria-label="Pages">
      {page > 1 ? <a href={page === 2 ? base : `${base}?page=${page - 1}`}>← Newer</a> : <span />}
      {hasMore ? <a href={`${base}?page=${page + 1}`}>Older →</a> : <span />}
    </nav>
  );
}
