import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/auth";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: `Admin | ${site.title}`, robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  if (await isAdmin()) redirect("/admin/");
  const { next } = await searchParams;
  return (
    <div className="admin-login">
      <a href="/" className="image avatar">
        <img src={site.avatar} alt="" />
      </a>
      <h1>Admin</h1>
      <LoginForm next={next ?? "/admin/"} />
    </div>
  );
}
