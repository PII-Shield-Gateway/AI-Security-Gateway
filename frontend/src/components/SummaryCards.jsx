import { getRiskBadgeClasses } from "../utils/badgeStyles";

function SummaryCards({
  riskLevel = "NONE",
  detections = [],
  detectedPii = [],
  transferStatus = "WAITING",
  filterEngine = "READY",
}) {
  const uniqueTypes = Array.from(new Set(detectedPii));
  const typeSummary = uniqueTypes.length > 0 ? uniqueTypes.join(", ") : "없음";
  const detectionCount = Array.isArray(detections) ? detections.length : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80 sm:p-8">
      <div className="mb-5 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Analysis Summary
        </p>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          분석 결과 요약
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="데이터 유출 위험도"
          value={riskLevel}
          toneClass={getRiskBadgeClasses(riskLevel)}
        />
        <SummaryCard
          title="탐지된 PII 개수"
          value={`${detectionCount}개`}
          toneClass="bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300"
        />
        <SummaryCard
          title="탐지 유형"
          value={typeSummary}
          toneClass="bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300"
        />
        <SummaryCard
          title="필터 엔진"
          value={filterEngine}
          toneClass="bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
          footer={`원본: BLOCKED · 비식별화 자료: ${transferStatus}`}
        />
      </div>
    </section>
  );
}

function SummaryCard({ title, value, toneClass, footer = "" }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm ring-1 ring-slate-200/60 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-800/60">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <div
        className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${toneClass}`}
      >
        {value}
      </div>
      {footer ? (
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {footer}
        </p>
      ) : null}
    </article>
  );
}

export default SummaryCards;
