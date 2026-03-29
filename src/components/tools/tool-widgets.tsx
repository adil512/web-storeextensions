"use client";

import { CATEGORIES } from "@/lib/constants/listing";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";

const panel = "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm";
const label = "text-xs font-semibold uppercase tracking-wide text-zinc-500";
const input =
  "mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20";
const btnPrimary =
  "rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700";

const PERMISSION_HELP: Record<string, string> = {
  activeTab:
    "Grants temporary access to the active tab when the user invokes your extension (e.g. clicks the action). No persistent tab access until invoked—good for privacy-sensitive UIs.",
  storage:
    "Use chrome.storage (sync/local) instead of window.localStorage in extension contexts. Reviewers expect you to justify what you persist.",
  scripting:
    "Inject scripts into pages you have host permissions for. Pair with explicit narrow matches in host_permissions.",
  tabs:
    "Read tab metadata (URL, title). High-risk for privacy; prefer activeTab when possible and document why you need broader tab access.",
  tabGroups:
    "Organize tabs into groups. Usually paired with tabs or activeTab depending on use case.",
  bookmarks:
    "Read or modify bookmarks. Sensitive; scope UI clearly and avoid exfiltration patterns.",
  history:
    "Read browsing history. Very sensitive—expect strict justification and minimal retention.",
  cookies:
    "Access cookies for origins you declare. Often replaced by host permissions + fetch for many use cases.",
  downloads:
    "Initiate or monitor downloads. Clear UX when starting downloads on behalf of the user.",
  identity:
    "OAuth / Google Sign-In flows for extensions. Ensure token handling follows Google’s branding and security rules.",
  notifications:
    "Show system notifications. Respect quiet hours and rate limits in your UX.",
  "webNavigation":
    "Observe navigation events. Can be powerful for tracking—declare matches narrowly.",
  declarativeNetRequest:
    "MV3-friendly way to block or modify requests with rulesets instead of blocking webRequest.",
  sidePanel:
    "Chrome side panel UI. Declare side_panel in manifest and gate entry points clearly.",
};

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "your",
  "from",
  "that",
  "this",
  "you",
  "are",
  "our",
  "all",
  "any",
  "can",
  "has",
  "have",
  "will",
  "into",
  "more",
  "when",
  "what",
  "how",
  "its",
  "also",
  "not",
  "but",
  "was",
  "were",
  "been",
  "being",
  "their",
  "they",
  "them",
  "than",
  "then",
  "too",
  "very",
  "just",
  "about",
  "out",
  "who",
  "which",
  "while",
  "each",
  "other",
  "some",
  "such",
  "only",
  "same",
  "over",
  "most",
  "both",
  "make",
  "made",
  "using",
  "use",
  "used",
  "help",
  "helps",
  "extension",
  "browser",
  "chrome",
  "web",
  "app",
]);

const CHECKLIST_ITEMS: { id: string; label: string }[] = [
  { id: "icons", label: "128×128, 48×48, and 16×16 PNG icons (no rounded corners baked in)" },
  { id: "manifest", label: "Manifest V3 fields validated (version, permissions, host_permissions)" },
  { id: "privacy", label: "Privacy practices disclosure matches what the extension actually collects" },
  { id: "single", label: "Single purpose clear in description and UI" },
  { id: "permissions", label: "Each permission justified; narrow host patterns where possible" },
  { id: "remote", label: "Remote code / obfuscation policies reviewed" },
  { id: "store", label: "Store listing: title, short description, detailed description, category" },
  { id: "screenshots", label: "At least one screenshot showing core UI (correct locale if localized)" },
  { id: "promo", label: "Optional promo images meet dimension guidance" },
  { id: "testing", label: "Tested in a clean profile with production build (not unpacked dev quirks)" },
];

