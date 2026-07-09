import type { CMSData } from "../types";
import { fallbackCmsData } from "../constants/fallbackCmsData";
import bundledCmsJson from "../cms.json";
import { getSupabaseBrowserClient } from "../lib/supabaseClient";
import { requireAdminClient } from "../lib/requireAdminClient";

const LEGACY_ADMIN_PASSWORD = "131094";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base || ""}${path.startsWith("/") ? path : `/${path}`}`;
}

const CMS_FETCH_TIMEOUT_MS = 12_000;

function mergeCmsPayload(incoming: Partial<CMSData>): CMSData {
  return {
    ...fallbackCmsData,
    ...incoming,
    about: { ...fallbackCmsData.about, ...(incoming.about || {}) },
    contact: { ...fallbackCmsData.contact, ...(incoming.contact || {}) },
    ui: {
      ...fallbackCmsData.ui,
      ...(incoming.ui || {}),
      blogIntro: incoming.ui?.blogIntro ?? fallbackCmsData.ui.blogIntro,
      footerContactBlurb:
        incoming.ui?.footerContactBlurb ?? fallbackCmsData.ui.footerContactBlurb,
      socialLinks: incoming.ui?.socialLinks || fallbackCmsData.ui.socialLinks,
    },
  };
}

async function fetchRemoteCmsJson(relativePath: string): Promise<Partial<CMSData> | null> {
  try {
    const response = await fetch(apiUrl(relativePath), {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as Partial<CMSData>;
  } catch {
    return null;
  }
}

async function fetchFromSupabase(): Promise<CMSData | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("cms_content").select("data").eq("id", 1).maybeSingle();

  if (error) {
    console.warn("Supabase CMS okuma:", error.message);
    return null;
  }
  if (!data?.data) return null;

  return mergeCmsPayload(data.data as Partial<CMSData>);
}

/**
 * Öncelik: Supabase (statik canlı) → /api/cms → /cms.json → derleme paketi.
 */
export async function getCMSData(): Promise<{ data: CMSData; fromApi: boolean }> {
  const fromSupabase = await fetchFromSupabase();
  if (fromSupabase) {
    return { data: fromSupabase, fromApi: true };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), CMS_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl("/api/cms"), {
      credentials: "same-origin",
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);

    if (response.ok) {
      const incoming = (await response.json()) as Partial<CMSData>;
      return { data: mergeCmsPayload(incoming), fromApi: true };
    }
  } catch {
    window.clearTimeout(timeoutId);
  }

  const fromPublic = await fetchRemoteCmsJson("/cms.json");
  if (fromPublic) {
    return { data: mergeCmsPayload(fromPublic), fromApi: false };
  }

  return {
    data: mergeCmsPayload(bundledCmsJson as unknown as Partial<CMSData>),
    fromApi: false,
  };
}

export async function updateCMSData(data: CMSData): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const authed = await requireAdminClient();
      const { error } = await authed.rpc("merge_site_cms", {
        p_payload: data as unknown as Record<string, unknown>,
      });
      if (!error) return;
      console.warn("Supabase CMS kayıt, API deneniyor:", error.message);
    } catch (e) {
      console.warn("Supabase CMS kayıt (oturum yok), API deneniyor:", e);
    }
  }

  const response = await fetch(apiUrl("/api/cms"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": LEGACY_ADMIN_PASSWORD,
    },
    body: JSON.stringify(data),
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("Failed to update CMS data");
}

function safeFileBase(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.[^.]+$/, "") || "image";
}

export async function uploadCMSImage(file: File): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const bucket = (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET as string | undefined)?.trim();

  if (supabase && bucket) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const objectPath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFileBase(file.name)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(objectPath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (!error) {
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      if (pub?.publicUrl) return pub.publicUrl;
    } else {
      console.warn("Supabase Storage yükleme, API deneniyor:", error.message);
    }
  }

  const toDataUrl = (input: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(input);
    });

  const dataUrl = await toDataUrl(file);
  const response = await fetch(apiUrl("/api/upload-image"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": LEGACY_ADMIN_PASSWORD,
    },
    body: JSON.stringify({
      fileName: file.name,
      dataUrl,
    }),
    credentials: "same-origin",
  });

  if (!response.ok) throw new Error("Failed to upload image");
  const body = (await response.json()) as { url: string };
  return body.url;
}
