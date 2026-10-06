export async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function randomCode(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

export function randomRedemptionCode() {
  return `LIFE-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}

export function sessionCookie(userId: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `life_session=${encodeURIComponent(userId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
}

export function userIdFromCookie(cookieHeader: string | null) {
  const match = cookieHeader?.match(/(?:^|;\s*)life_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
