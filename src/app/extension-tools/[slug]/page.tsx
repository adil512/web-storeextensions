import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolWidgets } from "@/components/tools/tool-widgets";
import { SITE_NAME } from "@/lib/brand";
import { canonicalUrl } from "@/lib/site-url";
import { getAllToolSlugs, getToolBySlug } from "@/lib/tools-registry";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllToolSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: "Tool" };
  return {
    title: `${tool.title} · Extension tools · ${SITE_NAME}`,
    description: tool.description,
    alternates: { canonical: await canonicalUrl(`/extension-tools/${slug}`) },
  };
}

export default async function ExtensionToolDetailPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  return (
    <div className="bg-zinc-50">
      <div className="border-b border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/90">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
          <nav className="text-sm text-zinc-500">
            <Link href="/extension-tools" className="font-medium text-orange-600 hover:text-orange-700">
              Extension tools
            </Link>
            <span className="mx-2 text-zinc-300">/</span>
            <span className="text-zinc-700">{tool.title}</span>
          </nav>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">{tool.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">{tool.description}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <ToolWidgets slug={slug} />
      </div>
    </div>
  );
}
