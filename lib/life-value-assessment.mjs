const preferNot = { value: "prefer-not-to-say", label: "不说明" };

const options = (entries) => [...entries.map(([value, label]) => ({ value, label })), preferNot];

export const EMERGENCY_OPTIONS = [
  { value: "medical-emergency", label: "我正遇到医疗急症" },
  { value: "self-harm-risk", label: "我有严重自伤想法或正处于紧急危险" },
  { value: "ongoing-legal-proceeding", label: "我正处于正在进行的法律程序" },
  { value: "safe-to-continue", label: "以上情况都不符合，继续测评" },
];

export const CONTEXT_QUESTIONS = [
  {
    id: "currentStage",
    prompt: "你目前大致处于哪个阶段？",
    options: options([
      ["studying", "在读"], ["new-worker", "刚工作"], ["stable-worker", "稳定工作"],
      ["increased-family-responsibility", "家庭责任增加"], ["near-retirement", "退休前后"],
    ]),
  },
  {
    id: "priorities",
    prompt: "你当前最关注哪些方向？最多选两项。",
    multiple: true,
    maxSelections: 2,
    options: options([
      ["safety-health", "安全健康"], ["money-rights", "钱与权益"], ["time-energy", "时间精力"],
      ["work-skills", "工作技能"], ["relationships-family", "关系家庭"],
    ]),
  },
  {
    id: "householdResponsibilities",
    prompt: "你目前主要承担哪些家庭责任？可多选。",
    multiple: true,
    options: options([
      ["self", "主要照顾自己"], ["partner", "伴侣"], ["minor-children", "未成年孩子"], ["elder-care", "老人照护"],
    ]),
  },
  {
    id: "residence",
    prompt: "你的居住情况更接近哪种？",
    options: options([["renting", "租住"], ["owner-occupied", "自住"]]),
  },
  {
    id: "transport",
    prompt: "你通常使用哪些出行方式？可多选。",
    multiple: true,
    options: options([
      ["driving", "驾车"], ["electric-motorcycle", "骑电动车/摩托"], ["public-transit-walking", "公共交通/步行"],
    ]),
  },
  {
    id: "scarceResource",
    prompt: "你目前最稀缺的资源是什么？",
    options: options([
      ["money", "钱"], ["time", "时间"], ["energy", "精力"], ["no-obvious-limit", "无明显限制"],
    ]),
  },
];

const LIKERT_LABELS = ["非常不像我", "比较不像我", "说不清", "比较像我", "非常像我"];
export const LIKERT_OPTIONS = LIKERT_LABELS.map((label, index) => ({ value: index + 1, label }));

export const STYLE_QUESTIONS = [
  { id: "protection-1", dimension: "protection", prompt: "做一个新决定前，我会先排除“出一次事就很难挽回”的风险。" },
  { id: "protection-2", dimension: "protection", prompt: "即使看上去机会很好，只要后果难承受，我通常会先暂缓。" },
  { id: "protection-3", dimension: "protection", prompt: "为了获得可能更大的收益，我愿意接受一些本可避免的风险。", reverse: true },
  { id: "evidence-1", dimension: "evidence", prompt: "遇到健康、金钱或权益建议时，我会先看适用条件和依据。" },
  { id: "evidence-2", dimension: "evidence", prompt: "身边多数人都在做，通常已经足够让我相信。", reverse: true },
  { id: "evidence-3", dimension: "evidence", prompt: "两种说法冲突时，我愿意多花一点时间确认来源。" },
  { id: "lowFriction-1", dimension: "lowFriction", prompt: "我更容易先完成一个小而明确的动作，再决定是否继续投入。" },
  { id: "lowFriction-2", dimension: "lowFriction", prompt: "我会把“以后再做”改成具体的时间、地点或触发条件。" },
  { id: "lowFriction-3", dimension: "lowFriction", prompt: "我宁愿等到计划完整，也不愿先做一个不完美的小步骤。", reverse: true },
  { id: "collaboration-1", dimension: "collaboration", prompt: "涉及健康、法律或钱的复杂问题，我会较早寻求专业或制度支持。" },
  { id: "collaboration-2", dimension: "collaboration", prompt: "除非实在没办法，我通常倾向一个人把问题扛过去。", reverse: true },
  { id: "collaboration-3", dimension: "collaboration", prompt: "我会让家人、朋友或工具参与提醒与执行，而不只靠意志力。" },
];