function SizeCalculator() {
  const [zipMb, setZipMb] = useState("");
  const [assetsMb, setAssetsMb] = useState("");
  const total = (Number(zipMb) || 0) + (Number(assetsMb) || 0);
  const softWarn = total > 200;

  return (
    <div className={`space-y-6 ${panel}`}>
      <p className="text-sm text-zinc-600">
        Chrome Web Store enforces a compressed package size limit (historically on the order of hundreds of MB—check the
        latest official docs). Use this as a quick sum—not a guarantee of acceptance.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Compressed ZIP size (MB)</label>
          <input className={input} type="number" min={0} step={0.1} value={zipMb} onChange={(e) => setZipMb(e.target.value)} />
        </div>
        <div>
          <label className={label}>Extra unpacked assets estimate (MB)</label>
          <input
            className={input}
            type="number"
            min={0}
            step={0.1}
            value={assetsMb}
            onChange={(e) => setAssetsMb(e.target.value)}
          />
        </div>
      </div>
      <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
        <p className="text-sm font-semibold text-zinc-800">Combined estimate</p>
        <p className="mt-1 text-2xl font-black tabular-nums text-zinc-950">{total.toFixed(2)} MB</p>
        {softWarn ? (
          <p className="mt-2 text-sm text-amber-800">Large bundles often trigger review questions—consider lazy loading and code splitting.</p>
        ) : null}
      </div>
    </div>
  );
}

