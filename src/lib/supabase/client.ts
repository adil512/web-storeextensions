"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (client) return client;
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
