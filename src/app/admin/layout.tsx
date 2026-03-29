import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Admin · ${SITE_NAME}`,
  description: "Moderation, featured listings, and user management.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-zinc-100">{children}</div>;
}
