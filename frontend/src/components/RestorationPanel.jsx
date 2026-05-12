function RestorationPanel({
  maskedText = "",
  restoredText = "",
  tokenMap = {},
  onRestore = () => {},
  onDownloadRestoredTxt = () => {},
}) {
  const tokenCount = Object.keys(tokenMap).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Restoration Tool
        </p>
        <h2 className="mt-2 text-xl font-semibold">복구 도구</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          복구 결과는 내부 검토용입니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge>복구 자료: INTERNAL ONLY</Badge>
        <Badge>{tokenCount} tokens</Badge>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        복구된 원본 데이터는 외부 AI API로 전송되지 않습니다. 운영 환경에서는 tokenMap을 암호화된 내부 저장소에만 보관해야 합니다.
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRestore}
          disabled={!maskedText || tokenCount === 0}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          복구 실행
        </button>
        <button
          type="button"
          onClick={onDownloadRestoredTxt}
          disabled={!restoredText}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          복구 결과 TXT 다운로드
        </button>
      </div>

      <pre className="mt-5 min-h-56 whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-900 ring-1 ring-slate-200/70 dark:bg-slate-950 dark:text-slate-100 dark:ring-slate-800">
        {restoredText || "복구 실행 후 내부 검토용 원문이 표시됩니다."}
      </pre>
    </section>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-300">
      {children}
    </span>
  );
}

export default RestorationPanel;
