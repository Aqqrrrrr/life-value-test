import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../db";
import { entitlements } from "../../../../db/schema";
import { userIdFromCookie } from "../../../../lib/server-auth";

export async function GET(request: Request) {
  const userId = userIdFromCookie(request.headers.get("cookie"));
  if (!userId) return Response.json({ reportAccess: false }, { status: 401 });
  try {
    const entitlement = (await getDb().select({ sku: entitlements.sku }).from(entitlements).where(and(eq(entitlements.userId, userId), isNull(entitlements.revokedAt))).limit(1))[0];
    return Response.json({ reportAccess: Boolean(entitlement), sku: entitlement?.sku ?? null });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "数据库尚未连接" }, { status: 503 });
  }
}
