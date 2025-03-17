import * as React from "react";

import { SCREEN_BREAKPOINT } from "../constants/utils";

export type ScreenBreakpoint = Record<keyof typeof SCREEN_BREAKPOINT, boolean>;

const DEFAULT_BREAKPOINT: ScreenBreakpoint = {
  sm: false,
  md: false,
  lg: false,
  xl: false,
  "2xl": false,
};

const useScreenBreakpoint = () => {
  const [breakpoint, setBreakpoint] =
    React.useState<ScreenBreakpoint>(DEFAULT_BREAKPOINT);
  const [initialized, setInitialized] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const newBreakpoint = DEFAULT_BREAKPOINT;
      for (const [key, value] of Object.entries(SCREEN_BREAKPOINT)) {
        if (window.matchMedia(`(min-width: ${value})`).matches) {
          newBreakpoint[key as keyof typeof SCREEN_BREAKPOINT] = true;
        } else {
          break;
        }
      }
      setBreakpoint(newBreakpoint);
    };

    checkBreakpoint();
    setInitialized(true);

    window.addEventListener("resize", checkBreakpoint);
    return () => {
      window.removeEventListener("resize", checkBreakpoint);
    };
  }, []);

  return [breakpoint, initialized] as [ScreenBreakpoint, boolean];
};

export default useScreenBreakpoint;
