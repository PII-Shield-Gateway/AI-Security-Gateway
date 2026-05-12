import { useState } from "react";

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
  const [selectedFileName, setSelectedFileName] = useState("");

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    setSelectedFileName(file?.name ?? "");
    onTxtUpload(event);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Internal Source
        </p>
        <h2 className="text-2xl font-semibold">내부 원본 자료</h2>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          원본 데이터는 외부 AI API로 전송되지 않습니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge tone="rose">원본 자료: BLOCKED</Badge>
        <Badge tone="slate">로그 원문 저장 안 함</Badge>
      </div>

      <label htmlFor="source-text" className="mt-6 block text-sm font-medium">
        원본 자료 입력
      </label>
      <textarea
        id="source-text"
        value={sourceText}
        onChange={(event) => onSourceTextChange(event.target.value)}
        placeholder="고객 상담 기록, 회의록, 계약 검토 메모, 코드 조각 등을 입력하세요."
        className="mt-3 min-h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm ring-1 ring-slate-200/60 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:ring-slate-700/60"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <PresetButton label="고객 상담 기록" onClick={() => onSampleClick("customer")} />
        <PresetButton label="회의록" onClick={() => onSampleClick("meeting")} />
        <PresetButton label="계약 검토 메모" onClick={() => onSampleClick("contract")} />
        <PresetButton label="코드/API Key 예시" onClick={() => onSampleClick("code")} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          id="source-file-upload"
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileUpload}
          className="sr-only"
        />
        <label
          htmlFor="source-file-upload"
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          TXT 업로드
        </label>
        <span className="max-w-64 truncate text-sm text-slate-500 dark:text-slate-400">
          {selectedFileName || "선택된 파일 없음"}
        </span>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRunCheck}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          {isLoading ? "검사 중..." : "보안 검사 실행"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          초기화
        </button>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm ring-1 ring-rose-500/10 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
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
      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      {label}
    </button>
  );
}

function Badge({ children, tone }) {
  const classes = {
    rose: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
    slate: "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${classes[tone]}`}>
      {children}
    </span>
  );
}

export default OriginalDocumentPanel;
