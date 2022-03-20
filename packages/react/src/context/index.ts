import React from "react";
import defaultContext, { Context } from "@fortune-sheet/core/src/context";
import { defaultSettings, Settings } from "@fortune-sheet/core/src/settings";

type RefValues = {
  globalCache: Record<string, any>;
  cellInput: React.MutableRefObject<HTMLDivElement | undefined>;
  fxInput: React.MutableRefObject<HTMLDivElement | undefined>;
  scrollbarX: React.MutableRefObject<HTMLDivElement | undefined>;
  scrollbarY: React.MutableRefObject<HTMLDivElement | undefined>;
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
    globalCache: {},
    cellInput: React.createRef() as React.MutableRefObject<
      HTMLDivElement | undefined
    >,
    fxInput: React.createRef() as React.MutableRefObject<
      HTMLDivElement | undefined
    >,
    scrollbarX: React.createRef() as React.MutableRefObject<
      HTMLDivElement | undefined
    >,
    scrollbarY: React.createRef() as React.MutableRefObject<
      HTMLDivElement | undefined
    >,
  },
});

export default WorkbookContext;
