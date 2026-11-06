export type Project = {
  title: string;
  date?: string;
  /** May contain inline HTML such as <strong>. */
  subtitle: string;
  link?: string;
  code?: string;
  image?: string;
  imageAlt?: string;
  fit?: "contain";
  notes?: string;
};

export const projects: Project[] = [
  {
    title: "Charge Screen Time",
    date: "Dec 2025 – Present",
    subtitle: "Balance-based app blocking built on Apple's Family Controls &amp; Managed Settings",
    link: "https://chargescreentime.app/?utm_source=rpisani&utm_medium=referral&utm_campaign=projects",
    image: "./assets/img/charge_screen_time.webp",
    imageAlt: "Charge Screen Time logo, a green charging ring around a lightning bolt",
    fit: "contain",
    notes: "Live on the App Store",
  },
  {
    title: "BulletApply",
    date: "Oct 2025 – Present",
    subtitle: "Chrome extension that ranks your resume bullets against each job posting and packs the best onto one full page",
    link: "https://bulletapply.com/?utm_source=rpisani&utm_medium=referral&utm_campaign=projects",
    image: "./assets/img/bullet_apply.webp",
    imageAlt: "BulletApply logo, blue resume lines with a bullet",
    fit: "contain",
    notes: "Live at https://bulletapply.com",
  },
  {
    title: "UseMindful",
    date: "Jan 2026 – Present",
    subtitle: "Chrome extension for blocking distracting sites, timed focus sessions &amp; intentional breaks",
    link: "https://chromewebstore.google.com/detail/usemindful/gefcckoeedcajhphekhcochmogbdoain",
    code: "https://github.com/romanobro56/Simple-Blocker",
    image: "./assets/img/usemindful.webp",
    imageAlt: "UseMindful icon, a white X on blue",
    fit: "contain",
    notes: "Live on the Chrome Web Store",
  },
];
