import { v4 as uuidv4 } from "uuid";
import React from "react";
import { Sheet, Selection, CellMatrix, Cell } from "./types";

export type Hooks = {
  beforeUpdateCell?: (r: number, c: number, value: any) => boolean;
  afterUpdateCell?: (
    row: number,
    column: number,
    oldValue: any,
    newValue: any
  ) => void;
  afterSelectionChange?: (sheetId: string, selection: Selection) => void;
  beforeRenderRowHeaderCell?: (
    rowNumber: string,
    rowIndex: number,
    top: number,
    width: number,
    height: number,
    ctx: CanvasRenderingContext2D
  ) => boolean;
  afterRenderRowHeaderCell?: (
    rowNumber: string,
    rowIndex: number,
    top: number,
    width: number,
    height: number,
    ctx: CanvasRenderingContext2D
  ) => void;
  beforeRenderColumnHeaderCell?: (
    columnChar: string,
    columnIndex: number,
    left: number,
    width: number,
    height: number,
    ctx: CanvasRenderingContext2D
  ) => boolean;
  afterRenderColumnHeaderCell?: (
    columnChar: string,
    columnIndex: number,
    left: number,
    width: number,
    height: number,
    ctx: CanvasRenderingContext2D
  ) => void;
  beforeRenderCellArea?: (
    cells: CellMatrix,
    ctx: CanvasRenderingContext2D
  ) => boolean;
  beforeRenderCell?: (
    cell: Cell | null,
    cellInfo: {
      row: number;
      column: number;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    },
    ctx: CanvasRenderingContext2D
  ) => boolean;
  afterRenderCell?: (
    cell: Cell | null,
    cellInfo: {
      row: number;
      column: number;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    },
    ctx: CanvasRenderingContext2D
  ) => void;
  beforeCellMouseDown?: (
    cell: Cell | null,
    cellInfo: {
      row: number;
      column: number;
      startRow: number;
      startColumn: number;
      endRow: number;
      endColumn: number;
    }
  ) => boolean;
  afterCellMouseDown?: (
    cell: Cell | null,
    cellInfo: {
      row: number;
      column: number;
      startRow: number;
      startColumn: number;
      endRow: number;
      endColumn: number;
    }
  ) => void;
  beforePaste?: (
    selection: Selection[] | undefined,
    content: string
  ) => boolean;
  beforeUpdateComment?: (row: number, column: number, value: any) => boolean;
  afterUpdateComment?: (
    row: number,
    column: number,
    oldValue: any,
    value: any
  ) => void;
  beforeInsertComment?: (row: number, column: number) => boolean;
  afterInsertComment?: (row: number, column: number) => void;
  beforeDeleteComment?: (row: number, column: number) => boolean;
  afterDeleteComment?: (row: number, column: number) => void;
  beforeAddSheet?: (sheet: Sheet) => boolean;
  afterAddSheet?: (sheet: Sheet) => void;
  beforeActivateSheet?: (id: string) => boolean;
  afterActivateSheet?: (id: string) => void;
  beforeDeleteSheet?: (id: string) => boolean;
  afterDeleteSheet?: (id: string) => void;
  beforeUpdateSheetName?: (
    id: string,
    oldName: string,
    newName: string
  ) => boolean;
  afterUpdateSheetName?: (id: string, oldName: string, newName: string) => void;
};

export type Settings = {
  column?: number;
  row?: number;
  addRows?: number;
  allowEdit?: boolean;
  showToolbar?: boolean;
  showFormulaBar?: boolean;
  showSheetTabs?: boolean;
  data: Sheet[];
  config?: any;
  devicePixelRatio?: number;
  lang?: string | null;
  forceCalculation?: boolean;
  rowHeaderWidth?: number;
  columnHeaderHeight?: number;
  defaultColWidth?: number;
  defaultRowHeight?: number;
  defaultFontSize?: number;
  toolbarItems?: string[];
  cellContextMenu?: string[];
  headerContextMenu?: string[];
  sheetTabContextMenu?: string[];
  filterContextMenu?: string[];
  generateSheetId?: () => string;
  hooks?: Hooks;
  customToolbarItems?: {
    key: string;
    tooltip?: string;
    children?: React.ReactNode;
    iconName?: string;
    icon?: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  }[];

  updateEntity?: (sheetIndex:number,sheetName:string,range:{r:number,re:number,c:number,ce:number},coordinate:string)=>void;
  addEntity?: (sheetIndex:number,sheetName:string,range:{r:number,re:number,c:number,ce:number},coordinate:string,type:string,isTable:boolean,global?:boolean)=>void;
  submitRange?:(sheetIndex:number,sheetName:string,range:{r:number,re:number,c:number,ce:number},coordinate:string)=>void;
  revertChanges?: ()=>void;
  addEntityIgnore?:(sheetIndex:number,sheetName:string,range:{r:number,re:number,c:number,ce:number},coordinate:string,route? :boolean)=>void;
  contextMenuState:"TABLE" | "CELL" | "ALL";
  //scrollInside:(options:any)=>void;
};

