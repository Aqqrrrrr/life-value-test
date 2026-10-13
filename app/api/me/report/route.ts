import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../db";
import { entitlements } from "../../../../db/schema";
import { userIdFromCookie } from "../../../../lib/server-auth";

export async function GET(request: Request) {
  const userId = userIdFromCookie(request.headers.get("cookie"));
  if (!userId) return Response.json({ error: "请先绑定并验证邮箱" }, { status: 401 });
  try {
    const entitlement = (await getDb().select({ sku: entitlements.sku }).from(entitlements).where(and(eq(entitlements.userId, userId), isNull(entitlements.revokedAt))).limit(1))[0];
    if (!entitlement) return Response.json({ error: "尚未解锁详细报告" }, { status: 403 });
    return Response.json({ reportAccess: true, sku: entitlement.sku });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "数据库尚未连接" }, { status: 503 });
  }
}
