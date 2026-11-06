import type { Metadata } from "next";
import { Fragment } from "react";
import { FeedPost } from "@/components/FeedPost";
import { SiteShell } from "@/components/SiteShell";
import { projects } from "@/data/projects";
import { formatLongDate } from "@/lib/format";
import { getFeedPage, getPublishedBlogPosts } from "@/lib/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${site.title} | ${site.affiliation}`,
  description: site.description,
  keywords: site.keywords,
  alternates: { canonical: `${site.url}/` },
  openGraph: {
    type: "website",
    url: `${site.url}/`,
    title: `${site.title} - ${site.position}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.title} - ${site.position}`,
    description: site.description,
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Roman Pisani",
  jobTitle: "Software Engineer & AI/ML Developer",
  affiliation: { "@type": "EducationalOrganization", name: "University of Massachusetts Amherst" },
  alumniOf: "University of Massachusetts Amherst",
  url: "https://rpisani.dev",
  sameAs: ["https://github.com/romanobro56", "https://www.linkedin.com/in/roman-pisani"],
  knowsAbout: ["Machine Learning", "Full Stack Development", "Cloud Computing", "AI Engineering"],
};

const navLinks: [string, string][] = [
  ["#about-me", "About Me"],
  ["/blog/", "Blog"],
  ["/feed/", "Feed"],
  ["/gallery/", "Gallery"],
  ["#projects", "Projects"],
];

export default async function HomePage() {
  const [blog, feed] = await Promise.all([getPublishedBlogPosts(), getFeedPage(1)]);
  const recent = blog.slice(0, 2);
  const latestPosts = feed.posts.slice(0, 2);

  return (
    <SiteShell linkHome={false}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <nav className="page-nav" aria-label="Page sections">
        <div className="page-nav__links">
          {navLinks.map(([href, label], i) => (
            <Fragment key={href}>
              {i > 0 && <span aria-hidden="true">|</span>}
              <a href={href} className="nav-link">
                {label}
              </a>
            </Fragment>
          ))}
        </div>
      </nav>

      <h2 id="about-me">About Me</h2>

      <p>I’m a Software Engineer and gym bro. My superpower is thinking. I want to fix the internet and have fun.</p>

      <a
        href="https://chargescreentime.app/?utm_source=rpisani&utm_medium=referral&utm_campaign=homepage"
        className="charge-cta"
        target="_blank"
        rel="noopener"
      >
        <img
          src="/assets/img/download-charge-screen-time.webp"
          alt="Download Charge Screen Time"
          width={3706}
          height={1040}
        />
      </a>

      <h2 id="blog">Recent Blog Posts</h2>

      <div className="blog-posts">
        <div className="bibliography">
          {recent.map((post) => (
            <Fragment key={post.slug}>
              <div className="pub-row">
                <div className="col-sm-9">
                  <div className="title">
                    <a href={`/posts/${post.slug}/`}>{post.title}</a>
                  </div>
                  <div className="author">
                    {formatLongDate(post.publishedAt)} • {post.readTime}
                  </div>
                  <div className="periodical">{post.excerpt}</div>
                  <div className="links">
                    <a href={`/posts/${post.slug}/`} className="btn btn-sm z-depth-0" role="button" style={{ fontSize: 12 }}>
                      Read More
                    </a>
                  </div>
                </div>
              </div>
              <br />
            </Fragment>
          ))}

          <div className="blog-posts__all">
            <a href="/blog/" className="btn btn-sm z-depth-0" role="button" style={{ fontSize: 12 }}>
              View All Posts
            </a>
          </div>
        </div>
      </div>

      {latestPosts.length > 0 && (
        <>
          <h2 id="feed">From the Feed</h2>

          <div className="feed feed-preview">
            {latestPosts.map((p) => (
              <FeedPost key={p.id} post={p} />
            ))}
            <div className="feed-preview__all">
              <a href="/feed/" className="btn btn-sm z-depth-0" role="button" style={{ fontSize: 12 }}>
                View Feed
              </a>
            </div>
          </div>
        </>
      )}

      <h2 id="projects">Projects</h2>

      <div className="projects">
        <div className="bibliography">
          {projects.map((p) => (
            <div className={p.link ? "pub-row pub-row--linked" : "pub-row"} key={p.title}>
              <div className="col-sm-3 abbr">
                {p.image && <img src={p.image} alt={p.imageAlt} className="teaser" data-fit={p.fit} />}
              </div>
              <div className="col-sm-9">
                <div className="title">{p.link ? <a href={p.link}>{p.title}</a> : p.title}</div>
                {p.date && <div className="date">{p.date}</div>}
                <div className="periodical" dangerouslySetInnerHTML={{ __html: p.subtitle }} />
                <div className="links">
                  {p.code && (
                    <a href={p.code} className="btn btn-sm z-depth-0" role="button" target="_blank" style={{ fontSize: 12 }}>
                      GitHub
                    </a>
                  )}
                  {p.notes && <span className="metric">{p.notes}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
