import { faDesktop, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";

import useTheme from "../hooks/useTheme";
import type { ThemePreference } from "../utils/theme";
import Icon from "./icon";

const themeLabels: Record<ThemePreference, string> = {
  system: "跟随系统",
  light: "日间模式",
  dark: "夜间模式",
};

const ThemeSwitcher: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const nextPreference =
    preference === "system"
      ? "light"
      : preference === "light"
        ? "dark"
        : "system";
  const description = `主题模式：${themeLabels[preference]}，点击切换为${themeLabels[nextPreference]}`;
  const icon =
    preference === "system"
      ? faDesktop
      : preference === "dark"
        ? faMoon
        : faSun;

  return (
    <button
      type="button"
      className={`item-selectable flex size-9 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
      aria-label={description}
      title={description}
      disabled={resolvedTheme === null}
      onClick={() => setPreference(nextPreference)}
    >
      <Icon icon={icon} aria-hidden="true" />
    </button>
  );
};

export default ThemeSwitcher;
