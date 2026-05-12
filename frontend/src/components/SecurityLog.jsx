function SecurityLog({
  transferStatus = "PENDING",
  gatewayStatus = "READY",
  externalApiResponse = "외부 AI API 응답은 비식별화 자료를 전송한 뒤 표시됩니다.",
  filterEngine = "gateway_detector",
  downloadedFile = null,
  downloadMessage = "",
  logSaved = false,
  detectedPii = [],
  riskLevel = "NONE",
  timestamp = new Date().toLocaleString(),
  latencyMs = "측정 예정",
  restoredText = "",
  onDownloadSecurityLogJson = () => {},
}) {
  const items = [
    ["처리 시각", timestamp, "blue"],
    ["original_text", "BLOCKED", "red"],
    ["masked_text", transferStatus, getTransferTone(transferStatus)],
    ["restored_text", restoredText ? "INTERNAL ONLY" : "INTERNAL ONLY", "amber"],
    ["risk_level", riskLevel, getRiskTone(riskLevel)],
    ["detected_pii", detectedPii.length > 0 ? detectedPii.join(", ") : "없음", "slate"],
    ["external_api_response", externalApiResponse, "emerald"],
    ["latency_ms", latencyMs, "slate"],
    ["gateway_status", gatewayStatus, getGatewayTone(gatewayStatus)],
    ["filter_engine", filterEngine, "indigo"],
    ["log_saved", String(logSaved), logSaved ? "emerald" : "slate"],
    ["download_file", downloadedFile?.filename || "없음", downloadedFile?.filename ? "blue" : "slate"],
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Security Log
          </p>
          <h2 className="mt-1 text-lg font-semibold">보안 처리 로그</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            로그에는 원본 개인정보 값을 저장하지 않습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onDownloadSecurityLogJson}
          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          로그 JSON 다운로드
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-1">
        {items.map(([label, value, tone]) => (
          <LogItem key={label} label={label} value={value} tone={tone} />
        ))}
      </div>

      {downloadMessage ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          {downloadMessage}
        </div>
      ) : null}
    </section>
  );
}

function LogItem({ label, value, tone = "slate" }) {
  const toneClasses = {
    emerald: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    blue: "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300",
    indigo: "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300",
    amber: "bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-300",
    red: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300",
    slate: "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300",
  };

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-800/60">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <div className={`mt-1 inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClasses[tone] ?? toneClasses.slate}`}>
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function getTransferTone(status) {
  if (status === "SENT" || status === "READY") return "emerald";
  return "slate";
}

function getGatewayTone(status) {
  if (status === "ERROR") return "red";
  if (status === "SCANNING") return "indigo";
  if (status === "MASKED" || status === "SENT") return "emerald";
  return "blue";
}

function getRiskTone(riskLevel) {
  if (riskLevel === "CRITICAL") return "red";
  if (riskLevel === "HIGH" || riskLevel === "MEDIUM") return "amber";
  if (riskLevel === "LOW" || riskLevel === "NONE") return "emerald";
  return "slate";
}

export default SecurityLog;
