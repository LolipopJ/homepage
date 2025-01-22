import * as React from "react";

export interface GlobalContextValues {
  setPageTitle: (title: string) => void;
}

const GlobalContext = React.createContext<GlobalContextValues>({
  setPageTitle: () => {},
});

export default GlobalContext;
