import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as assessment from "../lib/life-value-assessment.mjs";
import { createAssessmentSnapshot, ASSESSMENT_STORAGE_KEY } from "../lib/life-value-assessment.mjs";
import { buildQuestionSet } from "../lib/life-stage-question-bank.mjs";
import { ACTION_CATALOG, actionPresentationFor } from "../lib/guide-action-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshot = (answers = {}, lifeStages = ["stable-work"], priorityStage = null) => JSON.stringify(createAssessmentSnapshot({
  lifeStages, priorityStage,
  answers: Object.fromEntries(buildQuestionSet(lifeStages).map(({ id }) => [id, answers[id] ?? "not-sure"])),
}));
const borrowing = () => snapshot({ "core-money-2": "monthly-first" });

// Execute actual TSX/routes, substituting only external D1.
function loadTs(relativePath, overrides = {}) {
  const filename = path.resolve(root, relativePath);
  assert.ok(existsSync(filename), `Missing production presentation: ${relativePath}`);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } });
  const realRequire = createRequire(filename);
  const localRequire = (id) => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.startsWith(".")) {
      const resolved = path.resolve(path.dirname(filename), id);
      if (existsSync(`${resolved}.ts`)) return loadTs(`${resolved}.ts`, overrides);
      if (existsSync(`${resolved}.tsx`)) return loadTs(`${resolved}.tsx`, overrides);
    }
    return realRequire(id);
  };
  const compiled = { exports: {} };
  runInNewContext(`(function(require, module, exports) { ${outputText}\n})`, { Response, console, ...overrides.__globals })(localRequire, compiled, compiled.exports);
  return compiled.exports;
}
function render(props = {}, overrides = {}) {
  return renderToStaticMarkup(React.createElement(loadTs("components/assessment-results.tsx", overrides).AssessmentResults, props));
}
const actionIds = (html) => [...html.matchAll(/data-priority-review="([^"]+)"/g)].map((match) => match[1]);

test("public landing page and document title describe life choices without promising a personality or score", () => {
  const { default: Home } = loadTs("app/page.tsx");
  const { metadata } = loadTs("app/layout.tsx", { "./globals.css": {} });
  const html = renderToStaticMarkup(React.createElement(Home));
  assert.match(html, /生活选择自我测评/);
  assert.match(metadata.title, /生活选择自我测评/);
  assert.doesNotMatch(`${html} ${metadata.title} ${metadata.description}`, /决策风格|人格类型|总分/);
  assert.match(html, /href="\/test"/);
});

