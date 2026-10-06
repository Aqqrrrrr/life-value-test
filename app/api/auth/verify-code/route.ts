import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users, verificationCodes } from "../../../../db/schema";
import { makeId, normalizeEmail, sessionCookie, sha256 } from "../../../../lib/server-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; code?: string };
  const email = normalizeEmail(body.email ?? "");
  const code = (body.code ?? "").trim();
  if (!email || !/^\d{6}$/.test(code)) return Response.json({ error: "邮箱或验证码格式不正确" }, { status: 400 });
  try {
    const db = getDb();
    const row = (await db.select().from(verificationCodes).where(and(eq(verificationCodes.email, email), isNull(verificationCodes.consumedAt))).orderBy(desc(verificationCodes.createdAt)).limit(1))[0];
    if (!row || row.attempts >= 5 || new Date(row.expiresAt) < new Date()) return Response.json({ error: "验证码无效或已过期" }, { status: 400 });
    if (row.codeHash !== await sha256(code)) {
      await db.update(verificationCodes).set({ attempts: row.attempts + 1 }).where(eq(verificationCodes.id, row.id));
      return Response.json({ error: "验证码无效或已过期" }, { status: 400 });
    }
    await db.update(verificationCodes).set({ consumedAt: new Date().toISOString() }).where(eq(verificationCodes.id, row.id));
    const existing = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    const user = existing ?? { id: makeId("usr"), email };
    if (!existing) await db.insert(users).values({ id: user.id, email, emailVerifiedAt: new Date().toISOString() });
    return new Response(JSON.stringify({ ok: true, user: { id: user.id, email } }), { headers: { "Content-Type": "application/json", "Set-Cookie": sessionCookie(user.id) } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "数据库尚未连接" }, { status: 503 });
  }
}
