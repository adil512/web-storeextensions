"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CATEGORIES, LANGUAGES, STORE_PLATFORM_OPTIONS, parseStorePlatform } from "@/lib/constants/listing";

type Listing = {
  id: string;
  name: string;
  description: string;
  category: string;
  extension_id: string;
  current_users: number;
  uninstalls_last_30_days: number;
  users_by_region: Record<string, number>;
  languages: string[];
  listing_country?: string | null;
  homepage_url: string | null;
  store_url: string | null;
  logo_url: string | null;
  status: string;
  store_platform?: string | null;
  featured_placement_requested?: boolean | null;
};

export default function EditPendingListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? "");
  const supabase = createSupabaseBrowserClient();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [primaryCountry, setPrimaryCountry] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const run = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/auth");
        return;
      }
      const res = await fetch(`/api/extensions/${id}`);
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || "Could not load listing.");
        setLoading(false);
        return;
      }
      const l = json.listing as Listing;
      setListing(l);
      setDescription(l.description || "");
      setSelectedLanguages(l.languages || []);
      setPrimaryCountry(l.listing_country ?? "");
      setLoading(false);
    };
    void run();
  }, [id, router, supabase]);

  const toggleLanguage = (value: string) => {
    setSelectedLanguages((prev) => (prev.includes(value) ? prev.filter((it) => it !== value) : [...prev, value]));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!listing) return;
    setSaving(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const body = {
      name: formData.get("name"),
      description,
      category: formData.get("category"),
      storePlatform: formData.get("storePlatform"),
      extensionId: formData.get("extensionId"),
      currentUsers: formData.get("currentUsers"),
      uninstallsLast30Days: formData.get("uninstalls"),
      homepageUrl: formData.get("homepageUrl"),
      storeUrl: formData.get("storeUrl"),
      logoUrl: formData.get("logoUrl"),
      primaryCountry,
      languages: selectedLanguages,
      requestFeaturedPlacement: formData.get("requestFeaturedPlacement") === "on",
    };
    const res = await fetch(`/api/extensions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || "Save failed.");
      return;
    }
    setMessage("Saved. Previous version stored in history.");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-zinc-600">
        Loading…
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-red-600">{message || "Listing not found."}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-orange-600">
          ← Dashboard
        </Link>
      </div>
    );
  }

  if (listing.status !== "pending") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-zinc-600">Only pending listings can be edited here.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-orange-600">
          ← Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/dashboard" className="text-sm font-medium text-orange-600 hover:text-orange-700">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-900">Edit pending listing</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Each save stores a version in history for moderators. Extension ID must stay unique across active listings.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <input
          name="name"
          required
          minLength={2}
          defaultValue={listing.name}
          placeholder="Extension Name"
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
        />
        <div>
          <label className="text-sm font-semibold text-zinc-800">Description</label>
          <textarea
            name="description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what it does, who it is for, and key privacy/permission notes."
            rows={14}
            className="mt-1 min-h-[12rem] w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
          />
        </div>
        <select name="category" required defaultValue={listing.category} className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm">
          {!CATEGORIES.includes(listing.category as (typeof CATEGORIES)[number]) ? (
            <option value={listing.category}>{listing.category} (current)</option>
          ) : null}
          {CATEGORIES.map((category) => (
            <option value={category} key={category}>
              {category}
            </option>
          ))}
        </select>
        <div>
          <label className="text-sm font-semibold text-zinc-800">Platform</label>
          <select
            name="storePlatform"
            required
            defaultValue={parseStorePlatform(listing.store_platform)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
          >
            {STORE_PLATFORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-zinc-800">Extension ID (required)</label>
          <input
            name="extensionId"
            required
            minLength={2}
            maxLength={128}
            defaultValue={listing.extension_id}
            placeholder="Chrome Web Store item ID"
            className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm font-mono"
          />
          <p className="mt-1 text-xs text-zinc-500">From your store URL — must not match another live or pending listing.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="currentUsers"
            type="number"
            min={0}
            required
            defaultValue={listing.current_users}
            placeholder="Current users"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
          />
          <input
            name="uninstalls"
            type="number"
            min={0}
            required
            defaultValue={listing.uninstalls_last_30_days}
            placeholder="Uninstalls in 30 days"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-zinc-800">Primary country (most users)</label>
          <input
            name="primaryCountry"
            required
            value={primaryCountry}
            onChange={(e) => setPrimaryCountry(e.target.value)}
            placeholder="e.g. United States"
            className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
          />
        </div>
        <div className="rounded-xl border border-zinc-200 p-4">
          <p className="text-sm font-semibold text-zinc-900">Main Languages</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {LANGUAGES.map((language) => (
              <button
                type="button"
                key={language}
                onClick={() => toggleLanguage(language)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  selectedLanguages.includes(language) ? "border-orange-600 bg-orange-600 text-white" : "border-zinc-300 text-zinc-700"
                }`}
              >
                {language}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-orange-200/80 bg-orange-50/50 p-4">
          <label className="flex cursor-pointer gap-3 text-sm leading-relaxed text-zinc-700">
            <input
              type="checkbox"
              name="requestFeaturedPlacement"
              defaultChecked={!!listing.featured_placement_requested}
              className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
            />
            <span>
              <span className="font-semibold text-zinc-900">I want featured placement on the homepage</span> — paid plans on{" "}
              <Link href="/pricing" className="font-medium text-orange-600 underline-offset-2 hover:underline">
                Pricing
              </Link>
              . Check this if you purchased a boost or lifetime plan so admins can verify payment and set featured order.
            </span>
          </label>
        </div>
        <input
          name="homepageUrl"
          defaultValue={listing.homepage_url ?? ""}
          placeholder="Website URL (optional)"
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
        />
        <input
          name="storeUrl"
          defaultValue={listing.store_url ?? ""}
          placeholder="Extension store URL (optional)"
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
        />
        <input
          name="logoUrl"
          defaultValue={listing.logo_url ?? ""}
          placeholder="Logo URL (optional)"
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
        />
        <button
          disabled={saving}
          className="w-full rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:shadow-none"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-zinc-700">{message}</p> : null}
    </div>
  );
}
