/** Whitespace-separated tokens; matches typical "word count" in forms. */
export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

export const MIN_LISTING_DESCRIPTION_WORDS = 500;