export const defaultSettings: Required<Settings> = {
  column: 60, // 空表格默认的列数量
  row: 84, // 空表格默认的行数据量
  addRows: 50, // It will add the rows when we click on add row button
  showToolbar: true, // 是否显示工具栏
  showFormulaBar: true, // 是否显示公式栏
  showSheetTabs: true, // 是否显示底部表格名称区域
  data: [], // 客户端sheet数据[sheet1, sheet2, sheet3]
  config: {}, // 表格行高、列宽、合并单元格、公式等设置
  devicePixelRatio: 0, // 设备比例，比例越大表格分标率越高，0表示自动
  allowEdit: true, // 是否允许前台编辑
  lang: null, // language
  forceCalculation: false, // 强制刷新公式，公式较多会有性能问题，慎用
  rowHeaderWidth: 46,
  columnHeaderHeight: 20,
  defaultColWidth: 73,
  defaultRowHeight: 19,
  defaultFontSize: 10,
  toolbarItems: [
    "undo",
    "redo",
    "format-painter",
    "clear-format",
    "|",
    "currency-format",
    "percentage-format",
    "number-decrease",
    "number-increase",
    "format",
    "|",
    "font",
    "|",
    "font-size",
    "|",
    "bold",
    "italic",
    "strike-through",
    "underline",
    "|",
    "font-color",
    "background",
    "border",
    "merge-cell",
    "|",
    "horizontal-align",
    "vertical-align",
    "text-wrap",
    "text-rotation",
    "|",
    "freeze",
    "conditionFormat",
    "filter",
    "link",
    "image",
    "comment",
    "quick-formula",
    "dataVerification",
    "splitColumn",
    "locationCondition",
    "screenshot",
    "search",
  ], // 自定义工具栏
  cellContextMenu: [
    "updateEntity",
    "revertChanges",
    "addEntity",
    "|",
    "copy", // 复制
    "paste", // 粘贴
    "|",
    "insert-row", // 插入行
    "insert-column", // 插入列
    "delete-row", // 删除选中行
    "delete-column", // 删除选中列
    "delete-cell", // 删除单元格
    "hide-row", // 隐藏选中行和显示选中行
    "hide-column", // 隐藏选中列和显示选中列
    "set-row-height", // 设置行高
    "set-column-width", // 设置列宽
    "|",
    "clear", // 清除内容
    "sort", // 排序选区
    "orderAZ", // 升序
    "orderZA", // 降序
    "filter", // 筛选选区
    "chart", // 图表生成
    "image", // 插入图片
    "link", // 插入链接
    "data", // 数据验证
    "cell-format", // 设置单元格格式
  ], // 自定义单元格右键菜单
  headerContextMenu: [
    "copy", // 复制
    "paste", // 粘贴
    "|",
    "insert-row", // 插入行
    "insert-column", // 插入列
    "delete-row", // 删除选中行
    "delete-column", // 删除选中列
    "delete-cell", // 删除单元格
    "hide-row", // 隐藏选中行和显示选中行
    "hide-column", // 隐藏选中列和显示选中列
    "set-row-height", // 设置行高
    "set-column-width", // 设置列宽
    "|",
    "clear", // 清除内容
    "sort", // 排序选区
    "orderAZ", // 升序
    "orderZA", // 降序
  ], // header菜单
  sheetTabContextMenu: [
    "updateEntity",
    "revertChanges",
    "addEntity",
    "|",
    "delete",
    "copy",
    "rename",
    "color",
    "hide",
    "|",
    "move",
    // "focus",
  ], // 自定义底部sheet页右击菜单
  filterContextMenu: [
    "sort-by-asc",
    "sort-by-desc",
    "|",
    "filter-by-color",
    "|",
    // "filter-by-condition",
    // "|",
    "filter-by-value",
  ], // 筛选菜单
  generateSheetId: () => uuidv4(),
  hooks: {},
  customToolbarItems: [],
  updateEntity: function (sheetIndex:number,sheetName:string,range:{r:number,re:number,c:number,ce:number},coordinate:string): void {
    throw new Error("Function not implemented.");
  },
  addEntity: function (sheetIndex:number,sheetName:string,range:{r:number,re:number,c:number,ce:number},coordinate:string,type:string,isTable:boolean,global?:boolean): void {
    throw new Error("Function not implemented.");
  },
  submitRange : function (sheetIndex:number,sheetName:string,range:{r:number,re:number,c:number,ce:number},coordinate:string): void {
    throw new Error("Function not implemented.");
  },
  revertChanges: function (): void {
    throw new Error("Function not implemented.");
  },
  addEntityIgnore:function (sheetIndex:number,sheetName:string,range:{r:number,re:number,c:number,ce:number},coordinate:string,route? :boolean):void {
    throw new Error("Function not implemented.");
  },
  contextMenuState :"ALL"
  // scrollInside: function (options:any): void {
  //   throw new Error("Function not implemented.");
  // },
};
