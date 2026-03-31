export const VERIFICATION_BADGE_KEYS = [
  "traffic_verified",
  "revenue_documented",
  "ownership_verified",
  "seller_identity_verified",
] as const;

export type VerificationBadgeKey = (typeof VERIFICATION_BADGE_KEYS)[number];

export const VERIFICATION_BADGE_LABELS: Record<VerificationBadgeKey, string> = {
  traffic_verified: "Traffic verified",
  revenue_documented: "Revenue documented",
  ownership_verified: "Ownership verified",
  seller_identity_verified: "Seller identity verified",
};

export function isVerificationBadgeKey(raw: string): raw is VerificationBadgeKey {
  return (VERIFICATION_BADGE_KEYS as readonly string[]).includes(raw);
}
