import { useEffect, useState } from "react";
import type { ThemeMode } from "../types";

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => (localStorage.getItem("theme") as ThemeMode) || "light",
  );

  useEffect(() => {
    localStorage.setItem("theme", themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { themeMode, toggleTheme };
}
