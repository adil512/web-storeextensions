export const CATEGORIES = [
  "Accessibility",
  "Art & Design",
  "Communication",
  "Developer Tools",
  "Education",
  "Entertainment",
  "Functionality & UI",
  "Games",
  "Household",
  "Just for Fun",
  "Lifestyle",
  "News & Weather",
  "Privacy & Security",
  "Shopping",
  "Social Networking",
  "Tools",
  "Travel",
  "Well-being",
  "Workflow & Planning",
] as const;

export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Hindi",
  "Arabic",
  "Japanese",
  "Korean",
  "Chinese",
  "Russian",
  "Other",
] as const;

/** Listing store / browser platform (submit + public detail). */
export const STORE_PLATFORM_KEYS = ["google", "mozilla", "edge", "other"] as const;
export type StorePlatformKey = (typeof STORE_PLATFORM_KEYS)[number];

export const STORE_PLATFORM_OPTIONS: { value: StorePlatformKey; label: string }[] = [
  { value: "google", label: "Google" },
  { value: "mozilla", label: "Mozilla" },
  { value: "edge", label: "Edge" },
  { value: "other", label: "Other" },
];

export const STORE_PLATFORM_LABELS: Record<StorePlatformKey, string> = {
  google: "Google (Chrome)",
  mozilla: "Mozilla (Firefox)",
  edge: "Microsoft Edge",
  other: "Other",
};

export function isValidStorePlatform(raw: unknown): boolean {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return STORE_PLATFORM_KEYS.includes(s as StorePlatformKey);
}

export function parseStorePlatform(raw: unknown): StorePlatformKey {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return STORE_PLATFORM_KEYS.includes(s as StorePlatformKey) ? (s as StorePlatformKey) : "other";
}

export const REGIONS = [
  "North America",
  "South America",
  "Europe",
  "Middle East",
  "Africa",
  "South Asia",
  "East Asia",
  "Southeast Asia",
  "Oceania",
] as const;
