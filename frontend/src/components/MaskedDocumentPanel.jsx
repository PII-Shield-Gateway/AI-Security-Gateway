function MaskedDocumentPanel({
  maskedText = "",
  transferStatus = "PENDING",
  onSendExternal = () => {},
  canSend = false,
  onDownloadMaskedTxt = () => {},
  onDownloadMaskedJson = () => {},
  riskLevel = "NONE",
}) {
  const statusLabel = transferStatus === "SENT" ? "SENT" : transferStatus === "READY" ? "READY" : "PENDING";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Masked Output
        </p>
        <h2 className="text-2xl font-semibold">비식별화 자료</h2>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          외부 AI API로는 masked_text만 전송됩니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge tone="emerald">비식별화 자료: {statusLabel}</Badge>
        <Badge tone="rose">원본 전송: BLOCKED</Badge>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-950 dark:ring-slate-700/60">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">마스킹 결과</span>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            External Transfer: {statusLabel}
          </span>
        </div>
        <pre className="mt-3 min-h-72 whitespace-pre-wrap break-words rounded-2xl bg-white p-4 text-sm leading-6 text-slate-900 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800">
          {maskedText || "보안 검사를 실행하면 비식별화된 자료가 표시됩니다."}
        </pre>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSendExternal}
          disabled={!canSend}
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-50 dark:disabled:bg-slate-700"
        >
          외부 AI로 안전 전송
        </button>
        <button
          type="button"
          onClick={onDownloadMaskedTxt}
          disabled={!maskedText}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          TXT 다운로드
        </button>
        <button
          type="button"
          onClick={onDownloadMaskedJson}
          disabled={!maskedText}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          JSON 다운로드
        </button>
      </div>

      {riskLevel === "CRITICAL" ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-500/10 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
          CRITICAL 위험 데이터는 외부 AI로 전송할 수 없습니다.
        </div>
      ) : null}
    </section>
  );
}

function Badge({ children, tone }) {
  const classes = {
    emerald: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    rose: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${classes[tone]}`}>
      {children}
    </span>
  );
}

export default MaskedDocumentPanel;
