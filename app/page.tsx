import Link from "next/link";

const features = [
  ["24 题", "用真实生活取舍，识别你的决策偏好"],
  ["3 个维度", "钱、时间、毅力一起看，不只看价格"],
  ["1 份报告", "免费结果先看方向，购买后解锁逐项解释"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] text-[#26211d]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6"><Link href="/" className="text-lg font-bold tracking-tight">人生性价比</Link><div className="flex items-center gap-5 text-sm text-[#756b62]"><Link href="/test">开始测试</Link><Link href="/redeem">兑换报告</Link><Link href="/account">我的报告</Link></div></nav>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div><p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#a0633d]">A practical self-reflection tool</p><h1 className="max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-7xl">你做的选择，<br /><span className="text-[#a0633d]">真的划算吗？</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-[#756b62]">基于《高性价比人生指南》的成本、收益和证据框架，把“我该不该做”变成一套可以复盘的决策风格测试。</p><div className="mt-9 flex flex-wrap gap-3"><Link className="rounded-full bg-[#26211d] px-6 py-3 font-semibold text-white transition hover:bg-[#a0633d]" href="/test">免费开始 24 题</Link><Link className="rounded-full border border-[#cfc3b7] px-6 py-3 font-semibold" href="/redeem">已有兑换码</Link></div><p className="mt-4 text-xs text-[#968b82]">测评用于自我反思，不是心理诊断或正式人格测验。</p></div>
        <div className="rounded-[2rem] bg-[#dfd2c3] p-5 shadow-2xl shadow-[#8d735d]/10"><div className="rounded-[1.5rem] bg-[#f8f5f0] p-7"><div className="flex items-center justify-between text-xs text-[#968b82]"><span>人生性价比测试</span><span>01 / 24</span></div><div className="mt-10 h-2 rounded-full bg-[#e7ded4]"><div className="h-2 w-1/4 rounded-full bg-[#a0633d]" /></div><h2 className="mt-8 text-3xl font-bold">当时间有限时，你会先做什么？</h2><div className="mt-6 space-y-3">{["先处理最坏结果", "先做最容易开始的", "先问别人怎么选"].map((item) => <div key={item} className="rounded-xl border border-[#ded3c8] bg-white p-4 text-sm">{item}</div>)}</div></div></div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">{features.map(([title, text]) => <div key={title} className="rounded-2xl border border-[#e1d7cd] bg-[#fbf9f6] p-6"><div className="text-3xl font-bold text-[#a0633d]">{title}</div><p className="mt-3 text-sm leading-6 text-[#756b62]">{text}</p></div>)}</section>
    </main>
  );
}
