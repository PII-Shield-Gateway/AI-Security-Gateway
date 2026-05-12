function DarkModeToggle({ isDarkMode, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      <span
        className={`inline-flex h-2.5 w-2.5 rounded-full ${
          isDarkMode ? "bg-indigo-400" : "bg-amber-400"
        }`}
        aria-hidden="true"
      />
      {isDarkMode ? "Dark" : "Light"}
    </button>
  );
}

export default DarkModeToggle;
