import assert from "node:assert/strict";
import test from "node:test";
import { ASSESSMENT_STORAGE_KEY, parseAssessmentSnapshot } from "../lib/life-value-assessment.mjs";
import { ASSESSMENT_CHAPTERS, LIFE_AREAS, buildQuestionSet } from "../lib/life-stage-question-bank.mjs";
import { click, findButton, loadTestPage } from "./emergency-routing.test.mjs";

test("the first core page asks for a first step in a concrete situation", () => {
  const page = loadTestPage();
  click(page, "稳定工作");
  click(page, "开始测评");
  assert.match(page.html(), /打车去赶车，车辆还停着/);
  assert.match(page.html(), /按你通常最可能先做的第一步选择/);
  assert.doesNotMatch(page.html(), /非常像我|比较不像我|决策风格/);
});

test("intake requires one to three unique stages and prevents an empty start", () => {
  const page = loadTestPage();
  assert.equal(findButton(page.render(), "开始测评").props.disabled, true);
  click(page, "开始测评", { allowDisabled: true });
  assert.match(page.html(), /当前生活阶段/);
  assert.equal(page.snapshots.length, 0);
  for (const label of ["稳定工作", "独居", "伴侣/育儿"]) click(page, label);
  click(page, "职场起步", { allowDisabled: true });
  assert.equal(findButton(page.render(), "职场起步").props["aria-pressed"], false);
  click(page, "独居");
  click(page, "独居");
  click(page, "开始测评");
  assert.match(page.html(), /1 \/ 30/);
});

test("optional priority offers only selected stages, clears explicitly and clears on deselection", () => {
  const page = loadTestPage();
  assert.equal(findButton(page.render(), "优先展示：独居"), null);
  click(page, "稳定工作");
  click(page, "独居");
  assert.equal(findButton(page.render(), "优先展示：职场起步"), null);
  click(page, "优先展示：独居");
  assert.equal(findButton(page.render(), "优先展示：独居").props["aria-pressed"], true);
  click(page, "不设优先阶段");
  assert.equal(findButton(page.render(), "优先展示：独居").props["aria-pressed"], false);
  click(page, "优先展示：独居");
  click(page, "独居");
  assert.equal(findButton(page.render(), "优先展示：独居"), null);
  assert.equal(findButton(page.render(), "不设优先阶段").props["aria-pressed"], true);
});

for (const { labels, stages, count } of [
  { labels: ["稳定工作"], stages: ["stable-work"], count: 22 },
  { labels: ["稳定工作", "独居"], stages: ["stable-work", "living-alone"], count: 26 },
  { labels: ["稳定工作", "独居", "伴侣/育儿"], stages: ["stable-work", "living-alone", "partner-parenting"], count: 30 },
]) {
  test(`${labels.length} stages show chapter and area on every question and persist only completed v4 uncertainty answers`, (t) => {
    const writes = [];
    const events = [];
    const originalWindow = globalThis.window;
    globalThis.window = { localStorage: { setItem: (...args) => { writes.push(args); events.push("persist"); } }, location: { assign: (url) => events.push(url) } };
    t.after(() => { if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; });
    const page = loadTestPage();
    for (const label of labels) click(page, label);
    click(page, `优先展示：${labels.at(-1)}`);
    click(page, "开始测评");
    const questions = buildQuestionSet(stages);
    for (const [index, question] of questions.entries()) {
      assert.match(page.html(), new RegExp(`${index + 1} / ${count}`));
      assert.ok(page.html().includes(question.prompt));
      assert.ok(page.html().includes(ASSESSMENT_CHAPTERS.find(({ areaIds }) => areaIds.includes(question.areaId)).label));
      assert.ok(page.html().includes(LIFE_AREAS.find(({ id }) => id === question.areaId).label));
      assert.match(page.html(), /按你通常最可能先做的第一步选择/);
      assert.doesNotMatch(page.html(), /决策风格|非常像我|计分|人格/);
      const next = index === count - 1 ? "查看结果" : "下一步";
      assert.equal(findButton(page.render(), next).props.disabled, true);
      click(page, next, { allowDisabled: true });
      assert.equal(page.snapshots.length, 0);
      assert.deepEqual(writes, []);
      click(page, "我没遇过 / 目前不确定");
      if (index !== count - 1) click(page, next);
    }
    assert.equal(page.snapshots.length, 0);
    assert.deepEqual(writes, []);
    click(page, "查看结果");
    assert.equal(page.snapshots.length, 1);
    assert.equal(writes.length, 1);
    assert.equal(writes[0][0], ASSESSMENT_STORAGE_KEY);
    const snapshot = parseAssessmentSnapshot(writes[0][1]);
    assert.ok(snapshot);
    assert.equal(snapshot.version, 4);
    assert.ok(Object.values(snapshot.answers).every((answer) => answer === "not-sure"));
    assert.equal(Object.keys(snapshot.answers).length, count);
    assert.deepEqual(Object.keys(snapshot.answers), questions.map(({ id }) => id));
    assert.deepEqual(snapshot.lifeStages, stages);
    assert.equal(snapshot.priorityStage, stages.at(-1));
    assert.deepEqual(events, ["persist", "/result"]);
  });
}

test("back follows generated questions and returns to intake without discarding answers", () => {
  const page = loadTestPage();
  click(page, "稳定工作");
  click(page, "开始测评");
  const questions = buildQuestionSet(["stable-work"]);
  click(page, questions[0].options[0].label);
  click(page, "下一步");
  click(page, questions[1].options[1].label);
  click(page, "上一步");
  assert.equal(findButton(page.render(), questions[0].options[0].label).props["aria-pressed"], true);
  click(page, "上一步");
  assert.match(page.html(), /当前生活阶段/);
  click(page, "独居");
  click(page, "开始测评");
  assert.match(page.html(), /1 \/ 26/);
  assert.equal(findButton(page.render(), questions[0].options[0].label).props["aria-pressed"], true);
  click(page, "下一步");
  assert.equal(findButton(page.render(), questions[1].options[1].label).props["aria-pressed"], true);
  assert.equal(page.snapshots.length, 0);
});

test("changing stages retains core answers and submits only the newly generated question IDs", (t) => {
  const writes = [];
  const originalWindow = globalThis.window;
  globalThis.window = { localStorage: { setItem: (...args) => writes.push(args) }, location: { assign() {} } };
  t.after(() => { if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; });
  const page = loadTestPage();
  click(page, "稳定工作");
  click(page, "开始测评");
  for (const [index, question] of buildQuestionSet(["stable-work"]).entries()) {
    click(page, question.options[0].label);
    if (index < 21) click(page, "下一步");
  }
  for (let index = 0; index < 22; index++) click(page, "上一步");
  click(page, "稳定工作");
  click(page, "独居");
  click(page, "开始测评");
  for (const [index, question] of buildQuestionSet(["living-alone"]).entries()) {
    if (index < 18) assert.equal(findButton(page.render(), question.options[0].label).props["aria-pressed"], true);
    else click(page, question.options[0].label);
    if (index < 21) click(page, "下一步");
  }
  click(page, "查看结果");
  assert.equal(writes.length, 1);
  const snapshot = parseAssessmentSnapshot(writes[0][1]);
  assert.ok(snapshot);
  assert.deepEqual(snapshot.lifeStages, ["living-alone"]);
  assert.equal(Object.keys(snapshot.answers).length, 22);
  assert.ok(Object.keys(snapshot.answers).every((id) => !id.startsWith("stable-work-")));
});
