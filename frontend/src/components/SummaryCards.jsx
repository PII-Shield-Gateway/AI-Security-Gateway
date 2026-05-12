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
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
      <SummaryCard title="위험도" value={riskLevel} toneClass={getRiskBadgeClasses(riskLevel)} />
      <SummaryCard title="탐지 항목" value={`${detectionCount}개`} />
      <SummaryCard title="탐지 유형" value={typeSummary} toneClass="bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300" />
      <SummaryCard title="필터 엔진" value={filterEngine} toneClass="bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:text-teal-300" />
      <SummaryCard title="원본 상태" value="BLOCKED" toneClass="bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300" />
      <SummaryCard title="비식별화" value={transferStatus} toneClass="bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300" />
    </section>
  );
}

function SummaryCard({
  title,
  value,
  toneClass = "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300",
}) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/60">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <div className={`mt-2 inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClass}`}>
        <span className="truncate">{value}</span>
      </div>
    </article>
  );
}

export default SummaryCards;
