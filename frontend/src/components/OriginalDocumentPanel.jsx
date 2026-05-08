function OriginalDocumentPanel({
  sourceText = "",
  onSourceTextChange = () => {},
  onSampleClick = () => {},
  onTxtUpload = () => {},
  onRunCheck = () => {},
  onReset = () => {},
  isLoading = false,
  errorMessage = "",
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80 sm:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Original Document
        </p>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          내부 원본 자료
        </h2>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          이 자료는 외부 AI API로 직접 전송되지 않습니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
          Original
        </span>
        <span className="inline-flex items-center rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-300">
          External Transfer: Blocked
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <label
          htmlFor="source-text"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          원본 자료 입력
        </label>
        <textarea
          id="source-text"
          name="source-text"
          value={sourceText}
          onChange={(event) => onSourceTextChange(event.target.value)}
          placeholder="기업 내부 문서, 고객 상담 기록, 회의록, 코드 조각 등을 입력하세요."
          className="min-h-56 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm ring-1 ring-slate-200/60 transition-colors duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:ring-slate-700/60 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <PresetButton label="고객 상담 기록" onClick={() => onSampleClick("customer")} />
        <PresetButton label="회의록" onClick={() => onSampleClick("meeting")} />
        <PresetButton label="계약 검토 메모" onClick={() => onSampleClick("contract")} />
        <PresetButton label="코드/API Key 예시" onClick={() => onSampleClick("code")} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 transition-colors duration-200 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/60">
          <span className="font-medium text-slate-700 dark:text-slate-200">TXT 파일 업로드</span>
          <span>TXT 파일만 업로드할 수 있습니다.</span>
          <input
            type="file"
            accept=".txt,text/plain"
            onChange={onTxtUpload}
            className="sr-only"
          />
        </label>

        <div className="flex flex-col gap-3 sm:items-end sm:justify-end">
          <button
            type="button"
            onClick={onRunCheck}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-blue-500/20 transition-colors duration-200 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-blue-500 dark:hover:bg-blue-400 dark:disabled:bg-slate-700"
          >
            {isLoading ? "검사 중..." : "보안 검사 실행"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/60 transition-colors duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700/60 dark:hover:bg-slate-800"
          >
            초기화
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div
          className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm ring-1 ring-rose-500/10 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
}

function PresetButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      {label}
    </button>
  );
}

export default OriginalDocumentPanel;
