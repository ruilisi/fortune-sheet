import _ from "lodash";
import { Context } from "../context";
import { locale } from "../locale";
import { Settings } from "../settings";
import { CellMatrix, Sheet } from "../types";
import { generateRandomSheetName, getSheetIndex } from "../utils";

function storeSheetParam(ctx: Context) {
  const index = getSheetIndex(ctx, ctx.currentSheetId);
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
  const index = getSheetIndex(ctx, ctx.currentSheetId);
  if (index == null) return;
  ctx.luckysheetfile[index].config = ctx.config;
}

export function changeSheet(
  ctx: Context,
  id: string,
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

  if (id === ctx.currentSheetId) {
    return;
  }

  const file = ctx.luckysheetfile[getSheetIndex(ctx, id)!];

  if (ctx.hooks.beforeActivateSheet?.(id) === false) {
    return;
  }

  storeSheetParamALL(ctx);

  for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
    if (ctx.luckysheetfile[i].id === id) {
      ctx.luckysheetfile[i].status = 1;
    } else {
      ctx.luckysheetfile[i].status = 0;
    }
  }

  ctx.currentSheetId = id;

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
  if (ctx.hooks.afterActivateSheet) {
    setTimeout(() => {
      ctx.hooks.afterActivateSheet?.(id);
    });
  }
}

export function addSheet(
  ctx: Context,
  settings: Required<Settings>,
  newSheetID?: string, // if action is from websocket, there will be a new sheetID
  isPivotTable = false,
  sheetName: string | undefined = undefined,
  sheetData: Sheet | undefined = undefined
) {
  if (/* isEditMode() || */ ctx.allowEdit === false) {
    // alert("非编辑模式下不允许该操作！");
    return;
  }
  const order = ctx.luckysheetfile.length;
  const id = newSheetID ?? (settings?.generateSheetId() as string);
  const sheetname = generateRandomSheetName(
    ctx.luckysheetfile,
    isPivotTable,
    ctx
  );
  if (!_.isNil(sheetData)) {
    delete sheetData.data;
    ctx.luckysheetfile = ctx.luckysheetfile.map((sheet) => {
      sheet.order =
        (sheet.order as number) < sheetData.order!
          ? sheet.order
          : (sheet.order as number) + 1;
      return sheet;
    });
  }
  const sheetconfig: Sheet = _.isNil(sheetData)
    ? {
        name: sheetName === undefined ? sheetname : sheetName,
        status: 0,
        order,
        id,
        row: ctx.defaultrowNum,
        column: ctx.defaultcolumnNum,
        config: {},
        pivotTable: null,
        isPivotTable: !!isPivotTable,
      }
    : sheetData;

  if (ctx.hooks.beforeAddSheet?.(sheetconfig) === false) {
    return;
  }

  ctx.luckysheetfile.push(sheetconfig);

  //   server.saveParam("sha", null, $.extend(true, {}, sheetconfig));

  if (!newSheetID) {
    changeSheet(ctx, id, isPivotTable, true);
  }

  if (ctx.hooks.afterAddSheet) {
    setTimeout(() => {
      ctx.hooks.afterAddSheet?.(sheetconfig);
    });
  }
}

export function deleteSheet(ctx: Context, id: string) {
  if (ctx.allowEdit === false) {
    return;
  }

  const arrIndex = getSheetIndex(ctx, id);

  if (arrIndex == null) {
    return;
  }

  // const file = ctx.luckysheetfile[arrIndex];

  if (ctx.hooks.beforeDeleteSheet?.(id) === false) {
    return;
  }

  // _this.setSheetHide(index, true);

  // $(`#luckysheet-sheets-item${index}`).remove();
  // $(`#luckysheet-datavisual-selection-set-${index}`).remove();
  ctx.luckysheetfile = ctx.luckysheetfile.map((sheet) => {
    sheet.order =
      (sheet.order as number) < (ctx.luckysheetfile[arrIndex].order as number)
        ? sheet.order
        : (sheet.order as number) - 1;
    return sheet;
  });

  ctx.luckysheetfile.splice(arrIndex, 1);
  // _this.reOrderAllSheet();

  // server.saveParam("shd", null, { deleIndex: index });

  if (ctx.hooks.afterDeleteSheet) {
    setTimeout(() => {
      ctx.hooks.afterDeleteSheet?.(id);
    });
  }
}

export function editSheetName(ctx: Context, editable: HTMLSpanElement) {
  const index = getSheetIndex(ctx, ctx.currentSheetId);
  if (ctx.allowEdit === false) {
    if (index == null) return;
    editable.innerText = ctx.luckysheetfile[index].name;
    return;
  }
  const { sheetconfig } = locale(ctx);
  const oldtxt = editable.dataset.oldText || "";
  const txt = editable.innerText;

  if (
    ctx.hooks.beforeUpdateSheetName?.(ctx.currentSheetId, oldtxt, txt) === false
  ) {
    return;
  }

  if (txt.length === 0) {
    editable.innerText = oldtxt;
    throw new Error(sheetconfig.sheetNamecannotIsEmptyError);
  }

  if (
    txt.length > 31 ||
    txt.charAt(0) === "'" ||
    txt.charAt(txt.length - 1) === "'" ||
    /[：:\\/？?*[\]]+/.test(txt)
  ) {
    editable.innerText = oldtxt;
    throw new Error(sheetconfig.sheetNameSpecCharError);
  }

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
  // server.saveParam("all", ctx.currentSheetId, txt, { k: "name" });

  // $t.attr("contenteditable", "false").removeClass(
  //   "luckysheet-mousedown-cancel"
  // );

  if (ctx.hooks.afterUpdateSheetName) {
    setTimeout(() => {
      ctx.hooks.afterUpdateSheetName?.(ctx.currentSheetId, oldtxt, txt);
    });
  }
}

export function expandRowsAndColumns(
  data: CellMatrix,
  rowsToAdd: number,
  columnsToAdd: number
) {
  if (rowsToAdd <= 0 && columnsToAdd <= 0) {
    return data;
  }

  if (data.length + rowsToAdd >= 10000) {
    throw new Error(
      "This action would increase the number of rows in the workbook above the limit of 10000."
    );
  }

  if (data[0].length + columnsToAdd >= 1000) {
    throw new Error(
      "This action would increase the number of columns in the workbook above the limit of 1000."
    );
  }
  if (rowsToAdd <= 0) {
    rowsToAdd = 0;
  }

  if (columnsToAdd <= 0) {
    columnsToAdd = 0;
  }

  let currentColLen = 0;
  if (data.length > 0) {
    currentColLen = data[0].length;
  }

  for (let r = 0; r < data.length; r += 1) {
    for (let i = 0; i < columnsToAdd; i += 1) {
      data[r].push(null);
    }
  }

  for (let r = 0; r < rowsToAdd; r += 1) {
    data.push(_.times(currentColLen + columnsToAdd, () => null));
  }

  return data;
}
