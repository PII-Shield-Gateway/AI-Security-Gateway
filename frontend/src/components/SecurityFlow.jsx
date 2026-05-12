const steps = [
  {
    title: "원본 입력",
    description: "내부 문서는 검사 전용으로만 사용되고 외부 AI API 전송은 차단됩니다.",
    tone: "rose",
  },
  {
    title: "탐지 및 마스킹",
    description: "PII와 사용자 맞춤형 필터를 탐지해 [NAME_1] 같은 고유 토큰으로 변환합니다.",
    tone: "indigo",
  },
  {
    title: "안전 전송",
    description: "외부 전송 버튼은 항상 masked_text만 사용합니다.",
    tone: "emerald",
  },
  {
    title: "내부 복구",
    description: "tokenMap 기반 복구는 내부 검토용이며 외부 전송과 분리됩니다.",
    tone: "amber",
  },
];

const tones = {
  rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
};

function SecurityFlow() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div className="mb-5 flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Security Flow
        </p>
        <h2 className="text-xl font-semibold">데이터 상태 분리</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className={`rounded-2xl border p-4 shadow-sm ${tones[step.tone]}`}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.18em]">
              Step {index + 1}
            </div>
            <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default SecurityFlow;
