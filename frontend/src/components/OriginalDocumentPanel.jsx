import { useState } from "react";

function OriginalDocumentPanel({
  sourceText = "",
  onSourceTextChange = () => {},
  onSampleClick = () => {},
  onTxtUpload = () => {},
  saveResult = false,
  outputFormat = "txt",
  onSaveResultChange = () => {},
  onOutputFormatChange = () => {},
  onRunCheck = () => {},
  onReset = () => {},
  isLoading = false,
  errorMessage = "",
}) {
  const [selectedFileName, setSelectedFileName] = useState("");

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    setSelectedFileName(file?.name ?? "");
    onTxtUpload(event);
  }

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

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
          TXT 파일 업로드
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <input
            id="source-file-upload"
            type="file"
            accept=".txt,text/plain"
            onChange={handleFileUpload}
            className="sr-only"
          />

          <label
            htmlFor="source-file-upload"
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm ring-1 ring-blue-500/20 transition-colors duration-200 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            파일 선택
          </label>

          <span className="max-w-64 truncate text-sm text-slate-500 dark:text-slate-400">
            {selectedFileName || "선택된 파일 없음"}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-950 dark:ring-slate-700/60">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={saveResult}
            onChange={(event) => onSaveResultChange(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-blue-600"
          />
          필터링 결과 파일로 저장
        </label>

        <div
          className={`mt-4 flex flex-wrap items-center gap-3 ${
            saveResult ? "" : "opacity-50"
          }`}
        >
          <span className="text-sm text-slate-600 dark:text-slate-300">
            저장 형식
          </span>
          <select
            value={outputFormat}
            onChange={(event) => onOutputFormatChange(event.target.value)}
            disabled={!saveResult}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200/60 transition-colors duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700/60"
          >
            <option value="txt">TXT</option>
            <option value="json">JSON</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
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
