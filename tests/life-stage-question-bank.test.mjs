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

test("medication scenario keeps every first action within the same short medication-organising task", async () => {
  const { CORE_QUESTIONS } = await import(modulePath);
  const question = CORE_QUESTIONS.find(({ id }) => id === "core-health-3");

  assert.equal(question.prompt, "家里常备药有些混乱，其中几盒的名称或有效期看不清。你现在只有十分钟，最可能先做什么？");
  assert.deepEqual(question.options.slice(0, -1).map(({ label }) => label), [
    "把能辨认和信息不清的药分开，避免之后混用",
    "拍下信息不清的药盒，记下准备向药师确认的问题",
    "先把所有常备药集中到一处，周末再逐盒核对",
  ]);
});

test("core scenarios use short, plain-language setups before asking for one immediate first action", async () => {
  const { CORE_QUESTIONS } = await import(modulePath);
  assert.deepEqual(Object.fromEntries(CORE_QUESTIONS.map(({ id, prompt }) => [id, prompt])), {
    "core-safety-1": "你坐在网约车后排赶时间，安全带却卡住了，同行的人催着出发。你最可能先做什么？",
    "core-safety-2": "出租屋里方便使用的插座只有一个。你打算添一台取暖器，今晚只有十分钟准备。你最可能先做什么？",
    "core-safety-3": "刚搬进新住处，纸箱还没收拾好。睡前只剩十五分钟，你最可能先做什么？",
    "core-health-1": "连续几天熬夜，明天还得早起。今晚有一件待办和半小时空档，你最可能先做什么？",
    "core-health-2": "今天要连续处理几小时材料，场地又窄，没法专门留出运动时间。你最可能先做什么？",
    "core-health-3": "家里常备药有些混乱，其中几盒的名称或有效期看不清。你现在只有十分钟，最可能先做什么？",
    "core-money-1": "这月收入可能晚到两周，房租和几笔账单又快到期。今晚只有二十分钟理账，你最可能先做什么？",
    "core-money-2": "常用设备坏了，得尽快换新；一次付清会占去大半月预算，店里也提供分期。你最可能先做什么？",
    "core-money-3": "收到保障续费提醒，但手头已有几份不同渠道的保障。今天只能花二十分钟，你最可能先做什么？",
    "core-time-1": "下午又多了一项临时任务，原有两项也得今天交；剩下时间最多完成两项。你最可能先做什么？",
    "core-time-2": "一项生活手续拖了很久，材料也很分散。今天恰好空出十五分钟，你最可能先做什么？",
    "core-time-3": "这周很累，周末只有半天空档，还要买日用品和处理家务。你最可能先做什么？",
    "core-relationships-1": "朋友周末请你帮忙搬家，但你已有安排，只能抽出一小时。你最可能先做什么？",
    "core-relationships-2": "最近有件烦心事想找人谈，但熟悉的人都很忙；你今晚也只有一小段空闲。你最可能先做什么？",
    "core-relationships-3": "你和同住的人最近都很忙，采购、清洁和缴费常常撞在一起。今晚只能聊十分钟，你最可能先做什么？",
    "core-information-1": "准备买一项服务时，两篇评测给出相反结论，优惠今晚截止。你只剩二十分钟，最可能先做什么？",
    "core-information-2": "准备签一份服务约定，但销售只留十分钟介绍，文本很长，有些收费名词也不熟悉。你最可能先做什么？",
    "core-information-3": "一笔服务扣费和预期不同，付款与聊天记录又散在几个应用里。午休只剩十五分钟，你最可能先做什么？",
  });
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
  for (const question of CORE_QUESTIONS) {
    const actions = question.options.filter(({ value }) => value !== "not-sure");
    assert.ok(actions.length >= 2 && actions.length <= 4);
    assert.ok(actions.every(({ contextSignals }) => contextSignals.some((signal) => signal.startsWith("approach:"))), `${question.id} identifies the selected first-action approach`);
    for (const option of actions) {
      assert.ok(Array.isArray(option.reviewSignals), `${question.id}/${option.value} has an explicit review classification`);
      assert.ok(Array.isArray(option.strengthSignals), `${question.id}/${option.value} has an explicit strength classification`);
      assert.ok(option.reviewSignals.length + option.strengthSignals.length > 0);
    }
  }
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
