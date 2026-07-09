import { getSupabaseBrowserClient } from "../lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

export async function getAdminSession(): Promise<Session | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

export async function signInAdmin(email: string, password: string): Promise<User> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw new Error(error.message || "Giriş başarısız.");
  if (!data.user) throw new Error("Giriş başarısız.");
  return data.user;
}

export async function signOutAdmin(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message || "Çıkış başarısız.");
}

export function onAdminAuthChange(callback: (signedIn: boolean) => void): () => void {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => undefined;

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(Boolean(session));
  });

  return () => {
    data.subscription.unsubscribe();
  };
}
