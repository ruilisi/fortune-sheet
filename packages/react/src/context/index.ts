import React from "react";
import defaultContext, { Context } from "@fortune-sheet/core/src/context";

const WorkbookContext = React.createContext<{
  context: Context;
  setContext: React.Dispatch<React.SetStateAction<Context>>;
  // eslint-disable-next-line
  setContextValue: <K extends keyof Context>(key: K, value: Context[K]) => void;
}>({
  context: defaultContext(),
  setContext: () => {},
  setContextValue: () => {},
});

export default WorkbookContext;
