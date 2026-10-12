import assert from "node:assert/strict";
import test from "node:test";
import * as catalogModule from "../lib/guide-action-catalog.mjs";
import { createAssessmentSnapshot } from "../lib/life-value-assessment.mjs";
import { LIFE_STAGES, STAGE_QUESTION_BANK, buildQuestionSet } from "../lib/life-stage-question-bank.mjs";

const { ACTION_CATALOG, GUIDE_SOURCE_REVISION, actionPresentationFor, selectActions } = catalogModule;
const revision = "20718eeab32cb8506971fb71b03e66a91077be07";
const lensIds = ["safety-health", "time-energy", "money-rights"];
const snapshotFor = (lifeStages, overrides = {}, priorityStage = null) => createAssessmentSnapshot({
  lifeStages, priorityStage,
  answers: Object.fromEntries(buildQuestionSet(lifeStages).map((question) => [
    question.id, overrides[question.id] ?? (question.input === "likert" ? 3 : "prefer-not-to-say"),
  ])),
});
const recommend = (...args) => {
  assert.equal(typeof catalogModule.selectRecommendations, "function", "v3 recommendation selector is available");
  return catalogModule.selectRecommendations(...args);
};
const candidate = (id, overrides = {}) => ({
  id, chapter: "第15节第3条", title: "中介不得代收代付租金和押金，钱直接给房东",
  sourceUrl: "https://github.com/eternity4719/HowToLiveBetter/blob/" + revision + "/book/15-%E7%A7%9F%E6%88%BF%E4%B8%8E%E4%B9%B0%E6%88%BF.md#L22-L29",
  lens: "money-rights", benefit: "减少租金和押金经中介转手带来的风险",
  costs: { money: "0", time: "少", willpower: "些" }, ratioTier: "高", evidenceGrade: "A",
  firstStep: "付款前核对收款人", stageIds: ["studying-graduating"],
  signalRequirements: ["housing:renting"], status: "ready", caveats: [], ...overrides,
});

test("curated rows retain pinned complete sources, verified costs/evidence and valid stage signals", () => {
  assert.equal(GUIDE_SOURCE_REVISION, revision);
  assert.deepEqual(new Set(ACTION_CATALOG.map(({ lens }) => lens)), new Set(lensIds));
  const stageIds = new Set(LIFE_STAGES.map(({ id }) => id));
  const signals = new Set(Object.values(STAGE_QUESTION_BANK).flat().flatMap(({ options }) => options.flatMap((option) => option.signals)));
  // Hand-checked complete entries, not values computed by the production catalog.
  const verified = {
    seatbelt: ["第1节第1条", "#L20-L27", "0", "少", "否", "极高", "A"],
    "riding-helmet": ["第1节第2条", "#L28-L35", "少", "少", "否", "高", "A"],
    "child-car-seat": ["第1节第10条", "#L94-L101", "多", "少", "否", "高", "A"],
    "elder-fall-prevention": ["第1节第13条", "#L119-L127", "少", "多", "是", "一般", "A"],
    "smoke-alarm": ["第1节第3条", "#L36-L43", "少", "少", "否", "高", "B"],
    "child-window-guards": ["第1节第11条", "#L102-L110", "少", "少", "否", "高", "B"],
    "implementation-intention": ["第4节第1条", "#L6-L13", "0", "少", "否", "极高", "A"],
    "exit-conditions": ["第4节第2条", "#L14-L21", "0", "少", "些", "高", "B"],
    "reduce-meetings": ["第4节第6条", "#L47-L54", "0", "少", "些", "高", "B"],
    "renter-payment": ["第15节第3条", "#L22-L29", "0", "少", "些", "高", "A"],
    "renter-deposit": ["第15节第1条", "#L6-L13", "0", "少", "些", "一般", "A"],
  };
  assert.equal(ACTION_CATALOG.length, Object.keys(verified).length);
  assert.equal(new Set(ACTION_CATALOG.map(({ id }) => id)).size, ACTION_CATALOG.length);
  for (const action of ACTION_CATALOG) {
    assert.ok(action.id && action.chapter && action.title && action.benefit && action.firstStep);
    assert.ok(action.sourceUrl.startsWith("https://github.com/eternity4719/HowToLiveBetter/blob/" + revision + "/book/"));
    const [chapter, anchor, money, time, willpower, ratioTier, evidenceGrade] = verified[action.id];
    assert.equal(action.chapter, chapter);
    assert.ok(action.sourceUrl.endsWith(anchor));
    assert.deepEqual(action.costs, { money, time, willpower });
    assert.equal(action.ratioTier, ratioTier);
    assert.equal(action.evidenceGrade, evidenceGrade);
    assert.ok(["ready", "controversial", "manual-review", "todo"].includes(action.status));
    assert.ok(Array.isArray(action.caveats));
    assert.ok(Array.isArray(action.stageIds) && action.stageIds.length > 0);
    assert.ok(action.stageIds.every((id) => stageIds.has(id)));
    assert.ok(Array.isArray(action.signalRequirements));
    assert.ok(action.signalRequirements.every((signal) => signals.has(signal)));
    if (["ready", "controversial"].includes(action.status)) assert.ok(action.signalRequirements.length > 0);
  }
});

