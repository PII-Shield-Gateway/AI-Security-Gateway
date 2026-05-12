import DarkModeToggle from "./DarkModeToggle";

function Header({ isDarkMode, onToggleDarkMode }) {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/80 sm:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm dark:bg-indigo-500">
            <ShieldLockIcon />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
              AI Security Gateway
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              AI Security Gateway
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              외부 AI API 호출 전 개인정보와 민감정보를 필터링합니다.
              원본 데이터는 차단하고 비식별화된 자료만 전송 대상으로 분리합니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["PII Detection", "Unique Token Masking", "Internal Restore", "Custom Policy"].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
            Gateway Active
          </span>
          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-300">
            Original BLOCKED
          </span>
          <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
        </div>
      </div>
    </header>
  );
}

function ShieldLockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path
        d="M12 2.75 18.5 5.5v5.1c0 4.57-2.9 8.59-6.5 10.15-3.6-1.56-6.5-5.58-6.5-10.15V5.5L12 2.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 11.25V9.9a2.25 2.25 0 0 1 4.5 0v1.35"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <rect
        x="8.75"
        y="11.25"
        width="6.5"
        height="5.25"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export default Header;
