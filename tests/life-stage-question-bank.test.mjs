import test from "node:test";
import assert from "node:assert/strict";

const modulePath = "../lib/life-stage-question-bank.mjs";
const stageIds = ["studying-graduating", "career-start", "stable-work", "living-alone", "career-change", "partner-parenting", "elder-family-care"];
const categories = [
  ["job-choice", "rent-move", "first-large-purchase", "support-network"],
  ["employment-rights", "feedback-learning", "overtime-commute", "career-experiment"],
  ["work-boundaries", "energy-recovery", "savings-protection", "career-development"],
  ["home-safety", "emergency-plan", "living-costs", "daily-support"],
  ["cash-flow", "information-check", "transition-plan", "stress-support"],
  ["shared-decisions", "family-budget", "home-child-safety", "time-division"],
  ["care-division", "medical-emergency-info", "family-finance-rights", "caregiver-recovery"],
];

test("exports the required question bank API", async () => {
  let bank;
  try { bank = await import(modulePath); } catch { /* Missing implementation is the expected RED state. */ }
  assert.ok(bank, "the static question bank module must exist");
  for (const key of ["LIFE_STAGES", "LIFE_AREAS", "ASSESSMENT_CHAPTERS", "CORE_QUESTIONS", "STAGE_QUESTION_BANK", "buildQuestionSet", "questionCountFor"]) {
    assert.ok(bank[key], `${key} must be exported`);
  }
});

test("offers seven canonical stages and exactly four category questions per stage", async () => {
  const { LIFE_STAGES, CORE_QUESTIONS, STAGE_QUESTION_BANK } = await import(modulePath);
  assert.deepEqual(LIFE_STAGES.map(({ id }) => id), stageIds);
  assert.equal(CORE_QUESTIONS.length, 18);
  stageIds.forEach((stage, index) => {
    assert.equal(STAGE_QUESTION_BANK[stage].length, 4);
    assert.deepEqual(STAGE_QUESTION_BANK[stage].map(({ category }) => category), categories[index]);
    assert.deepEqual(STAGE_QUESTION_BANK[stage].map(({ id }) => id), categories[index].map((category) => `${stage}-${category}`));
    assert.ok(STAGE_QUESTION_BANK[stage].every((question) => question.stage === stage));
  });
});

test("assembles 22, 26 and 30 questions with cores first and canonical stage order", async () => {
  const { CORE_QUESTIONS, buildQuestionSet, questionCountFor } = await import(modulePath);
  for (const [stages, count] of [[stageIds.slice(0, 1), 22], [stageIds.slice(0, 2), 26], [stageIds.slice(0, 3), 30]]) {
    assert.equal(questionCountFor(stages), count);
    assert.equal(buildQuestionSet(stages).length, count);
  }
  const selection = ["elder-family-care", "living-alone", "career-start"];
  const original = [...selection];
  const set = buildQuestionSet(selection);
  assert.deepEqual(set.slice(0, 18), CORE_QUESTIONS);
  assert.deepEqual(set.slice(18).map(({ stage }) => stage), [
    ...Array(4).fill("career-start"), ...Array(4).fill("living-alone"), ...Array(4).fill("elder-family-care"),
  ]);
  assert.deepEqual(set, buildQuestionSet([...selection].reverse()));
  assert.deepEqual(selection, original, "assembly must not mutate the selected stages");
});

test("rejects invalid selections in both public helpers", async () => {
  const { buildQuestionSet, questionCountFor } = await import(modulePath);
  const sparse = Array(1);
  for (const invalid of [undefined, null, "career-start", {}, [], stageIds.slice(0, 4), ["unknown"], ["career-start", "career-start"], [null], sparse]) {
    assert.throws(() => buildQuestionSet(invalid), TypeError);
    assert.throws(() => questionCountFor(invalid), TypeError);
  }
});

test("scenario questions cover six areas and keep uncertainty separate from selected context", async () => {
  const { LIFE_AREAS, ASSESSMENT_CHAPTERS, CORE_QUESTIONS, STAGE_QUESTION_BANK } = await import(modulePath);
  assert.deepEqual(LIFE_AREAS.map(({ id }) => id), [
    "safety-home", "health-sleep-care", "money-protection",
    "time-work-energy", "relationships-boundaries", "information-rights",
  ]);
  assert.equal(ASSESSMENT_CHAPTERS.length, 3);
  assert.deepEqual(ASSESSMENT_CHAPTERS.flatMap(({ areaIds }) => areaIds), LIFE_AREAS.map(({ id }) => id));
  for (const area of LIFE_AREAS) assert.equal(CORE_QUESTIONS.filter(({ areaId }) => areaId === area.id).length, 3);
  const all = [...CORE_QUESTIONS, ...Object.values(STAGE_QUESTION_BANK).flat()];
  assert.equal(all.length, 46);
  assert.equal(new Set(all.map(({ id }) => id)).size, 46);
  for (const question of all) {
    assert.ok(typeof question.id === "string" && question.id.trim());
    assert.ok(typeof question.prompt === "string" && question.prompt.trim());
    assert.ok(["safety-health", "time-energy", "money-rights"].includes(question.lens));
    assert.equal(question.input, "single");
    assert.ok(LIFE_AREAS.some(({ id }) => id === question.areaId));
    assert.ok(question.options.length >= 2);
    assert.equal(new Set(question.options.map(({ value }) => value)).size, question.options.length);
    assert.ok(question.options.every(({ value, label }) => value !== undefined && typeof label === "string" && label.trim()));
    if (question.group === "core") {
      assert.equal(Object.hasOwn(question, "stage"), false);
      assert.equal(Object.hasOwn(question, "dimension"), false);
      assert.equal(Object.hasOwn(question, "signals"), false);
    } else {
      assert.equal(question.group, "stage");
      assert.ok(stageIds.includes(question.stage));
      assert.equal(Object.hasOwn(question, "dimension"), false);
      assert.ok(question.category);
      assert.equal(Object.hasOwn(question, "signals"), false);
    }
    assert.equal(question.options.at(-1).value, "not-sure");
    assert.equal(question.options.at(-1).label, "我没遇过 / 目前不确定");
    assert.equal(question.options.filter(({ value }) => value === "not-sure").length, 1);
    for (const option of question.options) {
      assert.equal(typeof option.value, "string");
      assert.ok(Array.isArray(option.contextSignals));
      for (const field of ["contextSignals", "reviewSignals", "strengthSignals"]) {
        const signals = option[field] ?? [];
        assert.equal(new Set(signals).size, signals.length);
        assert.ok(signals.every((signal) => typeof signal === "string" && /^[a-z]+:[a-z-]+$/.test(signal)));
        if (option.value === "not-sure") assert.deepEqual(signals, []);
      }
    }
    assert.ok(!JSON.stringify(question).match(/self-harm-risk|immediate-danger|ongoing-legal-proceeding|medical-emergency"/));
  }
});
