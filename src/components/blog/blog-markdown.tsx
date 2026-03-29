"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

const components: Partial<Components> = {
  h1: ({ id, children, ...props }) => (
    <h2
      id={id}
      className="mt-12 scroll-mt-28 border-b border-zinc-200 pb-2 text-2xl font-black tracking-tight text-zinc-950 first:mt-0"
      {...props}
    >
      {children}
    </h2>
  ),
  h2: ({ id, children, ...props }) => (
    <h3 id={id} className="mt-10 scroll-mt-28 text-xl font-bold tracking-tight text-zinc-900 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  h3: ({ id, children, ...props }) => (
    <h4 id={id} className="mt-8 scroll-mt-28 text-lg font-bold text-zinc-800" {...props}>
      {children}
    </h4>
  ),
  h4: ({ id, children, ...props }) => (
    <h5 id={id} className="mt-6 scroll-mt-28 text-base font-bold text-zinc-800" {...props}>
      {children}
    </h5>
  ),
  h5: ({ id, children, ...props }) => (
    <h6 id={id} className="mt-5 scroll-mt-28 text-sm font-bold uppercase tracking-wide text-zinc-700" {...props}>
      {children}
    </h6>
  ),
  h6: ({ id, children, ...props }) => (
    <h6 id={id} className="mt-4 scroll-mt-28 text-sm font-semibold text-zinc-600" {...props}>
      {children}
    </h6>
  ),
  p: ({ children }) => <p className="mt-5 text-[17px] leading-[1.75] text-zinc-700 first:mt-0">{children}</p>,
  a: ({ href, children }) => {
    if (href?.startsWith("/")) {
      return (
        <Link href={href} className="font-semibold text-orange-600 underline decoration-orange-200 underline-offset-2 transition hover:text-orange-700 hover:decoration-orange-400">
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-orange-600 underline decoration-orange-200 underline-offset-2 transition hover:text-orange-700"
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => <ul className="mt-5 list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-zinc-700">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mt-5 list-decimal space-y-2 pl-6 text-[17px] leading-relaxed text-zinc-700">{children}</ol>
  ),
  li: ({ children }) => <li className="marker:text-orange-500">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-zinc-900">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-4 border-orange-400 bg-orange-50/50 py-3 pl-5 pr-4 text-zinc-800 italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const inline = !className;
    if (inline) {
      return (
        <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.9em] text-orange-900">{children}</code>
      );
    }
    return <code className={className}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-zinc-950 p-4 text-sm text-zinc-100 shadow-inner">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-12 border-t border-zinc-200" />,
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto rounded-xl border border-zinc-200 shadow-sm">
      <table className="w-full min-w-[20rem] border-collapse text-left text-[15px] text-zinc-700">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-zinc-200 bg-zinc-50">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-zinc-100 bg-white">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th className="px-4 py-3 font-bold text-zinc-900">{children}</th>,
  td: ({ children }) => <td className="px-4 py-3 align-top">{children}</td>,
};

export function BlogMarkdown({ source }: { source: string }) {
  return (
    <div className="blog-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
