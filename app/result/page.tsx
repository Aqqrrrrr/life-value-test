"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Native anchors are required by the current Vinext navigation fallback. */

import { useSyncExternalStore } from "react";
import { AssessmentResults } from "../../components/assessment-results";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readSnapshot() {
  try { return window.localStorage.getItem("life-value-test-v2"); }
  catch { return null; }
}

export default function ResultPage() {
  const rawSnapshot = useSyncExternalStore(subscribe, readSnapshot, () => undefined);
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-10 text-[#26211d]">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm text-[#a0633d]">← 首页</a>
        {rawSnapshot === undefined
          ? <p className="mt-10" role="status">正在读取本设备的测试结果…</p>
          : <AssessmentResults rawSnapshot={rawSnapshot} />}
      </div>
    </main>
  );
}
