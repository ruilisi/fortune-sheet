import React from "react";
import {
  defaultContext,
  Context,
  defaultSettings,
  Settings,
  GlobalCache,
} from "@fortune-sheet/core";

type RefValues = {
  globalCache: GlobalCache;
  cellInput: React.MutableRefObject<HTMLDivElement | null>;
  fxInput: React.MutableRefObject<HTMLDivElement | null>;
  scrollbarX: React.MutableRefObject<HTMLDivElement | null>;
  scrollbarY: React.MutableRefObject<HTMLDivElement | null>;
  cellArea: React.MutableRefObject<HTMLDivElement | null>;
  workbookContainer: React.MutableRefObject<HTMLDivElement | null>;
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
    workbookContainer: React.createRef<HTMLDivElement | null>(),
  },
});

export default WorkbookContext;
