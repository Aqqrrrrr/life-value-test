/* eslint-disable @next/next/no-html-link-for-pages -- Native anchors are required by the current Vinext navigation fallback. */

const features = [
  ["自适应 22–30 道题", "选择 1–3 个同时经历的生活阶段，完成 18 道核心题与每阶段 4 道处境题。"],
  ["3 类问题分开看", "安全健康、时间精力、钱与权益有不同的判断重点。"],
  ["1 份当下的快照", "结果会随处境与经验改变，可用来复盘下一步。"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] text-[#26211d]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6"><a href="/" className="text-lg font-bold tracking-tight">人生性价比</a><div className="flex items-center gap-5 text-sm text-[#756b62]"><a href="/test">开始测试</a><a href="/redeem">兑换报告</a><a href="/account">我的报告</a></div></nav>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div><p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#a0633d]">A practical self-reflection tool</p><h1 className="max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-7xl">你做的选择，<br /><span className="text-[#a0633d]">真的划算吗？</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-[#756b62]">基于《高性价比人生指南》的成本、收益和证据框架，完成生活选择自我测评，看看当前处境中已有的保护做法和值得复盘的下一步。结果是当下的一张快照，处境变了，也值得重新测试。</p><div className="mt-9 flex flex-wrap gap-3"><a className="rounded-full bg-[#26211d] px-6 py-3 font-semibold text-white transition hover:bg-[#a0633d]" href="/test">免费开始测试</a><a className="rounded-full border border-[#cfc3b7] px-6 py-3 font-semibold" href="/redeem">已有兑换码</a></div><p className="mt-4 text-xs leading-5 text-[#968b82]">测评用于自我反思，不是心理诊断或正式人格测验；遇到紧急危险，应先寻求现实中的即时帮助。</p></div>
        <div className="rounded-[2rem] bg-[#dfd2c3] p-5 shadow-2xl shadow-[#8d735d]/10"><div className="rounded-[1.5rem] bg-[#f8f5f0] p-7"><div className="flex items-center justify-between text-xs text-[#968b82]"><span>人生性价比测试</span><span>选择 1–3 个阶段</span></div><div className="mt-10 h-2 rounded-full bg-[#e7ded4]"><div className="h-2 w-1/4 rounded-full bg-[#a0633d]" /></div><h2 className="mt-8 text-3xl font-bold">先看你正在面对什么</h2><div className="mt-6 space-y-3">{["稳定工作", "独居", "照护父母/家庭责任增加"].map((item) => <div key={item} className="rounded-xl border border-[#ded3c8] bg-white p-4 text-sm">{item}</div>)}</div><p className="mt-5 text-xs leading-6 text-[#968b82]">多个阶段可以同时选择，题目随所选阶段调整。</p></div></div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">{features.map(([title, description]) => <div key={title} className="rounded-2xl border border-[#e1d7cd] bg-[#fbf9f6] p-6"><div className="text-2xl font-bold text-[#a0633d]">{title}</div><p className="mt-3 text-sm leading-6 text-[#756b62]">{description}</p></div>)}</section>
    </main>
  );
}
