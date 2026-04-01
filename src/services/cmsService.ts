import { CMSData } from "../types";
import { fallbackCmsData } from "../constants/fallbackCmsData";

const ADMIN_PASSWORD = "131094";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base || ""}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function getCMSData(): Promise<CMSData> {
  const response = await fetch(apiUrl("/api/cms"), {
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("Failed to fetch CMS data");
  const incoming = (await response.json()) as Partial<CMSData>;
  return {
    ...fallbackCmsData,
    ...incoming,
    about: { ...fallbackCmsData.about, ...(incoming.about || {}) },
    contact: { ...fallbackCmsData.contact, ...(incoming.contact || {}) },
    ui: {
      ...fallbackCmsData.ui,
      ...(incoming.ui || {}),
      socialLinks: incoming.ui?.socialLinks || fallbackCmsData.ui.socialLinks,
    },
  };
}

export async function updateCMSData(data: CMSData): Promise<void> {
  const response = await fetch(apiUrl("/api/cms"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": ADMIN_PASSWORD,
    },
    body: JSON.stringify(data),
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("Failed to update CMS data");
}

export async function uploadCMSImage(file: File): Promise<string> {
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
      "x-admin-password": ADMIN_PASSWORD,
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
