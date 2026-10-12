import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { SAFETY_ROUTE_OPTIONS } from "../lib/life-value-assessment.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadTestPage() {
  const filename = path.join(root, "app", "test", "page.tsx");
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } });
  const realRequire = createRequire(filename);
  const state = [];
  const snapshots = [];
  const mountedRefs = new Set();
  let effects = [];
  let focusedLabel = null;
  let cursor = 0;
  const localRequire = (id) => {
    if (id === "react") return {
      useState(initial) {
        const slot = cursor++;
        if (!(slot in state)) state[slot] = initial;
        return [state[slot], (next) => { state[slot] = typeof next === "function" ? next(state[slot]) : next; }];
      },
      useRef(initial) {
        const slot = cursor++;
        if (!(slot in state)) state[slot] = { current: initial };
        return state[slot];
      },
      useEffect(effect, dependencies) {
        const slot = cursor++;
        if (!(slot in state) || dependencies.some((value, index) => !Object.is(value, state[slot][index]))) effects.push(effect);
        state[slot] = dependencies;
      },
    };
    if (id === "../../lib/life-value-assessment.mjs") {
      const assessment = realRequire(id);
      return { ...assessment, createAssessmentSnapshot(input) {
        snapshots.push(input);
        return assessment.createAssessmentSnapshot(input);
      } };
    }
    return realRequire(id);
  };
  const compiledModule = { exports: {} };
  Function("require", "module", "exports", outputText)(localRequire, compiledModule, compiledModule.exports);
  function attachRefs(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(attachRefs); return; }
    const ref = node.props?.ref;
    if (ref) {
      const label = node.props["aria-label"] ?? renderToStaticMarkup(node).replace(/<[^>]*>/g, "");
      const focusable = node.type === "button" || node.props.tabIndex !== undefined;
      ref.current = { focus() { if (focusable) focusedLabel = label; } };
      mountedRefs.add(ref);
    }
    attachRefs(node.props?.children);
  }
  const render = () => {
    cursor = 0;
    effects = [];
    const tree = compiledModule.exports.default();
    for (const ref of mountedRefs) ref.current = null;
    mountedRefs.clear();
    attachRefs(tree);
    for (const effect of effects) effect();
    return tree;
  };
  return { render, snapshots, html: () => renderToStaticMarkup(render()), focusedLabel: () => focusedLabel };
}

export function findButton(node, label) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) return node.map((child) => findButton(child, label)).find(Boolean) ?? null;
  if (node.type === "button" && (node.props["aria-label"] === label || renderToStaticMarkup(node).replace(/<[^>]*>/g, "") === label)) return node;
  return findButton(node.props?.children, label);
}

export function click(page, label, { allowDisabled = false } = {}) {
  const button = findButton(page.render(), label);
  assert.ok(button, `missing button: ${label}`);
  if (!allowDisabled) assert.ok(!button.props.disabled, `disabled button: ${label}`);
  button.props.onClick();
}

test("normal assessment starts with intake and opens help only on request", () => {
  const page = loadTestPage();
  assert.match(page.html(), /当前生活阶段/);
  assert.match(page.html(), /需要紧急协助/);
  assert.doesNotMatch(page.html(), /安全筛选|现在有需要优先处理的紧急情况吗/);
  for (const option of SAFETY_ROUTE_OPTIONS) assert.equal(findButton(page.render(), option.label), null);
  click(page, "需要紧急协助");
  for (const option of SAFETY_ROUTE_OPTIONS) assert.ok(findButton(page.render(), option.label));
  assert.equal(page.snapshots.length, 0);
});

test("help focuses its labeled heading and restores focus to the original trigger when closed", () => {
  const page = loadTestPage();
  page.render();
  assert.equal(page.focusedLabel(), null, "initial intake must not steal focus");
  click(page, "需要紧急协助");
  assert.match(page.html(), /aria-labelledby="emergency-help-heading"/);
  assert.equal(page.focusedLabel(), "紧急协助");
  click(page, "我正遇到医疗急症");
  page.render();
  assert.equal(page.focusedLabel(), "请先处理眼前的危险");
  click(page, "返回测评");
  page.render();
  assert.equal(page.focusedLabel(), "需要紧急协助");
  click(page, "稳定工作");
  click(page, "开始测评");
  click(page, "需要紧急协助");
  page.render();
  assert.equal(page.focusedLabel(), "紧急协助");
  click(page, "返回测评");
  assert.match(page.html(), /1 \/ 22/);
  assert.equal(page.focusedLabel(), "需要紧急协助");
  assert.equal(page.snapshots.length, 0);
});

test("voluntary help routes show direct assistance without normal answers or persistence", (t) => {
  const writes = [];
  const navigation = [];
  const originalWindow = globalThis.window;
  globalThis.window = { localStorage: { setItem: (...args) => writes.push(args) }, location: { assign: (url) => navigation.push(url) } };
  t.after(() => { if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; });
  const expected = {
    "medical-emergency": /当地急救或报警服务/,
    "self-harm-risk": /严重自伤想法.*陪伴并协助求助/,
    "immediate-danger": /远离危险.*报警或应急救援服务/,
    "ongoing-legal-proceeding": /联系律师或当地法律援助渠道/,
  };
  assert.deepEqual(SAFETY_ROUTE_OPTIONS.map(({ value }) => value).sort(), Object.keys(expected).sort());
  for (const option of SAFETY_ROUTE_OPTIONS) {
    const page = loadTestPage();
    click(page, "稳定工作");
    click(page, "开始测评");
    click(page, "比较像我");
    click(page, "需要紧急协助");
    click(page, option.label);
    assert.match(page.html(), /role="alert"/);
    assert.match(page.html(), expected[option.value]);
    assert.equal(findButton(page.render(), "下一步"), null);
    assert.equal(findButton(page.render(), "查看结果"), null);
    assert.doesNotMatch(page.html(), /href="\/result"/);
    assert.equal(page.snapshots.length, 0);
    click(page, "返回测评");
    assert.match(page.html(), /1 \/ 22/);
    assert.equal(findButton(page.render(), "比较像我").props["aria-pressed"], true);
    assert.equal(findButton(page.render(), "下一步").props.disabled, false);
  }
  assert.deepEqual(writes, []);
  assert.deepEqual(navigation, []);
});
