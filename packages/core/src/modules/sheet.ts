import { Context } from "../context";
import { Sheet } from "../types";
import {
  generateRandomSheetIndex,
  generateRandomSheetName,
  getSheetIndex,
} from "../utils";

function storeSheetParam(ctx: Context) {
  const index = getSheetIndex(ctx, ctx.currentSheetIndex);
  if (index == null) return;
  const file = ctx.luckysheetfile[index];
  file.config = ctx.config;
  file.visibledatarow = ctx.visibledatarow;
  file.visibledatacolumn = ctx.visibledatacolumn;
  file.ch_width = ctx.ch_width;
  file.rh_height = ctx.rh_height;
  file.luckysheet_select_save = ctx.luckysheet_select_save;
  file.luckysheet_selection_range = ctx.luckysheet_selection_range;
  file.zoomRatio = ctx.zoomRatio;
}

function storeSheetParamALL(ctx: Context) {
  storeSheetParam(ctx);
  const index = getSheetIndex(ctx, ctx.currentSheetIndex);
  if (index == null) return;
  ctx.luckysheetfile[index].config = ctx.config;
}

export function changeSheet(
  ctx: Context,
  index: string,
  isPivotInitial?: boolean,
  isNewSheet?: boolean,
  isCopySheet?: boolean
) {
  //   if (isEditMode()) {
  //     // alert("非编辑模式下不允许该操作！");
  //     return;
  //   }

  if (index === ctx.currentSheetIndex) {
    return;
  }

  //   if (server.allowUpdate) {
  //     $("#luckysheet-cell-main #luckysheet-multipleRange-show").empty();
  //     server.multipleIndex = 0;
  //   }
  const file = ctx.luckysheetfile[getSheetIndex(ctx, index)!];
  //   // 钩子 sheetCreateAfter
  //   if (isNewSheet) {
  //     method.createHookFunction("sheetCreateAfter", { sheet: file });
  //   }
  //   // 钩子 sheetCopyAfter
  //   if (isCopySheet) {
  //     method.createHookFunction("sheetCopyAfter", { sheet: file });
  //   }

  //   // 钩子函数
  //   method.createHookFunction("sheetActivate", index, isPivotInitial, isNewSheet);

  storeSheetParamALL(ctx);

  for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
    if (ctx.luckysheetfile[i].index === index) {
      ctx.luckysheetfile[i].status = 1;
    } else {
      ctx.luckysheetfile[i].status = 0;
    }
  }

  ctx.currentSheetIndex = index;

  if (file.isPivotTable) {
    ctx.luckysheetcurrentisPivotTable = true;
    //     if (!isPivotInitial) {
    //       pivotTable.changePivotTable(index);
    //     }
  } else {
    ctx.luckysheetcurrentisPivotTable = false;
    //     $("#luckysheet-modal-dialog-slider-pivot").hide();
    //     luckysheetsizeauto(false);
  }

  // 隐藏其他sheet的图表，显示当前sheet的图表 chartMix
  //   renderChartShow(index);

  //   luckysheetFreezen.initialFreezen(index);
  //   _this.restoreselect();
}

export function addSheet(ctx: Context, isPivotTable = false) {
  if (/* isEditMode() || */ ctx.allowEdit === false) {
    // alert("非编辑模式下不允许该操作！");
    return;
  }
  // 钩子 sheetCreateBefore
  //   if (!method.createHookFunction("sheetCreateBefore")) {
  //     return;
  //   }

  const order = ctx.luckysheetfile.length;
  const index = generateRandomSheetIndex();

  const sheetname = generateRandomSheetName(ctx.luckysheetfile, isPivotTable);

  const sheetconfig: Sheet = {
    name: sheetname,
    status: 0,
    order,
    index,
    row: ctx.defaultrowNum,
    column: ctx.defaultcolumnNum,
    config: {},
    pivotTable: null,
    isPivotTable: !!isPivotTable,
  };
  ctx.luckysheetfile.push(sheetconfig);

  //   server.saveParam("sha", null, $.extend(true, {}, sheetconfig));

  //   if (ctx.clearjfundo) {
  //     ctx.jfundo.length = 0;
  //     const redo = {};
  //     redo.type = "addSheet";
  //     redo.sheetconfig = $.extend(true, {}, sheetconfig);
  //     redo.index = index;
  //     redo.currentSheetIndex = ctx.currentSheetIndex;
  //     ctx.jfredo.push(redo);
  //   }

  changeSheet(ctx, index, isPivotTable, true);
}
