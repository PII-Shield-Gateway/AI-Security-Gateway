import { useEffect, useState } from "react";
import Header from "./components/Header";

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
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((current) => !current)}
        />
      </div>
    </main>
  );
}

export default App;
