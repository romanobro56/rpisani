import { site } from "@/lib/site";

/**
 * The left column from the Jekyll layouts, kept as the same markup so the theme CSS applies unchanged.
 * It is written as an HTML string because it uses the theme's custom <email> tag,
 * which React would warn about. The theme toggle is wired up by the inline theme script.
 */
export function SiteHeader({ linkHome = false }: { linkHome?: boolean }) {
  const avatar = linkHome
    ? `<a href="/" class="image avatar"><img src="${site.avatar}" alt="Roman Pisani profile picture" /></a>`
    : `<a class="image avatar"><img src="${site.avatar}" alt="Roman Pisani profile picture" /></a>`;
  const title = linkHome ? `<h1><a href="/">${site.title}</a></h1>` : `<h1>${site.title}</h1>`;

  const html = `
        ${avatar}
        ${title}
        <email>${site.email}</email>
        <br>
        <br>
        <div class="social-icons">
        <a style="margin: 0 5px 0 0" href="${site.cvLink}" aria-label="Download Resume">
          <i class="ai ai-cv" style="font-size:1.3rem;"></i>
        </a>
        <a style="margin: 0 5px 0 0" href="${site.githubLink}" aria-label="GitHub Profile">
          <i class="fab fa-github"></i>
        </a>
        <a style="margin: 0 5px 0 0" href="${site.linkedin}" aria-label="LinkedIn Profile">
          <i class="fab fa-linkedin"></i>
        </a>
        </div>
        <button class="theme-toggle" type="button" role="switch" aria-checked="false" aria-label="Dark mode">
          <i class="fas fa-sun" aria-hidden="true"></i>
          <i class="fas fa-moon" aria-hidden="true"></i>
          <span class="theme-toggle-knob"></span>
        </button>
        <br>`;

  return <header suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
