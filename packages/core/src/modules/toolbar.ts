import _ from "lodash";
import { Context, getFlowdata } from "../context";
// import { locale } from "../locale";
import { Cell, CellMatrix } from "../types";
import { getSheetIndex } from "../utils";
import { isAllSelectedCellsInStatus, normalizedAttr } from "./cell";
import { genarate, is_date, update } from "./format";
import {
  isInlineStringCT,
  updateInlineStringFormatOutside,
} from "./inline-string";
import { selectionCopyShow } from "./selection";
import { hasPartMC, isRealNum } from "./validation";

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

function updateFormat_mc(ctx: Context, d: CellMatrix, foucsStatus: any) {
  // if (!checkIsAllowEdit()) {
  //   tooltip.info("", locale().pivotTable.errorNotAllowEdit);
  //   return;
  // }
  const cfg = _.cloneDeep(ctx.config);
  if (cfg.merge == null) {
    cfg.merge = {};
  }

  // if (!checkProtectionNotEnable(ctx.currentSheetIndex)) {
  //   return;
  // }
  if (!ctx.luckysheet_select_save) return;

  if (foucsStatus === "mergeCancel") {
    for (let i = 0; i < ctx.luckysheet_select_save.length; i += 1) {
      const range = ctx.luckysheet_select_save[i];
      const r1 = range.row[0];
      const r2 = range.row[1];
      const c1 = range.column[0];
      const c2 = range.column[1];

      if (r1 === r2 && c1 === c2) {
        continue;
      }

      const fv: any = {};

      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
          const cell = d[r][c];

          if (cell != null && cell.mc != null) {
            const mc_r = cell.mc.r;
            const mc_c = cell.mc.c;

            if ("rs" in cell.mc) {
              delete cell.mc;
              delete cfg.merge[`${mc_r}_${mc_c}`];

              fv[`${mc_r}_${mc_c}`] = _.cloneDeep(cell);
            } else {
              // let cell_clone = fv[mc_r + "_" + mc_c];
              const cell_clone = JSON.parse(
                JSON.stringify(fv[`${mc_r}_${mc_c}`])
              );

              delete cell_clone.v;
              delete cell_clone.m;
              delete cell_clone.ct;
              delete cell_clone.f;
              delete cell_clone.spl;

              d[r][c] = cell_clone;
            }
          }
        }
      }
    }
  } else {
    let isHasMc = false; // 选区是否含有 合并的单元格

    for (let i = 0; i < ctx.luckysheet_select_save.length; i += 1) {
      const range = ctx.luckysheet_select_save[i];
      const r1 = range.row[0];
      const r2 = range.row[1];
      const c1 = range.column[0];
      const c2 = range.column[1];

      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
          const cell = d[r][c];

          if (cell?.mc) {
            isHasMc = true;
            break;
          }
        }
      }
    }

    if (isHasMc) {
      // 选区有合并单元格（选区都执行 取消合并）
      for (let i = 0; i < ctx.luckysheet_select_save.length; i += 1) {
        const range = ctx.luckysheet_select_save[i];
        const r1 = range.row[0];
        const r2 = range.row[1];
        const c1 = range.column[0];
        const c2 = range.column[1];

        if (r1 === r2 && c1 === c2) {
          continue;
        }

        const fv: any = {};

        for (let r = r1; r <= r2; r += 1) {
          for (let c = c1; c <= c2; c += 1) {
            const cell = d[r][c];

            if (cell != null && cell.mc != null) {
              const mc_r = cell.mc.r;
              const mc_c = cell.mc.c;

              if ("rs" in cell.mc) {
                delete cell.mc;
                delete cfg.merge[`${mc_r}_${mc_c}`];

                fv[`${mc_r}_${mc_c}`] = _.cloneDeep(cell);
              } else {
                // let cell_clone = fv[mc_r + "_" + mc_c];
                const cell_clone = JSON.parse(
                  JSON.stringify(fv[`${mc_r}_${mc_c}`])
                );

                delete cell_clone.v;
                delete cell_clone.m;
                delete cell_clone.ct;
                delete cell_clone.f;
                delete cell_clone.spl;

                d[r][c] = cell_clone;
              }
            }
          }
        }
      }
    } else {
      for (let i = 0; i < ctx.luckysheet_select_save.length; i += 1) {
        const range = ctx.luckysheet_select_save[i];
        const r1 = range.row[0];
        const r2 = range.row[1];
        const c1 = range.column[0];
        const c2 = range.column[1];

        if (r1 === r2 && c1 === c2) {
          continue;
        }

        if (foucsStatus === "mergeAll") {
          let fv = {};
          let isfirst = false;

          for (let r = r1; r <= r2; r += 1) {
            for (let c = c1; c <= c2; c += 1) {
              const cell = d[r][c];

              if (
                cell != null &&
                (isInlineStringCT(cell.ct) ||
                  !_.isEmpty(cell.v) ||
                  cell.f != null) &&
                !isfirst
              ) {
                fv = _.cloneDeep(cell);
                isfirst = true;
              }

              d[r][c] = { mc: { r: r1, c: c1 } };
            }
          }

          d[r1][c1] = fv;
          const a = d[r1][c1];
          if (!a) return;
          a.mc = { r: r1, c: c1, rs: r2 - r1 + 1, cs: c2 - c1 + 1 };

          cfg.merge[`${r1}_${c1}`] = {
            r: r1,
            c: c1,
            rs: r2 - r1 + 1,
            cs: c2 - c1 + 1,
          };
        } else if (foucsStatus === "mergeV") {
          for (let c = c1; c <= c2; c += 1) {
            let fv = {};
            let isfirst = false;

            for (let r = r1; r <= r2; r += 1) {
              const cell = d[r][c];

              if (
                cell != null &&
                (!_.isEmpty(cell.v) || cell.f != null) &&
                !isfirst
              ) {
                fv = _.cloneDeep(cell);
                isfirst = true;
              }

              d[r][c] = { mc: { r: r1, c } };
            }

            d[r1][c] = fv;
            const a = d[r1][c];
            if (!a) return;
            a.mc = { r: r1, c, rs: r2 - r1 + 1, cs: 1 };

            cfg.merge[`${r1}_${c}`] = {
              r: r1,
              c,
              rs: r2 - r1 + 1,
              cs: 1,
            };
          }
        } else if (foucsStatus === "mergeH") {
          for (let r = r1; r <= r2; r += 1) {
            let fv = {};
            let isfirst = false;

            for (let c = c1; c <= c2; c += 1) {
              const cell = d[r][c];

              if (
                cell != null &&
                (!_.isEmpty(cell.v) || cell.f != null) &&
                !isfirst
              ) {
                fv = _.cloneDeep(cell);
                isfirst = true;
              }

              d[r][c] = { mc: { r, c: c1 } };
            }

            d[r][c1] = fv;
            const a = d[r][c1];
            if (!a) return;
            a.mc = { r, c: c1, rs: 1, cs: c2 - c1 + 1 };

            cfg.merge[`${r}_${c1}`] = {
              r,
              c: c1,
              rs: 1,
              cs: c2 - c1 + 1,
            };
          }
        }
      }
    }
  }

  if (ctx.clearjfundo) {
    ctx.jfundo.length = 0;
    ctx.jfredo.push({
      type: "mergeChange",
      sheetIndex: ctx.currentSheetIndex,
      data: getFlowdata(ctx),
      curData: d,
      range: _.cloneDeep(ctx.luckysheet_select_save),
      config: _.cloneDeep(ctx.config),
      curConfig: cfg,
    });
  }

  ctx.clearjfundo = false;
  ctx.clearjfundo = true;
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

