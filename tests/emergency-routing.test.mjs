import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { EMERGENCY_OPTIONS, isEmergencySelection } from "../lib/life-value-assessment.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadTestPage(onSnapshot) {
  const filename = path.join(root, "app", "test", "page.tsx");
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } });
  const realRequire = createRequire(filename);
  const state = [];
  let cursor = 0;
  const localRequire = (id) => {
    if (id === "react") return { useState(initial) {
      const slot = cursor++;
      if (!(slot in state)) state[slot] = initial;
      return [state[slot], (next) => { state[slot] = typeof next === "function" ? next(state[slot]) : next; }];
    } };
    if (id === "../../lib/life-value-assessment.mjs") return {
      ...realRequire(id), createAssessmentSnapshot: onSnapshot,
    };
    return realRequire(id);
  };
  const compiledModule = { exports: {} };
  Function("require", "module", "exports", outputText)(localRequire, compiledModule, compiledModule.exports);
  return () => { cursor = 0; return compiledModule.exports.default(); };
}

function findButton(node, label) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) return node.map((child) => findButton(child, label)).find(Boolean) ?? null;
  if (node.type === "button" && node.props.children === label) return node;
  return findButton(node.props?.children, label);
}

test("each emergency selection opens the appropriate real card and bypasses the normal test", () => {
  const expected = {
    "medical-emergency": { label: "我正遇到医疗急症", text: /当地急救或报警服务/ },
    "self-harm-risk": { label: "我有严重自伤想法", text: /严重自伤想法.*陪伴并协助求助/ },
    "immediate-danger": { label: "我正遭遇人身威胁、火灾等紧急危险", text: /远离危险.*报警或应急救援服务/ },
    "ongoing-legal-proceeding": { label: "我正处于正在进行的法律程序", text: /联系律师或当地法律援助渠道/ },
  };
  const emergencyOptions = EMERGENCY_OPTIONS.filter(({ value }) => value !== "safe-to-continue");
  assert.deepEqual(emergencyOptions.map(({ value }) => value).sort(), Object.keys(expected).sort());

  for (const option of emergencyOptions) {
    const { label, text } = expected[option.value];
    assert.equal(option.label, label);
    assert.equal(isEmergencySelection(option.value), true);
    let snapshotCalls = 0;
    const render = loadTestPage(() => { snapshotCalls++; throw new Error("emergency attempted a normal snapshot"); });
    const button = findButton(render(), label);
    assert.ok(button, `${option.value} must be selectable`);
    button.props.onClick();
    const html = renderToStaticMarkup(render());
    assert.match(html, /role="alert"/);
    assert.match(html, text);
    if (option.value === "immediate-danger") assert.doesNotMatch(html, /严重自伤想法/);
    assert.doesNotMatch(html, /<button|href="\/result"|继续测评|处境筛选|决策风格/);
    assert.equal(snapshotCalls, 0);
  }
});
