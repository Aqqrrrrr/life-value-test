import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { entitlements, redemptionCodes } from "../../../db/schema";
import { sha256, userIdFromCookie } from "../../../lib/server-auth";

export async function POST(request: Request) {
  const userId = userIdFromCookie(request.headers.get("cookie"));
  if (!userId) return Response.json({ error: "请先完成邮箱验证" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  const code = body.code?.trim().toUpperCase() ?? "";
  if (!code) return Response.json({ error: "请输入兑换码" }, { status: 400 });
  try {
    const db = getDb();
    const row = (await db.select().from(redemptionCodes).where(and(eq(redemptionCodes.codeHash, await sha256(code)), eq(redemptionCodes.status, "issued"))).limit(1))[0];
    if (!row || (row.expiresAt && new Date(row.expiresAt) < new Date())) return Response.json({ error: "兑换码无效、已使用或已过期" }, { status: 400 });
    const updated = await db.update(redemptionCodes).set({ status: "redeemed", redeemedBy: userId, redeemedAt: new Date().toISOString() }).where(and(eq(redemptionCodes.id, row.id), eq(redemptionCodes.status, "issued"))).returning({ id: redemptionCodes.id });
    if (!updated.length) return Response.json({ error: "兑换码刚刚被其他账户使用，请勿重复提交" }, { status: 409 });
    await db.insert(entitlements).values({ userId, sku: row.sku, source: "xiaohongshu" });
    return Response.json({ ok: true, sku: row.sku });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "数据库尚未连接" }, { status: 503 });
  }
}
