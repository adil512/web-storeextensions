/**
 * Trust score 1–10 from how many listings this maker has submitted (any status).
 * 1 listing → 1, 10+ → 10.
 */
export function trustScoreFromListingCount(count: number): number {
  const n = Math.max(0, Math.floor(count));
  return Math.min(10, Math.max(1, n));
}
