import { parseAssessmentSnapshot, scoreCoreAnswers } from "../lib/life-value-assessment.mjs";
import { LIFE_STAGES } from "../lib/life-stage-question-bank.mjs";
import { actionPresentationFor, selectRecommendations } from "../lib/guide-action-catalog.mjs";

const lenses = [
  { id: "safety-health", name: "安全健康", description: "关注安全和健康方面可以减少的损失。" },
  { id: "time-energy", name: "时间精力", description: "关注时间与精力的使用。" },
  { id: "money-rights", name: "钱与权益", description: "关注金钱损失和具体权益。" },
];

const profileExplanations: Record<string, string> = {
  "steady-verify": "你更倾向先排除难以承受的风险，再核对证据和适用条件。可以先确认下面卡片的限制，再安排一个小步骤。",
  "steady-act": "你更倾向先保护重要的事情，并较快形成行动判断。把第一步做小，同时留出核对条件的时间。",
  "opportunity-verify": "你较愿意考虑机会，也倾向核对依据。可以在了解适用条件后，选择一个能及时复盘的小尝试。",
  "opportunity-act": "你较愿意考虑机会，并较快形成行动判断。可以从容易完成的一步开始，同时确认它的成本与限制。",
};

function stageLabel(id: string) {
  return LIFE_STAGES.find((stage) => stage.id === id)?.label ?? id;
}

const signalLabels: Record<string, string> = {
  "transport:driving": "有儿童同行时的乘车安排",
  "care:child": "有儿童活动的生活场景",
  "care:elder": "照护父母或家庭责任",
  "housing:renting": "租房与搬迁",
  "approach:plan": "安排可执行的步骤或计划",
  "approach:experiment": "可逆的小尝试",
  "focus:work-boundaries": "工作边界",
  "focus:home-safety": "日常居家安全检查",
  "focus:home-child-safety": "家庭日常防护计划",
  "focus:transition-plan": "过渡期安排",
};

type Presentation = NonNullable<ReturnType<typeof actionPresentationFor>>;

