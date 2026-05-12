function RestorationPanel({
  maskedText = "",
  restoredText = "",
  tokenMap = {},
  onRestore = () => {},
  onDownloadRestoredTxt = () => {},
}) {
  const tokenCount = Object.keys(tokenMap).length;
  const canRestore = Boolean(maskedText) && tokenCount > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Restoration Tool
          </p>
          <h2 className="mt-1 text-lg font-semibold">마스킹 복구</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            복구 결과는 내부 검토용이며 외부 AI API로 전송되지 않습니다.
          </p>
        </div>
        <Badge>restored_text: INTERNAL ONLY</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <span>{tokenCount} tokens available</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRestore}
            disabled={!canRestore}
            title={!canRestore ? "복구 가능한 토큰이 있을 때만 사용할 수 있습니다." : "마스킹 토큰을 내부 원본 값으로 복구합니다."}
            className="h-9 rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            복구 실행
          </button>
          <button
            type="button"
            onClick={onDownloadRestoredTxt}
            disabled={!restoredText}
            title={!restoredText ? "복구 결과 생성 후 다운로드할 수 있습니다." : "복구 결과를 TXT로 다운로드합니다."}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            TXT 다운로드
          </button>
        </div>
      </div>

      <pre className="mt-4 h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-900 ring-1 ring-slate-200/70 dark:bg-slate-950 dark:text-slate-100 dark:ring-slate-800">
        {restoredText || "복구 실행 후 내부 검토용 원문이 표시됩니다."}
      </pre>
    </section>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-300">
      {children}
    </span>
  );
}

export default RestorationPanel;
