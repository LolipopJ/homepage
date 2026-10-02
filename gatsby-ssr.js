import * as React from "react";

import ThemeProvider from "./src/components/theme-provider";
import { getThemeScript, THEME_COLORS } from "./src/utils/theme";

export const wrapRootElement = ({ element }) =>
  React.createElement(ThemeProvider, null, element);

export const onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    React.createElement("meta", {
      key: "site-theme-color",
      name: "theme-color",
      content: THEME_COLORS.light,
    }),
    React.createElement("script", {
      key: "site-theme-initializer",
      dangerouslySetInnerHTML: { __html: getThemeScript() },
    }),
  ]);
};
