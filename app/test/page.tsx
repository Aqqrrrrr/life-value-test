"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Native anchors are required by the current Vinext navigation fallback. */

import { useState } from "react";
import {
  ASSESSMENT_STORAGE_KEY,
  SAFETY_ROUTE_OPTIONS,
  createAssessmentSnapshot,
  isSafetyRoute,
  validateStageSelection,
} from "../../lib/life-value-assessment.mjs";
import { LIFE_STAGES, buildQuestionSet } from "../../lib/life-stage-question-bank.mjs";

type Answer = string | number;

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

const optionClass = (selected: boolean) => `block w-full rounded-2xl border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-[#a0633d] ${selected ? "border-[#a0633d] bg-[#f0e5db]" : "border-[#dfd3c8] bg-white hover:border-[#a0633d]"}`;

export default function TestPage() {
  const [stage, setStage] = useState<"intake" | "questions">("intake");
  const [lifeStages, setLifeStages] = useState<string[]>([]);
  const [priorityStage, setPriorityStage] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [helpOpen, setHelpOpen] = useState(false);
  const [emergency, setEmergency] = useState<string | null>(null);
  const [error, setError] = useState("");

  const questions = lifeStages.length ? buildQuestionSet(lifeStages) : [];
  const question = questions[index];
  const answerReady = Boolean(question?.options.some((option) => option.value === answers[question.id]));
  const step = emergency ? emergencySteps[emergency] : null;

  function chooseStage(id: string) {
    if (!LIFE_STAGES.some((item) => item.id === id)) return;
    setError("");
    if (lifeStages.includes(id)) {
      setLifeStages(lifeStages.filter((item) => item !== id));
      if (priorityStage === id) setPriorityStage(null);
      return;
    }
    if (lifeStages.length >= 3) {
      setError("最多选择 3 个当前生活阶段。");
      return;
    }
    setLifeStages([...lifeStages, id]);
  }

  function startTest() {
    try {
      validateStageSelection(lifeStages, priorityStage);
      setError("");
      setIndex(0);
      setStage("questions");
    } catch {
      setError("请选择 1 至 3 个当前生活阶段。");
    }
  }

  function chooseAnswer(value: Answer) {
    if (!question || !question.options.some((option) => option.value === value)) return;
    setError("");
    setAnswers((previous) => ({ ...previous, [question.id]: value }));
  }

  function continueTest() {
    if (!answerReady) return;
    setError("");
    if (index < questions.length - 1) {
      setIndex(index + 1);
      return;
    }
    // Keep earlier answers when editing intake, but submit only this generated set.
    if (!questions.every((item) => item.options.some((option) => option.value === answers[item.id]))) {
      setError("请先完成所有题目，再查看结果。");
      return;
    }
    try {
      const currentAnswers = Object.fromEntries(questions.map(({ id }) => [id, answers[id]]));
      const snapshot = createAssessmentSnapshot({ lifeStages, priorityStage, answers: currentAnswers });
      window.localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(snapshot));
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- A full-page navigation is required by the current Vinext navigation fallback.
      window.location.assign("/result");
    } catch {
      setError("答案暂时无法保存，请检查是否已完成所有题目，再试一次。");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-8 text-[#26211d]">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm text-[#a0633d]">← 返回首页</a>

        {!helpOpen && (
          <aside className="mt-6 text-xs leading-6 text-[#756b62]">
            <p>遇到医疗急症、自伤风险或即时危险，请先联系现实中的救援；正在进行的法律事项请优先寻求专业协助。</p>
            <button type="button" onClick={() => { setEmergency(null); setHelpOpen(true); }} className="mt-1 font-semibold text-[#a0633d] underline">需要紧急协助</button>
          </aside>
        )}

        {helpOpen && (
          <section className="mt-8 rounded-[2rem] border border-[#d9b1a3] bg-[#fff8f5] p-7 shadow-sm sm:p-12">
            {step ? (
              <div role="alert">
                <p className="text-sm font-semibold text-[#a0633d]">现在的第一步</p>
                <h1 className="mt-4 text-3xl font-bold leading-tight">{step.title}</h1>
                <p className="mt-8 rounded-2xl bg-white p-5 text-lg font-semibold leading-8">{step.action}</p>
                <p className="mt-5 text-sm leading-7 text-[#756b62]">{step.detail}</p>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold leading-tight">紧急协助</h1>
                <p className="mt-4 text-sm leading-6 text-[#756b62]">按需查看直接求助方式。这里的选择不会作为测评答案。</p>
                <div className="mt-8 space-y-3">{SAFETY_ROUTE_OPTIONS.map((option) => (
                  <button key={option.value} type="button" onClick={() => { if (isSafetyRoute(option.value)) setEmergency(option.value); }} className={optionClass(false)}>{option.label}</button>
                ))}</div>
              </>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <button type="button" onClick={() => { setHelpOpen(false); setEmergency(null); }} className="rounded-full border border-[#cfc3b7] px-6 py-3 font-semibold">返回测评</button>
              <a href="/" className="text-sm font-semibold text-[#a0633d] underline">返回首页</a>
            </div>
          </section>
        )}

        {!helpOpen && stage === "intake" && (
          <section className="mt-8 rounded-[2rem] bg-[#fbf9f6] p-7 shadow-sm sm:p-12">
            <p className="text-sm font-semibold text-[#a0633d]">从眼下的生活开始</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight">选择你的当前生活阶段</h1>
            <p className="mt-4 text-sm leading-6 text-[#756b62]">可选择 1 至 3 项。18 道核心题加上每个阶段的 4 道处境题，共 22 至 30 题。</p>
            <div className="mt-8 space-y-3">{LIFE_STAGES.map((item) => (
              <button key={item.id} type="button" aria-pressed={lifeStages.includes(item.id)} disabled={lifeStages.length >= 3 && !lifeStages.includes(item.id)} onClick={() => chooseStage(item.id)} className={`${optionClass(lifeStages.includes(item.id))} disabled:cursor-not-allowed disabled:opacity-40`}>{item.label}</button>
            ))}</div>
            {lifeStages.length > 0 && (
              <fieldset className="mt-8">
                <legend className="font-semibold">优先展示哪个阶段？（可选）</legend>
                <p className="mt-2 text-sm leading-6 text-[#756b62]">只调整结果展示顺序，不改变题目、计分或建议资格。</p>
                <div className="mt-4 space-y-3">
                  <button type="button" aria-pressed={priorityStage === null} onClick={() => setPriorityStage(null)} className={optionClass(priorityStage === null)}>不设优先阶段</button>
                  {LIFE_STAGES.filter(({ id }) => lifeStages.includes(id)).map((item) => (
                    <button key={item.id} type="button" aria-label={`优先展示：${item.label}`} aria-pressed={priorityStage === item.id} onClick={() => { if (lifeStages.includes(item.id)) setPriorityStage(item.id); }} className={optionClass(priorityStage === item.id)}>{item.label}</button>
                  ))}
                </div>
              </fieldset>
            )}
            {error && <p className="mt-5 text-sm font-medium text-[#a33f32]" role="alert">{error}</p>}
            <button type="button" disabled={lifeStages.length < 1 || lifeStages.length > 3} onClick={startTest} className="mt-9 rounded-full bg-[#26211d] px-6 py-3 font-semibold text-white transition hover:bg-[#a0633d] disabled:cursor-not-allowed disabled:opacity-40">开始测评</button>
          </section>
        )}

        {!helpOpen && stage === "questions" && question && (
          <>
            <div className="mt-8 flex items-center justify-between text-sm text-[#756b62]"><span>{question.group === "core" ? "决策风格" : "阶段处境"}</span><span>{index + 1} / {questions.length}</span></div>
            <div className="mt-3 h-2 rounded-full bg-[#e5dbd1]" role="progressbar" aria-label="测评进度" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index + 1}><div className="h-2 rounded-full bg-[#a0633d] transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
            <section className="mt-12 rounded-[2rem] bg-[#fbf9f6] p-7 shadow-sm sm:p-12">
              <p className="text-sm font-semibold text-[#a0633d]">{question.group === "core" ? "按平时的真实倾向回答" : "按眼下的实际情况回答"}</p>
              <h1 className="mt-4 text-3xl font-bold leading-tight">{question.prompt}</h1>
              <div className="mt-8 space-y-3">{question.options.map((option) => (
                <button key={option.value} type="button" aria-pressed={answers[question.id] === option.value} onClick={() => chooseAnswer(option.value)} className={optionClass(answers[question.id] === option.value)}>{option.label}</button>
              ))}</div>
              {error && <p className="mt-5 text-sm font-medium text-[#a33f32]" role="alert">{error}</p>}
              <div className="mt-9 flex items-center justify-between gap-4">
                <button type="button" onClick={() => { setError(""); if (index === 0) setStage("intake"); else setIndex(index - 1); }} className="rounded-full border border-[#cfc3b7] px-6 py-3 font-semibold">上一步</button>
                <button type="button" disabled={!answerReady} onClick={continueTest} className="rounded-full bg-[#26211d] px-6 py-3 font-semibold text-white transition hover:bg-[#a0633d] disabled:cursor-not-allowed disabled:opacity-40">{index === questions.length - 1 ? "查看结果" : "下一步"}</button>
              </div>
              <p className="mt-6 text-xs leading-5 text-[#8b8178]">答案只在完成全部 {questions.length} 题后保存在此浏览器中。选项没有标准答案。</p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
