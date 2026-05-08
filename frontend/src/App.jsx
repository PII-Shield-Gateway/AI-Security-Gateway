import { useEffect, useState } from "react";
import DarkModeToggle from "./components/DarkModeToggle";

const THEME_STORAGE_KEY = "theme";

function getInitialDarkMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark") {
    return true;
  }

  if (storedTheme === "light") {
    return false;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add("dark");
      window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
      return;
    }

    root.classList.remove("dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
  }, [isDarkMode]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            AI Security Gateway
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Frontend Initialization</h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            React, Vite, Tailwind CSS 기본 구조가 준비되었습니다. 다음 단계에서
            대시보드 UI와 기능을 순차적으로 추가합니다.
          </p>
        </div>

        <DarkModeToggle
          isDarkMode={isDarkMode}
          onToggle={() => setIsDarkMode((current) => !current)}
        />
      </div>
    </main>
  );
}

export default App;
