"use client";

import { useEffect, useState } from "react";
import { AssessmentResults } from "../../components/assessment-results";
import { ASSESSMENT_STORAGE_KEY } from "../../lib/life-value-assessment.mjs";

type ReportState =
  | { status: "loading" }
  | { status: "error"; message: string; retryBinding: boolean }
  | { status: "ready"; rawSnapshot: string | null };

export default function ReportPage() {
  const [state, setState] = useState<ReportState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    async function loadReport() {
      try {
        const response = await fetch("/api/me/report", { signal: controller.signal, cache: "no-store" });
        const payload: unknown = await response.json();
        const data = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
        if (controller.signal.aborted) return;
        if (!response.ok) {
          setState({ status: "error", message: typeof data.error === "string" ? data.error : "暂时无法查看报告，请稍后重试。", retryBinding: response.status === 401 || response.status === 403 });
          return;
        }
        if (data.reportAccess !== true || typeof data.sku !== "string") {
          setState({ status: "error", message: "报告权限暂时无法确认，请稍后重试。", retryBinding: false });
          return;
        }
        let rawSnapshot: string | null = null;
        try { rawSnapshot = window.localStorage.getItem(ASSESSMENT_STORAGE_KEY); }
        catch { /* Unavailable browser storage uses the explicit re-test state. */ }
        setState({ status: "ready", rawSnapshot });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error", message: "暂时无法连接报告服务，请稍后重试。", retryBinding: false });
      }
    }
    void loadReport();
    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-10 text-[#26211d]">
      <div className="mx-auto max-w-3xl">
        <a href="/account" className="text-sm text-[#a0633d]">← 我的报告</a>
        {state.status === "loading" && <p className="mt-10" role="status">正在确认报告权限…</p>}
        {state.status === "error" && (
          <section className="mt-10 rounded-[2rem] bg-[#fbf9f6] p-8" role="alert">
            <h1 className="text-3xl font-bold">暂时无法查看</h1>
            <p className="mt-4 text-[#756b62]">{state.message}</p>
            <a href={state.retryBinding ? "/redeem" : "/report"} className="mt-6 inline-flex rounded-full bg-[#26211d] px-5 py-3 text-sm font-semibold text-white">{state.retryBinding ? "去绑定或兑换" : "重新加载报告"}</a>
          </section>
        )}
        {state.status === "ready" && <AssessmentResults rawSnapshot={state.rawSnapshot} detailed reportAccess />}
      </div>
    </main>
  );
}
