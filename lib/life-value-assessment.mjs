import { LIFE_STAGES, buildQuestionSet } from "./life-stage-question-bank.mjs";

export const ASSESSMENT_STORAGE_KEY = "life-value-test-v4";

// Optional direct routes for the UI, never part of assessment answers or scores.
export const SAFETY_ROUTE_OPTIONS = [
  { value: "medical-emergency", label: "我正遇到医疗急症" },
  { value: "self-harm-risk", label: "我有严重自伤想法" },
  { value: "immediate-danger", label: "我正遭遇人身威胁、火灾等紧急危险" },
  { value: "ongoing-legal-proceeding", label: "我正处于正在进行的法律程序" },
];

const isRecord = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
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
    const valid = typeof value === "string" && !isSafetyRoute(value) && question.options.some((option) => option.value === value);
    if (!valid) throw new TypeError("测评答案无效");
  }
}

export function createAssessmentSnapshot(input) {
  const questions = questionSetForSnapshotInput(input);
  validateAnswers(input.answers, questions);
  const { lifeStages, priorityStage } = validateStageSelection(input.lifeStages, input.priorityStage);
  return {
    version: 4,
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
    if (!isRecord(snapshot) || snapshot.version !== 4) return null;
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

export function deriveResponseContexts(snapshot) {
  const questions = questionSetForSnapshotInput(snapshot);
  validateAnswers(snapshot.answers, questions);
  const contexts = { core: [], stage: [] };
  for (const question of questions) {
    const option = question.options.find(({ value }) => value === snapshot.answers[question.id]);
    const uncertain = option.value === "not-sure";
    contexts[question.group].push({
      questionId: question.id, group: question.group, areaId: question.areaId,
      stageId: question.stage ?? null, optionValue: option.value,
      contextSignals: uncertain ? [] : [...option.contextSignals],
      reviewSignals: uncertain ? [] : [...(option.reviewSignals ?? [])],
      strengthSignals: uncertain ? [] : [...(option.strengthSignals ?? [])],
      uncertain,
    });
  }
  return contexts;
}
