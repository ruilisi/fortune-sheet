import _ from "lodash";
import { SheetConfig } from ".";
import { normalizeSelection } from "./modules/selection";
import { Sheet, Selection, Cell, CommentBox, Rect, Image } from "./types";
import { getSheetIndex } from "./utils";

export type Context = {
  luckysheetfile: Sheet[];
  defaultcolumnNum: number;
  defaultrowNum: number;
  fullscreenmode: boolean;
  devicePixelRatio: number;
  commentBoxes?: CommentBox[];
  editingCommentBox?: CommentBox;
  hoveredCommentBox?: CommentBox;
  insertedImgs?: Image[];
  editingInsertedImgs?: Image;
  activeImg?: Image;

  contextMenu: any;
  sheetTabContextMenu: {
    x?: number;
    y?: number;
    sheet?: Sheet;
    onRename?: () => void;
  };

  currentSheetId: string;
  calculateSheetId: string;
  config: SheetConfig;

  visibledatarow: number[];
  visibledatacolumn: number[];
  ch_width: number;
  rh_height: number;

  cellmainWidth: number;
  cellmainHeight: number;
  toolbarHeight: number;
  infobarHeight: number;
  calculatebarHeight: number;
  rowHeaderWidth: number;
  columnHeaderHeight: number;
  cellMainSrollBarSize: number;
  sheetBarHeight: number;
  statisticBarHeight: number;
  luckysheetTableContentHW: number[];

  defaultcollen: number;
  defaultrowlen: number;

  scrollLeft: number;
  scrollTop: number;

  luckysheet_select_status: boolean;
  luckysheet_select_save: Sheet["luckysheet_select_save"];
  luckysheet_selection_range: Sheet["luckysheet_selection_range"];
  formulaRangeHighlight: ({
    rangeIndex: number;
    backgroundColor: string;
  } & Rect)[];
  formulaRangeSelect: ({ rangeIndex: number } & Rect) | undefined;
  functionCandidates: any[];
  functionHint: string | null | undefined;

  luckysheet_copy_save?: {
    dataSheetId: string;
    copyRange: { row: number[]; column: number[] }[];
    RowlChange: boolean;
    HasMC: boolean;
  }; // 复制粘贴
  luckysheet_paste_iscut: boolean;

  filterchage: boolean; // 筛选
  luckysheet_filter_save: { row: any[]; column: any[] };

  luckysheet_sheet_move_status: boolean;
  luckysheet_sheet_move_data: any[];
  luckysheet_scroll_status: boolean;

  luckysheetcurrentisPivotTable: boolean;

  luckysheet_rows_selected_status: boolean; // 行列标题相关参
  luckysheet_cols_selected_status: boolean;
  luckysheet_rows_change_size: boolean;
  luckysheet_rows_change_size_start: any[];
  luckysheet_cols_change_size: boolean;
  luckysheet_cols_change_size_start: any[];

  luckysheetCellUpdate: any[];

  luckysheet_shiftkeydown: boolean;
  luckysheet_shiftpositon: Selection | undefined;

  iscopyself: boolean;

  orderbyindex: number; // 排序下标

  luckysheet_model_move_state: boolean; // 模态框拖动
  luckysheet_model_xy: number[];
  luckysheet_model_move_obj: any;

  luckysheet_cell_selected_move: boolean; // 选区拖动替换
  luckysheet_cell_selected_move_index: any[];

  luckysheet_cell_selected_extend: boolean; // 选区下拉
  luckysheet_cell_selected_extend_index: any[];

  lang: string | null; // language

  chart_selection: any;

  zoomRatio: number;

  showGridLines: boolean;
  allowEdit: boolean;

  fontList: any[];
  defaultFontSize: number;

  luckysheetPaintModelOn: boolean;
  luckysheetPaintSingle: boolean;

  // 默认单元格
  defaultCell: Cell;
};

