// Site-wide settings, carried over from the old Jekyll _config.yml.
export const site = {
  title: "Roman Pisani",
  position: "Software Engineer & AI/ML Developer",
  affiliation: "University of Massachusetts Amherst",
  email: "romanp2929 (at) gmail.com",
  keywords:
    "Roman Pisani, Software Engineer, AI Engineer, Machine Learning, Full Stack Developer, React, Python, TypeScript, AWS, Computer Science UMass",
  description:
    "Roman Pisani is a Software Engineer and AI/ML Developer specializing in full-stack development, machine learning systems, and cloud infrastructure. Currently pursuing Computer Science at UMass Amherst with internship experience at Chewy and Intuit Credit Karma.",
  url: "https://rpisani.dev",
  cvLink: "/assets/files/Roman_Pisani_resume.pdf",
  githubLink: "https://github.com/romanobro56",
  linkedin: "https://www.linkedin.com/in/roman-pisani",
  avatar: "/assets/img/roman.webp",
  favicon: "/assets/img/favicon.png",
  faviconDark: "/assets/img/favicon-dark.png",
  /** Dates are shown in this zone so a post dated Oct 7 never renders as Oct 6. */
  timeZone: "America/New_York",
} as const;

export const MAX_VIDEO_SECONDS = 20 * 60;
export const MAX_AUDIO_SECONDS = 60 * 60;