test("v3 recommendations expose independent lenses and only selected stage keys", () => {
  const result = recommend(snapshotFor(["stable-work", "living-alone"], {
    "stable-work-work-boundaries": "priority", "living-alone-home-safety": "alarms",
  }));
  assert.deepEqual(Object.keys(result), ["lenses", "stages"]);
  assert.deepEqual(Object.keys(result.lenses), lensIds);
  assert.deepEqual(Object.keys(result.stages), ["stable-work", "living-alone"]);
  assert.equal(result.lenses["time-energy"].id, "implementation-intention");
  assert.equal(result.lenses["safety-health"].id, "smoke-alarm");
  assert.equal(result.lenses["money-rights"], null);
});

test("all required signals and a selected mapped stage must match", () => {
  const row = candidate("renter", { signalRequirements: ["housing:renting", "approach:verify"] });
  assert.equal(recommend(snapshotFor(["studying-graduating"], { "studying-graduating-rent-move": "budget" }), [row]).lenses["money-rights"], null);
  const found = recommend(snapshotFor(["studying-graduating"], { "studying-graduating-rent-move": "terms" }), [row]).lenses["money-rights"];
  assert.equal(found.id, "renter");
  assert.deepEqual(found.matchedSignals, ["housing:renting", "approach:verify"]);
  assert.deepEqual(found.matchedStageIds, ["studying-graduating"]);
  assert.equal(recommend(snapshotFor(["stable-work"]), [row]).lenses["money-rights"], null);
});

test("ratio then evidence then signal fit are compared only within a lens", () => {
  const snapshot = snapshotFor(["studying-graduating"], { "studying-graduating-rent-move": "terms" });
  const rows = [
    candidate("evidence-a"), candidate("tier-high-c", { ratioTier: "极高", evidenceGrade: "C" }),
    candidate("tier-high-b", { ratioTier: "极高", evidenceGrade: "B" }),
    candidate("specific", { ratioTier: "极高", evidenceGrade: "B", signalRequirements: ["housing:renting", "approach:verify"] }),
    candidate("safety", { lens: "safety-health", ratioTier: "一般" }),
    candidate("time", { lens: "time-energy", ratioTier: "一般" }),
  ];
  const { lenses } = recommend(snapshot, rows);
  assert.deepEqual(Object.keys(lenses), lensIds);
  assert.equal(lenses["money-rights"].id, "specific");
  assert.equal(lenses["safety-health"].id, "safety");
  assert.equal(lenses["time-energy"].id, "time");
});

test("stage sections cap at two and deduplicate IDs while merging applicability", () => {
  const snapshot = snapshotFor(["studying-graduating", "living-alone"], { "studying-graduating-rent-move": "terms" });
  const shared = candidate("shared", { stageIds: ["studying-graduating", "living-alone"] });
  const rows = [shared, { ...shared }, candidate("second"), candidate("third"), candidate("alone", { stageIds: ["living-alone"] })];
  const result = recommend(snapshot, rows);
  assert.deepEqual(result.stages["studying-graduating"].map(({ id }) => id), ["shared", "second"]);
  assert.deepEqual(result.stages["living-alone"].map(({ id }) => id), ["alone"]);
  assert.deepEqual(result.stages["studying-graduating"][0].matchedStageIds, ["studying-graduating", "living-alone"]);
  const actions = Object.values(result.stages).flat();
  assert.equal(new Set(actions.map(({ id }) => id)).size, actions.length);
  assert.ok(Object.values(result.stages).every((actions) => actions.length <= 2));
});

test("stage cap never uses another lens's ratio as a cross-lens rank", () => {
  const snapshot = snapshotFor(["studying-graduating"], { "studying-graduating-rent-move": "terms" });
  const rows = [candidate("safety", { lens: "safety-health", ratioTier: "一般" }), candidate("time", { lens: "time-energy", ratioTier: "一般" }), candidate("money", { ratioTier: "极高" })];
  const before = recommend(snapshot, rows);
  const after = recommend(snapshot, rows.map((row) => ({ ...row, ratioTier: row.lens === "money-rights" ? "一般" : "极高" })));
  assert.deepEqual(before.stages["studying-graduating"].map(({ id }) => id), after.stages["studying-graduating"].map(({ id }) => id));
});

