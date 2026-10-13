import { LIFE_STAGES, CORE_QUESTIONS, buildQuestionSet } from "./life-stage-question-bank.mjs";

export const ASSESSMENT_STORAGE_KEY = "life-value-test-v3";

// Optional direct routes for the UI, never part of assessment answers or scores.
export const SAFETY_ROUTE_OPTIONS = [
  { value: "medical-emergency", label: "我正遇到医疗急症" },
  { value: "self-harm-risk", label: "我有严重自伤想法" },
  { value: "immediate-danger", label: "我正遭遇人身威胁、火灾等紧急危险" },
  { value: "ongoing-legal-proceeding", label: "我正处于正在进行的法律程序" },
];

export const LIKERT_OPTIONS = CORE_QUESTIONS[0].options;

const PROFILE_DETAILS = {
  "steady-verify": { id: "steady-verify", name: "稳健验证型" },
  "steady-act": { id: "steady-act", name: "稳健行动型" },
  "opportunity-verify": { id: "opportunity-verify", name: "机会验证型" },
  "opportunity-act": { id: "opportunity-act", name: "机会推进型" },
};

const isRecord = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const isLikert = (value) => Number.isInteger(value) && value >= 1 && value <= 5;
const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const rounded = (value) => Math.round(value * 100) / 100;

export function isSafetyRoute(selection) {
  return SAFETY_ROUTE_OPTIONS.some(({ value }) => value === selection);
}

export function validateStageSelection(lifeStages, priorityStage) {
  if (!Array.isArray(lifeStages) || lifeStages.length < 1 || lifeStages.length > 3) {
    throw new TypeError("请选择 1 至 3 个生活阶段");
  }
  const selected = new Set(lifeStages);
  if (selected.size !== lifeStages.length || [...selected].some((id) => !LIFE_STAGES.some((stage) => stage.id === id))) {
    throw new TypeError("生活阶段必须是有效且不重复的阶段 ID");
  }
  if (priorityStage !== null && !selected.has(priorityStage)) {
    throw new TypeError("优先阶段必须为空或是已选择的生活阶段");
  }
  return {
    lifeStages: LIFE_STAGES.filter(({ id }) => selected.has(id)).map(({ id }) => id),
    priorityStage,
  };
}

export function questionSetForSnapshotInput(input) {
  if (!isRecord(input)) throw new TypeError("测评输入无效");
  const { lifeStages } = validateStageSelection(input.lifeStages, input.priorityStage);
  return buildQuestionSet(lifeStages);
}

function validateAnswers(answers, questions) {
  if (!isRecord(answers) || Object.keys(answers).length !== questions.length) {
    throw new TypeError("测评答案无效");
  }
  for (const question of questions) {
    if (!Object.hasOwn(answers, question.id)) throw new TypeError("测评答案不完整");
    const value = answers[question.id];
    const valid = question.input === "likert"
      ? isLikert(value)
      : typeof value === "string" && !isSafetyRoute(value) && question.options.some((option) => option.value === value);
    if (!valid) throw new TypeError("测评答案无效");
  }
}

export function createAssessmentSnapshot(input) {
  const questions = questionSetForSnapshotInput(input);
  validateAnswers(input.answers, questions);
  const { lifeStages, priorityStage } = validateStageSelection(input.lifeStages, input.priorityStage);
  return {
    version: 3,
    completedAt: new Date().toISOString(),
    lifeStages,
    priorityStage,
    answers: { ...input.answers },
  };
}

export function parseAssessmentSnapshot(raw) {
  if (typeof raw !== "string") return null;
  try {
    const snapshot = JSON.parse(raw);
    if (!isRecord(snapshot) || snapshot.version !== 3) return null;
    if (Object.keys(snapshot).sort().join(",") !== "answers,completedAt,lifeStages,priorityStage,version") return null;
    if (typeof snapshot.completedAt !== "string" || Number.isNaN(Date.parse(snapshot.completedAt))) return null;
    const questions = questionSetForSnapshotInput(snapshot);
    validateAnswers(snapshot.answers, questions);
    const { lifeStages, priorityStage } = validateStageSelection(snapshot.lifeStages, snapshot.priorityStage);
    return { ...snapshot, lifeStages, priorityStage };
  } catch {
    return null;
  }
}

export function scoreCoreAnswers(answers) {
  if (!isRecord(answers) || CORE_QUESTIONS.some(({ id }) => !Object.hasOwn(answers, id) || !isLikert(answers[id]))) {
    throw new TypeError("核心答案无效");
  }
  const dimensions = {};
  for (const dimension of ["protection", "evidence", "lowFriction", "collaboration"]) {
    const items = CORE_QUESTIONS.filter((question) => question.dimension === dimension);
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

export function deriveContextSignals(snapshot) {
  const questions = questionSetForSnapshotInput(snapshot);
  validateAnswers(snapshot.answers, questions);
  const signals = new Set();
  for (const question of questions.filter(({ group }) => group === "stage")) {
    const option = question.options.find(({ value }) => value === snapshot.answers[question.id]);
    for (const signal of option.signals ?? []) signals.add(signal);
  }
  return [...signals];
}