export function defaultContext(): Context {
  return {
    luckysheetfile: [],
    defaultcolumnNum: 60,
    defaultrowNum: 84,
    fullscreenmode: true,
    devicePixelRatio: (global || window).devicePixelRatio,

    contextMenu: {},
    sheetTabContextMenu: {},

    currentSheetId: "",
    calculateSheetId: "",
    config: {},

    visibledatarow: [],
    visibledatacolumn: [],
    ch_width: 0,
    rh_height: 0,

    cellmainWidth: 0,
    cellmainHeight: 0,
    toolbarHeight: 41,
    infobarHeight: 57,
    calculatebarHeight: 29,
    rowHeaderWidth: 46,
    columnHeaderHeight: 20,
    cellMainSrollBarSize: 12,
    sheetBarHeight: 31,
    statisticBarHeight: 23,
    luckysheetTableContentHW: [0, 0],

    defaultcollen: 73,
    defaultrowlen: 19,

    scrollLeft: 0,
    scrollTop: 0,

    luckysheet_select_status: false,
    luckysheet_select_save: undefined,
    luckysheet_selection_range: [],
    formulaRangeHighlight: [],
    formulaRangeSelect: undefined,
    functionCandidates: [],
    functionHint: null,

    luckysheet_copy_save: undefined, // 复制粘贴
    luckysheet_paste_iscut: false,

    filterchage: true, // 筛选
    luckysheet_filter_save: { row: [], column: [] },

    luckysheet_sheet_move_status: false,
    luckysheet_sheet_move_data: [],
    luckysheet_scroll_status: false,

    luckysheetcurrentisPivotTable: false,

    luckysheet_rows_selected_status: false, // 行列标题相关参
    luckysheet_cols_selected_status: false,
    luckysheet_rows_change_size: false,
    luckysheet_rows_change_size_start: [],
    luckysheet_cols_change_size: false,
    luckysheet_cols_change_size_start: [],

    luckysheetCellUpdate: [],

    luckysheet_shiftkeydown: false,
    luckysheet_shiftpositon: undefined,

    iscopyself: true,
    activeImg: undefined,

    orderbyindex: 0, // 排序下标

    luckysheet_model_move_state: false, // 模态框拖动
    luckysheet_model_xy: [0, 0],
    luckysheet_model_move_obj: null,

    luckysheet_cell_selected_move: false, // 选区拖动替换
    luckysheet_cell_selected_move_index: [],

    luckysheet_cell_selected_extend: false, // 选区下拉
    luckysheet_cell_selected_extend_index: [],

    lang: null, // language
    chart_selection: {},

    zoomRatio: 1,

    showGridLines: true,
    allowEdit: true,

    fontList: [],
    defaultFontSize: 10,

    luckysheetPaintModelOn: false,
    luckysheetPaintSingle: false,

    // 默认单元格
    defaultCell: {
      bl: 0,
      ct: { fa: "General", t: "n" },
      fc: "rgb(51, 51, 51)",
      ff: 0,
      fs: 11,
      ht: 1,
      it: 0,
      vt: 1,
      m: "",
      v: "",
    },
  };
}

export function getFlowdata(ctx?: Context) {
  if (!ctx) return null;
  const i = getSheetIndex(ctx, ctx.currentSheetId);
  if (_.isNil(i)) {
    return null;
  }
  return ctx.luckysheetfile?.[i]?.data;
}

