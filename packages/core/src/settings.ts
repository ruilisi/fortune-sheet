import { v4 as uuidv4 } from "uuid";
import { Sheet } from "./types";

export type Settings = {
  column?: number;
  row?: number;
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
  sheetTabContextMenu?: string[];
  generateSheetId?: () => string;
};

export const defaultSettings: Required<Settings> = {
  column: 60, // 空表格默认的列数量
  row: 84, // 空表格默认的行数据量
  showToolbar: true, // 是否显示工具栏
  showFormulaBar: true, // 是否显示公式栏
  showSheetTabs: true, // 是否显示底部表格名称区域
  data: [], // 客户端sheet数据[sheet1, sheet2, sheet3]
  config: {}, // 表格行高、列宽、合并单元格、公式等设置
  devicePixelRatio: (global || window).devicePixelRatio, // 设备比例，比例越大表格分标率越高
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
    "align-left",
    "align-center",
    "align-right",
    "align-top",
    "align-mid",
    "align-bottom",
    "|",
    "freeze",
    "image",
    "comment",
    "quick-formula",
    "sort",
  ], // 自定义工具栏
  cellContextMenu: [
    "copy", // 复制
    "paste", // 粘贴
    "insert-row", // 插入行
    "insert-column", // 插入列
    "delete-row", // 删除选中行
    "delete-column", // 删除选中列
    "delete-cell", // 删除单元格
    "hide-row", // 隐藏选中行和显示选中行
    "hide-column", // 隐藏选中列和显示选中列
    "clear", // 清除内容
    "sort", // 排序选区
    "filter", // 筛选选区
    "chart", // 图表生成
    "image", // 插入图片
    "link", // 插入链接
    "data", // 数据验证
    "cell-format", // 设置单元格格式
  ], // 自定义单元格右键菜单
  sheetTabContextMenu: ["delete", "copy", "rename", "color", "hide", "move"], // 自定义底部sheet页右击菜单
  generateSheetId: () => uuidv4(),
};
