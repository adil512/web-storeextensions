/** Normalize extension store IDs for comparison and storage (case-insensitive, trimmed). */
export function normalizeExtensionId(raw: string | null | undefined): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

export function isValidExtensionId(normalized: string): boolean {
  if (normalized.length < 2 || normalized.length > 128) return false;
  // Allow letters, numbers, hyphens (Chrome Web Store IDs are 32-char hex-like strings)
  return /^[a-z0-9][a-z0-9-]*$/i.test(normalized);
}
