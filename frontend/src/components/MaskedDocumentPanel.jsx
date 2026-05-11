function MaskedDocumentPanel({
  maskedText = "",
  transferStatus = "PENDING",
  onSendExternal = () => {},
  canSend = false,
  outputFormat = "txt",
  onOutputFormatChange = () => {},
  onDownloadFilteredFile = () => {},
  isDownloading = false,
  downloadedFile = null,
  downloadMessage = "",
  riskLevel = "NONE",
}) {
  const statusLabel =
    transferStatus === "SENT"
      ? "External Transfer: Sent"
      : transferStatus === "READY"
        ? "External Transfer: Ready"
        : "External Transfer: Pending";

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
          외부 AI API로는 비식별화된 자료만 전송됩니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
          Masked
        </span>
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
          {transferStatus === "PENDING" ? "PENDING" : transferStatus}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-950 dark:ring-slate-700/60">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            마스킹 결과
          </span>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {statusLabel}
          </span>
        </div>
        <pre
          id="maskedText"
          className="mt-3 min-h-56 whitespace-pre-wrap break-words rounded-2xl bg-white p-4 text-sm leading-6 text-slate-900 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
        >
          {maskedText || "보안 검사를 실행하면 비식별화된 자료가 표시됩니다."}
        </pre>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-950 dark:ring-slate-700/60">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            다운로드 형식
          </label>
          <select
            value={outputFormat}
            onChange={(event) => onOutputFormatChange(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200/60 transition-colors duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700/60"
          >
            <option value="txt">TXT</option>
            <option value="json">JSON</option>
          </select>
          <button
            type="button"
            onClick={onDownloadFilteredFile}
            disabled={!maskedText || isDownloading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            {isDownloading ? "다운로드 중..." : "필터링 결과 다운로드"}
          </button>
        </div>
      </div>

      {downloadedFile?.filename ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-500/10 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <div className="font-semibold">다운로드 완료</div>
          {downloadMessage ? <div className="mt-1">{downloadMessage}</div> : null}
          <div className="mt-1 font-medium">
            {String(downloadedFile.format || outputFormat).toUpperCase()} 파일이 저장되었습니다.
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          id="sendExternalBtn"
          type="button"
          onClick={onSendExternal}
          disabled={!canSend}
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-500/20 transition-colors duration-200 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:disabled:bg-slate-700"
        >
          외부 AI로 안전 전송
        </button>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          마스킹 결과가 있을 때만 전송할 수 있습니다.
        </span>
      </div>

      {riskLevel === "CRITICAL" ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-500/10 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
          CRITICAL 위험도 자료는 외부 AI로 전송할 수 없습니다.
        </div>
      ) : null}
    </section>
  );
}

export default MaskedDocumentPanel;
