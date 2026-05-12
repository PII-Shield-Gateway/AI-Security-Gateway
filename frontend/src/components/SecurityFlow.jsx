const steps = [
  {
    title: "보안 검사",
    description: "내부 원본 자료에서 개인정보와 민감정보를 탐지합니다.",
    tone: "rose",
  },
  {
    title: "마스킹 결과 확인",
    description: "탐지 값을 토큰화하고 masked_text 상태를 READY로 전환합니다.",
    tone: "indigo",
  },
  {
    title: "복구 및 다운로드",
    description: "복구 결과는 INTERNAL ONLY로 분리하고 파일로 내보냅니다.",
    tone: "amber",
  },
  {
    title: "외부 전송",
    description: "외부 AI API에는 비식별화된 masked_text만 전송합니다.",
    tone: "emerald",
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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Security Flow
          </p>
          <h2 className="mt-1 text-lg font-semibold">보안 처리 흐름</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className={`rounded-xl border p-3 shadow-sm ${tones[step.tone]}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em]">
              Step {index + 1}
            </div>
            <h3 className="mt-2 text-sm font-semibold">{step.title}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default SecurityFlow;
