import { Patch as ImmerPatch } from "immer";
import { PatchOptions } from "./utils";

export type Op = {
  op:
    | "replace"
    | "remove"
    | "add"
    | "insertRowCol"
    | "deleteRowCol"
    | "addSheet"
    | "deleteSheet";
  index?: string;
  path: (string | number)[];
  value?: any;
};

export type CellStyle = {
  bl?: number;
  it?: number;
  ff?: number | string;
  fs?: number;
  fc?: string;
  ht?: number;
  vt?: number;
  tb?: string;
  cl?: number;
  un?: number;
  tr?: string;
};

export type Cell = {
  v?: string | number | boolean;
  m?: string | number;
  mc?: { r: number; c: number; rs?: number; cs?: number };
  f?: string;
  ct?: { fa?: string; t?: string; s?: any };
  qp?: number;
  spl?: any;
  bg?: string;
  lo?: number;
  rt?: number;
  ps?: {
    left: number | null;
    top: number | null;
    width: number | null;
    height: number | null;
    value: string;
    isShow: boolean;
  };
} & CellStyle;

export type CellWithRowAndCol = {
  r: number;
  c: number;
  v: Cell | null;
};

export type CellMatrix = (Cell | null)[][];

export type Selection = {
  left?: number;
  width?: number;
  top?: number;
  height?: number;
  left_move?: number;
  width_move?: number;
  top_move?: number;
  height_move?: number;
  row: number[];
  column: number[];
  row_focus?: number;
  column_focus?: number;
  moveXY?: { x: number; y: number };
  row_select?: boolean;
  column_select?: boolean;
};

export type SheetConfig = {
  merge?: Record<string, { r: number; c: number; rs: number; cs: number }>; // 合并单元格
  rowlen?: Record<string, number>; // 表格行高
  columnlen?: Record<string, number>; // 表格列宽
  rowhidden?: Record<string, number>; // 隐藏行
  colhidden?: Record<string, number>; // 隐藏列
  customHeight?: Record<string, number>;
  customWidth?: Record<string, number>;
  borderInfo?: any[]; // 边框
  authority?: any;
};

export type Sheet = {
  name: string;
  config?: SheetConfig;
  order?: number;
  data?: CellMatrix;
  celldata?: CellWithRowAndCol[];
  index?: string;
  zoomRatio?: number;
  column?: number;
  row?: number;
  status?: number;
  luckysheet_select_save?: Selection[];
  luckysheet_selection_range?: {
    row: number[];
    column: number[];
  }[];
  calcChain?: any[];
  defaultRowHeight?: number;
  defaultColWidth?: number;
  showGridLines?: boolean | number;
  pivotTable?: any;
  isPivotTable?: boolean;
  filter?: any[];
  filter_select?: any;
  luckysheet_conditionformat_save?: any[];
  luckysheet_alternateformat_save?: any[];
  dataVerification?: any;
  hyperlink?: any;
  dynamicArray_compute?: any;
  dynamicArray?: any[];
  frozen?: {
    type: "row" | "column" | "both" | "rangeRow" | "rangeColumn" | "rangeBoth";
    range?: { row_focus: number; column_focus: number };
  };
};

export type CommentBox = {
  r: number;
  c: number;
  rc: string;
  left: number;
  top: number;
  width: number;
  height: number;
  autoFocus: boolean;
  value: string;
  size: {
    left: number;
    top: number;
    width: number;
    height: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  };
};

export type History = {
  patches: ImmerPatch[];
  inversePatches: ImmerPatch[];
  options?: PatchOptions;
};

export type Freezen = {
  horizontal?: { freezenhorizontaldata: any[]; top: number };
  vertical?: { freezenverticaldata: any[]; left: number };
};

export type GlobalCache = {
  overwriteCell?: boolean;
  doNotFocus?: boolean;
  doNotUpdateCell?: boolean;
  recentTextColor?: string;
  recentBackgroundColor?: string;
  visibleColumnsUnique?: number[];
  visibleRowsUnique?: number[];
  undoList: History[];
  redoList: History[];
  editingCommentBoxEle?: HTMLDivElement;
  freezen?: Record<string, Freezen>;
  commentBox?: {
    movingId: string | undefined;
    resizingId: string | undefined;
    resizingSide: string | undefined;
    commentRC: { r: number; c: number; rc: string };
    boxInitialPosition:
      | { left: number; top: number; width: number; height: number }
      | undefined;
    cursorMoveStartPosition: { x: number; y: number } | undefined;
  };
};

export type SingleRange = { row: number[]; column: number[] };
export type Range = SingleRange[];
