import assert from "node:assert/strict";
import test from "node:test";
import * as assessment from "../lib/life-value-assessment.mjs";
import { CORE_QUESTIONS, LIFE_STAGES, buildQuestionSet } from "../lib/life-stage-question-bank.mjs";

const coreAnswersWith = (values = {}) => Object.fromEntries(CORE_QUESTIONS.map(({ id }) => [id, Object.hasOwn(values, id) ? values[id] : 3]));
const inputWith = (lifeStages = ["stable-work"], overrides = {}) => ({
  lifeStages, priorityStage: null,
  answers: Object.fromEntries(buildQuestionSet(lifeStages).map((question) => [question.id, question.input === "likert" ? 3 : question.options[0].value])),
  ...overrides,
});
const orientedAnswers = (protection, evidence) => Object.fromEntries(CORE_QUESTIONS.map((question) => {
  const score = question.dimension === "protection" ? protection : question.dimension === "evidence" ? evidence : 3;
  return [question.id, question.reverse ? 6 - score : score];
}));

test("v3 snapshots contain only assessment data and round-trip with their storage key", () => {
  const snapshot = assessment.createAssessmentSnapshot(inputWith());
  assert.equal(assessment.ASSESSMENT_STORAGE_KEY, "life-value-test-v3");
  assert.deepEqual(Object.keys(snapshot).sort(), ["answers", "completedAt", "lifeStages", "priorityStage", "version"]);
  assert.equal(snapshot.version, 3);
  assert.equal(Number.isNaN(Date.parse(snapshot.completedAt)), false);
  assert.deepEqual(assessment.parseAssessmentSnapshot(JSON.stringify(snapshot)), snapshot);
});

test("stage validation canonicalizes selected stages and preserves a selected priority", () => {
  assert.deepEqual(assessment.validateStageSelection(["living-alone", "career-start", "stable-work"], "living-alone"), {
    lifeStages: ["career-start", "stable-work", "living-alone"], priorityStage: "living-alone",
  });
  const snapshot = assessment.createAssessmentSnapshot(inputWith(["living-alone", "career-start"], { priorityStage: "living-alone" }));
  assert.deepEqual(snapshot.lifeStages, ["career-start", "living-alone"]);
  assert.equal(snapshot.priorityStage, "living-alone");
});

test("stage validation rejects empty, excessive, duplicate, and unknown selections", () => {
  for (const stages of [null, "stable-work", [], Array(1), LIFE_STAGES.slice(0, 4).map(({ id }) => id), ["stable-work", "stable-work"], ["unknown"]]) {
    assert.throws(() => assessment.validateStageSelection(stages, null), TypeError);
  }
});

test("priority must be null or one selected stage", () => {
  assert.deepEqual(assessment.validateStageSelection(["stable-work"], null), { lifeStages: ["stable-work"], priorityStage: null });
  for (const priorityStage of ["living-alone", "unknown", 1, [], undefined]) {
    assert.throws(() => assessment.validateStageSelection(["stable-work"], priorityStage), TypeError);
    assert.throws(() => assessment.createAssessmentSnapshot(inputWith(["stable-work"], { priorityStage })), TypeError);
  }
});

test("question sets contain 22, 26, or 30 questions in deterministic stage order", () => {
  for (const [stages, count] of [
    [["stable-work"], 22], [["living-alone", "career-start"], 26], [["living-alone", "career-start", "stable-work"], 30],
  ]) {
    const questions = assessment.questionSetForSnapshotInput(inputWith(stages));
    assert.equal(questions.length, count);
    assert.deepEqual(questions.slice(0, 18).map(({ id }) => id), CORE_QUESTIONS.map(({ id }) => id));
    assert.equal(Object.keys(assessment.createAssessmentSnapshot(inputWith(stages)).answers).length, count);
  }
  const questions = assessment.questionSetForSnapshotInput(inputWith(["living-alone", "career-start"]));
  assert.equal(questions[18].stage, "career-start");
  assert.equal(questions[22].stage, "living-alone");
});

test("question-set generation rejects invalid stages and an outsider priority", () => {
  assert.throws(() => assessment.questionSetForSnapshotInput({ lifeStages: [], priorityStage: null }), TypeError);
  assert.throws(() => assessment.questionSetForSnapshotInput(inputWith(["stable-work"], { priorityStage: "living-alone" })), TypeError);
});

