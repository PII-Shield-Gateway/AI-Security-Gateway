const steps = [
  {
    title: "원본 자료 입력",
    description: "기업 내부 문서, 상담 기록, 코드 조각을 안전하게 입력합니다.",
    border: "border-rose-200 dark:border-rose-500/30",
    background: "bg-rose-50 dark:bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-200",
    dot: "bg-rose-500",
  },
  {
    title: "PII 탐지 및 마스킹",
    description: "개인정보를 식별하고 비식별화된 텍스트로 변환합니다.",
    border: "border-indigo-200 dark:border-indigo-500/30",
    background: "bg-indigo-50 dark:bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-200",
    dot: "bg-indigo-500",
  },
  {
    title: "비식별화 자료 전송",
    description: "마스킹된 내용만 외부 AI API로 전달합니다.",
    border: "border-emerald-200 dark:border-emerald-500/30",
    background: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
];

function SecurityFlow() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80 sm:p-8">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Security Flow
        </p>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          원본 자료가 외부로 나가기 전의 보안 경로
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {steps.map((step, index) => (
          <div key={step.title} className="contents">
            <div
              className={`rounded-2xl border ${step.border} ${step.background} p-5 shadow-sm ring-1 ring-white/60 transition-colors duration-200 dark:ring-white/5`}
            >
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${step.dot}`} />
                <span className={`text-sm font-semibold ${step.text}`}>
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {step.description}
              </p>
            </div>

            {index < steps.length - 1 ? (
              <div className="flex items-center justify-center py-2 lg:py-0">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                  <span className="hidden h-px w-10 bg-current lg:block" />
                  <ArrowRightIcon />
                  <span className="hidden h-px w-10 bg-current lg:block" />
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5 shrink-0">
      <path
        d="M5 12h14m0 0-5-5m5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default SecurityFlow;