export function cancelPaintModel(ctx: Context) {
  // let _this = this;
  // $("#luckysheet-sheettable_0").removeClass("luckysheetPaintCursor");
  if (ctx.luckysheet_copy_save === null) return;
  if (ctx.luckysheet_copy_save?.dataSheetIndex === ctx.currentSheetIndex) {
    ctx.luckysheet_selection_range = [];
    selectionCopyShow(ctx.luckysheet_selection_range, ctx);
  } else {
    if (!ctx.luckysheet_copy_save) return;
    const sheetIndex = getSheetIndex(
      ctx,
      ctx.luckysheet_copy_save.dataSheetIndex
    );
    if (!sheetIndex) return;
    // ctx.luckysheetfile[getSheetIndex(ctx.luckysheet_copy_save["dataSheetIndex"])].luckysheet_selection_range = [];
    ctx.luckysheetfile[sheetIndex].luckysheet_selection_range = [];
  }

  ctx.luckysheet_copy_save = {
    dataSheetIndex: "",
    copyRange: [{ row: [0], column: [0] }],
    RowlChange: false,
    HasMC: false,
  };

  ctx.luckysheetPaintModelOn = false;
  // $("#luckysheetpopover").fadeOut(200,function(){
  //     $("#luckysheetpopover").remove();
}
export function handleCurrencyFormat(ctx: Context, cellInput: HTMLDivElement) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;

  updateFormat(ctx, cellInput, flowdata, "ct", "¥ #.00");
}

