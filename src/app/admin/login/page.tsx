"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const CALLBACK = typeof window !== "undefined" ? `${window.location.origin}/api/auth/callback` : "";

function AdminLoginForm() {
  const supabase = createSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success" | "neutral">("neutral");

  const errorBanner =
    error === "forbidden"
      ? "This account is not an admin or super admin. Use the main sign-in for makers and visitors."
      : error === "session"
        ? "Session expired. Sign in again."
        : error === "required"
          ? "Sign in with a team account to open the admin dashboard."
          : null;

  const onEmailSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageTone("neutral");

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (err) {
      setMessage(err.message);
      setMessageTone("error");
      return;
    }

    window.location.href = "/admin/verify";
  };

  const onGoogleSignIn = async () => {
    const origin = window.location.origin;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent("/admin/verify")}`,
      },
    });
    if (err) {
      setMessage(err.message);
      setMessageTone("error");
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Team access</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-900">Admin sign-in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          For <strong>super admins</strong> and <strong>moderators</strong> only. After sign-in you&apos;ll go through a quick
          role check, then the admin dashboard (approvals, featured listings, user tools).
        </p>

        {errorBanner ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{errorBanner}</div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onEmailSignIn}>
          <input
            type="email"
            placeholder="Work email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
          />
          <input
            type="password"
            placeholder="Password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in to admin"}
          </button>
        </form>

        <button
          type="button"
          onClick={onGoogleSignIn}
          className="mt-4 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/auth" className="font-medium text-orange-600 underline-offset-2 hover:underline">
            Main sign-in for makers &amp; visitors
          </Link>
          {" · "}
          <Link href="/auth" className="font-medium text-zinc-600 underline-offset-2 hover:underline">
            Forgot password
          </Link>{" "}
          (use main page)
        </p>

        {message ? (
          <p
            className={`mt-4 text-sm ${
              messageTone === "error" ? "text-red-600" : messageTone === "success" ? "text-emerald-700" : "text-zinc-700"
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-16">
          <div className="h-48 w-full animate-pulse rounded-2xl bg-zinc-100" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
