import "./src/styles/global.css";

import nProgress from "nprogress";
import * as React from "react";

import ThemeProvider from "./src/components/theme-provider";

export const wrapRootElement = ({ element }) =>
  React.createElement(ThemeProvider, null, element);

export const onRouteUpdateDelayed = () => {
  nProgress.start();
};

export const onRouteUpdate = () => {
  nProgress.done();
};