export function handlePercentageFormat(
  ctx: Context,
  cellInput: HTMLDivElement
) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;

  updateFormat(ctx, cellInput, flowdata, "ct", "0.00%");
}

export function handleNumberDecrease(ctx: Context, cellInput: HTMLDivElement) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata || !ctx.luckysheet_select_save) return;

  const row_index = ctx.luckysheet_select_save[0].row_focus;
  const col_index = ctx.luckysheet_select_save[0].column_focus;
  if (!row_index || !col_index) return;

  let foucsStatus = normalizedAttr(flowdata, row_index, col_index, "ct");
  const cell = flowdata[row_index][col_index];

  if (foucsStatus == null || foucsStatus.t !== "n") {
    return;
  }

  if (foucsStatus.fa === "General") {
    if (!cell || !cell.v) return;

    const mask = genarate(cell.v);
    if (!mask || mask.length < 2) return;
    [, foucsStatus] = mask;
  }

  // 万亿格式
  const reg = /^(w|W)((0?)|(0\.0+))$/;
  if (reg.test(foucsStatus.fa)) {
    if (foucsStatus.fa.indexOf(".") > -1) {
      if (foucsStatus.fa.substr(-2) === ".0") {
        updateFormat(
          ctx,
          cellInput,
          flowdata,
          "ct",
          foucsStatus.fa.split(".")[0]
        );
      } else {
        updateFormat(
          ctx,
          cellInput,
          flowdata,
          "ct",
          foucsStatus.fa.substr(0, foucsStatus.fa.length - 1)
        );
      }
    } else {
      updateFormat(ctx, cellInput, flowdata, "ct", foucsStatus.fa);
    }

    return;
  }
  // Uncaught ReferenceError: Cannot access 'fa' before initialization
  let prefix = "";
  let main = "";
  let fa = [];
  if (foucsStatus.fa.indexOf(".") > -1) {
    fa = foucsStatus.fa.split(".");
    [prefix, main] = fa;
  } else {
    return;
  }

  fa = main.split("");
  let tail = "";
  for (let i = fa.length - 1; i >= 0; i -= 1) {
    const c = fa[i];
    if (c !== "#" && c !== "0" && c !== "," && Number.isNaN(parseInt(c, 10))) {
      tail = c + tail;
    } else {
      break;
    }
  }

  let fmt = "";
  if (foucsStatus.fa.indexOf(".") > -1) {
    let suffix = main;
    if (tail.length > 0) {
      suffix = main.replace(tail, "");
    }

    let pos = suffix.replace(/#/g, "0");
    pos = pos.substr(0, pos.length - 1);
    if (pos === "") {
      fmt = prefix + tail;
    } else {
      fmt = `${prefix}.${pos}${tail}`;
    }
  }

  updateFormat(ctx, cellInput, flowdata, "ct", fmt);
}

