import _ from "lodash";
import { Context, getFlowdata } from "../context";
import { isAllSelectedCellsInStatus } from "./cell";
import { is_date, update } from "./format";
import {
  inlineStyleAffectAttribute,
  updateInlineStringFormatOutside,
} from "./inline-string";
import { isRealNum } from "./validation";

type ToolbarItemClickHandler = (
  ctx: Context,
  cellInput: HTMLDivElement
) => void;

function updateFormatCell(
  ctx: Context,
  d: any,
  attr: string,
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
        let value = null;

        if (_.isPlainObject(cell)) {
          value = d[r][c].v;
        } else {
          value = d[r][c];
        }

        if (foucsStatus !== "@" && isRealNum(value)) {
          value = parseFloat(value);
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

        if (_.isPlainObject(cell)) {
          d[r][c].m = mask;
          if (_.isNil(d[r][c].ct)) {
            d[r][c].ct = {};
          }
          d[r][c].ct.fa = foucsStatus;
          d[r][c].ct.t = type;
        } else {
          d[r][c] = { ct: { fa: foucsStatus, t: type }, v: value, m: mask };
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

        if (_.isPlainObject(value)) {
          // if(attr in inlineStyleAffectAttribute && isInlineStringCell(value)){
          updateInlineStringFormatOutside(value, attr, foucsStatus);
          // }
          // else{
          d[r][c][attr] = foucsStatus;
          // }
        } else {
          console.info(123123)
          d[r][c] = { v: value };
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
  d: any,
  attr: string,
  foucsStatus: any
) {
  //   if (!checkProtectionFormatCells(ctx.currentSheetIndex)) {
  //     return;
  //   }

  if (!ctx.allowEdit) {
    return;
  }

  if (attr in inlineStyleAffectAttribute) {
    if (ctx.luckysheetCellUpdate.length > 0) {
      const value = $input.innerText;
      if (value.substring(0, 1) !== "=") {
        const cell =
          d[ctx.luckysheetCellUpdate[0]][ctx.luckysheetCellUpdate[1]];
        updateInlineStringFormat(
          cell,
          attr,
          foucsStatus,
          luckysheetformula.rangeResizeTo
        );
        // return;
      }
    }
  }

  let cfg = _.cloneDeep(ctx.config);
  if (_.isNil(cfg.rowlen)) {
    cfg.rowlen = {};
  }

  for (let s = 0; s < ctx.luckysheet_select_save.length; s += 1) {
    const [row_st, row_ed] = ctx.luckysheet_select_save[s].row;
    const [col_st, col_ed] = ctx.luckysheet_select_save[s].column;

    updateFormatCell(ctx, d, attr, foucsStatus, row_st, row_ed, col_st, col_ed);

    if (attr === "tb" || attr === "tr" || attr === "fs") {
      cfg = rowlenByRange(d, row_st, row_ed, cfg);
    }
  }

  //   let allParam = {};
  //   if (attr === "tb" || attr === "tr" || attr === "fs") {
  //     allParam = {
  //       cfg,
  //       RowlChange: true,
  //     };
  //   }

  //   jfrefreshgrid(d, ctx.luckysheet_select_save, allParam, false);
}

function handleToggleAttr(
  ctx: Context,
  cellInput: HTMLDivElement,
  attr: string
) {
  const flowdata = getFlowdata(ctx);
  const flag = isAllSelectedCellsInStatus(ctx, attr, 1);
  const foucsStatus = flag ? 0 : 1;

  updateFormat(ctx, cellInput, flowdata, attr, foucsStatus);
}

function handleBold(ctx: Context, cellInput: HTMLDivElement) {
  handleToggleAttr(ctx, cellInput, "bl");
}

function handleItalic(ctx: Context, cellInput: HTMLDivElement) {
  handleToggleAttr(ctx, cellInput, "it");
}

function handleStrikeThrough(ctx: Context, cellInput: HTMLDivElement) {
  handleToggleAttr(ctx, cellInput, "cl");
}

function handleUnderline(ctx: Context, cellInput: HTMLDivElement) {
  handleToggleAttr(ctx, cellInput, "un");
}

const handlerMap: Record<string, ToolbarItemClickHandler> = {
  bold: handleBold,
  italic: handleItalic,
  "strike-though": handleStrikeThrough,
  underline: handleUnderline,
};

export function getToolbarItemClickHandler(name: string) {
  return handlerMap[name];
}
