"use client";
import { type ComponentProps, useEffect, useState } from "react";
function Link({ href, ...props }: ComponentProps<"a">) { return <a href={href} {...props} />; }

type Report = { title: string; summary: string; dimensions: { name: string; value: string; detail: string }[]; review: string[]; sources: string[] };

export default function ReportPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/me/report").then(async (response) => { const data = await response.json(); if (!response.ok) setError(data.error ?? "暂无报告"); else setReport(data.report); }); }, []);
  return <main className="min-h-screen bg-[#f7f3ec] px-6 py-10 text-[#26211d]"><div className="mx-auto max-w-3xl"><Link href="/account" className="text-sm text-[#a0633d]">← 我的报告</Link>{error ? <div className="mt-10 rounded-[2rem] bg-[#fbf9f6] p-8"><h1 className="text-3xl font-bold">暂时无法查看</h1><p className="mt-4 text-[#756b62]">{error}</p><Link href="/redeem" className="mt-6 inline-flex rounded-full bg-[#26211d] px-5 py-3 text-sm font-semibold text-white">去绑定或兑换</Link></div> : report && <div className="mt-10 rounded-[2rem] bg-[#fbf9f6] p-8 sm:p-10"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a0633d]">Detailed report</p><h1 className="mt-3 text-4xl font-bold">{report.title}</h1><p className="mt-5 text-lg leading-8 text-[#756b62]">{report.summary}</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{report.dimensions.map((item) => <div key={item.name} className="rounded-2xl bg-[#efe4d8] p-5"><p className="text-sm text-[#756b62]">{item.name}</p><p className="mt-2 text-2xl font-bold text-[#a0633d]">{item.value}</p><p className="mt-3 text-sm leading-6 text-[#756b62]">{item.detail}</p></div>)}</div><section className="mt-10"><h2 className="text-xl font-bold">复盘清单</h2><ul className="mt-4 space-y-3">{report.review.map((item) => <li key={item} className="rounded-xl border border-[#dfd3c8] bg-white p-4 text-sm leading-6">{item}</li>)}</ul></section><section className="mt-10"><h2 className="text-xl font-bold">指南出处</h2><ul className="mt-4 space-y-2 text-sm text-[#756b62]">{report.sources.map((item) => <li key={item}>· {item}</li>)}</ul></section></div>}</div></main>;
}
