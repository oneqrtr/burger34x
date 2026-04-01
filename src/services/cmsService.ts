import { CMSData } from "../types";

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
  return response.json();
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
