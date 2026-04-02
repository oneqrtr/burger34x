import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/** Tarayıcıda VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY tanımlıysa istemci döner. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

  if (!url || !anonKey) {
    client = null;
    return null;
  }

  client = createClient(url, anonKey);
  return client;
}

export function isSupabaseBrowserConfigured(): boolean {
  return getSupabaseBrowserClient() !== null;
}
