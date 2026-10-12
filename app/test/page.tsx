"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Native anchors are required by the current Vinext navigation fallback. */

import { useState } from "react";
import {
  CONTEXT_QUESTIONS,
  EMERGENCY_OPTIONS,
  LIKERT_OPTIONS,
  STYLE_QUESTIONS,
  createAssessmentSnapshot,
  isEmergencySelection,
} from "../../lib/life-value-assessment.mjs";

type ContextAnswer = string | string[];

const emergencySteps: Record<string, { title: string; action: string; detail: string }> = {
  "medical-emergency": {
    title: "请先处理眼前的危险",
    action: "立即联系当地急救或报警服务。中国大陆适用时可拨打 120 或 110。",
    detail: "如果身边有人，请让对方陪你联系救援，并说清所在位置。测评可以以后再做。",
  },
  "self-harm-risk": {
    title: "此刻请不要独自待着",
    action: "立即联系当地急救服务，或找一位可信任的人来到你身边。",
    detail: "直接告诉对方你现在有严重自伤想法，需要他们陪伴并协助求助。中国大陆适用时可拨打 120 或 110。",
  },
  "immediate-danger": {
    title: "请先确保自己身处安全地点",
    action: "立即远离危险现场，并联系当地报警或应急救援服务。中国大陆适用时可拨打 110 或 119；有人受伤可拨打 120。",
    detail: "如果无法安全离开，请说明你所在的位置和眼前的危险，并听从救援人员指引。测评可以以后再做。",
  },
  "ongoing-legal-proceeding": {
    title: "先保护正在进行的法律事项",
    action: "保存通知、文书、聊天记录和时间节点，尽快联系律师或当地法律援助渠道。",
    detail: "法律程序有时限和具体要求。先确认下一步应做什么，再考虑普通测评。",
  },
};

