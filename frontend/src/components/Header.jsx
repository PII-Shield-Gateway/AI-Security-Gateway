import DarkModeToggle from "./DarkModeToggle";

function Header({
  isDarkMode,
  onToggleDarkMode,
  gatewayStatus = "READY",
  timestamp = new Date().toLocaleString(),
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              AI Security Gateway
            </h1>
            <StatusBadge tone="emerald">Gateway Active</StatusBadge>
            <StatusBadge tone={gatewayStatus === "ERROR" ? "rose" : gatewayStatus === "SCANNING" ? "indigo" : "emerald"}>
              {gatewayStatus}
            </StatusBadge>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            보안 검사, 마스킹 결과 확인, 복구, 다운로드, 외부 전송을 한 화면에서 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Last Scan
            </span>
            <span className="ml-2 font-semibold text-slate-800 dark:text-slate-100">
              {timestamp}
            </span>
          </div>
          <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
        </div>
      </div>
    </header>
  );
}

function StatusBadge({ children, tone = "slate" }) {
  const classes = {
    emerald: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    indigo: "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300",
    rose: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
    slate: "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classes[tone]}`}>
      {children}
    </span>
  );
}

export default Header;
