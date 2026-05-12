function ExportPanel({
  maskedText = "",
  restoredText = "",
  onDownloadMaskedTxt = () => {},
  onDownloadMaskedJson = () => {},
  onDownloadRestoredTxt = () => {},
  onDownloadSecurityLogJson = () => {},
  downloadedFile = null,
  downloadMessage = "",
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Export
        </p>
        <h2 className="mt-1 text-lg font-semibold">다운로드</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          로그 파일에는 original_text 원문과 개인정보 value를 포함하지 않습니다.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <ExportButton disabled={!maskedText} title={!maskedText ? "결과 생성 후 다운로드할 수 있습니다." : ""} onClick={onDownloadMaskedTxt}>
          마스킹 TXT
        </ExportButton>
        <ExportButton disabled={!maskedText} title={!maskedText ? "결과 생성 후 다운로드할 수 있습니다." : ""} onClick={onDownloadMaskedJson}>
          마스킹 JSON
        </ExportButton>
        <ExportButton disabled={!restoredText} title={!restoredText ? "복구 결과 생성 후 다운로드할 수 있습니다." : ""} onClick={onDownloadRestoredTxt}>
          복구 TXT
        </ExportButton>
        <ExportButton onClick={onDownloadSecurityLogJson}>
          보안 로그 JSON
        </ExportButton>
      </div>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        복구 결과에는 원본 개인정보가 포함될 수 있으므로 내부 보안 환경에서만 저장하세요.
      </div>

      {downloadedFile?.filename ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <div className="font-semibold">다운로드 완료</div>
          <div className="mt-1">{downloadMessage}</div>
          <div className="mt-1 truncate font-medium">{downloadedFile.filename}</div>
        </div>
      ) : null}
    </section>
  );
}

function ExportButton({ children, disabled = false, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm font-semibold text-slate-700 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
    >
      {children}
    </button>
  );
}

export default ExportPanel;
