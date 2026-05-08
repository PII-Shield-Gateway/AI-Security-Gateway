function SecurityLog({
  transferStatus = "WAITING",
  gatewayStatus = "READY",
  externalApiResponse = "보안 검사 후 외부 AI API 응답이 표시됩니다.",
  filterEngine = "READY",
  savedFile = null,
  logSaved = false,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80 sm:p-8">
      <div className="mb-5 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Security Log
        </p>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          보안 처리 로그
        </h2>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          원본 자료는 차단되고, 비식별화된 자료만 외부 AI API로 전달됩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LogItem label="원본 자료 전송" value="BLOCKED" tone="red" />
        <LogItem
          label="비식별화 자료 전송"
          value={transferStatus}
          tone={getTransferTone(transferStatus)}
        />
        <LogItem
          label="Gateway 처리 상태"
          value={gatewayStatus}
          tone={getGatewayTone(gatewayStatus)}
        />
        <LogItem label="필터 엔진" value={filterEngine} tone="indigo" />
        <LogItem
          label="외부 API 응답"
          value={externalApiResponse}
          tone="emerald"
          valueClassName="whitespace-pre-wrap break-words"
        />
        <LogItem
          label="로그 저장 여부"
          value={String(logSaved)}
          tone={logSaved ? "emerald" : "slate"}
        />
        <LogItem
          label="파일 저장 여부"
          value={savedFile?.saved_file ? "SAVED" : "NOT SAVED"}
          tone={savedFile?.saved_file ? "emerald" : "slate"}
        />
        <LogItem
          label="저장 형식"
          value={savedFile?.format ? String(savedFile.format).toUpperCase() : "-"}
          tone={savedFile?.saved_file ? "blue" : "slate"}
        />
        <LogItem
          label="저장 파일 경로"
          value={savedFile?.saved_file ?? "없음"}
          tone={savedFile?.saved_file ? "emerald" : "slate"}
          valueClassName="whitespace-pre-wrap break-words"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700/60">
        보안 검사 후 외부 AI API 응답이 표시됩니다.
      </div>
    </section>
  );
}

function LogItem({ label, value, tone = "slate", valueClassName = "" }) {
  const toneClasses = {
    emerald:
      "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    blue: "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300",
    indigo:
      "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300",
    yellow:
      "bg-yellow-500/10 text-yellow-800 ring-yellow-500/20 dark:text-yellow-300",
    orange:
      "bg-orange-500/10 text-orange-700 ring-orange-500/20 dark:text-orange-300",
    red: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300",
    slate:
      "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm ring-1 ring-slate-200/60 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-800/60">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div
        className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${toneClasses[tone] ?? toneClasses.slate} ${valueClassName}`}
      >
        {value}
      </div>
    </div>
  );
}

function getTransferTone(status) {
  switch (status) {
    case "SENT":
      return "emerald";
    case "READY":
      return "blue";
    case "WAITING":
      return "slate";
    default:
      return "orange";
  }
}

function getGatewayTone(status) {
  switch (status) {
    case "READY":
      return "blue";
    case "SCANNING":
      return "indigo";
    case "MASKED":
      return "emerald";
    case "SENT":
      return "emerald";
    case "ERROR":
      return "red";
    default:
      return "slate";
  }
}

export default SecurityLog;
