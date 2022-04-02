import { Sheet } from "./types";

export type Settings = {
  column?: number;
  row?: number;
  allowCopy?: boolean;
  showtoolbar?: boolean;
  showinfobar?: boolean;
  showsheetbar?: boolean;
  showstatisticBar?: boolean;
  pointEdit?: boolean;
  pointEditUpdate?: any;
  pointEditZoom?: number;
  data: Sheet[];
  config?: any;
  fullscreenmode?: boolean;
  devicePixelRatio?: number;
  allowEdit?: boolean;
  allowUpdate?: boolean;
  showConfigWindowResize?: boolean;
  enableAddRow?: boolean;
  enableAddBackTop?: boolean;
  autoFormatw?: boolean;
  accuracy?: number | string | null;
  editMode?: boolean;
  beforeCreateDom?: (() => void) | null;
  fireMousedown?: any;
  lang?: string;
  plugins?: string[];
  forceCalculation?: boolean;
  rowHeaderWidth?: number;
  columnHeaderHeight?: number;
  defaultColWidth?: number;
  defaultRowHeight?: number;
  defaultFontSize?: number;
  limitSheetNameLength?: boolean;
  defaultSheetNameMaxLength?: number;
  sheetFormulaBar?: boolean;
  showtoolbarConfig?: string[];
  showsheetbarConfig?: any;
  showstatisticBarConfig?: any;
  cellRightClickConfig?: string[];
  sheetRightClickConfig?: any;
  imageUpdateMethodConfig?: any;
};

export const defaultSettings: Required<Settings> = {
  column: 60, // 空表格默认的列数量
  row: 84, // 空表格默认的行数据量
  allowCopy: true, // 是否允许拷贝
  showtoolbar: true, // 是否第二列显示工具栏
  showinfobar: true, // 是否显示顶部名称栏
  showsheetbar: true, // 是否显示底部表格名称区域
  showstatisticBar: true, // 是否显示底部计数栏
  pointEdit: false, // 是否是编辑器插入表格模式
  pointEditUpdate: null, // 编辑器表格更新函数
  pointEditZoom: 1, // 编辑器表格编辑时缩放比例
  data: [], // 客户端sheet数据[sheet1, sheet2, sheet3]
  config: {}, // 表格行高、列宽、合并单元格、公式等设置
  fullscreenmode: true, // 是否全屏模式，非全屏模式下，标记框不会强制选中。
  devicePixelRatio: window.devicePixelRatio, // 设备比例，比例越大表格分标率越高
  allowEdit: true, // 是否允许前台编辑
  allowUpdate: false, // 是否允许编辑后的后台更新
  showConfigWindowResize: true, // 图表和数据透视表的配置会在右侧弹出，设置弹出后表格是否会自动缩进
  enableAddRow: true, // 允许添加行
  enableAddBackTop: true, // 允许回到顶部
  autoFormatw: false, // 自动格式化超过4位数的数字为 亿万格式 例：true or "true" or "TRUE"
  accuracy: null, // 设置传输来的数值的精确位数，小数点后n位 传参数为数字或数字字符串，例： "0" 或 0
  editMode: false, // 是否为编辑模式
  beforeCreateDom: null, // 表格创建之前的方法
  fireMousedown: undefined, // 单元格数据下钻
  lang: "zh", // language
  plugins: [], // plugins, e.g. ['chart']
  forceCalculation: false, // 强制刷新公式，公式较多会有性能问题，慎用
  rowHeaderWidth: 46,
  columnHeaderHeight: 20,
  defaultColWidth: 73,
  defaultRowHeight: 19,
  defaultFontSize: 10,
  limitSheetNameLength: true, // 是否限制工作表名的长度
  defaultSheetNameMaxLength: 31, // 默认工作表名称的最大长度
  sheetFormulaBar: true, // 是否显示公式栏
  showtoolbarConfig: [
    "clear-format",
    "|",
    "currency-format",
    "percentage-format",
    "number-decrease",
    "number-increase",
    "format",
    "text-size",
    "|",
    "bold",
    "italic",
    "strike-through",
    "underline",
    "|",
    "text-color",
    "text-background",
    "border-all",
    // "merge-cell",
    "merge-all",
    "|",
    "align-left",
    "align-center",
    "align-right",
    "align-top",
    "align-mid",
    "align-bottom",
  ], // 自定义工具栏
  showsheetbarConfig: {}, // 自定义底部sheet页
  showstatisticBarConfig: {}, // 自定义计数栏
  cellRightClickConfig: [
    "copy", // 复制
    "copyAs", // 复制为
    "paste", // 粘贴
    "insertRow", // 插入行
    "insertColumn", // 插入列
    "deleteRow", // 删除选中行
    "deleteColumn", // 删除选中列
    "deleteCell", // 删除单元格
    "hideRow", // 隐藏选中行和显示选中行
    "hideColumn", // 隐藏选中列和显示选中列
    "rowHeight", // 行高
    "columnWidth", // 列宽
    "clear", // 清除内容
    "matrix", // 矩阵操作选区
    "sort", // 排序选区
    "filter", // 筛选选区
    "chart", // 图表生成
    "image", // 插入图片
    "link", // 插入链接
    "data", // 数据验证
    "cellFormat", // 设置单元格格式
  ], // 自定义单元格右键菜单
  sheetRightClickConfig: {}, // 自定义底部sheet页右击菜单
  imageUpdateMethodConfig: {}, // 自定义图片同步方式
};
