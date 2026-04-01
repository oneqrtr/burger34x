/**
 * public/ altındaki veya kökten servis edilen yollar için Vite base (alt klasör deploy) uyumu.
 * Tam URL veya data: ile başlayanları olduğu gibi döndürür.
 */
export function publicAssetUrl(path: string): string {
  if (!path?.trim()) return path;
  const p = path.trim();
  if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("data:") || p.startsWith("blob:")) {
    return p;
  }
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const suffix = p.startsWith("/") ? p : `/${p}`;
  return base ? `${base}${suffix}` : suffix;
}