test("snapshot owns copies of stages and answers", () => {
  const input = inputWith();
  const snapshot = assessment.createAssessmentSnapshot(input);
  input.lifeStages[0] = "living-alone";
  input.answers["core-safety-1"] = 5;
  assert.deepEqual(snapshot.lifeStages, ["stable-work"]);
  assert.equal(snapshot.answers["core-safety-1"], 3);
});

test("snapshot rejects missing, extra, and unselected-stage answers", () => {
  const input = inputWith();
  const missing = { ...input.answers };
  delete missing["stable-work-work-boundaries"];
  for (const answers of [missing, { ...input.answers, unknown: 3 }, { ...input.answers, "living-alone-home-safety": "devices" }, [], null]) {
    assert.throws(() => assessment.createAssessmentSnapshot({ ...input, answers }), TypeError);
  }
});

test("snapshot rejects non-integer and out-of-range Likert answers", () => {
  for (const value of [0, 6, 3.5, "5", null, false, NaN, Infinity]) {
    const input = inputWith();
    input.answers["core-safety-1"] = value;
    assert.throws(() => assessment.createAssessmentSnapshot(input), TypeError);
  }
});

test("snapshot rejects unknown and non-string single-option answers", () => {
  for (const value of ["unknown", 1, ["priority"], null, true]) {
    const input = inputWith();
    input.answers["stable-work-work-boundaries"] = value;
    assert.throws(() => assessment.createAssessmentSnapshot(input), TypeError);
  }
});

test("voluntary safety routes stay outside all question sets and stored answers", () => {
  assert.deepEqual(assessment.SAFETY_ROUTE_OPTIONS.map(({ value }) => value), [
    "medical-emergency", "self-harm-risk", "immediate-danger", "ongoing-legal-proceeding",
  ]);
  for (const stage of LIFE_STAGES) {
    const questions = assessment.questionSetForSnapshotInput(inputWith([stage.id]));
    for (const route of assessment.SAFETY_ROUTE_OPTIONS) {
      assert.equal(assessment.isSafetyRoute(route.value), true);
      assert.equal(questions.some(({ id, options }) => id === route.value || options.some(({ value }) => value === route.value)), false);
      const input = inputWith([stage.id]);
      input.answers[questions[18].id] = route.value;
      assert.throws(() => assessment.createAssessmentSnapshot(input), TypeError);
      const extra = inputWith([stage.id]);
      extra.answers[route.value] = true;
      assert.throws(() => assessment.createAssessmentSnapshot(extra), TypeError);
    }
  }
  assert.equal(assessment.isSafetyRoute("safe-to-continue"), false);
  assert.equal(assessment.isSafetyRoute("unknown"), false);
});

test("core reverse scoring retains the four dimensions and their paired labels", () => {
  const scores = assessment.scoreCoreAnswers(orientedAnswers(5, 5));
  assert.deepEqual(scores.dimensions, {
    protection: 5, evidence: 5, lowFriction: 3, collaboration: 3,
    opportunity: 1, quickJudgement: 1, systemPlanning: 3, autonomy: 3,
  });
  assert.equal(scores.tendencyIsClear, true);
});

test("core scoring rejects missing and invalid core answers", () => {
  assert.throws(() => assessment.scoreCoreAnswers({}), TypeError);
  for (const value of [0, 6, 2.5, "5", null]) {
    assert.throws(() => assessment.scoreCoreAnswers(coreAnswersWith({ "core-safety-1": value })), TypeError);
  }
});

test("core scoring preserves all four profile labels", () => {
  for (const [protection, evidence, id, name] of [
    [5, 5, "steady-verify", "稳健验证型"], [5, 1, "steady-act", "稳健行动型"],
    [1, 5, "opportunity-verify", "机会验证型"], [1, 1, "opportunity-act", "机会推进型"],
  ]) {
    assert.deepEqual(assessment.scoreCoreAnswers(orientedAnswers(protection, evidence)).profile, { id, name });
  }
});

test("collaboration and planning retain auxiliary tags and neutral tendency", () => {
  assert.deepEqual(assessment.scoreCoreAnswers(coreAnswersWith({ "core-support-2": 4, "core-support-3": 4 })).auxiliaryTags, ["协作求助倾向"]);
  const answers = Object.fromEntries(CORE_QUESTIONS.map(({ id, dimension, reverse }) => [id,
    ["collaboration", "lowFriction"].includes(dimension) ? (reverse ? 5 : 1) : 3,
  ]));
  assert.deepEqual(assessment.scoreCoreAnswers(answers).auxiliaryTags, ["自主推进倾向", "系统规划倾向"]);
  assert.equal(assessment.scoreCoreAnswers(coreAnswersWith()).tendencyIsClear, false);
});