export function handleNumberIncrease(ctx: Context, cellInput: HTMLDivElement) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;
  if (!ctx.luckysheet_select_save) return;
  const row_index = ctx.luckysheet_select_save[0].row_focus;
  const col_index = ctx.luckysheet_select_save[0].column_focus;
  if (!row_index || !col_index) return;
  let foucsStatus = normalizedAttr(flowdata, row_index, col_index, "ct");
  const cell = flowdata[row_index][col_index];

  if (foucsStatus == null || foucsStatus.t !== "n") {
    return;
  }

  if (foucsStatus.fa === "General") {
    if (!cell || !cell.v) return;
    const mask = genarate(cell.v);
    if (!mask || mask.length < 2) return;
    [, foucsStatus] = mask;
  }

  if (foucsStatus.fa === "General") {
    updateFormat(ctx, cellInput, flowdata, "ct", "#.0");
    return;
  }

  // 万亿格式
  const reg = /^(w|W)((0?)|(0\.0+))$/;
  if (reg.test(foucsStatus.fa)) {
    if (foucsStatus.fa.indexOf(".") > -1) {
      updateFormat(ctx, cellInput, flowdata, "ct", `${foucsStatus.fa}0`);
    } else {
      if (foucsStatus.fa.substr(-1) === "0") {
        updateFormat(ctx, cellInput, flowdata, "ct", `${foucsStatus.fa}.0`);
      } else {
        updateFormat(ctx, cellInput, flowdata, "ct", `${foucsStatus.fa}0.0`);
      }
    }

    return;
  }

  // Uncaught ReferenceError: Cannot access 'fa' before initialization
  let prefix = "";
  let main = "";
  let fa = [];

  if (foucsStatus.fa.indexOf(".") > -1) {
    fa = foucsStatus.fa.split(".");
    [prefix, main] = fa;
  } else {
    main = foucsStatus.fa;
  }

  fa = main.split("");
  let tail = "";
  for (let i = fa.length - 1; i >= 0; i -= 1) {
    const c = fa[i];
    if (c !== "#" && c !== "0" && c !== "," && Number.isNaN(parseInt(c, 10))) {
      tail = c + tail;
    } else {
      break;
    }
  }

  let fmt = "";
  if (foucsStatus.fa.indexOf(".") > -1) {
    let suffix = main;
    if (tail.length > 0) {
      suffix = main.replace(tail, "");
    }

    let pos = suffix.replace(/#/g, "0");
    pos += "0";
    fmt = `${prefix}.${pos}${tail}`;
  } else {
    if (tail.length > 0) {
      fmt = `${main.replace(tail, "")}.0${tail}`;
    } else {
      fmt = `${main}.0${tail}`;
    }
  }

  updateFormat(ctx, cellInput, flowdata, "ct", fmt);
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

export function handleFormatPainter(ctx: Context) {
  //   if (!checkIsAllowEdit()) {
  //     tooltip.info("", locale().pivotTable.errorNotAllowEdit);
  //     return
  // }

  // e.stopPropagation();

  // let _locale = locale();
  // let locale_paint = _locale.paint;

  if (
    ctx.luckysheet_select_save == null ||
    ctx.luckysheet_select_save.length === 0
  ) {
    // if(isEditMode()){
    //     alert(locale_paint.tipSelectRange);
    // }
    // else{
    //     tooltip.info("",locale_paint.tipSelectRange);
    // }
    return;
  }
  if (ctx.luckysheet_select_save.length > 1) {
    // if(isEditMode()){
    //     alert(locale_paint.tipNotMulti);
    // }
    // else{
    //     tooltip.info("",locale_paint.tipNotMulti);
    // }
    return;
  }

  // *增加了对选区范围是否为部分合并单元格的校验，如果为部分合并单元格，就阻止格式刷的下一步
  // TODO 这里也可以改为：判断到是合并单元格的一部分后，格式刷执行黏贴格式后删除范围单元格的 mc 值

  let has_PartMC = false;

  const r1 = ctx.luckysheet_select_save[0].row[0];
  const r2 = ctx.luckysheet_select_save[0].row[1];

  const c1 = ctx.luckysheet_select_save[0].column[0];
  const c2 = ctx.luckysheet_select_save[0].column[1];

  has_PartMC = hasPartMC(ctx, ctx.config, r1, r2, c1, c2);

  if (has_PartMC) {
    // *提示后中止下一步
    // tooltip.info('无法对部分合并单元格执行此操作', '');
    return;
  }

  // tooltip.popover("<i class='fa fa-paint-brush'></i> "+locale_paint.start+"", "topCenter", true, null, locale_paint.end,function(){
  cancelPaintModel(ctx);
  // });

  // $("#luckysheet-sheettable_0").addClass("luckysheetPaintCursor");

  ctx.luckysheet_selection_range = [
    {
      row: ctx.luckysheet_select_save[0].row,
      column: ctx.luckysheet_select_save[0].column,
    },
  ];

  selectionCopyShow(ctx.luckysheet_selection_range, ctx);
  let RowlChange = false;
  let HasMC = false;

  for (
    let r = ctx.luckysheet_select_save[0].row[0];
    r <= ctx.luckysheet_select_save[0].row[1];
    r += 1
  ) {
    if (ctx.config.rowhidden != null && ctx.config.rowhidden[r] != null) {
      continue;
    }

    if (ctx.config.rowlen != null && r in ctx.config.rowlen) {
      RowlChange = true;
    }

    for (
      let c = ctx.luckysheet_select_save[0].column[0];
      c <= ctx.luckysheet_select_save[0].column[1];
      c += 1
    ) {
      const flowdata = getFlowdata(ctx);
      if (!flowdata) return;
      const cell = flowdata[r][c];
      if (cell != null && cell.mc != null && cell.mc.rs != null) {
        HasMC = true;
      }
    }
  }
  ctx.luckysheet_copy_save = {
    dataSheetIndex: ctx.currentSheetIndex,
    copyRange: [
      {
        row: ctx.luckysheet_select_save[0].row,
        column: ctx.luckysheet_select_save[0].column,
      },
    ],
    RowlChange,
    HasMC,
  };

  ctx.luckysheetPaintModelOn = true;
  ctx.luckysheetPaintSingle = true;
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
export function handleBorderAll(ctx: Context) {
  // *如果禁止前台编辑，则中止下一步操作
  // if (!checkIsAllowEdit()) {
  //   tooltip.info("", locale().pivotTable.errorNotAllowEdit);
  //   return;
  // }
  // if (!checkProtectionFormatCells(Store.currentSheetIndex)) {
  //   return;
  // }

  // const d = editor.deepCopyFlowData(Store.flowdata);
  // let type = $(this).attr("type");
  let type = "border-all";
  if (type == null) {
    type = "border-all";
  }

  // const subcolormenuid = "luckysheet-icon-borderColor-menuButton";
  // let color = $(`#${subcolormenuid}`).find(".luckysheet-color-selected").val();
  // let style = $("#luckysheetborderSizepreview").attr("itemvalue");

  let color = "#000000";
  let style = "1";

  if (color == null || color === "") {
    color = "#000";
  }

  if (style == null || style === "") {
    style = "1";
  }

  const cfg = _.cloneDeep(ctx.config);
  if (cfg.borderInfo == null) {
    cfg.borderInfo = [];
  }

  const borderInfo = {
    rangeType: "range",
    borderType: type,
    color,
    style,
    range: _.cloneDeep(ctx.luckysheet_select_save),
  };

  cfg.borderInfo.push(borderInfo);

  if (ctx.clearjfundo) {
    ctx.jfundo.length = 0;

    // const redo = [];

    // redo.type = "borderChange";

    // redo.config = $.extend(true, {}, Store.config);
    // redo.curconfig = $.extend(true, {}, cfg);

    // redo.sheetIndex = Store.currentSheetIndex;

    // ctx.jfredo.push(redo);
  }

  // server.saveParam("cg", ctx.currentSheetIndex, cfg.borderInfo, {
  //   k: "borderInfo",
  // });

  ctx.config = cfg;
  const index = getSheetIndex(ctx, ctx.currentSheetIndex);
  if (!index) return;
  ctx.luckysheetfile[index].config = ctx.config;

  // setTimeout(function () {
  //   luckysheetrefreshgrid();
  // }, 1);
}

export function handleMergeAll(ctx: Context) {
  // if (!checkProtectionNotEnable(ctx.currentSheetIndex)) {
  //   return;
  // }

  // if (selectIsOverlap()) {
  //   if (isEditMode()) {
  //     alert("不能合并重叠区域");
  //   } else {
  //     tooltip.info("不能合并重叠区域", "");
  //   }
  //   return;
  // }

  if (ctx.config.merge != null) {
    let has_PartMC = false;
    if (!ctx.luckysheet_select_save) return;
    for (let s = 0; s < ctx.luckysheet_select_save.length; s += 1) {
      const r1 = ctx.luckysheet_select_save[s].row[0];
      const r2 = ctx.luckysheet_select_save[s].row[1];
      const c1 = ctx.luckysheet_select_save[s].column[0];
      const c2 = ctx.luckysheet_select_save[s].column[1];

      has_PartMC = hasPartMC(ctx, ctx.config, r1, r2, c1, c2);

      if (has_PartMC) {
        break;
      }
    }

    if (has_PartMC) {
      // if (isEditMode()) {
      //   alert("无法对部分合并单元格执行此操作");
      // } else {
      //   tooltip.info("无法对部分合并单元格执行此操作", "");
      // }
      return;
    }
  }

  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;
  updateFormat_mc(ctx, flowdata, "mergeAll");
}

export function handleTextSize(
  ctx: Context,
  cellInput: HTMLDivElement,
  size: number
) {
  setAttr(ctx, cellInput, "fs", size);
}

const handlerMap: Record<string, ToolbarItemClickHandler> = {
  "currency-format": handleCurrencyFormat,
  "percentage-format": handlePercentageFormat,
  "number-decrease": handleNumberDecrease,
  "number-increase": handleNumberIncrease,
  "merge-all": handleMergeAll,
  "border-all": handleBorderAll,
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
  "format-painter": handleFormatPainter,
};

export function getToolbarItemClickHandler(name: string) {
  return handlerMap[name];
}
