import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTION_CATALOG,
  GUIDE_SOURCE_REVISION,
  actionPresentationFor,
  selectActions,
} from "../lib/guide-action-catalog.mjs";

const revision = "20718eeab32cb8506971fb71b03e66a91077be07";
const context = {
  currentStage: "stable-worker",
  priorities: ["money-rights", "time-energy"],
  householdResponsibilities: ["self"],
  residence: "renting",
  transport: ["public-transit-walking"],
  scarceResource: "time",
};
const candidate = (id, overrides = {}) => ({
  id,
  chapter: "第15节第3条",
  title: "中介不得代收代付租金和押金，钱直接给房东",
  sourceUrl: `https://github.com/eternity4719/HowToLiveBetter/blob/${revision}/book/15-%E7%A7%9F%E6%88%BF%E4%B8%8E%E4%B9%B0%E6%88%BF.md#L21-L28`,
  lens: "money-rights",
  benefit: "避免租金和押金经由中介代收代付",
  costs: { money: "0", time: "少", willpower: "些" },
  ratioTier: "高",
  evidenceGrade: "A",
  firstStep: "付款前核对收款人",
  requirements: { residence: ["renting"] },
  status: "ready",
  caveats: [],
  ...overrides,
});

test("curated actions retain pinned source and all three cost labels", () => {
  assert.equal(GUIDE_SOURCE_REVISION, revision);
  assert.ok(ACTION_CATALOG.length >= 3);
  assert.deepEqual(new Set(ACTION_CATALOG.map(({ lens }) => lens)), new Set(["safety-health", "time-energy", "money-rights"]));
  for (const action of ACTION_CATALOG) {
    assert.ok(action.id && action.chapter && action.title && action.benefit && action.firstStep);
    assert.match(action.sourceUrl, new RegExp(`^https://github\\.com/eternity4719/HowToLiveBetter/blob/${revision}/book/`));
    assert.match(action.sourceUrl, /#L\d+-L\d+$/);
    assert.deepEqual(Object.keys(action.costs).sort(), ["money", "time", "willpower"]);
    assert.ok(["0", "少", "多"].includes(action.costs.money));
    assert.ok(["少", "中", "多"].includes(action.costs.time));
    assert.ok(["否", "些", "是"].includes(action.costs.willpower));
    assert.ok(["极高", "高", "一般"].includes(action.ratioTier));
    assert.ok(["A", "B", "C"].includes(action.evidenceGrade));
    assert.ok(["ready", "controversial", "manual-review", "todo"].includes(action.status));
    assert.ok(Array.isArray(action.caveats));
  }
});

test("renter requirements select a rights action and incompatible context yields null", () => {
  const catalog = [
    candidate("renter-rights"),
    candidate("time-only", { lens: "time-energy", requirements: { transport: ["driving"] } }),
  ];
  const found = selectActions(context, catalog);
  assert.equal(found["money-rights"].id, "renter-rights");
  assert.equal(found["time-energy"], null);
  assert.equal(found["safety-health"], null);
  assert.equal(selectActions({ ...context, residence: "owner-occupied" }, catalog)["money-rights"], null);
});

test("multi-select requirements match their field and never invent a disclosed preference", () => {
  const row = candidate("child-rider", {
    lens: "safety-health",
    requirements: {
      householdResponsibilities: ["minor-children"],
      transport: ["driving", "electric-motorcycle"],
      priorities: ["safety-health"],
    },
  });
  assert.equal(selectActions(context, [row])["safety-health"], null);
  const matching = {
    ...context,
    priorities: ["safety-health", "money-rights"],
    householdResponsibilities: ["self", "minor-children"],
    transport: ["driving"],
  };
  assert.equal(selectActions(matching, [row])["safety-health"].id, "child-rider");
  assert.equal(selectActions({ ...matching, transport: ["prefer-not-to-say"] }, [row])["safety-health"], null);
});

test("todo and manual-review candidates cannot be auto-recommended", () => {
  const rows = [candidate("todo", { status: "todo", ratioTier: "极高" }), candidate("manual", { status: "manual-review", ratioTier: "极高" })];
  assert.equal(selectActions(context, rows)["money-rights"], null);
  assert.equal(selectActions(context, [...rows, candidate("ready")])["money-rights"].id, "ready");
});

test("the catalog does not auto-recommend age-limited child guidance without a child's age", () => {
  const childSeat = ACTION_CATALOG.find(({ id }) => id === "child-car-seat");
  const childContext = {
    ...context,
    priorities: ["safety-health"],
    householdResponsibilities: ["minor-children"],
    transport: ["driving"],
  };
  assert.equal(selectActions(childContext, [childSeat])["safety-health"], null);
});

test("controversial recommendation remains eligible with its caveat", () => {
  const row = candidate("contested", { status: "controversial", caveats: ["该效果存在争议"] });
  const selected = selectActions(context, [row])["money-rights"];
  assert.equal(selected.id, "contested");
  assert.deepEqual(selected.caveats, ["该效果存在争议"]);
  assert.equal(selected.status, "controversial");
});

test("sorting is within each lens: ratio, evidence, then matched context tags", () => {
  const rows = [
    candidate("evidence-a", { evidenceGrade: "A" }),
    candidate("tier-high-c", { ratioTier: "极高", evidenceGrade: "C" }),
    candidate("tier-high-b", { ratioTier: "极高", evidenceGrade: "B" }),
    candidate("specific", { ratioTier: "极高", evidenceGrade: "B", requirements: { residence: ["renting"], currentStage: ["stable-worker"] } }),
    candidate("safety", { lens: "safety-health", ratioTier: "一般", requirements: {} }),
    candidate("time", { lens: "time-energy", ratioTier: "一般", requirements: {} }),
  ];
  const selected = selectActions(context, rows);
  assert.deepEqual(Object.keys(selected), ["safety-health", "time-energy", "money-rights"]);
  assert.equal(selected["money-rights"].id, "specific");
  assert.equal(selected["safety-health"].id, "safety");
  assert.equal(selected["time-energy"].id, "time");
});

test("presentation changes emphasis while preserving recommendation identity", () => {
  const recommendation = selectActions(context, [candidate("renter-rights")])["money-rights"];
  const verifying = actionPresentationFor({ profile: { id: "steady-verify" }, dimensions: { lowFriction: 2, collaboration: 2 } }, recommendation);
  const acting = actionPresentationFor({ profile: { id: "opportunity-act" }, dimensions: { lowFriction: 4, collaboration: 4 } }, recommendation);
  assert.equal(verifying.action.id, "renter-rights");
  assert.equal(acting.action.id, "renter-rights");
  assert.equal(verifying.emphasis.focus, "evidence-conditions");
  assert.match(verifying.emphasis.text, /证据|适用/);
  assert.ok(verifying.emphasis.followUpChecklist.length > 0);
  assert.equal(acting.emphasis.focus, "first-step");
  assert.match(acting.emphasis.text, /付款前核对收款人/);
  assert.match(acting.emphasis.supportPrompt, /求助|支持|咨询/);
  assert.equal(actionPresentationFor({ profile: { id: "steady-verify" }, dimensions: {} }, null), null);
});
