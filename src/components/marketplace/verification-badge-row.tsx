import { VERIFICATION_BADGE_KEYS, VERIFICATION_BADGE_LABELS, type VerificationBadgeKey } from "@/lib/verification-badges";

export function VerificationBadgeRow({ badgeKeys }: { badgeKeys: string[] }) {
  const keys = badgeKeys.filter((k): k is VerificationBadgeKey =>
    (VERIFICATION_BADGE_KEYS as readonly string[]).includes(k),
  );
  if (keys.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((k) => (
        <span
          key={k}
          className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-900"
        >
          {VERIFICATION_BADGE_LABELS[k]}
        </span>
      ))}
    </div>
  );
}
