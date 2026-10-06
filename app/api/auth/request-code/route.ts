import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { verificationCodes } from "../../../../db/schema";
import { emailSender } from "../../../../lib/email-sender";
import { normalizeEmail, randomCode, sha256 } from "../../../../lib/server-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = normalizeEmail(body.email ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "请输入有效邮箱" }, { status: 400 });
  const code = randomCode();
  const expires = new Date(Date.now() + 10 * 60_000).toISOString();
  try {
    const db = getDb();
    await db.insert(verificationCodes).values({ email, codeHash: await sha256(code), expiresAt: expires });
    await emailSender.sendVerificationCode({ email, code, expiresAt: expires });
    return Response.json({ ok: true, devCode: process.env.NODE_ENV === "production" ? undefined : code, expiresAt: expires });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "数据库尚未连接；本地预览可继续使用，部署后请配置 D1" }, { status: 503 });
  }
}
