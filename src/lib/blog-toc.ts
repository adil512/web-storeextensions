import GithubSlugger from "github-slugger";

export type BlogTocItem = {
  level: number;
  text: string;
  id: string;
};

function stripHeadingInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

/**
 * Headings for in-page TOC. Skips markdown `#` (title is the page h1).
 * Slugs match rehype-slug / github-slugger for the same heading order.
 */
export function extractTocFromMarkdown(markdown: string): BlogTocItem[] {
  const slugger = new GithubSlugger();
  const items: BlogTocItem[] = [];
  const lines = markdown.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    const match = /^(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/.exec(trimmed);
    if (!match) continue;

    const level = match[1].length;
    if (level === 1) continue;

    const raw = match[2].trim();
    const text = stripHeadingInlineMarkdown(raw);
    if (!text) continue;

    const id = slugger.slug(text);
    items.push({ level, text, id });
  }

  return items;
}
