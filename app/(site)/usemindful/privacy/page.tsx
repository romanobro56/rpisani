import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import parse from "html-react-parser";
import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { renderMarkdown } from "@/lib/markdown";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: `UseMindful Privacy Policy | ${site.title}`, description: "UseMindful Privacy Policy" };

export default async function UseMindfulPrivacyPage() {
  const source = await readFile(path.join(process.cwd(), "content/pages/usemindful-privacy.md"), "utf8");
  return <SiteShell>{parse(renderMarkdown(matter(source).content))}</SiteShell>;
}
