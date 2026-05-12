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
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80">
      <div className="mb-5 flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Security Log
        </p>
        <h2 className="text-xl font-semibold">보안 처리 로그</h2>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          보안 로그에는 원본 개인정보 값을 저장하지 않습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <LogItem label="timestamp" value={timestamp} tone="blue" />
        <LogItem label="risk_level" value={riskLevel} tone={getRiskTone(riskLevel)} />
        <LogItem label="detected_pii" value={detectedPii.length > 0 ? detectedPii.join(", ") : "없음"} />
        <LogItem label="original_text" value="BLOCKED" tone="red" />
        <LogItem label="masked_text" value={transferStatus} tone={getTransferTone(transferStatus)} />
        <LogItem label="restored_text" value={restoredText ? "INTERNAL ONLY" : "NOT RESTORED"} tone="amber" />
        <LogItem label="gateway_status" value={gatewayStatus} tone={getGatewayTone(gatewayStatus)} />
        <LogItem label="filter_engine" value={filterEngine} tone="indigo" />
        <LogItem label="latency_ms" value={latencyMs} />
        <LogItem label="external_api_response" value={externalApiResponse} tone="emerald" />
        <LogItem label="log_saved" value={String(logSaved)} tone={logSaved ? "emerald" : "slate"} />
        <LogItem label="download_file" value={downloadedFile?.filename || "없음"} tone={downloadedFile?.filename ? "blue" : "slate"} />
        <LogItem label="download_message" value={downloadMessage || "-"} tone={downloadedFile?.filename ? "emerald" : "slate"} />
      </div>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-800/60">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <div className={`mt-2 inline-flex max-w-full rounded-full px-3 py-1 text-sm font-semibold ring-1 ${toneClasses[tone] ?? toneClasses.slate}`}>
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
