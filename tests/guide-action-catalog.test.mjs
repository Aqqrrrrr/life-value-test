import assert from "node:assert/strict";
import test from "node:test";
import * as catalogModule from "../lib/guide-action-catalog.mjs";
import { createAssessmentSnapshot } from "../lib/life-value-assessment.mjs";
import { LIFE_AREAS, CORE_QUESTIONS, STAGE_QUESTION_BANK, buildQuestionSet } from "../lib/life-stage-question-bank.mjs";

const { ACTION_CATALOG, GUIDE_SOURCE_REVISION, actionPresentationFor } = catalogModule;
const revision = "20718eeab32cb8506971fb71b03e66a91077be07";
const snapshotFor = (overrides = {}, lifeStages = ["studying-graduating"], priorityStage = null) => createAssessmentSnapshot({
  lifeStages, priorityStage,
  answers: Object.fromEntries(buildQuestionSet(lifeStages).map(({ id }) => [id, overrides[id] ?? "not-sure"])),
});
const select = (...args) => {
  assert.equal(typeof catalogModule.selectPriorityReviews, "function", "v4 priority review selector is available");
  return catalogModule.selectPriorityReviews(...args);
};
const candidate = (id, overrides = {}) => ({
  id, chapter: "第5节第7条", title: "核对贷款年化利率", sourceRevision: revision,
  sourceUrl: `https://github.com/eternity4719/HowToLiveBetter/blob/${revision}/book/05-%E4%B8%8D%E8%A6%81%E6%B5%AA%E8%B4%B9%E9%92%B1.md#L75-L82`,
  originalSources: ["https://www.gov.cn/zhengce/zhengceku/2021-03/31/content_5597156.htm"],
  areaIds: ["money-protection"], priority: "resource-protection", benefit: "比较借款总成本", benefitLens: "金钱", benefitMagnitude: "中",
  costs: { money: "0", time: "少", willpower: "些" }, ratioTier: "一般", evidenceGrade: "C",
  firstStep: "签约前索取包含相关费用的年化利率", applicability: ["正在比较消费分期"],
  triggers: [{ questionId: "core-money-2", reviewSignals: ["review:borrowing-cost"], contextSignals: ["money:borrowing"] }],
  status: "ready", caveats: ["以自己合同上的利率和费用为准"], ...overrides,
});

