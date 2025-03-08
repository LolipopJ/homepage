import "./src/styles/global.css";

import nProgress from "nprogress";

export const onRouteUpdateDelayed = () => {
  nProgress.start();
};

export const onRouteUpdate = () => {
  nProgress.done();
};
