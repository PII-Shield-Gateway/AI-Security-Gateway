function MaskedDocumentPanel({
  maskedText = "",
  transferStatus = "WAITING",
  onSendExternal = () => {},
  canSend = false,
  savedFile = null,
}) {
  const statusLabel =
    transferStatus === "SENT"
      ? "External Transfer: Sent"
      : transferStatus === "READY"
        ? "External Transfer: Ready"
        : "External Transfer: Waiting";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80 sm:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Masked Document
        </p>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          비식별화 자료
        </h2>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          외부 AI API에는 이 자료만 전송됩니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
          Masked
        </span>
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
          {statusLabel}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-950 dark:ring-slate-700/60">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            마스킹 결과
          </span>
          {maskedText ? (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Ready
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pending
            </span>
          )}
        </div>
        <pre className="mt-3 min-h-56 whitespace-pre-wrap break-words rounded-2xl bg-white p-4 text-sm leading-6 text-slate-900 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800">
          {maskedText || "보안 검사 실행 후 비식별화된 자료가 표시됩니다."}
        </pre>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSendExternal}
          disabled={!canSend}
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-500/20 transition-colors duration-200 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:disabled:bg-slate-700"
        >
          외부 AI로 안전 전송
        </button>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          마스킹 결과가 있을 때만 전송할 수 있습니다.
        </span>
      </div>

      {savedFile?.saved_file ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-500/10 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          저장된 파일: {savedFile.saved_file}
        </div>
      ) : null}
    </section>
  );
}

export default MaskedDocumentPanel;
