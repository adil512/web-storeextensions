export type ToolCategory = "build" | "ship" | "grow";

export type ToolDefinition = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: ToolCategory;
};

export const TOOL_CATEGORIES: Record<ToolCategory, { label: string; description: string }> = {
  build: { label: "Build", description: "Craft manifests, assets, and compliant packages." },
  ship: { label: "Ship", description: "Polish store listings and go live with confidence." },
  grow: { label: "Grow", description: "Positioning, keywords, and market context." },
};

export const TOOLS: ToolDefinition[] = [
  {
    slug: "extension-size-calculator",
    title: "Extension Size Calculator",
    tagline: "Estimate package footprint against common store limits.",
    description:
      "Sum assets and bundle estimates to see how close you are to typical Chrome Web Store compressed size guidance.",
    category: "build",
  },
  {
    slug: "manifest-json-generator",
    title: "Manifest.json Generator",
    tagline: "Scaffold a Chrome MV3 manifest from a short form.",
    description: "Generate a starter manifest_version 3 JSON with name, version, permissions, and action fields.",
    category: "build",
  },
  {
    slug: "extension-permission-explainer",
    title: "Extension Permission Explainer",
    tagline: "Plain-language notes for common Chrome permissions.",
    description: "Pick a permission to see what it allows and what reviewers often watch for.",
    category: "build",
  },
  {
    slug: "icon-generator-validator",
    title: "Icon Generator / Validator",
    tagline: "Check icon dimensions for store-ready sizes.",
    description: "Load a PNG or WebP and verify width and height against common toolbar and store requirements.",
    category: "build",
  },
  {
    slug: "mv2-to-mv3-converter",
    title: "MV2 to MV3 Converter",
    tagline: "Starter rewrite hints from a Manifest V2 JSON paste.",
    description: "Paste an MV2 manifest to get an MV3-shaped draft plus a short migration checklist.",
    category: "build",
  },
  {
    slug: "store-listing-optimizer",
    title: "Store Listing Optimizer",
    tagline: "Score your listing copy against a practical rubric.",
    description: "Answer quick prompts about your title, description, and screenshots to get actionable tips.",
    category: "ship",
  },
  {
    slug: "screenshot-validator",
    title: "Screenshot Validator",
    tagline: "Measure promo images against common aspect expectations.",
    description: "Upload images and compare dimensions to Chrome Web Store promo and marquee-style targets.",
    category: "ship",
  },
  {
    slug: "privacy-policy-generator",
    title: "Privacy Policy Generator",
    tagline: "Draft a simple policy outline from your data practices.",
    description: "Fill in basics—this produces a starting template, not legal advice. Have counsel review before shipping.",
    category: "ship",
  },
  {
    slug: "extension-pricing-calculator",
    title: "Extension Pricing Calculator",
    tagline: "Back-of-napkin revenue and unit math.",
    description: "Plug in price, fees, and goals to estimate installs or MRR needed.",
    category: "grow",
  },
  {
    slug: "extension-submission-checklist",
    title: "Extension Submission Checklist",
    tagline: "Track pre-submit tasks in the browser.",
    description: "A moderated checklist for packaging, policy, and store assets—saved locally until you clear it.",
    category: "ship",
  },
  {
    slug: "extension-category-finder",
    title: "Extension Category Finder",
    tagline: "Map keywords to directory categories.",
    description: "Paste a short description; we score overlap with our public category taxonomy.",
    category: "grow",
  },
  {
    slug: "extension-keyword-research",
    title: "Extension Keyword Research Tool",
    tagline: "Extract terms and phrases from your draft listing.",
    description: "Tokenize your copy, drop stopwords, and surface frequent words and bigrams for iteration.",
    category: "grow",
  },
  {
    slug: "extension-competition-analyzer",
    title: "Extension Competition Analyzer",
    tagline: "Structure a lightweight competitive review.",
    description: "Capture positioning, competitor count, and differentiators to produce a concise summary you can share.",
    category: "grow",
  },
];

const bySlug = new Map(TOOLS.map((t) => [t.slug, t]));

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return bySlug.get(slug);
}

export function getAllToolSlugs(): string[] {
  return TOOLS.map((t) => t.slug);
}
