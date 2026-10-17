import assert from "node:assert/strict";
import test from "node:test";
import * as assessment from "../lib/life-value-assessment.mjs";
import { CORE_QUESTIONS, LIFE_STAGES, buildQuestionSet } from "../lib/life-stage-question-bank.mjs";

const inputWith = (lifeStages = ["stable-work"], overrides = {}) => ({
  lifeStages, priorityStage: null,
  answers: Object.fromEntries(buildQuestionSet(lifeStages).map((question) => [question.id, question.options[0].value])),
  ...overrides,
});

test("v4 snapshots contain only assessment data and round-trip with their storage key", () => {
  const snapshot = assessment.createAssessmentSnapshot(inputWith());
  assert.equal(assessment.ASSESSMENT_STORAGE_KEY, "life-value-test-v4");
  assert.deepEqual(Object.keys(snapshot).sort(), ["answers", "completedAt", "lifeStages", "priorityStage", "version"]);
  assert.equal(snapshot.version, 4);
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
  input.answers[CORE_QUESTIONS[0].id] = "not-sure";
  assert.deepEqual(snapshot.lifeStages, ["stable-work"]);
  assert.equal(snapshot.answers[CORE_QUESTIONS[0].id], CORE_QUESTIONS[0].options[0].value);
});

test("snapshot rejects missing, extra, and unselected-stage answers", () => {
  const input = inputWith();
  const missing = { ...input.answers };
  delete missing["stable-work-work-boundaries"];
  for (const answers of [missing, { ...input.answers, unknown: 3 }, { ...input.answers, "living-alone-home-safety": "devices" }, [], null]) {
    assert.throws(() => assessment.createAssessmentSnapshot({ ...input, answers }), TypeError);
  }
});