test("every curated candidate preserves its audited complete entry and source limitations", () => {
  assert.equal(GUIDE_SOURCE_REVISION, revision);
  // Hand-checked full entries at the fixed revision, including the final 备注.
  const verified = {
    seatbelt: ["第1节第1条", "#L23-L30", "0", "少", "否", "极高", "A", "死亡率", "大"],
    "riding-helmet": ["第1节第2条", "#L32-L39", "少", "少", "否", "高", "A", "死亡率", "大"],
    "child-car-seat": ["第1节第10条", "#L104-L111", "多", "少", "否", "高", "A", "死亡率", "大"],
    "elder-fall-prevention": ["第1节第13条", "#L131-L138", "少", "多", "是", "一般", "A", "死亡率", "大"],
    "smoke-alarm": ["第1节第3条", "#L41-L48", "少", "少", "否", "高", "B", "死亡率", "大"],
    "child-window-guards": ["第1节第11条", "#L113-L120", "少", "少", "否", "高", "B", "死亡率", "大"],
    "implementation-intention": ["第4节第1条", "#L7-L14", "0", "少", "否", "极高", "A", "时间", "大"],
    "exit-conditions": ["第4节第2条", "#L16-L23", "0", "少", "些", "高", "B", "时间", "大"],
    "reduce-meetings": ["第4节第6条", "#L52-L59", "0", "少", "些", "高", "B", "时间", "大"],
    "renter-payment": ["第15节第3条", "#L25-L32", "0", "少", "些", "高", "A", "金钱", "大"],
    "renter-deposit": ["第15节第1条", "#L7-L14", "0", "少", "些", "一般", "A", "金钱", "中"],
    "sleep-recovery": ["第3节第3条", "#L37-L44", "0", "多", "些", "一般", "A", "时间", "大"],
    "relationship-boundaries": ["第3节第16条", "#L154-L161", "0", "少", "是", "一般", "C", "时间", "中"],
    "borrowing-apr": ["第5节第7条", "#L75-L82", "0", "少", "些", "一般", "C", "金钱", "中"],
    "read-before-signing": ["第8节第17条", "#L169-L176", "0", "少", "些", "高", "A", "金钱", "大"],
  };
  assert.equal(ACTION_CATALOG.length, Object.keys(verified).length);
  assert.equal(new Set(ACTION_CATALOG.map(({ id }) => id)).size, ACTION_CATALOG.length);
  const questionIds = new Set([...CORE_QUESTIONS, ...Object.values(STAGE_QUESTION_BANK).flat()].map(({ id }) => id));
  for (const action of ACTION_CATALOG) {
    const [chapter, anchor, money, time, willpower, ratio, evidence, lens, magnitude] = verified[action.id];
    assert.equal(action.chapter, chapter);
    assert.equal(action.sourceRevision, revision);
    assert.ok(action.sourceUrl.startsWith(`https://github.com/eternity4719/HowToLiveBetter/blob/${revision}/book/`));
    assert.ok(action.sourceUrl.endsWith(anchor));
    assert.deepEqual(action.costs, { money, time, willpower });
    assert.equal(action.ratioTier, ratio);
    assert.equal(action.evidenceGrade, evidence);
    assert.equal(action.benefitLens, lens);
    assert.equal(action.benefitMagnitude, magnitude);
    for (const field of ["title", "benefit", "firstStep"]) assert.ok(action[field]?.length > 0);
    for (const field of ["originalSources", "applicability", "caveats", "triggers", "areaIds"]) assert.ok(action[field]?.length > 0);
    assert.ok(action.originalSources.every((url) => /^https?:\/\//.test(url)));
    assert.ok(["ready", "controversial", "manual-review", "todo"].includes(action.status));
    assert.ok(action.areaIds.every((id) => LIFE_AREAS.some((area) => area.id === id)));
    assert.ok(action.triggers.every((trigger) => questionIds.has(trigger.questionId) && trigger.reviewSignals.length > 0));
  }
  for (const { id } of LIFE_AREAS) assert.ok(ACTION_CATALOG.some((row) => row.areaIds.includes(id) && ["ready", "controversial"].includes(row.status)));
});

test("uncertainty produces six insufficient areas and no filler cards", () => {
  const result = select(snapshotFor());
  assert.deepEqual(Object.keys(result), ["map", "cards"]);
  assert.deepEqual(result.map.map(({ areaId, state }) => [areaId, state]), [
    ["safety-home", "insufficient"], ["health-sleep-care", "insufficient"], ["money-protection", "insufficient"],
    ["time-work-energy", "insufficient"], ["relationships-boundaries", "insufficient"], ["information-rights", "insufficient"],
  ]);
  assert.deepEqual(result.cards, []);
  assert.ok(result.map.every((entry) => !Object.hasOwn(entry, "score")));
});

test("map distinguishes strength, review and mixed without converting protection into a problem", () => {
  const state = (answers) => select(snapshotFor(answers)).map.find(({ areaId }) => areaId === "money-protection").state;
  assert.equal(state({ "core-money-2": "compare-total" }), "strength");
  assert.equal(state({ "core-money-2": "monthly-first" }), "review");
  assert.equal(state({ "core-money-2": "check-budget" }), "mixed");
  assert.equal(state({ "core-money-1": "list-essentials", "core-money-2": "monthly-first" }), "mixed");
  assert.deepEqual(select(snapshotFor({ "core-safety-1": "adjust-belt" })).cards, []);
});

test("a stage topic or approach alone cannot qualify a review or infer a deficit", () => {
  const result = select(snapshotFor({ "living-alone-home-safety": "alarms", "living-alone-emergency-plan": "info" }, ["living-alone"]));
  assert.equal(result.map.find(({ areaId }) => areaId === "safety-home").state, "insufficient");
  assert.deepEqual(result.cards, []);
});

test("the real borrowing review card names only the response that supplies its review signal", () => {
  const result = select(snapshotFor({ "core-money-2": "monthly-first" }));
  assert.equal(result.cards.length, 1);
  assert.equal(result.cards[0].action.id, "borrowing-apr");
  assert.equal(result.cards[0].priority, "resource-protection");
  assert.deepEqual(result.cards[0].matchedResponseIds, ["core-money-2"]);
  assert.deepEqual(result.cards[0].areaIds, ["money-protection"]);
});

test("required signals cannot be assembled from different questions or selected stages", () => {
  const snapshot = snapshotFor({ "core-money-2": "monthly-first", "core-money-1": "list-essentials", "studying-graduating-rent-move": "terms" });
  const rows = [
    candidate("other-core", { triggers: [{ questionId: "core-money-2", reviewSignals: ["review:borrowing-cost"], contextSignals: ["resource:money"] }] }),
    candidate("other-stage", { triggers: [{ questionId: "core-money-2", reviewSignals: ["review:borrowing-cost"], contextSignals: ["housing:renting"] }] }),
    candidate("wrong-question", { triggers: [{ questionId: "core-money-1", reviewSignals: ["review:borrowing-cost"] }] }),
    candidate("missing-review", { triggers: [{ questionId: "core-money-2", reviewSignals: ["review:borrowing-cost", "review:contract-terms"] }] }),
  ];
  assert.deepEqual(select(snapshot, rows).cards, []);
});

test("OR triggers cannot splice the review from one branch with context from another", () => {
  const row = candidate("split", { triggers: [
    { questionId: "core-money-2", reviewSignals: ["review:borrowing-cost"], contextSignals: ["housing:renting"] },
    { questionId: "studying-graduating-rent-move", reviewSignals: ["review:borrowing-cost"], contextSignals: ["housing:renting"] },
  ] });
  assert.deepEqual(select(snapshotFor({ "core-money-2": "monthly-first", "studying-graduating-rent-move": "terms" }), [row]).cards, []);
});

test("each priority selects at most one action using ratio, evidence, then trigger fit", () => {
  const rows = [candidate("ordinary"), candidate("high-c", { ratioTier: "高" }),
    candidate("high-a", { ratioTier: "高", evidenceGrade: "A", triggers: [{ questionId: "core-money-2", reviewSignals: ["review:borrowing-cost"] }] }),
    candidate("specific", { ratioTier: "高", evidenceGrade: "A" }), candidate("risk", { priority: "downside-risk" }), candidate("information", { priority: "information-support" })];
  const result = select(snapshotFor({ "core-money-2": "monthly-first" }), rows);
  assert.deepEqual(result.cards.map(({ priority, action }) => [priority, action.id]), [["downside-risk", "risk"], ["resource-protection", "specific"], ["information-support", "information"]]);
  assert.ok(result.cards.length <= 3);
  assert.equal(new Set(result.cards.map(({ priority }) => priority)).size, result.cards.length);
  assert.ok(result.cards.every(({ matchedResponseIds }) => matchedResponseIds.length >= 1));
  const after = select(snapshotFor({ "core-money-2": "monthly-first" }), rows.map((row) => row.priority === "downside-risk" ? { ...row, ratioTier: "极高" } : row));
  assert.deepEqual(after.cards.map(({ action }) => action.id), ["risk", "specific", "information"]);
});

test("duplicate IDs and repeated triggers cannot duplicate an action across priorities or stages", () => {
  const row = candidate("shared");
  const result = select(snapshotFor({ "core-money-2": "monthly-first", "living-alone-home-safety": "alarms" }, ["studying-graduating", "living-alone"]), [{ ...row, triggers: [...row.triggers, ...row.triggers] }, { ...row }, { ...row, priority: "information-support" }]);
  assert.equal(result.cards.length, 1);
  assert.deepEqual(result.cards[0].matchedResponseIds, ["core-money-2"]);
});

test("todo and manual-review are excluded while controversy keeps its caveats", () => {
  const snapshot = snapshotFor({ "core-money-2": "monthly-first" });
  const excluded = [candidate("todo", { status: "todo" }), candidate("manual", { status: "manual-review" })];
  assert.deepEqual(select(snapshot, excluded).cards, []);
  const disputed = candidate("disputed", { status: "controversial", caveats: ["争议：该效果没有直接比较研究"] });
  const review = select(snapshot, [...excluded, disputed]).cards[0];
  assert.equal(review.action.status, "controversial");
  assert.deepEqual(actionPresentationFor(review).caveats, ["争议：该效果没有直接比较研究"]);
});

test("no eligible action leaves a review state visible without a filler", () => {
  const result = select(snapshotFor({ "core-money-2": "monthly-first" }), []);
  assert.equal(result.map.find(({ areaId }) => areaId === "money-protection").state, "review");
  assert.deepEqual(result.cards, []);
});

test("invalid snapshots and unsafe catalog metadata fail closed", () => {
  for (const value of [null, {}, { version: 3 }, { version: 4, answers: {} }, 1n]) {
    const result = select(value);
    assert.equal(result.map.length, 6);
    assert.ok(result.map.every(({ state }) => state === "insufficient"));
    assert.deepEqual(result.cards, []);
  }
  const row = candidate("invalid");
  const invalid = [{ ...row, triggers: [] }, { ...row, triggers: [{ questionId: "core-money-2", reviewSignals: [] }] },
    { ...row, triggers: [{ questionId: "unknown", reviewSignals: ["review:borrowing-cost"] }] }, { ...row, sourceUrl: "https://example.com/unverified" },
    { ...row, sourceRevision: "main" }, { ...row, originalSources: [] }, { ...row, applicability: [] }, { ...row, evidenceGrade: "D" },
    { ...row, areaIds: ["safety-home"] }, { ...row, priority: "ranking" },
    { ...row, triggers: [{ questionId: "core-money-2", reviewSignals: ["review:borrowing-cost"], contextSignals: "money:borrowing" }] },
    { ...row, status: "controversial", caveats: [] }];
  assert.deepEqual(select(snapshotFor({ "core-money-2": "monthly-first" }), invalid).cards, []);
});

test("stage click order and preferred stage cannot change selection", () => {
  const overrides = { "core-money-2": "check-budget", "living-alone-home-safety": "alarms" };
  assert.deepEqual(select(snapshotFor(overrides, ["living-alone", "studying-graduating"], "living-alone")), select(snapshotFor(overrides, ["studying-graduating", "living-alone"], "studying-graduating")));
});

test("presentation explains only matched card facts without personality emphasis", () => {
  const review = select(snapshotFor({ "core-money-2": "monthly-first" })).cards[0];
  const shown = actionPresentationFor(review);
  assert.equal(shown.action, review.action);
  assert.match(shown.observation, /从这组处境看/);
  assert.match(shown.observation, /分期|费用/);
  assert.ok(shown.ignoredCostOrBenefit.includes(review.action.benefit));
  assert.equal(shown.firstStep, review.action.firstStep);
  assert.deepEqual(shown.applicability, review.action.applicability);
  assert.deepEqual(shown.caveats, review.action.caveats);
  assert.deepEqual(shown.source, { chapter: "第5节第7条", title: review.action.title, url: review.action.sourceUrl, revision, originalSources: review.action.originalSources });
  assert.deepEqual(shown.matchedResponseIds, ["core-money-2"]);
  assert.equal(Object.hasOwn(shown, "emphasis"), false);
  assert.equal(actionPresentationFor(null), null);
});
