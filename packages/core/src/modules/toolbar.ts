import _ from "lodash";
import { Context, getFlowdata } from "../context";
import { Cell, CellMatrix } from "../types";
import { isAllSelectedCellsInStatus } from "./cell";
import { is_date, update } from "./format";
import { updateInlineStringFormatOutside } from "./inline-string";
import { isRealNum } from "./validation";

type ToolbarItemClickHandler = (
  ctx: Context,
  cellInput: HTMLDivElement
) => void;

function updateFormatCell(
  ctx: Context,
  d: CellMatrix,
  attr: keyof Cell,
  foucsStatus: any,
  row_st: number,
  row_ed: number,
  col_st: number,
  col_ed: number
) {
  if (_.isNil(d) || _.isNil(attr)) {
    return;
  }
  if (attr === "ct") {
    for (let r = row_st; r <= row_ed; r += 1) {
      if (!_.isNil(ctx.config.rowhidden) && !_.isNil(ctx.config.rowhidden[r])) {
        continue;
      }

      for (let c = col_st; c <= col_ed; c += 1) {
        const cell = d[r][c];
        let value;

        if (_.isPlainObject(cell)) {
          value = cell?.v;
        } else {
          value = cell;
        }

        if (foucsStatus !== "@" && isRealNum(value)) {
          value = Number(value!);
        }

        const mask = update(foucsStatus, value);
        let type = "n";

        if (
          is_date(foucsStatus) ||
          foucsStatus === 14 ||
          foucsStatus === 15 ||
          foucsStatus === 16 ||
          foucsStatus === 17 ||
          foucsStatus === 18 ||
          foucsStatus === 19 ||
          foucsStatus === 20 ||
          foucsStatus === 21 ||
          foucsStatus === 22 ||
          foucsStatus === 45 ||
          foucsStatus === 46 ||
          foucsStatus === 47
        ) {
          type = "d";
        } else if (foucsStatus === "@" || foucsStatus === 49) {
          type = "s";
        } else if (foucsStatus === "General" || foucsStatus === 0) {
          // type = "g";
          type = isRealNum(value) ? "n" : "g";
        }

        if (cell && _.isPlainObject(cell)) {
          cell.m = mask;
          if (_.isNil(cell.ct)) {
            cell.ct = {};
          }
          cell.ct.fa = foucsStatus;
          cell.ct.t = type;
        } else {
          d[r][c] = {
            ct: { fa: foucsStatus, t: type },
            v: value as string,
            m: mask,
          };
        }
      }
    }
  } else {
    if (attr === "ht") {
      if (foucsStatus === "left") {
        foucsStatus = "1";
      } else if (foucsStatus === "center") {
        foucsStatus = "0";
      } else if (foucsStatus === "right") {
        foucsStatus = "2";
      }
    } else if (attr === "vt") {
      if (foucsStatus === "top") {
        foucsStatus = "1";
      } else if (foucsStatus === "middle") {
        foucsStatus = "0";
      } else if (foucsStatus === "bottom") {
        foucsStatus = "2";
      }
    } else if (attr === "tb") {
      if (foucsStatus === "overflow") {
        foucsStatus = "1";
      } else if (foucsStatus === "clip") {
        foucsStatus = "0";
      } else if (foucsStatus === "wrap") {
        foucsStatus = "2";
      }
    } else if (attr === "tr") {
      if (foucsStatus === "none") {
        foucsStatus = "0";
      } else if (foucsStatus === "angleup") {
        foucsStatus = "1";
      } else if (foucsStatus === "angledown") {
        foucsStatus = "2";
      } else if (foucsStatus === "vertical") {
        foucsStatus = "3";
      } else if (foucsStatus === "rotation-up") {
        foucsStatus = "4";
      } else if (foucsStatus === "rotation-down") {
        foucsStatus = "5";
      }
    }

    for (let r = row_st; r <= row_ed; r += 1) {
      if (!_.isNil(ctx.config.rowhidden) && !_.isNil(ctx.config.rowhidden[r])) {
        continue;
      }

      for (let c = col_st; c <= col_ed; c += 1) {
        const value = d[r][c];

        if (value && _.isPlainObject(value)) {
          // if(attr in inlineStyleAffectAttribute && isInlineStringCell(value)){
          updateInlineStringFormatOutside(value!, attr, foucsStatus);
          // }
          // else{
          // @ts-ignore
          value[attr] = foucsStatus;
          // }
        } else {
          // @ts-ignore
          d[r][c] = { v: value };
          // @ts-ignore
          d[r][c][attr] = foucsStatus;
        }

        // if(attr === "tr" && !_.isNil(d[r][c].tb)){
        //     d[r][c].tb = "0";
        // }
      }
    }
  }
}

