export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = Exclude<ThemePreference, "system">;

export const THEME_STORAGE_KEY = "blog-theme";
export const THEME_COLORS = { light: "#f6f7f9", dark: "#0f0f0f" };

/** Also serialized into the HTML head: keep this function self-contained. */
export function initializeTheme(
  storageKey: string,
  colors: Record<ResolvedTheme, string>,
  requestedPreference?: ThemePreference,
): { preference: ThemePreference; resolvedTheme: ResolvedTheme } {
  let preference = requestedPreference;
  if (preference === undefined) {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(storageKey);
    } catch {
      // Storage can be unavailable; system detection must still run.
    }
    preference = stored === "light" || stored === "dark" ? stored : "system";
  }

  let systemDark = false;
  try {
    systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    // Browsers without matchMedia fall back to light.
  }
  const resolvedTheme =
    preference === "system" ? (systemDark ? "dark" : "light") : preference;
  const root = document.documentElement;
  root.setAttribute("data-theme", resolvedTheme);
  root.style.colorScheme = resolvedTheme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", colors[resolvedTheme]);

  // Fancybox is appended to body and may already be open during a switch.
  document.querySelectorAll(".fancybox__container").forEach((container) => {
    container.setAttribute("theme", resolvedTheme);
  });
  return { preference, resolvedTheme };
}

export function getThemeScript(): string {
  return `(${initializeTheme.toString()})(${JSON.stringify(THEME_STORAGE_KEY)},${JSON.stringify(THEME_COLORS)});`;
}
