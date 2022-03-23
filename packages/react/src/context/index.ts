import React from "react";
import defaultContext, { Context } from "@fortune-sheet/core/src/context";
import { defaultSettings, Settings } from "@fortune-sheet/core/src/settings";

type RefValues = {
  globalCache: Record<string, any>;
  cellInput: React.MutableRefObject<HTMLDivElement | null>;
  fxInput: React.MutableRefObject<HTMLDivElement | null>;
  scrollbarX: React.MutableRefObject<HTMLDivElement | null>;
  scrollbarY: React.MutableRefObject<HTMLDivElement | null>;
  cellArea: React.MutableRefObject<HTMLDivElement | null>;
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
    cellInput: React.createRef<HTMLDivElement | null>(),
    fxInput: React.createRef<HTMLDivElement | null>(),
    scrollbarX: React.createRef<HTMLDivElement | null>(),
    scrollbarY: React.createRef<HTMLDivElement | null>(),
    cellArea: React.createRef<HTMLDivElement | null>(),
  },
});

export default WorkbookContext;
