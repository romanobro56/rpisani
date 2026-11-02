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
    title: "Drip Screen Time: Screen Time That Replenishes",
    date: "Jul 2026 – Present",
    subtitle: "Balance-Based App Blocking Built on Apple's Family Controls &amp; Managed Settings",
    link: "https://dripscreentime.app",
    image: "./assets/img/drip_screen_time.webp",
    imageAlt: "Drip Screen Time app icon, a blue water drop",
    notes: "Live on the App Store",
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
