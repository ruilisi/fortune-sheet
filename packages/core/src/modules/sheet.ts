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
  // file.visibledatarow = ctx.visibledatarow;
  // file.visibledatacolumn = ctx.visibledatacolumn;
  // file.ch_width = ctx.ch_width;
  // file.rh_height = ctx.rh_height;
  file.luckysheet_select_save = ctx.luckysheet_select_save;
  file.luckysheet_selection_range = ctx.luckysheet_selection_range;
  file.zoomRatio = ctx.zoomRatio;
}

export function storeSheetParamALL(ctx: Context) {
  storeSheetParam(ctx);
  const index = getSheetIndex(ctx, ctx.currentSheetIndex);
  if (index == null) return;
  ctx.luckysheetfile[index].config = ctx.config;
}

export function changeSheet(
  ctx: Context,
  index: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPivotInitial?: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isNewSheet?: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const sheetname = generateRandomSheetName(
    ctx.luckysheetfile,
    isPivotTable,
    ctx
  );

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

export function deleteSheet(ctx: Context, index: string) {
  if (ctx.allowEdit === false) {
    return;
  }

  const arrIndex = getSheetIndex(ctx, index);
  if (arrIndex == null) return;

  // const file = ctx.luckysheetfile[arrIndex];

  // // 钩子 sheetDeleteBefore
  // if (!method.createHookFunction("sheetDeleteBefore", { sheet: file })) {
  //   return;
  // }

  // _this.setSheetHide(index, true);

  // $(`#luckysheet-sheets-item${index}`).remove();
  // $(`#luckysheet-datavisual-selection-set-${index}`).remove();

  ctx.luckysheetfile.splice(arrIndex, 1);
  // _this.reOrderAllSheet();

  // server.saveParam("shd", null, { deleIndex: index });

  // if (ctx.clearjfundo) {
  //   removedsheet[0].type = "deleteSheet";
  //   ctx.jfredo.push(removedsheet[0]);
  // }
  // // 钩子 sheetDeleteAfter
  // method.createHookFunction("sheetDeleteAfter", { sheet: file });
}

export function editSheetName(ctx: Context, editable: HTMLSpanElement) {
  if (ctx.allowEdit === false) {
    return;
  }
  const oldtxt = editable.dataset.oldText || "";
  const txt = editable.innerText;

  if (txt.length === 0) {
    // tooltip.info("", locale_sheetconfig.sheetNamecannotIsEmptyError);
    editable.innerText = oldtxt;
    return;
  }

  if (
    txt.length > 31 ||
    txt.charAt(0) === "'" ||
    txt.charAt(txt.length - 1) === "'" ||
    /[：:\\/？?*[\]]+/.test(txt)
  ) {
    // tooltip.info("", locale_sheetconfig.sheetNameSpecCharError);
    editable.innerText = oldtxt;
    return;
  }

  const index = getSheetIndex(ctx, ctx.currentSheetIndex);
  if (index == null) return;

  for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
    if (index !== i && ctx.luckysheetfile[i].name === txt) {
      // if (isEditMode()) {
      //   alert(locale_sheetconfig.tipNameRepeat);
      // } else {
      //   tooltip.info("", locale_sheetconfig.tipNameRepeat);
      // }
      editable.innerText = oldtxt;
      return;
    }
  }

  // sheetmanage.sheetArrowShowAndHide();

  ctx.luckysheetfile[index].name = txt;
  // server.saveParam("all", ctx.currentSheetIndex, txt, { k: "name" });

  // $t.attr("contenteditable", "false").removeClass(
  //   "luckysheet-mousedown-cancel"
  // );

  // if (ctx.clearjfundo) {
  //   const redo = {};
  //   redo.type = "sheetName";
  //   redo.sheetIndex = ctx.currentSheetIndex;

  //   redo.oldtxt = oldtxt;
  //   redo.txt = txt;

  //   ctx.jfundo.length = 0;
  //   ctx.jfredo.push(redo);
  // }
  // // 钩子： sheetEditNameAfter
  // method.createHookFunction("sheetEditNameAfter", {
  //   i: ctx.luckysheetfile[index].index,
  //   oldName: oldtxt,
  //   newName: txt,
  // });
}
