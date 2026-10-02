import * as React from "react";

import {
  initializeTheme,
  type ResolvedTheme,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "../utils/theme";

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme | null;
  setPreference: (preference: ThemePreference) => void;
}

export const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // The initial React tree is identical in SSR and hydration. The head script
  // applies colors before paint; this effect only connects React to that state.
  const [theme, setTheme] = React.useState<{
    preference: ThemePreference;
    resolvedTheme: ResolvedTheme | null;
  }>({ preference: "system", resolvedTheme: null });
  const preferenceRef = React.useRef<ThemePreference>("system");

  const applyPreference = React.useCallback((preference?: ThemePreference) => {
    const next = initializeTheme(THEME_STORAGE_KEY, THEME_COLORS, preference);
    preferenceRef.current = next.preference;
    setTheme((previous) =>
      previous.preference === next.preference &&
      previous.resolvedTheme === next.resolvedTheme
        ? previous
        : next,
    );
  }, []);

  React.useEffect(() => {
    React.startTransition(() => applyPreference());
    const onSystemChange = () => {
      if (preferenceRef.current === "system") applyPreference("system");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      // Ignore sessionStorage changes without depending on storage availability.
      try {
        if (event.storageArea && event.storageArea !== window.localStorage)
          return;
      } catch {
        return;
      }
      const value = event.key === null ? null : event.newValue;
      applyPreference(value === "light" || value === "dark" ? value : "system");
    };

    let media: MediaQueryList | undefined;
    try {
      media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", onSystemChange);
    } catch {
      // The initial resolver already provides a fallback for unsupported APIs.
    }
    window.addEventListener("storage", onStorage);
    return () => {
      media?.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [applyPreference]);

  const setPreference = React.useCallback(
    (preference: ThemePreference) => {
      applyPreference(preference);
      try {
        if (preference === "system")
          window.localStorage.removeItem(THEME_STORAGE_KEY);
        else window.localStorage.setItem(THEME_STORAGE_KEY, preference);
      } catch {
        // Switching remains usable even when persistence is blocked.
      }
    },
    [applyPreference],
  );

  const value = React.useMemo(
    () => ({ ...theme, setPreference }),
    [theme, setPreference],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeProvider;
