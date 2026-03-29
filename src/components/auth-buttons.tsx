"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SessionUser = { id: string; email?: string };

export default function AuthButtons() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const loadUser = async () => {
      const data = (await supabase.auth.getUser()).data;
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email });
      }
    };
    void loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event: unknown, session: { user?: SessionUser } | null) => {
      const sessionUser = session?.user;
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email } : null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium">
          Dashboard
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/auth" className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium">
        Log in
      </Link>
      <Link
        href="/auth"
        className="rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700"
      >
        Sign up
      </Link>
    </div>
  );
}
