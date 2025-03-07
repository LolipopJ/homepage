import * as React from "react";

import { SCREEN_BREAKPOINT } from "../constants/utils";

export type ScreenBreakpoint = Record<keyof typeof SCREEN_BREAKPOINT, boolean>;

const useScreenBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<ScreenBreakpoint>({
    sm: false,
    md: false,
    lg: false,
    xl: false,
    "2xl": false,
  });

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const newBreakpoint: ScreenBreakpoint = {
        sm: false,
        md: false,
        lg: false,
        xl: false,
        "2xl": false,
      };
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
    window.addEventListener("resize", checkBreakpoint);

    return () => {
      window.removeEventListener("resize", checkBreakpoint);
    };
  }, []);

  return breakpoint;
};

export default useScreenBreakpoint;