const PROFILE_DETAILS = {
  "steady-verify": { id: "steady-verify", name: "稳妥核实型" },
  "steady-act": { id: "steady-act", name: "稳妥行动型" },
  "opportunity-verify": { id: "opportunity-verify", name: "机会核实型" },
  "opportunity-act": { id: "opportunity-act", name: "机会行动型" },
};

const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const rounded = (value) => Math.round(value * 100) / 100;

export function isEmergencySelection(selection) {
  return EMERGENCY_OPTIONS.some(({ value }) => value === selection && value !== "safe-to-continue");
}

export function scoreStyleAnswers(answers) {
  if (!validStyleAnswers(answers)) throw new TypeError("风格答案无效");
  const dimensions = {};
  for (const dimension of ["protection", "evidence", "lowFriction", "collaboration"]) {
    const items = STYLE_QUESTIONS.filter((question) => question.dimension === dimension);
    dimensions[dimension] = rounded(average(items.map(({ id, reverse }) => reverse ? 6 - answers[id] : answers[id])));
  }
  dimensions.opportunity = rounded(6 - dimensions.protection);
  dimensions.quickJudgement = rounded(6 - dimensions.evidence);
  dimensions.systemPlanning = rounded(6 - dimensions.lowFriction);
  dimensions.autonomy = rounded(6 - dimensions.collaboration);

  const profileId = `${dimensions.protection >= 3 ? "steady" : "opportunity"}-${dimensions.evidence >= 3 ? "verify" : "act"}`;
  const tendencyIsClear = Math.abs(dimensions.protection - 3) > 0.5 && Math.abs(dimensions.evidence - 3) > 0.5;
  const auxiliaryTags = [];
  if (dimensions.collaboration >= 3.5) auxiliaryTags.push("协作求助倾向");
  if (dimensions.collaboration <= 2.5) auxiliaryTags.push("自主推进倾向");
  if (dimensions.lowFriction <= 2.5) auxiliaryTags.push("系统规划倾向");

  return { dimensions, profile: PROFILE_DETAILS[profileId], auxiliaryTags, tendencyIsClear };
}

const CONTEXT_ALLOWED_VALUES = Object.fromEntries(CONTEXT_QUESTIONS.map(({ id, options: choices }) => [
  id, new Set(choices.map(({ value }) => value)),
]));
const STYLE_IDS = new Set(STYLE_QUESTIONS.map(({ id }) => id));

function validContext(context) {
  if (!context || typeof context !== "object" || Array.isArray(context)) return false;
  if (Object.keys(context).length !== CONTEXT_QUESTIONS.length) return false;
  for (const question of CONTEXT_QUESTIONS) {
    const value = context[question.id];
    const allowed = CONTEXT_ALLOWED_VALUES[question.id];
    if (question.maxSelections || ["householdResponsibilities", "transport"].includes(question.id)) {
      if (!Array.isArray(value) || value.length < 1 || value.some((item) => !allowed.has(item))) return false;
      if (new Set(value).size !== value.length) return false;
      if (value.includes("prefer-not-to-say") && value.length !== 1) return false;
      if (question.maxSelections && value.length > question.maxSelections) return false;
    } else if (typeof value !== "string" || !allowed.has(value)) return false;
  }
  return true;
}

function validStyleAnswers(answers) {
  return Boolean(answers && typeof answers === "object" && !Array.isArray(answers)
    && Object.keys(answers).length === STYLE_IDS.size
    && Object.entries(answers).every(([id, value]) => STYLE_IDS.has(id) && Number.isInteger(value) && value >= 1 && value <= 5));
}

export function createAssessmentSnapshot(context, answers) {
  if (!validContext(context)) throw new TypeError("处境答案无效");
  if (!validStyleAnswers(answers)) throw new TypeError("风格答案无效");
  return {
    version: 2,
    completedAt: new Date().toISOString(),
    context: structuredClone(context),
    styleAnswers: { ...answers },
  };
}

export function parseAssessmentSnapshot(raw) {
  if (typeof raw !== "string") return null;
  try {
    const snapshot = JSON.parse(raw);
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot) || snapshot.version !== 2) return null;
    if (Object.keys(snapshot).sort().join(",") !== "completedAt,context,styleAnswers,version") return null;
    if (typeof snapshot.completedAt !== "string" || Number.isNaN(Date.parse(snapshot.completedAt))) return null;
    if (!validContext(snapshot.context) || !validStyleAnswers(snapshot.styleAnswers)) return null;
    return snapshot;
  } catch {
    return null;
  }
}
