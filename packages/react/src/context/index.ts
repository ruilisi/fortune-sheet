import React from "react";
import {
  defaultContext,
  Context,
  defaultSettings,
  Settings,
  GlobalCache,
  PatchOptions,
} from "@online-sheet/core";

export type RefValues = {
  globalCache: GlobalCache;
  cellInput: React.MutableRefObject<HTMLDivElement | null>;
  fxInput: React.MutableRefObject<HTMLDivElement | null>;
  canvas: React.MutableRefObject<HTMLCanvasElement | null>;
  scrollbarX: React.MutableRefObject<HTMLDivElement | null>;
  scrollbarY: React.MutableRefObject<HTMLDivElement | null>;
  cellArea: React.MutableRefObject<HTMLDivElement | null>;
  workbookContainer: React.MutableRefObject<HTMLDivElement | null>;
};

export type SetContextOptions = {
  noHistory?: boolean;
  logPatch?: boolean;
} & PatchOptions;

const defaultRefs = {
  globalCache: { undoList: [], redoList: [] },
  cellInput: React.createRef<HTMLDivElement | null>(),
  fxInput: React.createRef<HTMLDivElement | null>(),
  canvas: React.createRef<HTMLCanvasElement | null>(),
  cellArea: React.createRef<HTMLDivElement | null>(),
  workbookContainer: React.createRef<HTMLDivElement | null>(),
};

const WorkbookContext = React.createContext<{
  context: Context;
  setContext: (
    recipe: (ctx: Context) => void,
    options?: SetContextOptions
  ) => void;
  // eslint-disable-next-line
  settings: Required<Settings>;
  refs: RefValues;
  handleUndo: () => void;
  handleRedo: () => void;
}>({
  context: defaultContext(defaultRefs),
  setContext: () => {},
  settings: defaultSettings,
  handleUndo: () => {},
  handleRedo: () => {},
  refs: {
    globalCache: { undoList: [], redoList: [] },
    cellInput: React.createRef<HTMLDivElement | null>(),
    fxInput: React.createRef<HTMLDivElement | null>(),
    canvas: React.createRef<HTMLCanvasElement | null>(),
    scrollbarX: React.createRef<HTMLDivElement | null>(),
    scrollbarY: React.createRef<HTMLDivElement | null>(),
    cellArea: React.createRef<HTMLDivElement | null>(),
    workbookContainer: React.createRef<HTMLDivElement | null>(),
  },
});

export default WorkbookContext;
