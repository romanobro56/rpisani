// Projects are shown grouped by `group`, in the order each group first appears.
export type Project = {
  group: string;
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
    group: "Personal",
    title: "Charge Screen Time: Screen Time That Recharges",
    date: "Jul 2026 – Present",
    subtitle: "Balance-Based App Blocking Built on Apple's Family Controls &amp; Managed Settings",
    link: "https://chargescreentime.app/?utm_source=rpisani&utm_medium=referral&utm_campaign=projects",
    image: "./assets/img/charge_screen_time.webp",
    imageAlt: "Charge Screen Time logo, a green charging ring around a lightning bolt",
    fit: "contain",
    notes: "Live on the App Store",
  },
  {
    group: "Personal",
    title: "BulletApply: A Tailored One-Page Resume for Every Job",
    subtitle: "Chrome Extension That Ranks Your Resume Bullets Against Each Job Posting and Packs the Best Onto One Full Page",
    link: "https://bulletapply.com/?utm_source=rpisani&utm_medium=referral&utm_campaign=projects",
    image: "./assets/img/bullet_apply.webp",
    imageAlt: "BulletApply logo, blue resume lines with a bullet",
    fit: "contain",
    notes: "Live at https://bulletapply.com",
  },
  {
    group: "Personal",
    title: "UseMindful: Intentional Website Blocking",
    date: "Jan 2026 – Present",
    subtitle: "Chrome Extension for Blocking Distracting Sites, Timed Focus Sessions &amp; Intentional Breaks",
    link: "https://chromewebstore.google.com/detail/usemindful/gefcckoeedcajhphekhcochmogbdoain",
    code: "https://github.com/romanobro56/Simple-Blocker",
    image: "./assets/img/usemindful.webp",
    imageAlt: "UseMindful icon, a white X on blue",
    fit: "contain",
    notes: "Live on the Chrome Web Store",
  },
];

export function groupProjects(list: Project[] = projects): { name: string; items: Project[] }[] {
  const groups: { name: string; items: Project[] }[] = [];
  for (const p of list) {
    const g = groups.find((x) => x.name === p.group);
    if (g) g.items.push(p);
    else groups.push({ name: p.group, items: [p] });
  }
  return groups;
}
