import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTEXT_QUESTIONS,
  EMERGENCY_OPTIONS,
  LIKERT_OPTIONS,
  STYLE_QUESTIONS,
  createAssessmentSnapshot,
  isEmergencySelection,
  parseAssessmentSnapshot,
  scoreStyleAnswers,
} from "../lib/life-value-assessment.mjs";

const contextAnswers = {
  currentStage: "stable-worker",
  priorities: ["safety-health"],
  householdResponsibilities: ["self"],
  residence: "renting",
  transport: ["public-transit-walking"],
  scarceResource: "time",
};

const answersWith = (values) => Object.fromEntries(
  STYLE_QUESTIONS.map((question) => [question.id, values[question.id] ?? 3]),
);

test("questionnaire has six context prompts, twelve style prompts, and ordered Likert choices", () => {
  assert.equal(CONTEXT_QUESTIONS.length, 6);
  assert.equal(STYLE_QUESTIONS.length, 12);
  assert.deepEqual(LIKERT_OPTIONS.map(({ value }) => value), [1, 2, 3, 4, 5]);
  assert.ok(EMERGENCY_OPTIONS.length >= 2);
});

test("emergency choice is distinguished from continuing the assessment", () => {
  assert.equal(isEmergencySelection("medical-emergency"), true);
  assert.equal(isEmergencySelection("safe-to-continue"), false);
});

test("reverse-scored style items map a five to a protection score of five", () => {
  const answers = answersWith({ "protection-1": 5, "protection-2": 5, "protection-3": 1 });
  assert.equal(scoreStyleAnswers(answers).dimensions.protection, 5);
});

test("scoring rejects missing and out-of-range Likert answers", () => {
  assert.throws(() => scoreStyleAnswers({}), /风格答案无效/);
  assert.throws(() => scoreStyleAnswers(answersWith({ "protection-1": 6 })), /风格答案无效/);
});

test("protection and evidence orientation selects steady-verify", () => {
  const answers = answersWith({
    "protection-1": 5, "protection-2": 5, "protection-3": 1,
    "evidence-1": 5, "evidence-2": 1, "evidence-3": 5,
  });
  assert.equal(scoreStyleAnswers(answers).profile.id, "steady-verify");
});

test("opportunity and quick-judgement orientation selects opportunity-act", () => {
  const answers = answersWith({
    "protection-1": 1, "protection-2": 1, "protection-3": 5,
    "evidence-1": 1, "evidence-2": 5, "evidence-3": 1,
  });
  assert.equal(scoreStyleAnswers(answers).profile.id, "opportunity-act");
});

test("the remaining two combinations select their corresponding profiles", () => {
  const steadyAct = answersWith({
    "protection-1": 5, "protection-2": 5, "protection-3": 1,
    "evidence-1": 1, "evidence-2": 5, "evidence-3": 1,
  });
  const opportunityVerify = answersWith({
    "protection-1": 1, "protection-2": 1, "protection-3": 5,
    "evidence-1": 5, "evidence-2": 1, "evidence-3": 5,
  });
  assert.equal(scoreStyleAnswers(steadyAct).profile.id, "steady-act");
  assert.equal(scoreStyleAnswers(opportunityVerify).profile.id, "opportunity-verify");
});

test("collaborative responses produce the collaboration auxiliary tag", () => {
  const answers = answersWith({ "collaboration-1": 4, "collaboration-2": 2, "collaboration-3": 4 });
  assert.deepEqual(scoreStyleAnswers(answers).auxiliaryTags, ["协作求助倾向"]);
});

test("neutral answers do not claim a clear tendency", () => {
  assert.equal(scoreStyleAnswers(answersWith({})).tendencyIsClear, false);
});

test("autonomy and system-planning answers produce their auxiliary tags", () => {
  const answers = answersWith({
    "collaboration-1": 1, "collaboration-2": 5, "collaboration-3": 1,
    "lowFriction-1": 1, "lowFriction-2": 1, "lowFriction-3": 5,
  });
  assert.deepEqual(scoreStyleAnswers(answers).auxiliaryTags, ["自主推进倾向", "系统规划倾向"]);
});

test("snapshot contains only versioned assessment data and parses valid v2", () => {
  const snapshot = createAssessmentSnapshot(contextAnswers, answersWith({}));
  assert.deepEqual(Object.keys(snapshot).sort(), ["completedAt", "context", "styleAnswers", "version"]);
  assert.equal(snapshot.version, 2);
  assert.equal(parseAssessmentSnapshot(JSON.stringify(snapshot)).version, 2);
});

test("snapshot parser rejects malformed, old-version, incomplete, and emergency data", () => {
  const valid = createAssessmentSnapshot(contextAnswers, answersWith({}));
  assert.equal(parseAssessmentSnapshot("not json"), null);
  assert.equal(parseAssessmentSnapshot(JSON.stringify({ version: 1 })), null);
  assert.equal(parseAssessmentSnapshot(JSON.stringify({ ...valid, styleAnswers: {} })), null);
  assert.equal(parseAssessmentSnapshot(JSON.stringify({
    ...valid,
    context: { ...valid.context, currentStage: "medical-emergency" },
  })), null);
  assert.equal(parseAssessmentSnapshot(JSON.stringify({
    ...valid,
    styleAnswers: { ...valid.styleAnswers, unknown: 3 },
  })), null);
  assert.equal(parseAssessmentSnapshot(JSON.stringify({
    ...valid,
    styleAnswers: { ...valid.styleAnswers, "protection-1": "5" },
  })), null);
});

test("snapshot preserves explicit non-disclosure selections", () => {
  const context = { ...contextAnswers, currentStage: "prefer-not-to-say" };
  const snapshot = createAssessmentSnapshot(context, answersWith({}));
  assert.equal(parseAssessmentSnapshot(JSON.stringify(snapshot)).context.currentStage, "prefer-not-to-say");
});