test("todo and manual-review rows never recommend and controversy retains its caveats", () => {
  const snapshot = snapshotFor(["studying-graduating"], { "studying-graduating-rent-move": "terms" });
  const rows = [candidate("todo", { status: "todo", ratioTier: "极高" }), candidate("manual", { status: "manual-review", ratioTier: "极高" })];
  assert.deepEqual(recommend(snapshot, rows).stages["studying-graduating"], []);
  assert.equal(recommend(snapshot, rows).lenses["money-rights"], null);
  const disputed = candidate("disputed", { status: "controversial", caveats: ["该效果存在争议"] });
  const result = recommend(snapshot, [...rows, disputed]);
  assert.equal(result.lenses["money-rights"].status, "controversial");
  assert.deepEqual(result.stages["studying-graduating"][0].caveats, ["该效果存在争议"]);
  const meeting = recommend(snapshotFor(["stable-work"], { "stable-work-work-boundaries": "scope" })).lenses["time-energy"];
  assert.equal(meeting.id, "reduce-meetings");
  assert.equal(meeting.status, "controversial");
  assert.ok(meeting.caveats.some((caveat) => caveat.includes("争议")));
});

test("non-disclosure and unsupported contexts produce explicit empty sections", () => {
  const hidden = recommend(snapshotFor(["career-start", "elder-family-care"]));
  assert.deepEqual(hidden, { lenses: { "safety-health": null, "time-energy": null, "money-rights": null }, stages: { "career-start": [], "elder-family-care": [] } });
  const unmatched = recommend(snapshotFor(["career-start"], { "career-start-employment-rights": "pay" }));
  assert.deepEqual(unmatched.stages["career-start"], []);
  assert.equal(unmatched.lenses["money-rights"], null);
  const childSeat = ACTION_CATALOG.find(({ id }) => id === "child-car-seat");
  const child = recommend(snapshotFor(["partner-parenting"], { "partner-parenting-home-child-safety": "child-travel" }), [childSeat]);
  assert.equal(child.lenses["safety-health"], null);
  assert.deepEqual(child.stages["partner-parenting"], []);
});

test("priority and selection click order cannot change recommendation selection", () => {
  const overrides = { "stable-work-work-boundaries": "priority", "living-alone-home-safety": "alarms" };
  const base = recommend(snapshotFor(["stable-work", "living-alone"], overrides));
  assert.deepEqual(recommend(snapshotFor(["living-alone", "stable-work"], overrides, "living-alone")), base);
  assert.deepEqual(recommend(snapshotFor(["stable-work", "living-alone"], overrides, "stable-work")), base);
});

test("legacy or malformed snapshots and invalid catalog metadata cannot create recommendations", () => {
  const empty = { lenses: { "safety-health": null, "time-energy": null, "money-rights": null }, stages: {} };
  for (const value of [null, {}, { version: 2, context: { residence: "renting" } }, { version: 3, lifeStages: [], answers: {} }]) assert.deepEqual(recommend(value), empty);
  const snapshot = snapshotFor(["studying-graduating"], { "studying-graduating-rent-move": "terms" });
  const rows = [candidate("missing", { signalRequirements: undefined }), candidate("invalid", { signalRequirements: ["unknown"] }), candidate("wrong-stage", { stageIds: ["new-worker"] })];
  assert.equal(recommend(snapshot, rows).lenses["money-rights"], null);
  assert.deepEqual(recommend(snapshot, rows).stages["studying-graduating"], []);
  assert.deepEqual(selectActions({ residence: "renting" }), empty.lenses);
});

test("v3 compatibility and presentation preserve recommendation identity", () => {
  const snapshot = snapshotFor(["studying-graduating"], { "studying-graduating-rent-move": "terms" });
  const recommendation = selectActions(snapshot, [candidate("renter")])["money-rights"];
  assert.equal(recommendation.id, "renter");
  const verifying = actionPresentationFor({ profile: { id: "steady-verify" }, dimensions: { lowFriction: 2, collaboration: 2 } }, recommendation);
  const acting = actionPresentationFor({ profile: { id: "opportunity-act" }, dimensions: { lowFriction: 4, collaboration: 4 } }, recommendation);
  assert.equal(verifying.action.id, "renter");
  assert.equal(acting.action.id, "renter");
  assert.equal(verifying.emphasis.focus, "evidence-conditions");
  assert.ok(verifying.emphasis.followUpChecklist.length > 0);
  assert.equal(acting.emphasis.focus, "first-step");
  assert.match(acting.emphasis.text, /付款前核对收款人/);
  assert.match(acting.emphasis.supportPrompt, /求助|支持|咨询/);
  assert.equal(actionPresentationFor({}, null), null);
});