export default function TestPage() {
  const [stage, setStage] = useState<"safety" | "questions" | "emergency">("safety");
  const [emergency, setEmergency] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [context, setContext] = useState<Record<string, ContextAnswer>>({});
  const [styleAnswers, setStyleAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  function chooseSafety(value: string) {
    if (isEmergencySelection(value)) {
      setEmergency(value);
      setStage("emergency");
      return;
    }
    if (value === "safe-to-continue") {
      setError("");
      setIndex(0);
      setStage("questions");
    }
  }

  function chooseContext(id: string, value: string, multiple: boolean, maxSelections?: number) {
    setError("");
    if (!multiple) {
      setContext((previous) => ({ ...previous, [id]: value }));
      return;
    }
    const current = context[id];
    const selected = Array.isArray(current) ? current : [];
    let next: string[];
    if (value === "prefer-not-to-say") {
      next = selected.includes(value) ? [] : [value];
    } else if (selected.includes(value)) {
      next = selected.filter((item) => item !== value);
    } else {
      const regular = selected.filter((item) => item !== "prefer-not-to-say");
      if (maxSelections && regular.length >= maxSelections) {
        setError(`这题最多选择 ${maxSelections} 项。`);
        return;
      }
      next = [...regular, value];
    }
    setContext((previous) => ({ ...previous, [id]: next }));
  }

  function continueTest() {
    setError("");
    if (index < CONTEXT_QUESTIONS.length + STYLE_QUESTIONS.length - 1) {
      setIndex(index + 1);
      return;
    }
    try {
      const snapshot = createAssessmentSnapshot(context, styleAnswers);
      window.localStorage.setItem("life-value-test-v2", JSON.stringify(snapshot));
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- A full-page navigation is required by the current Vinext navigation fallback.
      window.location.assign("/result");
    } catch {
      setError("答案暂时无法保存，请检查是否已完成所有题目，再试一次。");
    }
  }

  const contextQuestion = index < CONTEXT_QUESTIONS.length ? CONTEXT_QUESTIONS[index] : null;
  const styleQuestion = contextQuestion ? null : STYLE_QUESTIONS[index - CONTEXT_QUESTIONS.length];
  const contextValue = contextQuestion ? context[contextQuestion.id] : undefined;
  const answerReady = contextQuestion
    ? Array.isArray(contextValue) ? contextValue.length > 0 : typeof contextValue === "string"
    : styleQuestion ? Number.isInteger(styleAnswers[styleQuestion.id]) : false;
  const step = emergency ? emergencySteps[emergency] : null;

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-8 text-[#26211d]">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm text-[#a0633d]">← 返回首页</a>

        {stage === "safety" && (
          <section className="mt-12 rounded-[2rem] bg-[#fbf9f6] p-7 shadow-sm sm:p-12">
            <p className="text-sm font-semibold text-[#a0633d]">开始之前 · 安全筛选</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight">现在有需要优先处理的紧急情况吗？</h1>
            <p className="mt-4 text-sm leading-6 text-[#756b62]">选择最符合你当前情况的一项。紧急情况会直接显示现实中的第一步，不进入普通测评。</p>
            <div className="mt-8 space-y-3">{EMERGENCY_OPTIONS.map((option) => (
              <button key={option.value} type="button" onClick={() => chooseSafety(option.value)} className="block w-full rounded-2xl border border-[#dfd3c8] bg-white p-5 text-left transition hover:border-[#a0633d] focus-visible:outline-2 focus-visible:outline-[#a0633d]">{option.label}</button>
            ))}</div>
          </section>
        )}

        {stage === "emergency" && step && (
          <section className="mt-12 rounded-[2rem] border border-[#d9b1a3] bg-[#fff8f5] p-7 shadow-sm sm:p-12" role="alert">
            <p className="text-sm font-semibold text-[#a0633d]">现在的第一步</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight">{step.title}</h1>
            <p className="mt-8 rounded-2xl bg-white p-5 text-lg font-semibold leading-8">{step.action}</p>
            <p className="mt-5 text-sm leading-7 text-[#756b62]">{step.detail}</p>
            <a href="/" className="mt-8 inline-block text-sm font-semibold text-[#a0633d] underline">返回首页</a>
          </section>
        )}

        {stage === "questions" && (
          <>
            <div className="mt-12 flex items-center justify-between text-sm text-[#756b62]"><span>{contextQuestion ? "处境筛选" : "决策风格"}</span><span>{index + 1} / 18</span></div>
            <div className="mt-3 h-2 rounded-full bg-[#e5dbd1]"><div className="h-2 rounded-full bg-[#a0633d] transition-all" style={{ width: `${((index + 1) / 18) * 100}%` }} /></div>
            <section className="mt-12 rounded-[2rem] bg-[#fbf9f6] p-7 shadow-sm sm:p-12">
              <p className="text-sm font-semibold text-[#a0633d]">{contextQuestion ? "按眼下的实际情况回答" : "按平时的真实倾向回答"}</p>
              <h1 className="mt-4 text-3xl font-bold leading-tight">{contextQuestion?.prompt ?? styleQuestion?.prompt}</h1>
              {contextQuestion && (
                <div className="mt-8 space-y-3">{contextQuestion.options.map((option) => {
                  const selected = Array.isArray(contextValue) ? contextValue.includes(option.value) : contextValue === option.value;
                  const multiple = Boolean(contextQuestion.multiple);
                  return <button key={option.value} type="button" aria-pressed={selected} onClick={() => chooseContext(contextQuestion.id, option.value, multiple, contextQuestion.maxSelections)} className={`block w-full rounded-2xl border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-[#a0633d] ${selected ? "border-[#a0633d] bg-[#f0e5db]" : "border-[#dfd3c8] bg-white hover:border-[#a0633d]"}`}>{multiple && <span className="mr-3" aria-hidden="true">{selected ? "☑" : "□"}</span>}{option.label}</button>;
                })}</div>
              )}
              {styleQuestion && (
                <div className="mt-8 space-y-3">{LIKERT_OPTIONS.map((option) => {
                  const selected = styleAnswers[styleQuestion.id] === option.value;
                  return <button key={option.value} type="button" aria-pressed={selected} onClick={() => { setError(""); setStyleAnswers((previous) => ({ ...previous, [styleQuestion.id]: option.value })); }} className={`block w-full rounded-2xl border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-[#a0633d] ${selected ? "border-[#a0633d] bg-[#f0e5db]" : "border-[#dfd3c8] bg-white hover:border-[#a0633d]"}`}>{option.label}</button>;
                })}</div>
              )}
              {error && <p className="mt-5 text-sm font-medium text-[#a33f32]" role="alert">{error}</p>}
              <div className="mt-9 flex items-center justify-between gap-4"><button type="button" onClick={() => { setError(""); if (index === 0) setStage("safety"); else setIndex(index - 1); }} className="rounded-full border border-[#cfc3b7] px-6 py-3 font-semibold">上一步</button><button type="button" disabled={!answerReady} onClick={continueTest} className="rounded-full bg-[#26211d] px-6 py-3 font-semibold text-white transition hover:bg-[#a0633d] disabled:cursor-not-allowed disabled:opacity-40">{index === 17 ? "查看结果" : "下一步"}</button></div>
              <p className="mt-6 text-xs leading-5 text-[#8b8178]">答案只在完成全部 18 题后保存在此浏览器中。选项没有标准答案。</p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
