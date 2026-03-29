"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success" | "neutral">("neutral");
  const [showForgot, setShowForgot] = useState(false);

  const onEmailAuth = async (mode: "sign-in" | "sign-up", event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageTone("neutral");

    const authAction =
      mode === "sign-up"
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });

    const { error } = await authAction;
    setLoading(false);

    if (error) {
      setMessage(error.message);
      setMessageTone("error");
      return;
    }

    window.location.href = "/dashboard";
  };

  const onGoogleSignIn = async () => {
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent("/dashboard")}`,
      },
    });
    if (error) {
      setMessage(error.message);
      setMessageTone("error");
    }
  };

  const onForgotPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setMessage("Enter your email address above, then click send reset link.");
      setMessageTone("error");
      return;
    }
    setLoading(true);
    setMessage("");
    setMessageTone("neutral");

    const redirectTo = `${window.location.origin}/auth/update-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setLoading(false);
    if (error) {
      setMessage(error.message);
      setMessageTone("error");
      return;
    }

    setMessage(
      "Check your email for a reset link. If it does not arrive, confirm your Supabase redirect URL includes " +
        redirectTo,
    );
    setMessageTone("success");
    setShowForgot(false);
  };

  return (
    <div className="mx-auto flex max-w-lg px-4 py-16 sm:px-6">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Sign in or create account</h1>
        <p className="mt-2 text-sm text-zinc-600">
          For extension makers and visitors. Use email/password or continue with Google.
        </p>
        <p className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          <strong className="text-zinc-800">Platform staff?</strong>{" "}
          <Link href="/admin/login" className="font-semibold text-orange-600 underline-offset-2 hover:underline">
            Admin &amp; super admin sign-in
          </Link>
        </p>

        <form className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
          />
          {!showForgot ? (
            <div>
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
              />
              <div className="mt-2 flex items-center justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-orange-600 hover:text-orange-700"
                  onClick={() => {
                    setShowForgot(true);
                    setMessage("");
                    setMessageTone("neutral");
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
                onClick={() => {
                  setShowForgot(false);
                  setMessage("");
                  setMessageTone("neutral");
                }}
              >
                Back to sign in
              </button>
            </div>
          )}

          {showForgot ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-600">
                We will email you a link to set a new password. Use the same email as your account.
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={onForgotPassword}
                className="mt-3 w-full rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="submit"
                disabled={loading}
                onClick={(event) => onEmailAuth("sign-in", event)}
                className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold"
              >
                Log in
              </button>
              <button
                type="submit"
                disabled={loading}
                onClick={(event) => onEmailAuth("sign-up", event)}
                className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-500/20"
              >
                Sign up
              </button>
            </div>
          )}
        </form>

        {!showForgot ? (
          <button
            type="button"
            onClick={onGoogleSignIn}
            className="mt-4 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold"
          >
            Continue with Google
          </button>
        ) : null}

        <p className="mt-6 text-center text-xs text-zinc-500">
          After resetting, you will land on{" "}
          <Link href="/auth/update-password" className="font-medium text-zinc-700 underline">
            /auth/update-password
          </Link>
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
