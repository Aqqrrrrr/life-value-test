/* eslint-disable @next/next/no-html-link-for-pages -- Native anchors support the current Vinext navigation fallback. */

import { parseAssessmentSnapshot } from "../lib/life-value-assessment.mjs";
import { LIFE_STAGES } from "../lib/life-stage-question-bank.mjs";
import { actionPresentationFor, selectPriorityReviews } from "../lib/guide-action-catalog.mjs";
import { ChoiceMap } from "./choice-map";

type Presentation = NonNullable<ReturnType<typeof actionPresentationFor>>;

export function ActionCard({ presentation, detailed = false }: { presentation: Presentation; detailed?: boolean }) {
  const { action, source } = presentation;
  return (
    <article id={`action-${action.id}`} data-priority-review={action.id} className="mt-4 rounded-2xl border border-[#dfd3c8] bg-white p-5 sm:p-6">
      <h3 className="text-xl font-bold leading-8">{action.title}</h3>
      <dl className="mt-5 space-y-4 text-sm leading-7">
        <div><dt className="font-semibold">观察</dt><dd className="text-[#756b62]">{presentation.observation}</dd></div>
        <div><dt className="font-semibold">可能遗漏的成本或收益</dt><dd className="text-[#756b62]">{presentation.ignoredCostOrBenefit}</dd></div>
        <div><dt className="font-semibold">本周第一步</dt><dd className="text-[#756b62]">{presentation.firstStep}</dd></div>
        <div><dt className="font-semibold">适用条件</dt><dd><ul className="list-disc pl-5 text-[#756b62]">{presentation.applicability.map((condition: string) => <li key={condition}>{condition}</li>)}</ul><p className="mt-1 text-[#756b62]">仍需结合现实条件确认是否适用。</p></dd></div>
      </dl>
      <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-[#f7f3ec] p-4 text-sm">
        <div><dt className="text-[#756b62]">金钱</dt><dd className="mt-1 font-semibold">{action.costs.money}</dd></div>
        <div><dt className="text-[#756b62]">时间</dt><dd className="mt-1 font-semibold">{action.costs.time}</dd></div>
        <div><dt className="text-[#756b62]">毅力</dt><dd className="mt-1 font-semibold">{action.costs.willpower}</dd></div>
      </dl>
      <p className="mt-4 text-sm font-semibold">证据等级：{action.evidenceGrade} · 指南条目性价比：{action.ratioTier}</p>
      <p className="mt-2 text-xs leading-6 text-[#756b62]">以上等级描述指南条目的依据与投入收益，适用条件仍须逐项核对。</p>
      {action.status === "controversial" && <p className="mt-4 rounded-xl border border-[#d9b1a3] bg-[#fff8f5] p-4 text-sm font-semibold">争议提醒：这条行动存在争议，请先核对下面的限制与原文。</p>}
      <div className="mt-4 text-sm leading-7"><h4 className="font-semibold">限制与备注</h4><ul className="mt-1 list-disc space-y-1 pl-5 text-[#756b62]">{presentation.caveats.map((caveat: string) => <li key={caveat}>{caveat}</li>)}</ul></div>
      <a href={source.url} target="_blank" rel="noreferrer" className="mt-5 inline-block text-sm leading-6 text-[#865334] underline underline-offset-4">指南出处：{source.chapter} · {source.title}</a>
      {detailed && (
        <div className="mt-6 border-t border-[#dfd3c8] pt-5 text-sm leading-7">
          <h4 className="font-semibold">核对清单</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[#756b62]">
            <li>对照本次情境回答，确认这项观察是否符合你现在的实际处境。</li>
            <li>逐项核对适用条件、成本和限制，再决定是否采用这一步。</li>
            <li>打开指南原文与下列依据，核对信息与规则是否仍适用。</li>
            <li>完成后记录实际投入、变化和下次复盘时间。</li>
          </ul>
          <ul className="mt-3 list-disc space-y-1 pl-5">{source.originalSources.map((url: string, index: number) => <li key={url}><a href={url} target="_blank" rel="noreferrer" className="break-words text-[#865334] underline underline-offset-4">原始依据 {index + 1}</a></li>)}</ul>
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
      <p className="mt-5 leading-8 text-[#756b62]">{detailed ? "已解锁详细报告；请在本设备重新完成测试以生成个性化内容" : "本设备没有可用的新版完整答案，请重新完成测试，生成本次生活选择地图。"}</p>
      <p className="mt-3 text-sm leading-7 text-[#756b62]">测试答案保存在完成测试的浏览器中，换设备或清除浏览器数据后需要重新测试。</p>
      <a href="/test" className="mt-6 inline-flex rounded-full bg-[#26211d] px-5 py-3 text-sm font-semibold text-white">重新完成测试</a>
    </section>
  );

  const reviews = selectPriorityReviews(snapshot);
  const selectedStages = LIFE_STAGES.filter(({ id }) => snapshot.lifeStages.includes(id));
  const displayStages = [
    ...selectedStages.filter(({ id }) => id === snapshot.priorityStage),
    ...selectedStages.filter(({ id }) => id !== snapshot.priorityStage),
  ];
  return (
    <div className="mt-10 rounded-[2rem] bg-[#fbf9f6] p-6 sm:p-10">
      <p className="text-sm font-semibold text-[#a0633d]">{detailed ? "你的详细报告" : "你的免费结果"}</p>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">本次处境快照</h1>
      <p className="mt-4 text-sm leading-7 text-[#756b62]">这份地图来自本次生活选择，描述眼下可能保留或回看的做法。处境变化时，可以重新复盘。</p>
      <section className="mt-6" aria-labelledby="current-life-stages">
        <h2 id="current-life-stages" className="text-xl font-bold">当前生活阶段</h2>
        <ul className="mt-3 flex flex-wrap gap-2">{displayStages.map(({ id, label }) => <li key={id} className="rounded-full bg-[#efe4d8] px-4 py-2 text-sm">{label}{id === snapshot.priorityStage ? "（优先展示）" : ""}</li>)}</ul>
      </section>
      <ChoiceMap areas={reviews.map} />
      <section className="mt-10" aria-labelledby="priority-reviews-heading">
        <h2 id="priority-reviews-heading" className="text-2xl font-bold">优先复盘</h2>
        <p className="mt-3 text-sm leading-7 text-[#756b62]">最多三项，依次回看难以承受的损失、资源投入与信息支持；每项都需要本次回答提供明确线索。</p>
        {reviews.cards.length === 0
          ? <div className="mt-4 rounded-2xl border border-dashed border-[#cdb9a8] p-5 text-sm leading-7"><p>暂不下结论：本次回答尚未提供足够线索匹配可复盘行动。已有保护做法可以保留，信息不足的区域可在经历相关处境后重新复盘。</p><a href="/test" className="mt-3 inline-block text-[#865334] underline underline-offset-4">重新复盘</a></div>
          : reviews.cards.slice(0, 3).map((review) => <ActionCard key={review.action.id} presentation={actionPresentationFor(review)!} detailed={detailed && reportAccess} />)}
      </section>
      {!detailed && <section className="mt-10 rounded-2xl border border-dashed border-[#cdb9a8] p-6"><h2 className="text-xl font-bold">查看详细报告</h2><p className="mt-3 text-sm leading-7 text-[#756b62]">详细报告为这些相同行动补充核对清单，使用本设备的同一份测试答案。</p><a href="/report" className="mt-5 inline-flex rounded-full bg-[#26211d] px-5 py-3 text-sm font-semibold text-white">查看报告或解锁</a></section>}
      <a href="/test" className="mt-8 inline-block text-sm text-[#865334] underline">处境变化了？重新完成测试</a>
    </div>
  );
}
