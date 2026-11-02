"use client";

import { useState } from "react";

const POSTS_PER_PAGE = 5;

type Item = { slug: string; title: string; excerpt: string; readTime: string; date: string };

export function BlogList({ posts }: { posts: Item[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const visible = posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  return (
    <div className="blog-page">
      <div className="bibliography">
        {visible.map((post) => (
          <div className="pub-row blog-item" key={post.slug}>
            <div className="col-sm-9" style={{ position: "relative", paddingRight: 15, paddingLeft: 20 }}>
              <div className="title" style={{ marginTop: 30 }}>
                <a href={`/posts/${post.slug}/`}>{post.title}</a>
              </div>
              <div className="author">
                {post.date} &bull; {post.readTime}
              </div>
              <div className="periodical" style={{ marginTop: 8 }}>
                {post.excerpt}
              </div>
              <div className="links" style={{ marginTop: 8 }}>
                <a href={`/posts/${post.slug}/`} className="btn btn-sm z-depth-0" role="button" style={{ fontSize: 12 }}>
                  Read More
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination" id="pagination">
        {totalPages > 1 &&
          Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} className={n === page ? "active" : undefined} onClick={() => setPage(n)}>
              {n}
            </button>
          ))}
      </div>
    </div>
  );
}
