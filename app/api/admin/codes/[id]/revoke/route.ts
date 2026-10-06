import { eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { redemptionCodes } from "../../../../../../db/schema";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!process.env.ADMIN_SECRET || request.headers.get("x-admin-secret") !== process.env.ADMIN_SECRET) return Response.json({ error: "无管理员权限" }, { status: 403 });
  const { id } = await context.params;
  try {
    await getDb().update(redemptionCodes).set({ status: "revoked" }).where(eq(redemptionCodes.id, Number(id)));
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "数据库尚未连接" }, { status: 503 });
  }
}
