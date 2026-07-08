const COOLDOWN_KEY = 'burger34-last-order-at';
const COOLDOWN_MS = 2 * 60 * 1000;

export function canSubmitOrderNow(): { ok: boolean; waitSeconds?: number } {
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY);
    if (!raw) return { ok: true };
    const last = Number(raw);
    if (!Number.isFinite(last)) return { ok: true };
    const elapsed = Date.now() - last;
    if (elapsed >= COOLDOWN_MS) return { ok: true };
    return { ok: false, waitSeconds: Math.ceil((COOLDOWN_MS - elapsed) / 1000) };
  } catch {
    return { ok: true };
  }
}

export function markOrderSubmitted(): void {
  localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
}