function calcRowColSize(ctx: Context, rowCount: number, colCount: number) {
  ctx.visibledatarow = [];
  ctx.rh_height = 0;

  for (let r = 0; r < rowCount; r += 1) {
    let rowlen: number | string = ctx.defaultrowlen;

    if (ctx.config.rowlen?.[r]) {
      rowlen = ctx.config?.rowlen?.[r];
    }

    if (ctx.config?.rowhidden?.[r] != null) {
      ctx.visibledatarow.push(ctx.rh_height);
      continue;
    }

    // 自动行高计算
    // if (rowlen === "auto") {
    //   rowlen = computeRowlenByContent(ctx.flowdata, r);
    // }
    ctx.rh_height += Math.round(((rowlen as number) + 1) * ctx.zoomRatio);

    ctx.visibledatarow.push(ctx.rh_height); // 行的临时长度分布
  }

  // 如果增加行和回到顶部按钮隐藏，则减少底部空白区域，但是预留足够空间给单元格下拉按钮
  // if (
  //   !luckysheetConfigsetting.enableAddRow &&
  //   !luckysheetConfigsetting.enableAddBackTop
  // ) {
  //   ctx.rh_height += 29;
  // } else {
  //   ctx.rh_height += 80; // 最底部增加空白
  // }

  ctx.visibledatacolumn = [];
  ctx.ch_width = 0;

  const maxColumnlen = 120;

  const flowdata = getFlowdata(ctx);
  for (let c = 0; c < colCount; c += 1) {
    let firstcolumnlen: number | string = ctx.defaultcollen;

    if (ctx.config?.columnlen?.[c]) {
      firstcolumnlen = ctx.config.columnlen[c];
    } else {
      if (flowdata?.[0]?.[c]) {
        if (firstcolumnlen > 300) {
          firstcolumnlen = 300;
        } else if (firstcolumnlen < ctx.defaultcollen) {
          firstcolumnlen = ctx.defaultcollen;
        }

        if (firstcolumnlen !== ctx.defaultcollen) {
          if (!ctx.config?.columnlen) {
            ctx.config.columnlen = {};
          }

          ctx.config.columnlen[c] = firstcolumnlen;
        }
      }
    }

    if (ctx.config?.colhidden?.[c] != null) {
      ctx.visibledatacolumn.push(ctx.ch_width);
      continue;
    }

    // 自动行高计算
    // if (firstcolumnlen === "auto") {
    //   firstcolumnlen = computeColWidthByContent(
    //     ctx.flowdata,
    //     c,
    //     rowCount
    //   );
    // }
    ctx.ch_width += Math.round(
      ((firstcolumnlen as number) + 1) * ctx.zoomRatio
    );

    ctx.visibledatacolumn.push(ctx.ch_width); // 列的临时长度分布
  }

  ctx.ch_width += maxColumnlen;
}

export function ensureSheetIndex(data: Sheet[], generateSheetId: () => string) {
  if (data?.length > 0) {
    let hasActive = false;
    const indexs: (string | number)[] = [];
    data.forEach((item) => {
      if (item.id == null) {
        item.id = generateSheetId();
      }
      if (indexs.includes(item.id)) {
        item.id = generateSheetId();
      } else {
        indexs.push(item.id);
      }

      if (item.status == null) {
        item.status = 0;
      }
      if (item.status === 1) {
        if (hasActive) {
          item.status = 0;
        } else {
          hasActive = true;
        }
      }
    });
    if (!hasActive) {
      data[0].status = 1;
    }
  }
}

export function initSheetIndex(ctx: Context) {
  // get current sheet
  ctx.currentSheetId = ctx.luckysheetfile[0].id!;

  for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
    if (ctx.luckysheetfile[i].status === 1) {
      ctx.currentSheetId = ctx.luckysheetfile[i].id!;
      break;
    }
  }
}

export function updateContextWithSheetData(ctx: Context, data: any[][]) {
  const rowCount = data.length;
  const colCount = rowCount === 0 ? 0 : data[0].length;

  calcRowColSize(ctx, rowCount, colCount);
  normalizeSelection(ctx, ctx.luckysheet_select_save);
}

export function updateContextWithCanvas(
  ctx: Context,
  canvas: HTMLCanvasElement,
  placeholder: HTMLDivElement
) {
  ctx.luckysheetTableContentHW = [
    placeholder.clientWidth,
    placeholder.clientHeight,
  ];
  ctx.cellmainHeight = placeholder.clientHeight - ctx.columnHeaderHeight;
  ctx.cellmainWidth = canvas.clientWidth - ctx.rowHeaderWidth;

  canvas.style.width = `${ctx.luckysheetTableContentHW[0]}px`;
  canvas.style.height = `${ctx.luckysheetTableContentHW[1]}px`;

  canvas.width = Math.ceil(
    ctx.luckysheetTableContentHW[0] * ctx.devicePixelRatio
  );
  canvas.height = Math.ceil(
    ctx.luckysheetTableContentHW[1] * ctx.devicePixelRatio
  );
}
