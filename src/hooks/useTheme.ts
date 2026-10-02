import * as React from "react";

import { ThemeContext } from "../components/theme-provider";

export default function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
