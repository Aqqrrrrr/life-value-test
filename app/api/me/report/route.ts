import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../db";
import { entitlements } from "../../../../db/schema";
import { userIdFromCookie } from "../../../../lib/server-auth";

const report = {
  title: "风险先行型决策者",
  summary: "你倾向先处理高损失、低容错的事情，再追求效率和体验。这个风格通常能减少大坑，但也要留意不要因为过度谨慎而错过低成本试错。",
  dimensions: [
    { name: "风险意识", value: "高", detail: "你更容易注意到安全、健康和不可逆损失。" },
    { name: "证据偏好", value: "稳健", detail: "你会优先选择证据更硬、适用条件更清楚的行动。" },
    { name: "执行方式", value: "先小后大", detail: "适合把长期行动拆成今天能完成的一步。" },
  ],
  review: [
    "每次做决定时，先把钱、时间、毅力三类成本分别写出来。",
    "不要把死亡率、金钱、时间和人身自由混成一个总分。",
    "遇到‘争议’或‘待核实’条目，把它们当作复查提醒，而不是唯一答案。",
  ],
  sources: [
    "第1节第1条（系安全带，前排后排都系）",
    "第1节第7条（量血压，高了就吃药降到达标）",
    "第1节第19条（45到50岁起做结直肠癌筛查）",
  ],
};

export async function GET(request: Request) {
  const userId = userIdFromCookie(request.headers.get("cookie"));
  if (!userId) return Response.json({ error: "请先绑定并验证邮箱" }, { status: 401 });
  try {
    const entitlement = (await getDb().select({ sku: entitlements.sku }).from(entitlements).where(and(eq(entitlements.userId, userId), isNull(entitlements.revokedAt))).limit(1))[0];
    if (!entitlement) return Response.json({ error: "尚未解锁详细报告" }, { status: 403 });
    return Response.json({ report, sku: entitlement.sku });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "数据库尚未连接" }, { status: 503 });
  }
}