function updateFormat(
  ctx: Context,
  $input: HTMLDivElement,
  d: CellMatrix,
  attr: keyof Cell,
  foucsStatus: any
) {
  //   if (!checkProtectionFormatCells(ctx.currentSheetIndex)) {
  //     return;
  //   }

  if (!ctx.allowEdit) {
    return;
  }

  // if (attr in inlineStyleAffectAttribute) {
  //   if (ctx.luckysheetCellUpdate.length > 0) {
  //     const value = $input.innerText;
  //     if (value.substring(0, 1) !== "=") {
  //       const cell =
  //         d[ctx.luckysheetCellUpdate[0]][ctx.luckysheetCellUpdate[1]];
  //       updateInlineStringFormat(
  //         cell,
  //         attr,
  //         foucsStatus,
  //         luckysheetformula.rangeResizeTo
  //       );
  //       // return;
  //     }
  //   }
  // }

  const cfg = _.cloneDeep(ctx.config);
  if (_.isNil(cfg.rowlen)) {
    cfg.rowlen = {};
  }

  _.forEach(ctx.luckysheet_select_save, (selection) => {
    const [row_st, row_ed] = selection.row;
    const [col_st, col_ed] = selection.column;

    updateFormatCell(ctx, d, attr, foucsStatus, row_st, row_ed, col_st, col_ed);

    // if (attr === "tb" || attr === "tr" || attr === "fs") {
    //   cfg = rowlenByRange(ctx, d, row_st, row_ed, cfg);
    // }
  });

  //   let allParam = {};
  //   if (attr === "tb" || attr === "tr" || attr === "fs") {
  //     allParam = {
  //       cfg,
  //       RowlChange: true,
  //     };
  //   }

  //   jfrefreshgrid(d, ctx.luckysheet_select_save, allParam, false);
}

function toggleAttr(ctx: Context, cellInput: HTMLDivElement, attr: keyof Cell) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;

  const flag = isAllSelectedCellsInStatus(ctx, attr, 1);
  const foucsStatus = flag ? 0 : 1;

  updateFormat(ctx, cellInput, flowdata, attr, foucsStatus);
}

function setAttr(
  ctx: Context,
  cellInput: HTMLDivElement,
  attr: keyof Cell,
  value: any
) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;

  updateFormat(ctx, cellInput, flowdata, attr, value);
}

export function handleBold(ctx: Context, cellInput: HTMLDivElement) {
  toggleAttr(ctx, cellInput, "bl");
}

export function handleItalic(ctx: Context, cellInput: HTMLDivElement) {
  toggleAttr(ctx, cellInput, "it");
}

export function handleStrikeThrough(ctx: Context, cellInput: HTMLDivElement) {
  toggleAttr(ctx, cellInput, "cl");
}

export function handleUnderline(ctx: Context, cellInput: HTMLDivElement) {
  toggleAttr(ctx, cellInput, "un");
}

export function handleHorizontalAlign(
  ctx: Context,
  cellInput: HTMLDivElement,
  value: string
) {
  setAttr(ctx, cellInput, "ht", value);
}

export function handleVerticalAlign(
  ctx: Context,
  cellInput: HTMLDivElement,
  value: string
) {
  setAttr(ctx, cellInput, "vt", value);
}

export function handleClearFormat(ctx: Context) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;

  _.forEach(ctx.luckysheet_select_save, (selection) => {
    const [row_st, row_ed] = selection.row;
    const [col_st, col_ed] = selection.column;

    for (let r = row_st; r <= row_ed; r += 1) {
      if (!_.isNil(ctx.config.rowhidden) && !_.isNil(ctx.config.rowhidden[r])) {
        continue;
      }

      for (let c = col_st; c <= col_ed; c += 1) {
        const cell = flowdata[r][c];
        if (!cell) continue;

        flowdata[r][c] = _.pick(cell, "v", "m", "mc", "f", "ct");
      }
    }
  });
}

export function handleTextColor(
  ctx: Context,
  cellInput: HTMLDivElement,
  color: string
) {
  setAttr(ctx, cellInput, "fc", color);
}

export function handleTextBackground(
  ctx: Context,
  cellInput: HTMLDivElement,
  color: string
) {
  setAttr(ctx, cellInput, "bg", color);
}

export function handleTextSize(
  ctx: Context,
  cellInput: HTMLDivElement,
  size: number
) {
  setAttr(ctx, cellInput, "fs", size);
}

const handlerMap: Record<string, ToolbarItemClickHandler> = {
  bold: handleBold,
  italic: handleItalic,
  "strike-through": handleStrikeThrough,
  underline: handleUnderline,
  "align-left": (ctx: Context, cellInput: HTMLDivElement) =>
    handleHorizontalAlign(ctx, cellInput, "left"),
  "align-center": (ctx: Context, cellInput: HTMLDivElement) =>
    handleHorizontalAlign(ctx, cellInput, "center"),
  "align-right": (ctx: Context, cellInput: HTMLDivElement) =>
    handleHorizontalAlign(ctx, cellInput, "right"),
  "align-top": (ctx: Context, cellInput: HTMLDivElement) =>
    handleVerticalAlign(ctx, cellInput, "top"),
  "align-mid": (ctx: Context, cellInput: HTMLDivElement) =>
    handleVerticalAlign(ctx, cellInput, "middle"),
  "align-bottom": (ctx: Context, cellInput: HTMLDivElement) =>
    handleVerticalAlign(ctx, cellInput, "bottom"),
  "clear-format": handleClearFormat,
};

export function getToolbarItemClickHandler(name: string) {
  return handlerMap[name];
}