test("missing, malformed and legacy v3 snapshots require retest without invented results", () => {
  const legacyV3 = JSON.stringify({ version: 3, completedAt: "2026-10-18T00:00:00Z", lifeStages: ["stable-work"], priorityStage: null, answers: {} });
  for (const rawSnapshot of [null, "{", '{"answers":{"1":"A"}}', legacyV3]) {
    const html = render({ rawSnapshot });
    assert.match(html, /重新完成测试/);
    assert.match(html, /href="\/test"/);
    assert.doesNotMatch(html, /data-priority-review|data-area=/);
  }
});
test("results show six-area snapshot and indicated review with real source and costs", () => {
  const html = render({ rawSnapshot: borrowing() });
  assert.match(html, /本次生活选择地图/);
  assert.match(html, /本次处境快照/);
  assert.match(html, /优先复盘/);
  assert.doesNotMatch(html, /稳健验证型|机会推进型|总分|第.?名|决策风格|data-lens|按生活阶段看行动/);
  assert.deepEqual([...html.matchAll(/data-area="([^"]+)"/g)].map((match) => match[1]), ["safety-home", "health-sleep-care", "money-protection", "time-work-energy", "relationships-boundaries", "information-rights"]);
  assert.deepEqual(actionIds(html), ["borrowing-apr"]);
  assert.ok(actionIds(html).length <= 3);
  for (const label of ["观察", "可能遗漏的成本或收益", "本周第一步", "适用条件", "限制", "金钱", "时间", "毅力", "证据等级", "第5节第7条"]) assert.ok(html.includes(label), label);
  assert.match(html, /href="https:\/\/github.com\/eternity4719\/HowToLiveBetter\/blob\/[^\"]+#L75-L82"/);
  assert.match(html, /民间借贷利率上限不能套用于银行/);
  assert.doesNotMatch(html, /<h4[^>]*>核对清单/);
});
test("uncertainty leaves six areas insufficient with retest links and no substitute actions", () => {
  const html = render({ rawSnapshot: snapshot() });
  assert.equal((html.match(/data-state="insufficient"/g) ?? []).length, 6);
  assert.match(html, /信息不足/);
  assert.match(html, /暂不下结论/);
  assert.deepEqual(actionIds(html), []);
  assert.equal((html.match(/>重新做这一区域复盘<\/a>/g) ?? []).length, 6);
  assert.ok((html.match(/href="\/test"/g) ?? []).length >= 6);
});
test("map preserves protective, mixed and review states as readable text", () => {
  const html = render({ rawSnapshot: snapshot({ "core-safety-1": "adjust-belt", "core-money-2": "check-budget" }) });
  assert.match(html, /data-area="safety-home" data-state="strength"/);
  assert.match(html, /data-area="money-protection" data-state="mixed"/);
  assert.match(html, /已有保护做法/);
  assert.match(html, /可保留，也值得复盘/);
  assert.match(render({ rawSnapshot: borrowing() }), /data-area="money-protection" data-state="review"/);
});
test("free and authorized reports keep identical actions; access only adds checklists", () => {
  const free = render({ rawSnapshot: borrowing() });
  const detailed = render({ rawSnapshot: borrowing(), detailed: true, reportAccess: true });
  assert.deepEqual(actionIds(free), ["borrowing-apr"]);
  assert.deepEqual(actionIds(detailed), actionIds(free));
  assert.match(detailed, /核对清单/);
  assert.doesNotMatch(free, /核对清单<\/h4>/);
  const locked = render({ rawSnapshot: borrowing(), detailed: true, reportAccess: false });
  assert.match(locked, /确认详细报告权限/);
  assert.deepEqual(actionIds(locked), []);
  assert.match(render({ rawSnapshot: null, detailed: true, reportAccess: true }), /已解锁详细报告；请在本设备重新完成测试以生成个性化内容/);
});
test("controversial cards preserve the actual caveat and applicability", () => {
  const { ActionCard } = loadTs("components/assessment-results.tsx");
  const action = ACTION_CATALOG.find(({ id }) => id === "reduce-meetings");
  const presentation = actionPresentationFor({ action, priority: action.priority, areaIds: ["relationships-boundaries"], matchedResponseIds: ["stable-work-work-boundaries"], matchedReviewSignals: ["review:meeting-load"] });
  const html = renderToStaticMarkup(React.createElement(ActionCard, { presentation, detailed: true }));
  assert.match(html, /争议提醒/);
  assert.match(html, /工作请求涉及可调整的会议/);
  assert.match(html, /没有研究直接比较文字异步和开会/);
  assert.match(html, /第4节第6条/);
  assert.deepEqual(actionIds(html), ["reduce-meetings"]);
});
test("priority stage cannot change reviews and the snapshot is parsed once", () => {
  let calls = 0;
  const overrides = { "../lib/life-value-assessment.mjs": { ...assessment, parseAssessmentSnapshot(raw) { calls++; return assessment.parseAssessmentSnapshot(raw); } } };
  const stages = ["stable-work", "living-alone"];
  const html = render({ rawSnapshot: snapshot({ "core-money-2": "monthly-first" }, stages, "living-alone") }, overrides);
  assert.equal(calls, 1);
  assert.deepEqual(actionIds(html), actionIds(render({ rawSnapshot: snapshot({ "core-money-2": "monthly-first" }, stages, "stable-work") })));
});
test("result and report read only v4 storage; old v3 storage requires retest", async () => {
  const observed = [];
  const storedSnapshot = borrowing();
  const browser = { localStorage: { getItem(key) { observed.push(key); return storedSnapshot; } } };
  let reportEffect;
  let reportState;
  const resultReact = { ...React, useSyncExternalStore(_subscribe, readSnapshot) { return readSnapshot(); } };
  const reportReact = { ...React, useState() { return [{ status: "loading" }, (state) => { reportState = state; }]; }, useEffect(effect) { reportEffect = effect; } };
  const { default: ResultPage } = loadTs("app/result/page.tsx", { react: resultReact, __globals: { window: browser } });
  assert.match(renderToStaticMarkup(React.createElement(ResultPage)), /本次生活选择地图/);
  const { default: ReportPage } = loadTs("app/report/page.tsx", { react: reportReact, __globals: { window: browser, AbortController, fetch: async () => ({ ok: true, json: async () => ({ reportAccess: true, sku: "life-report" }) }) } });
  ReportPage();
  const cleanup = reportEffect();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(observed, ["life-value-test-v4", "life-value-test-v4"]);
  assert.equal(ASSESSMENT_STORAGE_KEY, "life-value-test-v4");
  assert.equal(reportState.status, "ready");
  assert.equal(reportState.rawSnapshot, storedSnapshot);
  cleanup();
  const { default: LegacyResult } = loadTs("app/result/page.tsx", { react: resultReact, __globals: { window: { localStorage: { getItem(key) { return key === "life-value-test-v3" ? '{"version":3}' : null; } } } } });
  assert.match(renderToStaticMarkup(React.createElement(LegacyResult)), /重新完成测试/);
});
async function routeFixture(rows, unavailable = false) {
  const drizzle = await import("drizzle-orm");
  const sqlite = await import("drizzle-orm/sqlite-core");
  const observed = { calls: 0, query: null };
  const query = { from() { return this; }, where(condition) { observed.query = new sqlite.SQLiteSyncDialect().sqlToQuery(condition); return this; }, async limit() { return rows; } };
  const { GET } = loadTs("app/api/me/report/route.ts", {
    "drizzle-orm": drizzle, "drizzle-orm/sqlite-core": sqlite,
    "../../../../db": { getDb() { observed.calls++; if (unavailable) throw new Error("test D1 unavailable"); return { select() { return query; } }; } },
  });
  return { GET, observed };
}
test("report API ignores URL authority and returns 401 without session", async () => {
  const { GET, observed } = await routeFixture([{ sku: "life-report" }]);
  const response = await GET(new Request("https://example.test/api/me/report?reportAccess=true&userId=buyer&sku=life-report"));
  assert.equal(response.status, 401);
  assert.equal(observed.calls, 0);
});
test("report API requires a non-revoked entitlement for the cookie user", async () => {
  const { GET, observed } = await routeFixture([]);
  const response = await GET(new Request("https://example.test/api/me/report?userId=other", { headers: { cookie: "life_session=actual-user" } }));
  assert.equal(response.status, 403);
  assert.deepEqual(observed.query.params, ["actual-user"]);
  assert.match(observed.query.sql, /revoked_at.*is null/);
});
test("report API returns only access and SKU on success", async () => {
  const { GET } = await routeFixture([{ sku: "life-report" }]);
  const response = await GET(new Request("https://example.test/api/me/report", { headers: { cookie: "life_session=buyer" } }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reportAccess: true, sku: "life-report" });
});
test("report API preserves 503 when D1 unavailable", async (t) => {
  t.mock.method(console, "error", () => {});
  const { GET } = await routeFixture([], true);
  const response = await GET(new Request("https://example.test/api/me/report", { headers: { cookie: "life_session=buyer" } }));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "数据库尚未连接" });
});
