import { desc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { redemptionCodes } from "../../../../db/schema";
import { randomRedemptionCode, sha256 } from "../../../../lib/server-auth";

function authorized(request: Request) {
  return Boolean(process.env.ADMIN_SECRET) && request.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "无管理员权限" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { sku?: string; sourceOrderRef?: string; expiresAt?: string };
  const code = randomRedemptionCode();
  try {
    const db = getDb();
    await db.insert(redemptionCodes).values({ codeHash: await sha256(code), sku: body.sku ?? "full-report", sourceOrderRef: body.sourceOrderRef, expiresAt: body.expiresAt });
    return Response.json({ ok: true, code });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "数据库尚未连接" }, { status: 503 });
  }
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "无管理员权限" }, { status: 403 });
  try {
    const rows = await getDb().select({ id: redemptionCodes.id, sku: redemptionCodes.sku, status: redemptionCodes.status, sourceOrderRef: redemptionCodes.sourceOrderRef, expiresAt: redemptionCodes.expiresAt, redeemedBy: redemptionCodes.redeemedBy, redeemedAt: redemptionCodes.redeemedAt, createdAt: redemptionCodes.createdAt }).from(redemptionCodes).orderBy(desc(redemptionCodes.createdAt)).limit(100);
    return Response.json({ codes: rows });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "数据库尚未连接" }, { status: 503 });
  }
}
