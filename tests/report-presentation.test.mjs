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
import * as assessment from "../lib/life-value-assessment.mjs";
import { createAssessmentSnapshot, ASSESSMENT_STORAGE_KEY } from "../lib/life-value-assessment.mjs";
import { CORE_QUESTIONS, buildQuestionSet } from "../lib/life-stage-question-bank.mjs";
import { ACTION_CATALOG, actionPresentationFor, selectRecommendations } from "../lib/guide-action-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const answers = Object.fromEntries(CORE_QUESTIONS.map(({ id, reverse }) => [id, reverse ? 1 : 5]));
const defaultStages = ["studying-graduating", "stable-work", "living-alone"];
const defaultStageAnswers = {
  "studying-graduating-rent-move": "terms", "stable-work-work-boundaries": "priority",
  "living-alone-home-safety": "alarms",
};
const snapshot = ({ lifeStages = defaultStages, priorityStage = "living-alone", stageAnswers = defaultStageAnswers } = {}, style = answers) => JSON.stringify(createAssessmentSnapshot({
  lifeStages, priorityStage,
  answers: Object.fromEntries(buildQuestionSet(lifeStages).map((question) => [question.id,
    question.input === "likert" ? style[question.id] : stageAnswers[question.id] ?? "prefer-not-to-say",
  ])),
}));

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
  runInNewContext(`(function(require, module, exports) { ${outputText}\n})`, { Response, console, ...overrides.__globals })(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

function render(props = {}, overrides = {}) {
  const { AssessmentResults } = loadTs("components/assessment-results.tsx", overrides);
  return renderToStaticMarkup(React.createElement(AssessmentResults, props));
}

test("missing, malformed and legacy snapshots offer a re-test without an invented profile", () => {
  for (const rawSnapshot of [null, "{", '{"answers":{"1":"A"}}', '{"version":2,"context":{},"styleAnswers":{}}']) {
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
  assert.match(html, /租房/);
  assert.match(html, /钱与权益/);
  assert.match(html, /只对自己真想做的事适用/);
  assert.match(html, /工作场景不一定同样有效/);
  assert.match(html, /收款人不是产权人时/);
  for (const label of ["金钱", "时间", "毅力", "证据等级", "第一步"]) assert.ok(html.includes(label));
  assert.match(html, /href="https:\/\/github.com\/eternity4719\/HowToLiveBetter\/blob\/[^\"]+"/);
  assert.match(html, /第1节第3条/);
  assert.match(html, /烟雾报警器/);
  assert.match(html, /单项回顾性研究/);
  assert.doesNotMatch(html, /<h4[^>]*>核对清单/);
  assert.doesNotMatch(html, /<ol|总分|第.?名/);
});

test("unclear tendencies are qualified and unmatched lenses do not receive substitute actions", () => {
  const neutral = Object.fromEntries(CORE_QUESTIONS.map(({ id }) => [id, 3]));
  const html = render({ rawSnapshot: snapshot({ lifeStages: ["career-start"], priorityStage: null, stageAnswers: {} }, neutral) });
  assert.match(html, /倾向尚不明显/);
  assert.equal((html.match(/暂不自动推荐/g) ?? []).length, 4);
  assert.match(html, /data-stage="career-start"/);
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
  assert.match(html, /单项回顾性研究/);
  assert.match(html, /研究多涉及学生与健康习惯/);
  assert.match(html, /相关制度渠道求助/);
});

test("controversial cards display their actual limits and all alternative applicability conditions", () => {
  const { ActionCard } = loadTs("components/assessment-results.tsx");
  const candidate = ACTION_CATALOG.find(({ id }) => id === "reduce-meetings");
  const action = selectRecommendations(JSON.parse(snapshot({ lifeStages: ["stable-work"], priorityStage: null, stageAnswers: { "stable-work-work-boundaries": "scope" } })), [candidate]).lenses["time-energy"];
  const presentation = actionPresentationFor({ profile: { id: "steady-verify" }, dimensions: { lowFriction: 2, collaboration: 4 } }, action);
  const html = renderToStaticMarkup(React.createElement(ActionCard, { presentation, detailed: true }));
  assert.match(html, /争议提醒/);
  assert.match(html, /稳定工作/);
  assert.match(html, /没有研究直接比较文字异步沟通和开会/);
  assert.match(html, /完成后记录结果与下一次检查时间/);
  assert.match(html, /第4节第6条/);
});

test("style changes affect the profile while free and detailed results retain the same context actions", () => {
  const actingAnswers = Object.fromEntries(CORE_QUESTIONS.map(({ id, reverse }) => [id, reverse ? 5 : 1]));
  for (const [style, expectedName] of [[answers, "稳健验证型"], [actingAnswers, "机会推进型"]]) {
    for (const detailed of [false, true]) {
      const html = render({ rawSnapshot: snapshot({}, style), detailed, reportAccess: true });
      assert.ok(html.includes(expectedName));
      assert.match(html, /烟雾报警器/);
      assert.match(html, /把「打算做」写成「几点、在哪、遇到什么就做什么」/);
      assert.match(html, /中介不得代收代付租金和押金，钱直接给房东/);
    }
  }
});

test("three current stages display priority first followed by canonical order", () => {
  const html = render({ rawSnapshot: snapshot() });
  assert.match(html, /当前生活阶段/);
  assert.ok(html.indexOf("独居") < html.indexOf("在校/毕业过渡"));
  assert.ok(html.indexOf("在校/毕业过渡") < html.indexOf("稳定工作"));
  assert.deepEqual([...html.matchAll(/data-stage="([^"]+)"/g)].map((match) => match[1]), ["living-alone", "studying-graduating", "stable-work"]);
  assert.deepEqual([...html.matchAll(/data-lens="([^"]+)"/g)].map((match) => match[1]), ["safety-health", "time-energy", "money-rights"]);
  assert.doesNotMatch(html, /总分|第.?名/);
});

test("shared stage recommendations render one card with merged applicability and working stage links", () => {
  const html = render({ rawSnapshot: snapshot() });
  assert.equal((html.match(/data-action="implementation-intention"/g) ?? []).length, 1);
  assert.equal((html.match(/<h3[^>]*>把「打算做」/g) ?? []).length, 1);
  assert.match(html, /同时适用阶段[^<]*在校\/毕业过渡[^<]*稳定工作[^<]*独居/);
  assert.match(html, /href="#action-implementation-intention"/);
  assert.match(html, /id="action-implementation-intention"/);
  assert.equal((html.match(/data-action="reduce-meetings"/g) ?? []).length, 1);
  assert.match(html, /争议提醒/);
  const ids = [...html.matchAll(/data-action="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test("priority changes ordering only and the component parses a snapshot once", () => {
  let calls = 0;
  const overrides = { "../lib/life-value-assessment.mjs": { ...assessment, parseAssessmentSnapshot(raw) { calls++; return assessment.parseAssessmentSnapshot(raw); } } };
  const html = render({ rawSnapshot: snapshot() }, overrides);
  assert.equal(calls, 1);
  const other = render({ rawSnapshot: snapshot({ priorityStage: "stable-work" }) });
  const ids = (markup) => [...markup.matchAll(/data-action="([^"]+)"/g)].map((match) => match[1]).sort();
  assert.deepEqual(ids(html), ids(other));
});

test("result and authorized report read the exported v3 storage key", async () => {
  const observed = [];
  const storedSnapshot = snapshot();
  const browser = { localStorage: { getItem(key) { observed.push(key); return storedSnapshot; } } };
  let reportEffect;
  let reportState;
  const resultReact = { ...React, useSyncExternalStore(_subscribe, readSnapshot) { return readSnapshot(); } };
  const reportReact = { ...React, useState() { return [{ status: "loading" }, (state) => { reportState = state; }]; }, useEffect(effect) { reportEffect = effect; } };
  const { default: ResultPage } = loadTs("app/result/page.tsx", { react: resultReact, __globals: { window: browser } });
  const result = renderToStaticMarkup(React.createElement(ResultPage));
  assert.match(result, /当前生活阶段/);
  const { default: ReportPage } = loadTs("app/report/page.tsx", { react: reportReact, __globals: { window: browser, AbortController, fetch: async () => ({ ok: true, json: async () => ({ reportAccess: true, sku: "life-report" }) }) } });
  ReportPage();
  const cleanup = reportEffect();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(observed, [ASSESSMENT_STORAGE_KEY, ASSESSMENT_STORAGE_KEY]);
  assert.equal(reportState.status, "ready");
  assert.equal(reportState.rawSnapshot, storedSnapshot);
  cleanup();
  for (const route of ["app/result/page.tsx", "app/report/page.tsx"]) {
    const source = readFileSync(path.join(root, route), "utf8");
    assert.match(source, /import\s*\{\s*ASSESSMENT_STORAGE_KEY\s*\}/);
    assert.match(source, /localStorage\.getItem\(ASSESSMENT_STORAGE_KEY\)/);
    assert.doesNotMatch(source, /life-value-test-v2/);
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
