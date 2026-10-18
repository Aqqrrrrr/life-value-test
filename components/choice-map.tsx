/* eslint-disable @next/next/no-html-link-for-pages -- Native anchors support the current Vinext navigation fallback. */

import type { selectPriorityReviews } from "../lib/guide-action-catalog.mjs";

const states: Record<string, { label: string; description: string }> = {
  review: { label: "值得复盘", description: "本次回答出现明确复盘信号，可以先核对相关行动的条件。" },
  strength: { label: "已有保护做法", description: "本次回答中有可保留的保护做法，不代表这个区域已没有其他成本。" },
  mixed: { label: "可保留，也值得复盘", description: "本次回答同时呈现保护做法和复盘信号，可以结合具体处境回看。" },
  insufficient: { label: "信息不足", description: "本次回答尚不足以作出判断；没有遇过或不确定时，暂不下结论。" },
};

export function ChoiceMap({ areas }: { areas: ReturnType<typeof selectPriorityReviews>["map"] }) {
  return (
    <section className="mt-8" aria-labelledby="choice-map-heading">
      <h2 id="choice-map-heading" className="text-2xl font-bold">本次生活选择地图</h2>
      <p className="mt-3 text-sm leading-7 text-[#756b62]">六个生活区域分别描述本次回答。区域之间不作比较，状态也会随处境变化。</p>
      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="地图图例">
        {Object.entries(states).map(([id, state]) => <div key={id}><dt className="inline font-semibold">{state.label}</dt><dd className="sr-only">{state.description}</dd></div>)}
      </dl>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {areas.map(({ areaId, label, state }) => (
          <article key={areaId} data-area={areaId} data-state={state} aria-labelledby={`area-${areaId}`} className="rounded-2xl border border-[#dfd3c8] bg-white p-5">
            <h3 id={`area-${areaId}`} className="text-lg font-bold">{label}</h3>
            <p className="mt-3 font-semibold text-[#865334]">{states[state].label}</p>
            <p className="mt-2 text-sm leading-7 text-[#756b62]">{states[state].description}</p>
            <a href="/test" aria-label={`${label}：重新完成测评`} className="mt-4 inline-block text-sm text-[#865334] underline underline-offset-4">重新完成测评</a>
          </article>
        ))}
      </div>
    </section>
  );
}