test("snapshot rejects every numeric Likert value and unknown core options", () => {
  for (const value of [0, 1, 2, 3, 4, 5, 6, 3.5, "5", "unknown", "devices", "prefer-not-to-say", null, false, NaN, Infinity]) {
    const input = inputWith();
    input.answers[CORE_QUESTIONS[0].id] = value;
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

test("response contexts retain selected core review and strength signals with explicit identity", () => {
  assert.equal(typeof assessment.deriveResponseContexts, "function");
  const input = inputWith();
  input.answers["core-safety-1"] = "ask-driver";
  const contexts = assessment.deriveResponseContexts(assessment.createAssessmentSnapshot(input));
  assert.equal(contexts.core.length, 18);
  assert.equal(contexts.stage.length, 4);
  assert.deepEqual(contexts.core[0], {
    questionId: "core-safety-1", group: "core", areaId: "safety-home", stageId: null,
    optionValue: "ask-driver", contextSignals: ["transport:driving", "approach:support"],
    reviewSignals: [], strengthSignals: ["strength:seat-belt"], uncertain: false,
  });
  input.answers["core-safety-1"] = "adjust-belt";
  const safe = assessment.deriveResponseContexts(assessment.createAssessmentSnapshot(input)).core[0];
  assert.deepEqual(safe.reviewSignals, []);
  assert.deepEqual(safe.strengthSignals, ["strength:seat-belt"]);
});

test("protective first actions can produce a pure strength response in every life area", () => {
  const input = inputWith();
  const cases = [
    ["core-safety-1", "ask-driver", "safety-home", "strength:seat-belt"],
    ["core-health-3", "ask-pharmacist", "health-sleep-care", "strength:medication-check"],
    ["core-money-2", "compare-total", "money-protection", "strength:borrowing-cost"],
    ["core-time-1", "confirm-priority", "time-work-energy", "strength:task-capacity"],
    ["core-relationships-1", "offer-part", "relationships-boundaries", "strength:request-boundary"],
    ["core-information-2", "request-copy", "information-rights", "strength:contract-terms"],
  ];
  for (const [id, value] of cases) input.answers[id] = value;
  const { core } = assessment.deriveResponseContexts(assessment.createAssessmentSnapshot(input));
  for (const [questionId, optionValue, areaId, signal] of cases) {
    const response = core.find((context) => context.questionId === questionId);
    assert.equal(response.areaId, areaId);
    assert.equal(response.optionValue, optionValue);
    assert.equal(response.uncertain, false);
    assert.deepEqual(response.reviewSignals, []);
    assert.deepEqual(response.strengthSignals, [signal]);
  }
});

test("deferred fee checks, bounded budgets and uncertainty retain distinct review, mixed and empty signals", () => {
  const input = inputWith();
  for (const [optionValue, reviews, strengths, uncertain] of [
    ["monthly-first", ["review:borrowing-cost"], [], false],
    ["check-budget", ["review:borrowing-cost"], ["strength:spending-boundary"], false],
    ["not-sure", [], [], true],
  ]) {
    input.answers["core-money-2"] = optionValue;
    const { core } = assessment.deriveResponseContexts(assessment.createAssessmentSnapshot(input));
    const response = core.find(({ questionId }) => questionId === "core-money-2");
    assert.deepEqual(response.reviewSignals, reviews);
    assert.deepEqual(response.strengthSignals, strengths);
    assert.equal(response.uncertain, uncertain);
    assert.deepEqual(core[0].reviewSignals, []);
    assert.deepEqual(core[0].strengthSignals, ["strength:seat-belt"]);
  }
});

test("resource-limited core scenes accept alternative first actions without treating them as completion states", () => {
  const cases = [
    ["core-safety-1", ["adjust-belt", "ask-driver", "change-car"]],
    ["core-money-1", ["list-essentials", "ask-payment-date", "pause-expenses"]],
    ["core-relationships-1", ["clarify-request", "offer-part", "suggest-help"]],
  ];
  for (const [questionId, actions] of cases) {
    const question = CORE_QUESTIONS.find(({ id }) => id === questionId);
    assert.deepEqual(question.options.filter(({ value }) => value !== "not-sure").map(({ value }) => value), actions);
    for (const action of actions) {
      const input = inputWith();
      input.answers[questionId] = action;
      const snapshot = assessment.parseAssessmentSnapshot(JSON.stringify(assessment.createAssessmentSnapshot(input)));
      const response = assessment.deriveResponseContexts(snapshot).core.find((context) => context.questionId === questionId);
      assert.equal(response.optionValue, action);
      assert.equal(response.uncertain, false);
    }
  }
});

test("two selected stage options never splice their context into a fabricated response", () => {
  assert.equal(typeof assessment.deriveResponseContexts, "function");
  const input = inputWith(["partner-parenting", "living-alone"]);
  input.answers["partner-parenting-home-child-safety"] = "child-travel";
  input.answers["living-alone-home-safety"] = "devices";
  const { stage } = assessment.deriveResponseContexts(assessment.createAssessmentSnapshot(input));
  assert.deepEqual(stage.find(({ questionId }) => questionId === "living-alone-home-safety"), {
    questionId: "living-alone-home-safety", group: "stage", areaId: "safety-home", stageId: "living-alone",
    optionValue: "devices", contextSignals: ["focus:home-safety", "approach:verify"],
    reviewSignals: [], strengthSignals: [], uncertain: false,
  });
  assert.deepEqual(stage.find(({ questionId }) => questionId === "partner-parenting-home-child-safety").contextSignals,
    ["focus:home-child-safety", "care:child", "transport:driving"]);
});

test("uncertain answers round-trip with empty signals in both response groups", () => {
  assert.equal(typeof assessment.deriveResponseContexts, "function");
  const input = inputWith(["stable-work", "living-alone", "elder-family-care"]);
  for (const question of buildQuestionSet(input.lifeStages)) input.answers[question.id] = "not-sure";
  const snapshot = assessment.createAssessmentSnapshot(input);
  for (const context of Object.values(assessment.deriveResponseContexts(snapshot)).flat()) {
    assert.equal(context.uncertain, true);
    assert.equal(context.optionValue, "not-sure");
    assert.deepEqual(context.contextSignals, []);
    assert.deepEqual(context.reviewSignals, []);
    assert.deepEqual(context.strengthSignals, []);
  }
  assert.deepEqual(assessment.parseAssessmentSnapshot(JSON.stringify(snapshot)), snapshot);
});

test("context derivation validates answers and does not expose mutable option signal arrays", () => {
  assert.equal(typeof assessment.deriveResponseContexts, "function");
  const snapshot = assessment.createAssessmentSnapshot(inputWith());
  assert.throws(() => assessment.deriveResponseContexts({ ...snapshot, answers: {} }), TypeError);
  const context = assessment.deriveResponseContexts(snapshot).core[0];
  context.contextSignals.push("fake:signal");
  assert.equal(assessment.deriveResponseContexts(snapshot).core[0].contextSignals.includes("fake:signal"), false);
});

test("parser canonicalizes a valid reordered stage list", () => {
  const snapshot = assessment.createAssessmentSnapshot(inputWith(["career-start", "living-alone"]));
  assert.deepEqual(assessment.parseAssessmentSnapshot(JSON.stringify({ ...snapshot, lifeStages: ["living-alone", "career-start"] })).lifeStages, ["career-start", "living-alone"]);
});

test("parser rejects v3, earlier, malformed, and schema-expanded snapshots", () => {
  const valid = assessment.createAssessmentSnapshot(inputWith());
  for (const raw of [null, undefined, valid, "not json", "null", "[]", JSON.stringify({ version: 1 }), JSON.stringify({ version: 2, context: {}, styleAnswers: {} }),
    JSON.stringify({ ...valid, version: 2 }), JSON.stringify({ ...valid, version: 3 }), JSON.stringify({ ...valid, context: {} }), JSON.stringify({ ...valid, profile: "steady-verify" }),
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
