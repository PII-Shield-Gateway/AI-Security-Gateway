import { getRiskBadgeClasses } from "../utils/badgeStyles";

function SummaryCards({
  riskLevel = "NONE",
  detections = [],
  detectedPii = [],
  transferStatus = "PENDING",
  filterEngine = "gateway_detector",
}) {
  const uniqueTypes = Array.from(new Set(detectedPii));
  const typeSummary = uniqueTypes.length > 0 ? uniqueTypes.join(", ") : "없음";
  const detectionCount = Array.isArray(detections) ? detections.length : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div className="mb-5 flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Analysis Summary
        </p>
        <h2 className="text-xl font-semibold">분석 결과 요약</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard title="위험도" value={riskLevel} toneClass={getRiskBadgeClasses(riskLevel)} />
        <SummaryCard title="탐지 항목 수" value={`${detectionCount}개`} />
        <SummaryCard title="탐지 유형" value={typeSummary} toneClass="bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300" wide />
        <SummaryCard title="필터 엔진" value={filterEngine} toneClass="bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:text-teal-300" wide />
        <SummaryCard title="원본 전송 상태" value="BLOCKED" toneClass="bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300" />
        <SummaryCard title="비식별화 전송 상태" value={transferStatus} toneClass="bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300" />
      </div>
    </section>
  );
}

function SummaryCard({
  title,
  value,
  toneClass = "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300",
  wide = false,
}) {
  return (
    <article className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-800/60 ${wide ? "xl:col-span-2" : ""}`}>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <div className={`mt-3 inline-flex max-w-full rounded-full px-3 py-1 text-sm font-semibold ring-1 ${toneClass}`}>
        <span className="truncate">{value}</span>
      </div>
    </article>
  );
}

export default SummaryCards;
