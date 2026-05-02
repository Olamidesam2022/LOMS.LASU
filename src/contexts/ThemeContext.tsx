import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = (localStorage.getItem("theme") as Theme) || "light";
      return saved === "system" ? "light" : saved;
    } catch {
      return "light";
    }
  });
  const [isDark, setIsDark] = useState(false);

  // Apply initial theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement;
    let isDarkMode = false;

    if (newTheme === "dark") {
      html.classList.add("dark");
      isDarkMode = true;
    } else if (newTheme === "light") {
      html.classList.remove("dark");
      isDarkMode = false;
    } else {
      // system
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (systemDark) {
        html.classList.add("dark");
        isDarkMode = true;
      } else {
        html.classList.remove("dark");
        isDarkMode = false;
      }
    }

    setIsDark(isDarkMode);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
