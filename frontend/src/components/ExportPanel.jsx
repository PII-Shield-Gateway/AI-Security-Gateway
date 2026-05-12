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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Export
        </p>
        <h2 className="mt-2 text-xl font-semibold">다운로드/내보내기</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          로그 파일에는 original_text 원문과 개인정보 value를 포함하지 않습니다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        <ExportButton disabled={!maskedText} onClick={onDownloadMaskedTxt}>
          마스킹 결과 TXT 다운로드
        </ExportButton>
        <ExportButton disabled={!maskedText} onClick={onDownloadMaskedJson}>
          마스킹 결과 JSON 다운로드
        </ExportButton>
        <ExportButton disabled={!restoredText} onClick={onDownloadRestoredTxt}>
          복구 결과 TXT 다운로드
        </ExportButton>
        <ExportButton onClick={onDownloadSecurityLogJson}>
          보안 로그 JSON 다운로드
        </ExportButton>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        복구 결과에는 원본 개인정보가 포함될 수 있으므로 안전한 환경에서만 저장하세요.
      </div>

      {downloadedFile?.filename ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <div className="font-semibold">다운로드 완료</div>
          <div className="mt-1">{downloadMessage}</div>
          <div className="mt-1 truncate font-medium">{downloadedFile.filename}</div>
        </div>
      ) : null}
    </section>
  );
}

function ExportButton({ children, disabled = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
    >
      {children}
    </button>
  );
}

export default ExportPanel;
