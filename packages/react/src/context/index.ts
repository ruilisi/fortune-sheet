import React from "react";
import defaultContext, { Context } from "@fortune-sheet/core/src/context";
import { defaultSettings, Settings } from "@fortune-sheet/core/src/settings";

const WorkbookContext = React.createContext<{
  context: Context;
  setContext: React.Dispatch<React.SetStateAction<Context>>;
  // eslint-disable-next-line
  setContextValue: <K extends keyof Context>(key: K, value: Context[K]) => void;
  settings: Settings;
}>({
  context: defaultContext(),
  setContext: () => {},
  setContextValue: () => {},
  settings: defaultSettings,
});

export default WorkbookContext;
