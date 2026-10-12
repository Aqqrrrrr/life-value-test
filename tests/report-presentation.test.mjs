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
import { SQLiteSyncDialect } from "drizzle-orm/sqlite-core";
import { createAssessmentSnapshot, STYLE_QUESTIONS } from "../lib/life-value-assessment.mjs";
import { ACTION_CATALOG, actionPresentationFor, selectActions } from "../lib/guide-action-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = {
  currentStage: "stable-worker", priorities: ["time-energy", "money-rights"],
  householdResponsibilities: ["self"], residence: "renting", transport: ["driving"], scarceResource: "time",
};
const answers = Object.fromEntries(STYLE_QUESTIONS.map(({ id, reverse }) => [id, reverse ? 1 : 5]));
const snapshot = (changes = {}, style = answers) => JSON.stringify(createAssessmentSnapshot({ ...context, ...changes }, style));

// Node cannot execute TSX directly. Compile the actual component/route in memory;
// only the Cloudflare D1 boundary is substituted in route tests.
function loadTs(relativePath, overrides = {}) {
  const filename = path.resolve(root, relativePath);
  assert.ok(existsSync(filename), `Missing production presentation: ${relativePath}`);
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
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
  const compiledModule = { exports: {} };
  runInNewContext(`(function(require, module, exports) { ${outputText}\n})`, { Response, console })(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

function render(props = {}) {
  const { AssessmentResults } = loadTs("components/assessment-results.tsx");
  return renderToStaticMarkup(React.createElement(AssessmentResults, props));
}

test("missing, malformed and legacy snapshots offer a re-test without an invented profile", () => {
  for (const rawSnapshot of [null, "{", '{"answers":{"1":"A"}}']) {
    const html = render({ rawSnapshot });
    assert.match(html, /重新完成测试/);
    assert.match(html, /href="\/test"/);
    assert.doesNotMatch(html, /稳健验证型|证据等级|data-lens/);
  }
});

test("free cards render each independent lens with real conditions, caveats, costs and clickable sources", () => {
  const html = render({ rawSnapshot: snapshot() });
  assert.match(html, /稳健验证型/);
  assert.match(html, /协作求助倾向/);
  assert.match(html, /不是.*诊断/);
  assert.match(html, /随.*变化/);
  for (const lens of ["safety-health", "time-energy", "money-rights"]) assert.match(html, new RegExp(`data-lens="${lens}"`));
  assert.match(html, /为什么匹配/);
  assert.match(html, /适用条件/);
  assert.match(html, /驾车/);
  assert.match(html, /租住/);
  assert.match(html, /钱与权益/);
  assert.match(html, /只对自己真想做的事适用/);
  assert.match(html, /工作场景不一定同样有效/);
  assert.match(html, /收款人不是产权人时/);
  for (const label of ["金钱", "时间", "毅力", "证据等级", "第一步"]) assert.ok(html.includes(label));
  assert.match(html, /href="https:\/\/github.com\/eternity4719\/HowToLiveBetter\/blob\/[^\"]+"/);
  assert.match(html, /第1节第1条/);
  assert.match(html, /系安全带，前排后排都系/);
  assert.doesNotMatch(html, /<ol|总分|第.?名/);
});

test("unclear tendencies are qualified and unmatched lenses do not receive substitute actions", () => {
  const neutral = Object.fromEntries(STYLE_QUESTIONS.map(({ id }) => [id, 3]));
  const html = render({ rawSnapshot: snapshot({ transport: ["prefer-not-to-say"], priorities: ["prefer-not-to-say"] }, neutral) });
  assert.match(html, /倾向尚不明显/);
  assert.equal((html.match(/暂不自动推荐/g) ?? []).length, 3);
  assert.doesNotMatch(html, /系安全带|付款前核对收款人/);
});

test("detailed cards require access and a valid local snapshot", () => {
  const locked = render({ rawSnapshot: snapshot(), detailed: true, reportAccess: false });
  assert.doesNotMatch(locked, /data-lens|系安全带|稳健验证型/);
  const missing = render({ rawSnapshot: null, detailed: true, reportAccess: true });
  assert.match(missing, /已解锁详细报告；请在本设备重新完成测试以生成个性化内容/);
  assert.match(missing, /href="\/test"/);
  const html = render({ rawSnapshot: snapshot(), detailed: true, reportAccess: true });
  assert.match(html, /如何理解这次结果/);
  assert.match(html, /核对清单/);
  assert.match(html, /来源中的降幅是基于事故资料的估计/);
  assert.match(html, /研究多涉及学生与健康习惯/);
  assert.match(html, /相关制度渠道求助/);
});

test("controversial cards display their actual limits and all alternative applicability conditions", () => {
  const { ActionCard } = loadTs("components/assessment-results.tsx");
  const candidate = ACTION_CATALOG.find(({ id }) => id === "reduce-meetings");
  const action = selectActions(context, [candidate])["time-energy"];
  const presentation = actionPresentationFor({ profile: { id: "steady-verify" }, dimensions: { lowFriction: 2, collaboration: 4 } }, action);
  const html = renderToStaticMarkup(React.createElement(ActionCard, { presentation, detailed: true }));
  assert.match(html, /争议提醒/);
  assert.match(html, /刚工作或稳定工作或家庭责任增加/);
  assert.match(html, /没有研究直接比较文字异步沟通和开会/);
  assert.match(html, /完成后记录结果与下一次检查时间/);
  assert.match(html, /第4节第6条/);
});

test("style changes affect the profile while free and detailed results retain the same context actions", () => {
  const actingAnswers = Object.fromEntries(STYLE_QUESTIONS.map(({ id, reverse }) => [id, reverse ? 5 : 1]));
  for (const [style, expectedName] of [[answers, "稳健验证型"], [actingAnswers, "机会推进型"]]) {
    for (const detailed of [false, true]) {
      const html = render({ rawSnapshot: snapshot({}, style), detailed, reportAccess: true });
      assert.ok(html.includes(expectedName));
      assert.match(html, /系安全带，前排后排都系/);
      assert.match(html, /把「打算做」写成「几点、在哪、遇到什么就做什么」/);
      assert.match(html, /中介不得代收代付租金和押金，钱直接给房东/);
    }
  }
});

function routeFixture(rows, unavailable = false) {
  const observed = { calls: 0, query: null };
  const query = {
    from() { return this; },
    where(condition) { observed.query = new SQLiteSyncDialect().sqlToQuery(condition); return this; },
    async limit() { return rows; },
  };
  const { GET } = loadTs("app/api/me/report/route.ts", {
    "../../../../db": { getDb() { observed.calls++; if (unavailable) throw new Error("test D1 unavailable"); return { select() { return query; } }; } },
  });
  return { GET, observed };
}

test("report API ignores URL authority and returns 401 without a session", async () => {
  const { GET, observed } = routeFixture([{ sku: "life-report" }]);
  const response = await GET(new Request("https://example.test/api/me/report?reportAccess=true&userId=buyer&sku=life-report"));
  assert.equal(response.status, 401);
  assert.equal(observed.calls, 0);
});

test("report API requires a non-revoked entitlement for the cookie user", async () => {
  const { GET, observed } = routeFixture([]);
  const response = await GET(new Request("https://example.test/api/me/report?userId=other", { headers: { cookie: "life_session=actual-user" } }));
  assert.equal(response.status, 403);
  assert.deepEqual(observed.query.params, ["actual-user"]);
  assert.match(observed.query.sql, /revoked_at.*is null/);
});

test("report API returns only access and SKU on success", async () => {
  const { GET } = routeFixture([{ sku: "life-report" }]);
  const response = await GET(new Request("https://example.test/api/me/report", { headers: { cookie: "life_session=buyer" } }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reportAccess: true, sku: "life-report" });
});

test("report API preserves 503 when D1 is unavailable", async (t) => {
  t.mock.method(console, "error", () => {});
  const { GET } = routeFixture([], true);
  const response = await GET(new Request("https://example.test/api/me/report", { headers: { cookie: "life_session=buyer" } }));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "数据库尚未连接" });
});
