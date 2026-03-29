"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SocialJson = Record<string, string> | null;

function pickSocial(links: SocialJson) {
  if (!links || typeof links !== "object") {
    return { facebook: "", x: "", linkedin: "" };
  }
  return {
    facebook: String(links.facebook ?? ""),
    x: String(links.x ?? links.twitter ?? ""),
    linkedin: String(links.linkedin ?? ""),
  };
}

export default function AccountPage() {
  const supabase = createSupabaseBrowserClient();
  const [message, setMessage] = useState("");
  const [savedOk, setSavedOk] = useState(false);
  const [data, setData] = useState({
    username: "",
    fullName: "",
    avatarUrl: "",
    bio: "",
    websiteUrl: "",
    facebookUrl: "",
    xUrl: "",
    linkedinUrl: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      const authData = (await supabase.auth.getUser()).data;
      if (!authData.user) {
        window.location.href = "/auth";
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", authData.user.id).maybeSingle();
      if (profile) {
        const social = pickSocial(profile.social_links as SocialJson);
        setData({
          username: profile.username ?? "",
          fullName: profile.full_name ?? "",
          avatarUrl: profile.avatar_url ?? "",
          bio: profile.bio ?? "",
          websiteUrl: profile.website_url ?? "",
          facebookUrl: social.facebook,
          xUrl: social.x,
          linkedinUrl: social.linkedin,
        });
      }
    };
    void loadProfile();
  }, [supabase]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setSavedOk(false);

    const payload = {
      username: data.username,
      fullName: data.fullName,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      websiteUrl: data.websiteUrl,
      facebookUrl: data.facebookUrl,
      xUrl: data.xUrl,
      linkedinUrl: data.linkedinUrl,
    };

    const response = await fetch("/api/profile", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (result.error) {
      const raw = String(result.error);
      if (raw.includes("profiles")) {
        setMessage("Error: Database tables are missing. Run supabase/migrations/0001_init.sql in Supabase SQL Editor.");
      } else {
        setMessage(`Error: ${raw}`);
      }
      return;
    }
    setMessage("Profile updated successfully.");
    setSavedOk(true);
  };

  const onUploadAvatar = async (file: File | null) => {
    if (!file) return;
    const authData = (await supabase.auth.getUser()).data;
    if (!authData.user) return;
    const filePath = `${authData.user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (error) {
      setMessage(`Upload failed: ${error.message}`);
      return;
    }
    const publicUrl = supabase.storage.from("avatars").getPublicUrl(filePath).data.publicUrl;
    setData((prev) => ({ ...prev, avatarUrl: publicUrl }));
    setMessage("Avatar uploaded. Save profile to confirm.");
    setSavedOk(false);
  };

  const profileSlug = data.username.trim().toLowerCase();
  const canViewLive = Boolean(profileSlug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-black tracking-tight text-zinc-900">Profile settings</h1>
      <p className="mt-2 text-sm text-zinc-600">Website and social links appear on your public profile.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <input
          value={data.username}
          onChange={(e) => {
            setData((p) => ({ ...p, username: e.target.value }));
            setSavedOk(false);
          }}
          required
          placeholder="Username (public URL)"
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
        />
        <input
          value={data.fullName}
          onChange={(e) => setData((p) => ({ ...p, fullName: e.target.value }))}
          placeholder="Full name"
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
        />
        <input
          value={data.avatarUrl}
          onChange={(e) => setData((p) => ({ ...p, avatarUrl: e.target.value }))}
          placeholder="Avatar image URL (optional)"
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => void onUploadAvatar(e.target.files?.[0] || null)}
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
        />
        <textarea
          value={data.bio}
          onChange={(e) => setData((p) => ({ ...p, bio: e.target.value }))}
          placeholder="Bio"
          className="min-h-24 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
        />

        <div className="border-t border-zinc-100 pt-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Website &amp; social</p>
          <input
            value={data.websiteUrl}
            onChange={(e) => setData((p) => ({ ...p, websiteUrl: e.target.value }))}
            placeholder="Website URL (e.g. https://yoursite.com)"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
          />
          <input
            value={data.facebookUrl}
            onChange={(e) => setData((p) => ({ ...p, facebookUrl: e.target.value }))}
            placeholder="Facebook profile URL"
            className="mt-3 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
          />
          <input
            value={data.xUrl}
            onChange={(e) => setData((p) => ({ ...p, xUrl: e.target.value }))}
            placeholder="X (Twitter) profile URL"
            className="mt-3 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
          />
          <input
            value={data.linkedinUrl}
            onChange={(e) => setData((p) => ({ ...p, linkedinUrl: e.target.value }))}
            placeholder="LinkedIn profile URL"
            className="mt-3 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-500/20"
          >
            Save profile
          </button>
          {canViewLive ? (
            <Link
              href={`/u/${profileSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-800"
            >
              View live profile
            </Link>
          ) : null}
        </div>
      </form>

      <p className="mt-3 text-xs text-zinc-500">
        Public URL: <span className="font-mono text-zinc-700">/u/{profileSlug || "your-username"}</span>
      </p>

      {savedOk && canViewLive ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Profile saved.{" "}
          <Link href={`/u/${profileSlug}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            Open your live profile
          </Link>{" "}
          in a new tab.
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-zinc-700">{message}</p> : null}
    </div>
  );
}
