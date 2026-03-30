"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CATEGORIES, LANGUAGES, STORE_PLATFORM_OPTIONS } from "@/lib/constants/listing";

export default function SubmitPage() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const data = (await supabase.auth.getUser()).data;
      if (!data.user) window.location.href = "/auth";
    };
    void checkAuth();
  }, [supabase]);

  const toggleLanguage = (value: string) => {
    setSelectedLanguages((prev) => (prev.includes(value) ? prev.filter((it) => it !== value) : [...prev, value]));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);

    const payload = {
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
      primaryCountry: formData.get("primaryCountry"),
      languages: selectedLanguages,
      requestFeaturedPlacement: formData.get("requestFeaturedPlacement") === "on",
    };

    const response = await fetch("/api/extensions", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    setLoading(false);
    if (data.error) {
      setMessage(`Error: ${String(data.error)}`);
      return;
    }
    setMessage("Submitted! Admin will review your listing.");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-black tracking-tight text-zinc-900">Submit your extension</h1>
      <p className="mt-2 text-sm text-zinc-600">Your listing appears publicly once admin approves it.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <input name="name" required placeholder="Extension Name" className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm" />
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
        <select name="category" required className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm">
          <option value="">Select category</option>
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
            className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Select platform (Chrome, Firefox, Edge, …)
            </option>
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
            placeholder="e.g. Chrome Web Store item ID from the listing URL"
            className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm font-mono"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Must be unique: the same extension cannot be listed twice while pending or approved. Names can match; IDs cannot.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input name="currentUsers" type="number" min={0} required placeholder="Current users" className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm" />
          <input name="uninstalls" type="number" min={0} required placeholder="Uninstalls in 30 days" className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="text-sm font-semibold text-zinc-800">Primary country (most users)</label>
          <input
            name="primaryCountry"
            required
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
              className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
            />
            <span>
              <span className="font-semibold text-zinc-900">I want featured placement on the homepage</span> — paid plans on{" "}
              <Link href="/pricing" className="font-medium text-orange-600 underline-offset-2 hover:underline">
                Pricing
              </Link>
              . Check this if you are purchasing (or have purchased) a boost or lifetime plan. Admins verify payment, then
              approve your listing and set the featured order.
            </span>
          </label>
        </div>
        <input name="homepageUrl" placeholder="Website URL (optional)" className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm" />
        <input name="storeUrl" placeholder="Extension store URL (optional)" className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm" />
        <input name="logoUrl" placeholder="Logo URL (optional)" className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm" />
        <button
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? "Submitting..." : "Submit for review"}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-zinc-700">{message}</p> : null}
    </div>
  );
}