function ManifestGenerator() {
  const [name, setName] = useState("My Extension");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("Does something useful.");
  const [perms, setPerms] = useState<string[]>(["storage", "activeTab"]);

  const toggle = (p: string) => {
    setPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const json = useMemo(
    () =>
      JSON.stringify(
        {
          manifest_version: 3,
          name,
          version,
          description,
          permissions: perms,
          action: {
            default_title: name,
            default_popup: "popup.html",
          },
        },
        null,
        2,
      ),
    [name, version, description, perms],
  );

  const options = Object.keys(PERMISSION_HELP).sort();

  return (
    <div className="space-y-6">
      <div className={panel}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Name</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className={label}>Version</label>
            <input className={input} value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Description</label>
            <textarea className={input} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <p className={`${label} mt-6`}>Permissions</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                perms.includes(p) ? "border-orange-400 bg-orange-50 text-orange-900" : "border-zinc-200 bg-white text-zinc-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className={panel}>
        <label className={label}>Output (copy into manifest.json)</label>
        <pre className="mt-2 max-h-80 overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 text-xs text-zinc-100">{json}</pre>
      </div>
    </div>
  );
}

function PermissionExplainer() {
  const keys = Object.keys(PERMISSION_HELP).sort();
  const [sel, setSel] = useState(keys[0] ?? "activeTab");
  return (
    <div className={`space-y-4 ${panel}`}>
      <div>
        <label className={label}>Permission</label>
        <select className={input} value={sel} onChange={(e) => setSel(e.target.value)}>
          {keys.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm leading-relaxed text-zinc-700">{PERMISSION_HELP[sel]}</p>
    </div>
  );
}

function IconValidator() {
  const [msg, setMsg] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setMsg(null);
    setDims(null);
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setDims({ w: img.naturalWidth, h: img.naturalHeight });
      const ok = [16, 32, 48, 128].some((s) => s === img.naturalWidth && s === img.naturalHeight);
      setMsg(
        ok
          ? "Matches a common square store size."
          : "Chrome store expects square PNG icons (commonly 16, 32, 48, 128). Resize if needed.",
      );
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setMsg("Could not read image.");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className={`space-y-4 ${panel}`}>
      <label className={label}>Image file</label>
      <input className="mt-2 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-orange-900" type="file" accept="image/png,image/webp" onChange={onFile} />
      {dims ? (
        <p className="text-sm font-medium text-zinc-800">
          Detected: {dims.w} × {dims.h}px
        </p>
      ) : null}
      {msg ? <p className="text-sm text-zinc-600">{msg}</p> : null}
    </div>
  );
}

function Mv2ToMv3() {
  const [raw, setRaw] = useState("");
  const [out, setOut] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  const convert = () => {
    setNotes([]);
    try {
      const j = JSON.parse(raw) as Record<string, unknown>;
      const warn: string[] = [];
      if (Number(j.manifest_version) !== 2) {
        warn.push("Input manifest_version is not 2 — double-check the output manually.");
      }

      const outObj: Record<string, unknown> = { manifest_version: 3 };
      for (const k of ["name", "version", "description", "icons", "options_ui", "content_scripts", "oauth2", "key"]) {
        if (j[k] !== undefined) outObj[k] = j[k];
      }

      const bg = j.background as { scripts?: string[]; page?: string } | undefined;
      if (bg?.scripts?.length) {
        outObj.background = { service_worker: bg.scripts[0] };
        if (bg.scripts.length > 1) warn.push("Multiple background scripts — merge into one service_worker entry.");
      } else if (bg?.page) {
        warn.push("background.page detected — convert manually to a service worker.");
      }

      const ba = (j.browser_action ?? j.page_action) as Record<string, unknown> | undefined;
      if (ba) outObj.action = { ...ba };

      if (j.web_accessible_resources !== undefined) {
        outObj.web_accessible_resources = j.web_accessible_resources;
        warn.push("Confirm web_accessible_resources matches MV3 shape (resources + matches).");
      }

      const existingHost = j.host_permissions;
      if (Array.isArray(existingHost) && existingHost.length) {
        outObj.host_permissions = existingHost;
      }

      if (Array.isArray(j.permissions)) {
        const perms = j.permissions as string[];
        const hostLike = perms.filter((p) => p.includes("/") || p === "<all_urls>");
        const normal = perms.filter((p) => !hostLike.includes(p));
        outObj.permissions = normal;
        if (hostLike.length) {
          const prev = (outObj.host_permissions as string[] | undefined) ?? [];
          outObj.host_permissions = [...prev, ...hostLike];
        }
      }

      setOut(JSON.stringify(outObj, null, 2));
      setNotes([
        ...warn,
        "Review optional_host_permissions vs host_permissions.",
        "Replace blocking webRequest usage with declarativeNetRequest where required.",
      ]);
    } catch {
      setOut("");
      setNotes(["Invalid JSON—paste a full manifest.json body."]);
    }
  };

  return (
    <div className="space-y-6">
      <div className={panel}>
        <label className={label}>Manifest V2 JSON</label>
        <textarea className={`${input} font-mono text-xs`} rows={12} value={raw} onChange={(e) => setRaw(e.target.value)} />
        <button type="button" className={`${btnPrimary} mt-4`} onClick={convert}>
          Draft MV3 JSON
        </button>
      </div>
      {out ? (
        <div className={panel}>
          <label className={label}>Draft output</label>
          <pre className="mt-2 max-h-96 overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 text-xs text-zinc-100">{out}</pre>
          <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-zinc-600">
            {notes.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function StoreListingOptimizer() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [bullets, setBullets] = useState("");
  const [hasScreens, setHasScreens] = useState(false);

  const score = useMemo(() => {
    let s = 0;
    if (title.length >= 20 && title.length <= 75) s += 25;
    else if (title.length > 0) s += 10;
    if (desc.length >= 120) s += 25;
    else if (desc.length > 0) s += 10;
    const b = bullets.split("\n").filter((l) => l.trim().length > 0).length;
    if (b >= 3) s += 25;
    else if (b > 0) s += 10;
    if (hasScreens) s += 25;
    return Math.min(100, s);
  }, [title, desc, bullets, hasScreens]);

  return (
    <div className={`space-y-6 ${panel}`}>
      <div>
        <label className={label}>Listing title (draft)</label>
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Clear benefit + product name" />
        <p className="mt-1 text-xs text-zinc-500">{title.length} chars — aim for clarity, not keyword stuffing.</p>
      </div>
      <div>
        <label className={label}>Short description</label>
        <textarea className={input} rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What user gets in one breath." />
      </div>
      <div>
        <label className={label}>Feature bullets (one per line)</label>
        <textarea className={input} rows={5} value={bullets} onChange={(e) => setBullets(e.target.value)} />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
        <input
          type="checkbox"
          checked={hasScreens}
          onChange={(e) => setHasScreens(e.target.checked)}
          className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
        />
        I have at least one polished screenshot that matches the story above
      </label>
      <div className="rounded-xl border border-orange-200 bg-orange-50/80 px-4 py-3">
        <p className="text-sm font-bold text-orange-950">Listing strength (heuristic)</p>
        <p className="mt-1 text-3xl font-black text-orange-900">{score}/100</p>
        <p className="mt-2 text-sm text-orange-900/90">
          Strong listings pair a specific promise, proof (social or metrics), and screenshots that match the copy.
        </p>
      </div>
    </div>
  );
}

function ScreenshotValidator() {
  const [msg, setMsg] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  const targets = [
    { label: "Common single screenshot", w: 1280, h: 800 },
    { label: "Alternate acceptable", w: 640, h: 400 },
    { label: "Small promo tile style", w: 440, h: 280 },
  ];

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setMsg(null);
    setDims(null);
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setDims({ w, h });
      const match = targets.find((t) => t.w === w && t.h === h);
      setMsg(
        match
          ? `Matches “${match.label}”.`
          : `No exact match to presets below. Closest aspect: ${(w / h).toFixed(2)}:1 — adjust canvas before upload.`,
      );
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setMsg("Could not read image.");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className={`space-y-4 ${panel}`}>
      <p className="text-sm text-zinc-600">Compare your asset dimensions to common Chrome Web Store screenshot presets.</p>
      <ul className="text-sm text-zinc-700">
        {targets.map((t) => (
          <li key={t.label}>
            <strong>{t.w}×{t.h}</strong> — {t.label}
          </li>
        ))}
      </ul>
      <input className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-orange-900" type="file" accept="image/*" onChange={onFile} />
      {dims ? (
        <p className="text-sm font-medium text-zinc-800">
          File: {dims.w} × {dims.h}px
        </p>
      ) : null}
      {msg ? <p className="text-sm text-zinc-600">{msg}</p> : null}
    </div>
  );
}

function PrivacyPolicyGenerator() {
  const [app, setApp] = useState("");
  const [contact, setContact] = useState("");
  const [collects, setCollects] = useState({
    analytics: false,
    personal: false,
    payment: false,
    location: false,
  });

  const text = useMemo(() => {
    const lines = [
      `Privacy policy (draft) for ${app || "[Extension name]"}`,
      "",
      "Last updated: [DATE]",
      "",
      `Contact: ${contact || "[support email or URL]"}`,
      "",
      "Summary",
      `${app || "This extension"} is provided as described in the store listing. This document is a starting template only and is not legal advice.`,
      "",
      "Data collection",
    ];
    if (!collects.analytics && !collects.personal && !collects.payment && !collects.location) {
      lines.push("The developer states that this extension does not collect personal data beyond what the browser or store requires for operation. Update this section if you add analytics, accounts, or server-side storage.");
    } else {
      if (collects.personal) lines.push("- We process account or profile-related information you provide.");
      if (collects.analytics) lines.push("- We use analytics to understand feature usage (describe vendors and retention).");
      if (collects.payment) lines.push("- Payment data is handled by our payment processor under their terms.");
      if (collects.location) lines.push("- We may process coarse location when you enable location-based features.");
    }
    lines.push(
      "",
      "Third parties",
      "If you integrate third-party APIs, list them here with links to their policies.",
      "",
      "Changes",
      "We may update this policy; material changes should be communicated to users per store guidelines.",
      "",
      "Disclaimer",
      "Have qualified counsel review before publishing.",
    );
    return lines.join("\n");
  }, [app, contact, collects]);

  return (
    <div className="space-y-6">
      <div className={`${panel} border-amber-200 bg-amber-50/50 text-sm text-amber-950`}>
        This generates a <strong>draft outline</strong> only. It is not legal advice. Align every statement with your real
        data practices and Chrome Web Store requirements.
      </div>
      <div className={panel}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Extension / product name</label>
            <input className={input} value={app} onChange={(e) => setApp(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Support contact (email or URL)</label>
            <input className={input} value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
        </div>
        <p className={`${label} mt-6`}>Data practices (check all that apply)</p>
        <div className="mt-3 space-y-2 text-sm">
          {(
            [
              ["analytics", "Usage analytics or telemetry"],
              ["personal", "Accounts, email, or identifiable user data"],
              ["payment", "Payments or billing"],
              ["location", "Location or region beyond coarse store locale"],
            ] as const
          ).map(([k, lab]) => (
            <label key={k} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={collects[k]}
                onChange={(e) => setCollects((c) => ({ ...c, [k]: e.target.checked }))}
                className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
              />
              {lab}
            </label>
          ))}
        </div>
      </div>
      <div className={panel}>
        <label className={label}>Draft text</label>
        <textarea className={`${input} font-mono text-xs`} rows={16} readOnly value={text} />
      </div>
    </div>
  );
}

function PricingCalculator() {
  const [price, setPrice] = useState("4.99");
  const [feePct, setFeePct] = useState("15");
  const [mrr, setMrr] = useState("1000");

  const p = Number(price) || 0;
  const f = (Number(feePct) || 0) / 100;
  const goal = Number(mrr) || 0;
  const net = p * (1 - f);
  const subs = net > 0 ? Math.ceil(goal / net) : 0;

  return (
    <div className={`space-y-6 ${panel}`}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>Price (USD)</label>
          <input className={input} type="number" min={0} step={0.5} value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label className={label}>Store / platform fee %</label>
          <input className={input} type="number" min={0} max={100} value={feePct} onChange={(e) => setFeePct(e.target.value)} />
        </div>
        <div>
          <label className={label}>Target MRR (USD)</label>
          <input className={input} type="number" min={0} value={mrr} onChange={(e) => setMrr(e.target.value)} />
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
        <p>
          Estimated net per paying user: <strong className="tabular-nums">${net.toFixed(2)}</strong>
        </p>
        <p className="mt-2">
          Paying users needed (approx): <strong className="tabular-nums">{subs}</strong>
        </p>
        <p className="mt-2 text-xs text-zinc-500">Ignores churn, taxes, and regional pricing—use for directional planning only.</p>
      </div>
    </div>
  );
}

const LS_KEY = "webstoreextensions:submission-checklist";

function SubmissionChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: Record<string, boolean>) => {
    setDone(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = (id: string) => {
    persist({ ...done, [id]: !done[id] });
  };

  const clear = () => {
    persist({});
  };

  const pct = Math.round((CHECKLIST_ITEMS.filter((i) => done[i.id]).length / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className={`space-y-4 ${panel}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-800">
          Progress: {pct}% ({CHECKLIST_ITEMS.filter((i) => done[i.id]).length}/{CHECKLIST_ITEMS.length})
        </p>
        <button type="button" className="text-sm font-semibold text-red-700 hover:underline" onClick={clear}>
          Reset
        </button>
      </div>
      <ul className="space-y-3">
        {CHECKLIST_ITEMS.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 transition hover:bg-zinc-50">
              <input
                type="checkbox"
                className="mt-1 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                checked={!!done[item.id]}
                onChange={() => toggle(item.id)}
              />
              <span className="text-sm text-zinc-800">{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryFinder() {
  const [text, setText] = useState("");
  const ranked = useMemo(() => {
    const body = text.toLowerCase();
    if (!body.trim()) return [] as { cat: string; score: number }[];
    return CATEGORIES.map((cat) => {
      const parts = cat
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 2);
      let score = 0;
      for (const w of parts) {
        if (body.includes(w)) score += 2;
      }
      if (body.includes(cat.toLowerCase())) score += 5;
      return { cat, score };
    })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [text]);

  return (
    <div className={`space-y-4 ${panel}`}>
      <label className={label}>Describe your extension</label>
      <textarea className={input} rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Blocks trackers on news sites, shows a privacy score…" />
      {ranked.length === 0 ? (
        <p className="text-sm text-zinc-500">Type a few sentences to see suggested categories from our taxonomy.</p>
      ) : (
        <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-800">
          {ranked.map((r) => (
            <li key={r.cat}>
              <strong>{r.cat}</strong> <span className="text-zinc-500">(score {r.score})</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function KeywordResearch() {
  const [text, setText] = useState("");

  const { words, bigrams } = useMemo(() => {
    const raw = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const tokens = raw.split(/\s+/).filter((t) => t.length > 2 && !STOPWORDS.has(t));
    const freq = new Map<string, number>();
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
    const words = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
    const biFreq = new Map<string, number>();
    for (let i = 0; i < tokens.length - 1; i++) {
      const bg = `${tokens[i]} ${tokens[i + 1]}`;
      biFreq.set(bg, (biFreq.get(bg) ?? 0) + 1);
    }
    const bigrams = [...biFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
    return { words, bigrams };
  }, [text]);

  return (
    <div className={`space-y-6 ${panel}`}>
      <label className={label}>Paste draft listing or landing copy</label>
      <textarea className={input} rows={8} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className={label}>Top tokens</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700">
            {words.length === 0 ? <li className="text-zinc-400">—</li> : words.map(([w, n]) => (
              <li key={w}>
                {w} <span className="text-zinc-400">×{n}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className={label}>Frequent bigrams</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700">
            {bigrams.length === 0 ? <li className="text-zinc-400">—</li> : bigrams.map(([w, n]) => (
              <li key={w}>
                {w} <span className="text-zinc-400">×{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CompetitionAnalyzer() {
  const [name, setName] = useState("");
  const [count, setCount] = useState("5");
  const [diff, setDiff] = useState("");
  const [weak, setWeak] = useState("");

  const summary = useMemo(() => {
    const c = Number(count) || 0;
    return [
      `Product: ${name || "[Your extension]"}`,
      `Estimated competitor set size (your input): ${c}`,
      "",
      "Differentiator",
      diff || "[What you do that others don’t, in one paragraph]",
      "",
      "Competitor weaknesses to validate",
      weak || "[Hypotheses to test with user interviews and store reviews]",
      "",
      "Next steps",
      "- Read 10 recent 1–3★ reviews on top competitors for unmet needs.",
      "- Map feature parity vs. your MVP; cut scope that doesn’t reinforce the differentiator.",
      "- Align store screenshots with the differentiator in the first frame.",
    ].join("\n");
  }, [name, count, diff, weak]);

  return (
    <div className="space-y-6">
      <div className={panel}>
        <div className="grid gap-4">
          <div>
            <label className={label}>Your extension name</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className={label}>How many close competitors are you tracking?</label>
            <input className={input} type="number" min={0} value={count} onChange={(e) => setCount(e.target.value)} />
          </div>
          <div>
            <label className={label}>Core differentiator</label>
            <textarea className={input} rows={4} value={diff} onChange={(e) => setDiff(e.target.value)} />
          </div>
          <div>
            <label className={label}>Where competitors look weak (hypotheses)</label>
            <textarea className={input} rows={4} value={weak} onChange={(e) => setWeak(e.target.value)} />
          </div>
        </div>
      </div>
      <div className={panel}>
        <label className={label}>Worksheet export (copy to Notion or Docs)</label>
        <textarea className={`${input} font-mono text-xs`} rows={14} readOnly value={summary} />
      </div>
    </div>
  );
}

export function ToolWidgets({ slug }: { slug: string }) {
  switch (slug) {
    case "extension-size-calculator":
      return <SizeCalculator />;
    case "manifest-json-generator":
      return <ManifestGenerator />;
    case "extension-permission-explainer":
      return <PermissionExplainer />;
    case "icon-generator-validator":
      return <IconValidator />;
    case "mv2-to-mv3-converter":
      return <Mv2ToMv3 />;
    case "store-listing-optimizer":
      return <StoreListingOptimizer />;
    case "screenshot-validator":
      return <ScreenshotValidator />;
    case "privacy-policy-generator":
      return <PrivacyPolicyGenerator />;
    case "extension-pricing-calculator":
      return <PricingCalculator />;
    case "extension-submission-checklist":
      return <SubmissionChecklist />;
    case "extension-category-finder":
      return <CategoryFinder />;
    case "extension-keyword-research":
      return <KeywordResearch />;
    case "extension-competition-analyzer":
      return <CompetitionAnalyzer />;
    default:
      return <p className="text-sm text-zinc-500">This tool is not available.</p>;
  }
}
