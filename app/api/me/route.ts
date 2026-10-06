import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { entitlements, users } from "../../../db/schema";
import { userIdFromCookie } from "../../../lib/server-auth";

export async function GET(request: Request) {
  const userId = userIdFromCookie(request.headers.get("cookie"));
  if (!userId) return Response.json({ user: null, reportAccess: false });
  try {
    const db = getDb();
    const user = (await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, userId)).limit(1))[0] ?? null;
    const entitlement = user ? (await db.select({ sku: entitlements.sku }).from(entitlements).where(and(eq(entitlements.userId, userId), isNull(entitlements.revokedAt))).limit(1))[0] : null;
    return Response.json({ user, reportAccess: Boolean(entitlement), sku: entitlement?.sku ?? null });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "数据库尚未连接" }, { status: 503 });
  }
}
