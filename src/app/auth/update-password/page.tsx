"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const supabase = createSupabaseBrowserClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [canReset, setCanReset] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "PASSWORD_RECOVERY") {
        setCanReset(true);
      }
    });

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setCanReset(true);
      }
    };

    void syncSession();
    const retry = window.setTimeout(() => void syncSession(), 300);

    return () => {
      window.clearTimeout(retry);
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Password updated. Redirecting…");
    window.location.href = "/dashboard";
  };

  return (
    <div className="mx-auto flex max-w-lg px-4 py-16 sm:px-6">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Set a new password</h1>
        <p className="mt-2 text-sm text-zinc-600">Use the link from your reset email. This page only works after you open that link.</p>

        {!canReset ? (
          <p className="mt-6 text-sm text-amber-800">
            Waiting for a valid recovery session… If this stays here, open the reset link from your email again, or{" "}
            <Link href="/auth" className="font-semibold underline">
              request a new reset
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            placeholder="New password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            disabled={loading || !canReset}
            className="w-full rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-zinc-700">{message}</p> : null}
      </div>
    </div>
  );
}
