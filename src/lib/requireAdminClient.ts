import { getSupabaseBrowserClient } from "../lib/supabaseClient";

export async function requireAdminClient() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new Error("Oturum süresi doldu. Lütfen tekrar giriş yapın.");
  }

  return supabase;
}