export function ActionCard({ presentation, detailed = false }: { presentation: Presentation; detailed?: boolean }) {
  const { action, emphasis } = presentation;
  const applicableStages = action.matchedStageIds.map(stageLabel).join("、");
  const conditions = action.signalRequirements.map((signal: string) => signalLabels[signal] ?? signal).join("；");
  return (
    <article id={`action-${action.id}`} data-action={action.id} className="mt-4 rounded-2xl border border-[#dfd3c8] bg-white p-5 sm:p-6">
      <h3 className="text-xl font-bold leading-8">{action.title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#756b62]">可能收益：{action.benefit}</p>
      <p className="mt-4 rounded-xl bg-[#f7f3ec] p-4 text-sm font-medium leading-7">{emphasis.text}</p>
      <dl className="mt-5 space-y-4 text-sm leading-7">
        <div><dt className="font-semibold">为什么匹配</dt><dd className="text-[#756b62]">你选择了「{applicableStages}」生活阶段，且本次处境回答涉及{action.matchedSignals.map((signal: string) => `「${signalLabels[signal] ?? signal}」`).join("、")}，符合这条行动的处境筛选条件。{action.matchedStageIds.length > 1 && <span>同时适用阶段：{applicableStages}；合并展示一次。</span>}</dd></div>
        <div><dt className="font-semibold">适用条件</dt><dd className="text-[#756b62]">{conditions || "请核对下面的限制与备注。"}；仍需结合现实条件确认是否适用。</dd></div>
        <div><dt className="font-semibold">第一步</dt><dd className="text-[#756b62]">{action.firstStep}</dd></div>
      </dl>
      <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-[#f7f3ec] p-4 text-sm">
        <div><dt className="text-[#756b62]">金钱</dt><dd className="mt-1 font-semibold">{action.costs.money}</dd></div>
        <div><dt className="text-[#756b62]">时间</dt><dd className="mt-1 font-semibold">{action.costs.time}</dd></div>
        <div><dt className="text-[#756b62]">毅力</dt><dd className="mt-1 font-semibold">{action.costs.willpower}</dd></div>
      </dl>
      <p className="mt-4 text-sm font-semibold">证据等级：{action.evidenceGrade} · 本方向性价比：{action.ratioTier} · 条目状态：{action.status === "controversial" ? "有争议，需核对" : "已核对来源"}</p>
      {action.status === "controversial" && <p className="mt-4 rounded-xl border border-[#d9b1a3] bg-[#fff8f5] p-4 text-sm font-semibold">争议提醒：这条建议存在争议，请先阅读限制并核对来源。</p>}
      <div className="mt-4 text-sm leading-7"><h4 className="font-semibold">限制与备注</h4><ul className="mt-1 list-disc space-y-1 pl-5 text-[#756b62]">{action.caveats.map((caveat: string) => <li key={caveat}>{caveat}</li>)}</ul></div>
      <a href={action.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-block text-sm leading-6 text-[#a0633d] underline underline-offset-4">指南出处：{action.chapter} · {action.title}</a>
      {detailed && (
        <div className="mt-6 border-t border-[#dfd3c8] pt-5 text-sm leading-7">
          <h4 className="font-semibold">核对清单</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[#756b62]">
            <li>先核对以上适用条件与限制；处境匹配并不代表你已经满足所有现实条件。</li>
            <li>打开指南原文，确认依据与备注，再决定是否采用这一步。</li>
            {emphasis.followUpChecklist.map((item: string) => <li key={item}>{item}</li>)}
          </ul>
          {emphasis.supportPrompt && <p className="mt-3 text-[#756b62]">{emphasis.supportPrompt}</p>}
        </div>
      )}
    </article>
  );
}

export function AssessmentResults({ rawSnapshot, detailed = false, reportAccess = false }: {
  rawSnapshot: string | null; detailed?: boolean; reportAccess?: boolean;
}) {
  if (detailed && !reportAccess) return <p className="mt-10">请先绑定或兑换，以确认详细报告权限。</p>;
  const snapshot = parseAssessmentSnapshot(rawSnapshot);
  if (!snapshot) return (
    <section className="mt-10 rounded-[2rem] bg-[#fbf9f6] p-8 sm:p-10">
      <h1 className="text-3xl font-bold">{detailed ? "报告已解锁" : "这里还没有完整的测试结果"}</h1>
      <p className="mt-5 leading-8 text-[#756b62]">{detailed ? "已解锁详细报告；请在本设备重新完成测试以生成个性化内容" : "本设备没有可用的完整答案，请重新完成测试，生成属于你的结果。"}</p>
      <p className="mt-3 text-sm leading-7 text-[#756b62]">测试答案保存在完成测试的浏览器中，换设备或清除浏览器数据后需要重新测试。</p>
      <a href="/test" className="mt-6 inline-flex rounded-full bg-[#26211d] px-5 py-3 text-sm font-semibold text-white">重新完成测试</a>
    </section>
  );

  const style = scoreCoreAnswers(snapshot.answers);
  const recommendations = selectRecommendations(snapshot);
  const selectedStages = LIFE_STAGES.filter(({ id }) => snapshot.lifeStages.includes(id));
  const displayStages = [
    ...selectedStages.filter(({ id }) => id === snapshot.priorityStage),
    ...selectedStages.filter(({ id }) => id !== snapshot.priorityStage),
  ];
  // Lens cards own their actions. Stage allocations link to those cards and
  // render only additional selector-supplied actions, once across the page.
  const displayed = new Set<string>();
  return (
    <div className="mt-10 rounded-[2rem] bg-[#fbf9f6] p-6 sm:p-10">
      <p className="text-sm font-semibold text-[#a0633d]">{detailed ? "你的详细报告" : "你的免费结果"}</p>
      <section className="mt-5" aria-labelledby="current-life-stages">
        <h2 id="current-life-stages" className="text-xl font-bold">当前生活阶段</h2>
        <ul className="mt-3 flex flex-wrap gap-2">{displayStages.map(({ id, label }) => <li key={id} className="rounded-full bg-[#efe4d8] px-4 py-2 text-sm">{label}{id === snapshot.priorityStage ? "（优先展示）" : ""}</li>)}</ul>
        <p className="mt-3 text-sm leading-7 text-[#756b62]">这是你选择的当下生活阶段；优先阶段只影响展示顺序。结果是当前决策快照，会随处境与经验变化。</p>
      </section>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">本次倾向：{style.profile.name}</h1>
      {!style.tendencyIsClear && <p className="mt-4 font-semibold text-[#a0633d]">倾向尚不明显：当前标签仅供参考，不必把自己归入固定类型。</p>}
      <p className="mt-5 leading-8 text-[#756b62]">{profileExplanations[style.profile.id]}</p>
      {style.auxiliaryTags.length > 0 && <ul className="mt-5 flex flex-wrap gap-2">{style.auxiliaryTags.map((tag: string) => <li key={tag} className="rounded-full bg-[#efe4d8] px-4 py-2 text-sm">{tag}</li>)}</ul>}
      <p className="mt-5 text-sm leading-7 text-[#756b62]">这是当前自述的决策倾向，不是人格或心理诊断，也不代表能力高低；它会随处境和时间变化。</p>

      {detailed && (
        <section className="mt-8 rounded-2xl bg-[#efe4d8] p-5 sm:p-6">
          <h2 className="text-xl font-bold">如何理解这次结果</h2>
          <p className="mt-3 text-sm leading-7">主要风格来自风险保护与证据核实两个维度；行动与协作倾向补充说明你可能更容易执行的方式。每个维度分别计算，反向题已换算，不合成能力分数。</p>
          <p className="mt-3 text-sm leading-7">这些是问卷回答的描述，不是经过临床验证的测量结论。行动先按你填写的处境筛选，再在各自收益方向内参考性价比与证据；风格只影响表达方式。</p>
          <p className="mt-3 text-sm leading-7">下方 A/B/C 是指南给行动依据的等级，不是对你个人的评级。医疗、法律等具体问题仍需结合现实条件和专业意见。</p>
        </section>
      )}

      <p className="mt-9 text-sm leading-7 text-[#756b62]">以下是三个独立的收益方向，彼此没有排名。某个方向没有充分匹配的条目时，会暂不推荐。</p>
      <div className="mt-7 space-y-9">{lenses.map((lens) => {
        const presentation = actionPresentationFor(style, recommendations.lenses[lens.id]);
        if (presentation) displayed.add(presentation.action.id);
        return <section key={lens.id} data-lens={lens.id} aria-labelledby={`lens-${lens.id}`}>
          <h2 id={`lens-${lens.id}`} className="text-2xl font-bold">{lens.name}</h2>
          <p className="mt-2 text-sm text-[#756b62]">{lens.description}</p>
          {presentation ? <ActionCard presentation={presentation} detailed={detailed} /> : <p className="mt-4 rounded-2xl border border-dashed border-[#cdb9a8] p-5 text-sm leading-7">暂不自动推荐：目前的处境信息不足以匹配本方向的可推荐条目。这不代表这个方向不重要。</p>}
        </section>;
      })}</div>

      <section className="mt-10" aria-labelledby="stage-actions">
        <h2 id="stage-actions" className="text-2xl font-bold">按生活阶段看行动</h2>
        <p className="mt-3 text-sm leading-7 text-[#756b62]">每个阶段最多两条，沿用相同的处境筛选；同一行动合并展示，并标明同时适用的阶段。即时安全优先，现金流与法定权益优先于可延后的体验；请结合可用资源安排下一步。</p>
        <div className="mt-6 space-y-8">{displayStages.map(({ id, label }) => (
          <section key={id} data-stage={id} aria-labelledby={`stage-${id}`}>
            <h2 id={`stage-${id}`} className="text-xl font-bold">{label}{id === snapshot.priorityStage ? "（优先展示）" : ""}</h2>
            {recommendations.stages[id].length === 0
              ? <p className="mt-4 rounded-2xl border border-dashed border-[#cdb9a8] p-5 text-sm leading-7">暂不自动推荐：本次处境回答与已核对的指南条目没有为本阶段分配单独建议。同时适用的行动会在其他位置合并展示；这不代表本阶段不重要。</p>
              : recommendations.stages[id].map((action: Presentation["action"]) => {
                if (displayed.has(action.id)) return <p key={action.id} className="mt-4 text-sm leading-7"><a href={`#action-${action.id}`} className="text-[#a0633d] underline underline-offset-4">查看已合并的行动：{action.title}</a></p>;
                displayed.add(action.id);
                return <ActionCard key={action.id} presentation={actionPresentationFor(style, action)!} detailed={detailed} />;
              })}
          </section>
        ))}</div>
      </section>

      {!detailed && <section className="mt-10 rounded-2xl border border-dashed border-[#cdb9a8] p-6"><h2 className="text-xl font-bold">查看详细报告</h2><p className="mt-3 text-sm leading-7 text-[#756b62]">详细报告补充结果解释、行动核对清单与跟进提示，使用本设备的同一份测试答案。</p><a href="/report" className="mt-5 inline-flex rounded-full bg-[#26211d] px-5 py-3 text-sm font-semibold text-white">查看报告或解锁</a></section>}
      <a href="/test" className="mt-8 inline-block text-sm text-[#a0633d] underline">处境变化了？重新完成测试</a>
    </div>
  );
}