test("stage answers, counts, and priorities never alter core profile scores", () => {
  const core = orientedAnswers(5, 1);
  const one = inputWith(["stable-work"], { priorityStage: "stable-work" });
  const three = inputWith(["living-alone", "stable-work", "career-start"], { priorityStage: "living-alone" });
  for (const question of buildQuestionSet(three.lifeStages).filter(({ group }) => group === "stage")) three.answers[question.id] = question.options[1].value;
  Object.assign(one.answers, core);
  Object.assign(three.answers, core);
  assert.deepEqual(assessment.scoreCoreAnswers(assessment.createAssessmentSnapshot(one).answers), assessment.scoreCoreAnswers(core));
  assert.deepEqual(assessment.scoreCoreAnswers(assessment.createAssessmentSnapshot(three).answers), assessment.scoreCoreAnswers(core));
});

test("context signals contain selected option signals only and deduplicate repeats", () => {
  const snapshot = assessment.createAssessmentSnapshot(inputWith(["living-alone"]));
  assert.deepEqual(new Set(assessment.deriveContextSignals(snapshot)), new Set([
    "focus:home-safety", "approach:verify", "focus:emergency-plan", "approach:support",
    "focus:living-costs", "resource:money", "focus:daily-support",
  ]));
  const signals = [...assessment.deriveContextSignals(snapshot)];
  assert.equal(signals.length, new Set(signals).size);
  assert.equal(signals.includes("approach:plan"), false);
  assert.equal(signals.includes("care:child"), false);
  assert.equal(signals.includes("living-alone"), false);
});

test("non-disclosure options round-trip without fabricating context signals", () => {
  const input = inputWith(["stable-work", "living-alone", "elder-family-care"]);
  for (const question of buildQuestionSet(input.lifeStages).filter(({ group }) => group === "stage")) input.answers[question.id] = "prefer-not-to-say";
  const snapshot = assessment.createAssessmentSnapshot(input);
  assert.deepEqual(assessment.deriveContextSignals(snapshot), []);
  assert.deepEqual(assessment.parseAssessmentSnapshot(JSON.stringify(snapshot)), snapshot);
  assert.equal(snapshot.answers["elder-family-care-care-division"], "prefer-not-to-say");
});

test("parser canonicalizes a valid reordered stage list", () => {
  const snapshot = assessment.createAssessmentSnapshot(inputWith(["career-start", "living-alone"]));
  assert.deepEqual(assessment.parseAssessmentSnapshot(JSON.stringify({ ...snapshot, lifeStages: ["living-alone", "career-start"] })).lifeStages, ["career-start", "living-alone"]);
});

test("parser rejects v2, legacy, malformed, and schema-expanded snapshots", () => {
  const valid = assessment.createAssessmentSnapshot(inputWith());
  for (const raw of [null, undefined, valid, "not json", "null", "[]", JSON.stringify({ version: 1 }), JSON.stringify({ version: 2, context: {}, styleAnswers: {} }),
    JSON.stringify({ ...valid, version: 2 }), JSON.stringify({ ...valid, context: {} }), JSON.stringify({ ...valid, profile: "steady-verify" }),
    JSON.stringify({ ...valid, completedAt: "not a date" }), JSON.stringify({ ...valid, completedAt: 1 })]) {
    assert.equal(assessment.parseAssessmentSnapshot(raw), null);
  }
  for (const field of Object.keys(valid)) {
    const incomplete = { ...valid };
    delete incomplete[field];
    assert.equal(assessment.parseAssessmentSnapshot(JSON.stringify(incomplete)), null);
  }
});

test("parser rejects invalid selections and malformed answers", () => {
  const valid = assessment.createAssessmentSnapshot(inputWith());
  for (const mutation of [
    { lifeStages: [] }, { lifeStages: ["unknown"] }, { lifeStages: ["stable-work", "stable-work"] },
    { priorityStage: "living-alone" }, { answers: {} }, { answers: { ...valid.answers, unknown: 3 } },
    { answers: { ...valid.answers, "core-safety-1": "5" } }, { answers: { ...valid.answers, "core-safety-1": 3.5 } },
    { answers: { ...valid.answers, "stable-work-work-boundaries": "medical-emergency" } },
  ]) assert.equal(assessment.parseAssessmentSnapshot(JSON.stringify({ ...valid, ...mutation })), null);
});
