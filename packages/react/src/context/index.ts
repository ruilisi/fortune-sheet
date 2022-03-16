import React from "react";
import defaultContext, { Context } from "@fortune-sheet/core/src/context";
import { defaultSettings, Settings } from "@fortune-sheet/core/src/settings";

type RefValues = {
  cellInput: React.MutableRefObject<HTMLDivElement | undefined>;
};

const WorkbookContext = React.createContext<{
  context: Context;
  setContext: React.Dispatch<React.SetStateAction<Context>>;
  // eslint-disable-next-line
  setContextValue: <K extends keyof Context>(key: K, value: Context[K]) => void;
  settings: Settings;
  refs: RefValues;
}>({
  context: defaultContext(),
  setContext: () => {},
  setContextValue: () => {},
  settings: defaultSettings,
  refs: {
    cellInput: React.createRef() as React.MutableRefObject<
      HTMLDivElement | undefined
    >,
  },
});

export default WorkbookContext;
