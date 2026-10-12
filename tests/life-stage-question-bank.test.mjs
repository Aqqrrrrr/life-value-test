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
  for (const key of ["LIFE_STAGES", "CORE_QUESTIONS", "STAGE_QUESTION_BANK", "buildQuestionSet", "questionCountFor"]) {
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

test("all questions have unique IDs, valid options and isolated core/stage metadata", async () => {
  const { CORE_QUESTIONS, STAGE_QUESTION_BANK } = await import(modulePath);
  const all = [...CORE_QUESTIONS, ...Object.values(STAGE_QUESTION_BANK).flat()];
  assert.equal(all.length, 46);
  assert.equal(new Set(all.map(({ id }) => id)).size, 46);
  for (const question of all) {
    assert.ok(typeof question.id === "string" && question.id.trim());
    assert.ok(typeof question.prompt === "string" && question.prompt.trim());
    assert.ok(["safety-health", "time-energy", "money-rights"].includes(question.lens));
    assert.ok(["likert", "single"].includes(question.input));
    assert.ok(question.options.length >= 2);
    assert.equal(new Set(question.options.map(({ value }) => value)).size, question.options.length);
    assert.ok(question.options.every(({ value, label }) => value !== undefined && typeof label === "string" && label.trim()));
    if (question.group === "core") {
      assert.equal(Object.hasOwn(question, "stage"), false);
      assert.ok(["protection", "evidence", "lowFriction", "collaboration"].includes(question.dimension));
      assert.equal(Object.hasOwn(question, "signals"), false);
    } else {
      assert.equal(question.group, "stage");
      assert.ok(stageIds.includes(question.stage));
      assert.equal(Object.hasOwn(question, "dimension"), false);
      assert.ok(question.category);
      assert.equal(Object.hasOwn(question, "signals"), false);
      const optOuts = question.options.filter(({ value }) => value === "prefer-not-to-say");
      assert.equal(optOuts.length, 1, `${question.id} must allow non-disclosure exactly once`);
      assert.equal(optOuts[0].label, "暂不说明");
      for (const option of question.options) {
        if (option.value === "prefer-not-to-say") {
          assert.deepEqual(option.signals, []);
        } else {
          assert.ok(option.signals.includes(`focus:${question.category}`));
        }
        assert.equal(new Set(option.signals).size, option.signals.length);
        assert.ok(option.signals.every((signal) => typeof signal === "string" && /^[a-z]+:[a-z-]+$/.test(signal)));
      }
    }
    assert.ok(!JSON.stringify(question).match(/self-harm-risk|immediate-danger|ongoing-legal-proceeding|medical-emergency"/));
  }
});
