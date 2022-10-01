import _, { isPlainObject } from "lodash";
import type { Sheet as SheetType, Selection, Freezen, Range } from "../types";
import { Context, getFlowdata } from "../context";
import {
  getCellValue,
  getdatabyselection,
  getStyleByCell,
  mergeBorder,
} from "./cell";
import { delFunctionGroup } from "./formula";
import clipboard from "./clipboard";
import { getBorderInfoCompute } from "./border";
import { getSheetIndex, replaceHtml } from "../utils";
import { hasPartMC } from "./validation";
import { update } from "./format";

export const selectionCache = {
  isPasteAction: false,
};

// 公式函数 选区实体框
export function seletedHighlistByindex(
  ctx: Context,
  r1: number,
  r2: number,
  c1: number,
  c2: number
) {
  const row = ctx.visibledatarow[r2];
  const row_pre = r1 - 1 === -1 ? 0 : ctx.visibledatarow[r1 - 1];
  const col = ctx.visibledatacolumn[c2];
  const col_pre = c1 - 1 === -1 ? 0 : ctx.visibledatacolumn[c1 - 1];

  return {
    left: col_pre,
    width: col - col_pre - 1,
    top: row_pre,
    height: row - row_pre - 1,
  };
}

export function normalizeSelection(
  ctx: Context,
  selection: SheetType["luckysheet_select_save"]
) {
  if (!selection) return selection;

  const flowdata = getFlowdata(ctx);
  if (!flowdata) return selection;

  for (let i = 0; i < selection.length; i += 1) {
    const r1 = selection[i].row[0];
    const r2 = selection[i].row[1];
    const c1 = selection[i].column[0];
    const c2 = selection[i].column[1];

    let rf;
    let cf;
    if (_.isNil(selection[i].row_focus)) {
      rf = r1;
    } else {
      rf = selection[i].row_focus;
    }

    if (_.isNil(selection[i].column_focus)) {
      cf = c1;
    } else {
      cf = selection[i].column_focus;
    }

    if (_.isNil(rf) || _.isNil(cf)) {
      console.error("normalizeSelection: rf and cf is nil");
      return selection;
    }

    const row = ctx.visibledatarow[r2];
    const row_pre = r1 - 1 === -1 ? 0 : ctx.visibledatarow[r1 - 1];
    const col = ctx.visibledatacolumn[c2];
    const col_pre = c1 - 1 === -1 ? 0 : ctx.visibledatacolumn[c1 - 1];

    let row_f = ctx.visibledatarow[rf];
    let row_pre_f = rf - 1 === -1 ? 0 : ctx.visibledatarow[rf - 1];
    let col_f = ctx.visibledatacolumn[cf];
    let col_pre_f = cf - 1 === -1 ? 0 : ctx.visibledatacolumn[cf - 1];

    const margeset = mergeBorder(ctx, flowdata, rf, cf);
    if (margeset) {
      [row_pre_f, row_f] = margeset.row;
      [col_pre_f, col_f] = margeset.column;
    }

    selection[i].row = [r1, r2];
    selection[i].column = [c1, c2];

    selection[i].row_focus = rf;
    selection[i].column_focus = cf;

    selection[i].left = col_pre_f;
    selection[i].width = col_f - col_pre_f - 1;
    selection[i].top = row_pre_f;
    selection[i].height = row_f - row_pre_f - 1;

    selection[i].left_move = col_pre;
    selection[i].width_move = col - col_pre - 1;
    selection[i].top_move = row_pre;
    selection[i].height_move = row - row_pre - 1;
  }
  return selection;
}

export function selectTitlesMap(
  rangeMap: Record<string, number>,
  range1: number,
  range2: number
) {
  const map: Record<string, number> = rangeMap || {};
  for (let i = range1; i <= range2; i += 1) {
    if (i in map) {
      continue;
    }
    map[i] = 0;
  }
  return map;
}

export function selectTitlesRange(map: Record<string, number>) {
  const mapArr = Object.keys(map).map(Number);

  mapArr.sort((a, b) => {
    return a - b;
  });

  let rangeArr: number[][] | undefined;
  let item = [];

  if (mapArr.length > 1) {
    rangeArr = [];
    for (let j = 1; j < mapArr.length; j += 1) {
      if (mapArr[j] - mapArr[j - 1] === 1) {
        item.push(mapArr[j - 1]);

        if (j === mapArr.length - 1) {
          item.push(mapArr[j]);
          rangeArr.push(item);
        }
      } else {
        if (j === 1) {
          if (j === mapArr.length - 1) {
            item.push(mapArr[j - 1]);
            rangeArr.push(item);
            rangeArr.push([mapArr[j]]);
          } else {
            rangeArr.push([mapArr[0]]);
          }
        } else if (j === mapArr.length - 1) {
          item.push(mapArr[j - 1]);
          rangeArr.push(item);
          rangeArr.push([mapArr[j]]);
        } else {
          item.push(mapArr[j - 1]);
          rangeArr.push(item);
          item = [];
        }
      }
    }
  } else {
    rangeArr = [];
    rangeArr.push([mapArr[0]]);
  }

  return rangeArr;
}

export function pasteHandlerOfPaintModel(
  ctx: Context,
  copyRange: Context["luckysheet_copy_save"]
) {
  // if (!checkProtectionLockedRangeList(ctx.luckysheet_select_save, ctx.currentSheetId)) {
  //   return;
  // }
  const cfg = ctx.config;
  if (cfg.merge == null) {
    cfg.merge = {};
  }

  if (!copyRange) return;
  // 复制范围
  const copyHasMC = copyRange.HasMC;
  // let copyRowlChange = copyRange["RowlChange"];
  const copySheetIndex = copyRange.dataSheetId;

  const c_r1 = copyRange.copyRange[0].row[0];
  const c_r2 = copyRange.copyRange[0].row[1];
  const c_c1 = copyRange.copyRange[0].column[0];
  const c_c2 = copyRange.copyRange[0].column[1];

  const copyData = _.cloneDeep(
    getdatabyselection(
      ctx,
      { row: [c_r1, c_r2], column: [c_c1, c_c2] },
      copySheetIndex
    )
  );

  // 应用范围
  if (!ctx.luckysheet_select_save) return;
  // 框选区域
  const last =
    ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1];
  // 框选区域输出
  const minh = last.row[0];
  let maxh = last.row[1]; // 应用范围首尾行
  const minc = last.column[0];
  let maxc = last.column[1]; // 应用范围首尾列

  const copyh = copyData.length;
  const copyc = copyData[0].length;

  if (minh === maxh && minc === maxc) {
    // 应用范围是一个单元格，自动增加到复制范围大小 (若自动增加的范围包含部分合并单元格，则提示)
    let has_PartMC = false;
    if (cfg.merge != null) {
      has_PartMC = hasPartMC(
        ctx,
        cfg,
        minh,
        minh + copyh - 1,
        minc,
        minc + copyc - 1
      );
    }

    if (has_PartMC) {
      // if (isEditMode()) {
      //   alert("不能对合并单元格做部分更改");
      // }
      // else {
      //   tooltip.info('<i class="fa fa-exclamation-triangle"></i>提示', "不能对合并单元格做部分更改");
      // }
      return;
    }

    maxh = minh + copyh - 1;
    maxc = minc + copyc - 1;
  }

  const timesH = Math.ceil((maxh - minh + 1) / copyh); // 复制行 组数
  const timesC = Math.ceil((maxc - minc + 1) / copyc); // 复制列 组数

  // let d = editor.deepCopyFlowData(ctx.flowdata);//取数据
  const flowdata = getFlowdata(ctx); // 取数据
  if (flowdata == null) return;
  const cellMaxLength = flowdata[0].length;
  const rowMaxLength = flowdata.length;

  const borderInfoCompute = getBorderInfoCompute(ctx, copySheetIndex);
  const c_dataVerification =
    _.cloneDeep(
      ctx.luckysheetfile[getSheetIndex(ctx, copySheetIndex)!].dataVerification
    ) || {};
  let dataVerification = null;

  let mth = 0;
  let mtc = 0;
  let maxcellCahe = 0;
  let maxrowCache = 0;
  for (let th = 1; th <= timesH; th += 1) {
    for (let tc = 1; tc <= timesC; tc += 1) {
      mth = minh + (th - 1) * copyh;
      mtc = minc + (tc - 1) * copyc;

      maxrowCache =
        minh + th * copyh > rowMaxLength ? rowMaxLength : minh + th * copyh;
      if (maxrowCache > maxh + 1) {
        maxrowCache = maxh + 1;
      }

      maxcellCahe =
        minc + tc * copyc > cellMaxLength ? cellMaxLength : minc + tc * copyc;
      if (maxcellCahe > maxc + 1) {
        maxcellCahe = maxc + 1;
      }

      const offsetMC: any = {};
      for (let h = mth; h < maxrowCache; h += 1) {
        if (h == null) return;
        if (flowdata[h] == null) return;
        let x: any[] = [];
        x = flowdata[h];

        for (let c = mtc; c < maxcellCahe; c += 1) {
          if (borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`]) {
            const bd_obj = {
              rangeType: "cell",
              value: {
                row_index: h,
                col_index: c,
                l: borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`].l,
                r: borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`].r,
                t: borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`].t,
                b: borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`].b,
              },
            };

            if (cfg.borderInfo == null) {
              cfg.borderInfo = [];
            }

            cfg.borderInfo.push(bd_obj);
          } else if (borderInfoCompute[`${h}_${c}`]) {
            const bd_obj = {
              rangeType: "cell",
              value: {
                row_index: h,
                col_index: c,
                l: null,
                r: null,
                t: null,
                b: null,
              },
            };

            if (cfg.borderInfo == null) {
              cfg.borderInfo = [];
            }

            cfg.borderInfo.push(bd_obj);
          }

          // 数据验证 复制
          if (c_dataVerification[`${c_r1 + h - mth}_${c_c1 + c - mtc}`]) {
            if (dataVerification == null) {
              dataVerification = _.cloneDeep(
                ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!]
                  .dataVerification
              );
            }

            dataVerification[`${h}_${c}`] =
              c_dataVerification[`${c_r1 + h - mth}_${c_c1 + c - mtc}`];
          }

          if (isPlainObject(x[c]) && x[c].mc) {
            if (x[c].mc.rs) {
              delete cfg.merge[`${x[c].mc.r}_${x[c].mc.c}`];
            }
            delete x[c].mc;
          }

          let value: any = null;
          if (copyData[h - mth] != null && copyData[h - mth][c - mtc] != null) {
            value = copyData[h - mth][c - mtc];
          }

          if (value != null) {
            delete value.v;
            delete value.m;
            delete value.f;
            delete value.spl;

            if (value.ct && value.ct.t === "inlineStr") {
              delete value.ct;
            }
            if (isPlainObject(x[c])) {
              if (x[c].ct && x[c].ct.t === "inlineStr") {
                delete value.ct;
              } else {
                const format = [
                  "bg",
                  "fc",
                  "ct",
                  "ht",
                  "vt",
                  "bl",
                  "it",
                  "cl",
                  "un",
                  "fs",
                  "ff",
                  "tb",
                ];
                format.forEach((item) => {
                  Reflect.deleteProperty(x[c], item);
                });
              }
            } else {
              x[c] = { v: x[c] };
            }
            // 加一个判断x[c]是不是空，空就代表这个单元格没有值，那么就不需要修改，否则会出现空单元格也被赋值的情况出现
            if (!_.isEmpty(x[c])) {
              x[c] = _.assign(value, x[c]);
            }
            if (x[c].ct && x[c].ct.t === "inlineStr") {
              x[c].ct.s.forEach((item: any) => _.assign(value, item));
            }

            if (copyHasMC && x[c].mc) {
              if (x[c].mc.rs != null) {
                x[c].mc.r = h;
                if (x[c].mc.rs + h >= maxrowCache) {
                  x[c].mc.rs = maxrowCache - h;
                }

                x[c].mc.c = c;
                if (x[c].mc.cs + c >= maxcellCahe) {
                  x[c].mc.cs = maxcellCahe - c;
                }

                cfg.merge[`${x[c]!.mc!.r}_${x[c]!.mc!.c}`] = x[c].mc;

                offsetMC[`${value.mc!.r}_${value.mc!.c}`] = [
                  x[c]!.mc!.r,
                  x[c]!.mc!.c,
                ];
              } else {
                x[c] = {
                  mc: {
                    r: offsetMC[`${value.mc!.r}_${value.mc!.c}`][0],
                    c: offsetMC[`${value.mc!.r}_${value.mc!.c}`][1],
                  },
                };
              }
            }

            if (x[c].v != null) {
              if (value.ct != null && value.ct.fa != null) {
                // 修改被格式刷的值
                const mask = update(value.ct.fa, x[c].v);
                x[c].m = mask;
              }
            }
          }
        }
        flowdata[h] = x;
      }
    }
  }

  const currFile = ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!];
  currFile.config = cfg;
  currFile.dataVerification = dataVerification;

  // 复制范围 是否有 条件格式
  // let cdformat = null;
  // const copyIndex = getSheetIndex(ctx, copySheetIndex)
  // if (!copyIndex) return;
  // let ruleArr = _.cloneDeep(ctx.luckysheetfile[copyIndex]["luckysheet_conditionformat_save"]);

  // if (ruleArr != null && ruleArr.length > 0) {
  //   const currentIndex = getSheetIndex(ctx, ctx.currentSheetId)
  //   if (!currentIndex) return;
  //   cdformat = _.cloneDeep(ctx.luckysheetfile[currentIndex]["luckysheet_conditionformat_save"]);

  //   for (let i = 0; i < ruleArr.length; i++) {
  //     let cdformat_cellrange = ruleArr[i].cellrange;
  //     let emptyRange: any[] = [];

  // for (let j = 0; j < cdformat_cellrange.length; j++) {
  //   let range = conditionformat.CFSplitRange(
  //     cdformat_cellrange[j],
  //     { "row": [c_r1, c_r2], "column": [c_c1, c_c2] },
  //     { "row": [minh, maxh], "column": [minc, maxc] },
  //     "operatePart"
  //   );

  //   if (range.length > 0) {
  //     emptyRange = emptyRange.concat(range);
  //   }
  // }

  // if (emptyRange.length > 0) {
  //   ruleArr[i].cellrange = [{ "row": [minh, maxh], "column": [minc, maxc] }];
  //   cdformat.push(ruleArr[i]);
  // }
}
// }

// last["row"] = [minh, maxh];
// last["column"] = [minc, maxc];

// if (copyRowlChange) {
//   cfg = rowlenByRange(flowdata, minh, maxh, cfg);

//   let allParam = {
//     "cfg": cfg,
//     "RowlChange": true,
//     "cdformat": cdformat,
//     "dataVerification": dataVerification
//   }
//   jfrefreshgrid(flowdata, ctx.luckysheet_select_save, allParam);
// }
// else {
//   // 选区格式刷存在超出边界的情况
//   if (maxh >= flowdata.length) {
//     maxh = flowdata.length - 1;
//   }
//   cfg = rowlenByRange(flowdata, minh, maxh, cfg); //更新行高
//   let allParam = {
//     "cfg": cfg,
//     "RowlChange": true,
//     "cdformat": cdformat,
//     "dataVerification": dataVerification
//   }
//   jfrefreshgrid(flowdata, ctx.luckysheet_select_save, allParam);

//   selectHightlightShow();
// }
// }
export function selectionCopyShow(range: any, ctx: Context) {
  // $("#fortune-selection-copy").empty();

  if (range == null) {
    range = ctx.luckysheet_selection_range;
  }
  range = JSON.parse(JSON.stringify(range));

  // if (range.length > 0) {
  //     for (let s = 0; s < range.length; s++) {
  //         let r1 = range[s].row[0], r2 = range[s].row[1];
  //         let c1 = range[s].column[0], c2 = range[s].column[1];

  //         let row = ctx.visibledatarow[r2],
  //             row_pre = r1 - 1 == -1 ? 0 : ctx.visibledatarow[r1 - 1];
  //         let col = ctx.visibledatacolumn[c2],
  //             col_pre = c1 - 1 == -1 ? 0 : ctx.visibledatacolumn[c1 - 1];

  //         let copyDomHtml = '<div class="fortune-selection-copy" style="display: block; left: ' + col_pre + 'px; width: ' + (col - col_pre - 1) + 'px; top: ' + row_pre + 'px; height: ' + (row - row_pre - 1) + 'px;">' +
  //             '<div class="fortune-selection-copy-top fortune-copy"></div>' +
  //             '<div class="fortune-selection-copy-right fortune-copy"></div>' +
  //             '<div class="fortune-selection-copy-bottom fortune-copy"></div>' +
  //             '<div class="fortune-selection-copy-left fortune-copy"></div>' +
  //             '<div class="fortune-selection-copy-hc"></div>' +
  //             '</div>';
  //         $("#fortune-selection-copy").append(copyDomHtml);
  //     }
  // }
}
export function moveHighlightCell(
  ctx: Context,
  postion: "down" | "right",
  index: number,
  type: "rangeOfSelect" | "rangeOfFormula"
) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;
  const datarowlen = flowdata.length;
  const datacolumnlen = flowdata[0].length;

  let row;
  let row_pre;
  let row_index;
  let row_index_ed;
  let col;
  let col_pre;
  let col_index;
  let col_index_ed;

  if (type === "rangeOfSelect") {
    const last =
      ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
    if (!last) {
      console.error("moveHighlightCell: no selection found");
      return;
    }

    let curR;
    if (_.isNil(last.row_focus)) {
      [curR] = last.row;
    } else {
      curR = last.row_focus;
    }

    let curC;
    if (_.isNil(last.column_focus)) {
      [curC] = last.column;
    } else {
      curC = last.column_focus;
    }

    // focus单元格 是否是合并单元格
    const margeset = mergeBorder(ctx, flowdata, curR, curC);
    if (margeset) {
      const str_r = margeset.row[2];
      const end_r = margeset.row[3];

      const str_c = margeset.column[2];
      const end_c = margeset.column[3];

      if (index > 0) {
        if (postion === "down") {
          curR = end_r;
          curC = str_c;
        } else if (postion === "right") {
          curR = str_r;
          curC = end_c;
        }
      } else {
        curR = str_r;
        curC = str_c;
      }
    }

    if (_.isNil(curR) || _.isNil(curC)) {
      console.error("moveHighlightCell: curR or curC is nil");
      return;
    }

    let moveX = _.isNil(last.moveXY) ? curR : last.moveXY.x;
    let moveY = _.isNil(last.moveXY) ? curC : last.moveXY.y;

    if (postion === "down") {
      curR += index;
      moveX = curR;
    } else if (postion === "right") {
      curC += index;
      moveY = curC;
    }

    if (curR >= datarowlen) {
      curR = datarowlen - 1;
      moveX = curR;
    }

    if (curR < 0) {
      curR = 0;
      moveX = curR;
    }

    if (curC >= datacolumnlen) {
      curC = datacolumnlen - 1;
      moveY = curC;
    }

    if (curC < 0) {
      curC = 0;
      moveY = curC;
    }

    // 移动的下一个单元格是否是合并的单元格
    const margeset2 = mergeBorder(ctx, flowdata, curR, curC);
    if (margeset2) {
      [row_pre, row, row_index, row_index_ed] = margeset2.row;
      [col_pre, col, col_index, col_index_ed] = margeset2.column;
    } else {
      row = ctx.visibledatarow[moveX];
      row_pre = moveX - 1 === -1 ? 0 : ctx.visibledatarow[moveX - 1];
      // row_index = moveX;
      // row_index_ed = moveX;

      col = ctx.visibledatacolumn[moveY];
      col_pre = moveY - 1 === -1 ? 0 : ctx.visibledatacolumn[moveY - 1];
      // col_index = moveY;
      // col_index_ed = moveY;

      row_index = curR;
      row_index_ed = curR;
      col_index = curC;
      col_index_ed = curC;
    }

    if (
      _.isNil(row_index) ||
      _.isNil(row_index_ed) ||
      _.isNil(col_index) ||
      _.isNil(col_index_ed)
    ) {
      console.error(
        "moveHighlightCell: row_index or row_index_ed or col_index or col_index_ed is nil"
      );
      return;
    }

    last.row = [row_index, row_index_ed];
    last.column = [col_index, col_index_ed];
    last.row_focus = row_index;
    last.column_focus = col_index;
    last.moveXY = { x: moveX, y: moveY };

    normalizeSelection(ctx, ctx.luckysheet_select_save);
    // TODO pivotTable.pivotclick(row_index, col_index);
    // TODO formula.fucntionboxshow(row_index, col_index);
  } else if (type === "rangeOfFormula") {
    const last = ctx.formulaCache.func_selectedrange;
    if (!last) return;

    let curR;
    if (_.isNil(last.row_focus)) {
      [curR] = last.row;
    } else {
      curR = last.row_focus;
    }

    let curC;
    if (_.isNil(last.column_focus)) {
      [curC] = last.column;
    } else {
      curC = last.column_focus;
    }

    // focus单元格 是否是合并单元格
    const margeset = mergeBorder(ctx, flowdata, curR, curC);
    if (margeset) {
      const str_r = margeset.row[2];
      const end_r = margeset.row[3];

      const str_c = margeset.column[2];
      const end_c = margeset.column[3];

      if (index > 0) {
        if (postion === "down") {
          curR = end_r;
          curC = str_c;
        } else if (postion === "right") {
          curR = str_r;
          curC = end_c;
        }
      } else {
        curR = str_r;
        curC = str_c;
      }
    }

    if (_.isNil(curR) || _.isNil(curC)) {
      console.error("moveHighlightCell: curR or curC is nil");
      return;
    }

    let moveX = _.isNil(last.moveXY) ? curR : last.moveXY.x;
    let moveY = _.isNil(last.moveXY) ? curC : last.moveXY.y;

    if (postion === "down") {
      curR += index;
      moveX = curR;
    } else if (postion === "right") {
      curC += index;
      moveY = curC;
    }

    if (curR >= datarowlen) {
      curR = datarowlen - 1;
      moveX = curR;
    }

    if (curR < 0) {
      curR = 0;
      moveX = curR;
    }

    if (curC >= datacolumnlen) {
      curC = datacolumnlen - 1;
      moveY = curC;
    }

    if (curC < 0) {
      curC = 0;
      moveY = curC;
    }

    // 移动的下一个单元格是否是合并的单元格
    const margeset2 = mergeBorder(ctx, flowdata, curR, curC);
    if (margeset2) {
      [row_pre, row, row_index, row_index_ed] = margeset2.row;
      [col_pre, col, col_index, col_index_ed] = margeset2.column;
    } else {
      row = ctx.visibledatarow[moveX];
      row_pre = moveX - 1 === -1 ? 0 : ctx.visibledatarow[moveX - 1];
      row_index = moveX;
      row_index_ed = moveX;

      col = ctx.visibledatacolumn[moveY];
      col_pre = moveY - 1 === -1 ? 0 : ctx.visibledatacolumn[moveY - 1];
      col_index = moveY;
      col_index_ed = moveY;
    }

    if (
      _.isNil(col) ||
      _.isNil(col_pre) ||
      _.isNil(row) ||
      _.isNil(row_pre) ||
      _.isNil(row_index) ||
      _.isNil(row_index_ed) ||
      _.isNil(col_index) ||
      _.isNil(col_index_ed)
    ) {
      console.error(
        "moveHighlightCell: some values of func_selectedrange is nil"
      );
      return;
    }

    ctx.formulaCache.func_selectedrange = {
      left: col_pre,
      width: col - col_pre - 1,
      top: row_pre,
      height: row - row_pre - 1,
      left_move: col_pre,
      width_move: col - col_pre - 1,
      top_move: row_pre,
      height_move: row - row_pre - 1,
      row: [row_index, row_index_ed],
      column: [col_index, col_index_ed],
      row_focus: row_index,
      column_focus: col_index,
      moveXY: { x: moveX, y: moveY },
    };

    // $("#fortune-formula-functionrange-select")
    //   .css({
    //     left: col_pre,
    //     width: col - col_pre - 1,
    //     top: row_pre,
    //     height: row - row_pre - 1,
    //   })
    //   .show();

    // formula.rangeSetValue({
    //   row: [row_index, row_index_ed],
    //   column: [col_index, col_index_ed],
    // });
  }

  /*
  const scrollLeft = $("#luckysheet-cell-main").scrollLeft();
  const scrollTop = $("#luckysheet-cell-main").scrollTop();
  const winH = $("#luckysheet-cell-main").height();
  const winW = $("#luckysheet-cell-main").width();

  let sleft = 0;
  let stop = 0;
  if (col - scrollLeft - winW + 20 > 0) {
    sleft = col - winW + 20;
    if (isScroll) {
      $("#luckysheet-scrollbar-x").scrollLeft(sleft);
    }
  } else if (col_pre - scrollLeft - 20 < 0) {
    sleft = col_pre - 20;
    if (isScroll) {
      $("#luckysheet-scrollbar-x").scrollLeft(sleft);
    }
  }

  if (row - scrollTop - winH + 20 > 0) {
    stop = row - winH + 20;
    if (isScroll) {
      $("#luckysheet-scrollbar-y").scrollTop(stop);
    }
  } else if (row_pre - scrollTop - 20 < 0) {
    stop = row_pre - 20;
    if (isScroll) {
      $("#luckysheet-scrollbar-y").scrollTop(stop);
    }
  }

  clearTimeout(ctx.countfuncTimeout);
  countfunc();
  */

  // 移动单元格通知后台
  // server.saveParam("mv", ctx.currentSheetId, ctx.luckysheet_select_save);
}

function getHtmlBorderStyle(type: string, color: string) {
  let style = "";
  const borderType: any = {
    "0": "none",
    "1": "Thin",
    "2": "Hair",
    "3": "Dotted",
    "4": "Dashed",
    "5": "DashDot",
    "6": "DashDotDot",
    "7": "Double",
    "8": "Medium",
    "9": "MediumDashed",
    "10": "MediumDashDot",
    "11": "MediumDashDotDot",
    "12": "SlantedDashDot",
    "13": "Thick",
  };
  type = borderType[type.toString()];

  if (type.indexOf("Medium") > -1) {
    style += "1pt ";
  } else if (type === "Thick") {
    style += "1.5pt ";
  } else {
    style += "0.5pt ";
  }

  if (type === "Hair") {
    style += "double ";
  } else if (type.indexOf("DashDotDot") > -1) {
    style += "dotted ";
  } else if (type.indexOf("DashDot") > -1) {
    style += "dashed ";
  } else if (type.indexOf("Dotted") > -1) {
    style += "dotted ";
  } else if (type.indexOf("Dashed") > -1) {
    style += "dashed ";
  } else {
    style += "solid ";
  }

  return `${style + color};`;
}

export function rangeValueToHtml(
  ctx: Context,
  sheetId: string,
  ranges?: Range
) {
  const idx = getSheetIndex(ctx, sheetId);
  if (idx == null) return "";
  const sheet = ctx.luckysheetfile[idx];

  const rowIndexArr: number[] = [];
  const colIndexArr: number[] = [];

  for (let s = 0; s < (ranges?.length ?? 0); s += 1) {
    const range = ranges![s];

    const r1 = range.row[0];
    const r2 = range.row[1];
    const c1 = range.column[0];
    const c2 = range.column[1];

    for (let copyR = r1; copyR <= r2; copyR += 1) {
      if (
        !_.isNil(sheet.config?.rowhidden) &&
        !_.isNil(sheet.config?.rowhidden[copyR])
      ) {
        continue;
      }

      if (!rowIndexArr.includes(copyR)) {
        rowIndexArr.push(copyR);
      }

      for (let copyC = c1; copyC <= c2; copyC += 1) {
        if (
          !_.isNil(sheet.config?.colhidden) &&
          !_.isNil(sheet.config?.colhidden[copyC])
        ) {
          continue;
        }

        if (!colIndexArr.includes(copyC)) {
          colIndexArr.push(copyC);
        }
      }
    }
  }

  let borderInfoCompute;
  if (sheet.config?.borderInfo && sheet.config.borderInfo.length > 0) {
    // 边框
    borderInfoCompute = getBorderInfoCompute(ctx, sheetId);
  }

  let cpdata = "";
  const d = sheet.data;
  if (!d) return null;

  let colgroup = "";

  // rowIndexArr = rowIndexArr.sort();
  // colIndexArr = colIndexArr.sort();

  for (let i = 0; i < rowIndexArr.length; i += 1) {
    const r = rowIndexArr[i];

    if (
      !_.isNil(sheet.config?.rowhidden) &&
      !_.isNil(sheet.config?.rowhidden[r])
    ) {
      continue;
    }

    cpdata += "<tr>";

    for (let j = 0; j < colIndexArr.length; j += 1) {
      const c = colIndexArr[j];

      if (
        !_.isNil(sheet.config?.colhidden) &&
        !_.isNil(sheet.config?.colhidden[c])
      ) {
        continue;
      }

      // eslint-disable-next-line no-template-curly-in-string
      let column = '<td ${span} style="${style}">';

      const cell = d[r]?.[c];
      if (cell != null) {
        let style = "";
        let span = "";

        if (r === rowIndexArr[0]) {
          if (
            _.isNil(sheet.config) ||
            _.isNil(sheet.config.columnlen) ||
            _.isNil(sheet.config.columnlen[c.toString()])
          ) {
            colgroup += '<colgroup width="72px"></colgroup>';
          } else {
            colgroup += `<colgroup width="${
              sheet.config.columnlen[c.toString()]
            }px"></colgroup>`;
          }
        }

        if (c === colIndexArr[0]) {
          if (
            _.isNil(sheet.config) ||
            _.isNil(sheet.config.rowlen) ||
            _.isNil(sheet.config.rowlen[r.toString()])
          ) {
            style += "height:19px;";
          } else {
            style += `height:${sheet.config.rowlen[r.toString()]}px;`;
          }
        }

        const reg = /^(w|W)((0?)|(0\.0+))$/;
        let c_value;
        if (
          !_.isNil(cell.ct) &&
          !_.isNil(cell.ct.fa) &&
          cell.ct.fa.match(reg)
        ) {
          c_value = getCellValue(r, c, d);
        } else {
          c_value = getCellValue(r, c, d, "m");
        }

        const styleObj = getStyleByCell(d, r, c);
        style += _.map(styleObj, (v, key) => {
          return `${_.kebabCase(key)}:${_.isNumber(v) ? `${v}px` : v};`;
        }).join("");

        if (cell.mc) {
          if ("rs" in cell.mc) {
            span = `rowspan="${cell.mc.rs}" colspan="${cell.mc.cs}"`;

            // 边框
            if (borderInfoCompute && borderInfoCompute[`${r}_${c}`]) {
              const bl_obj: any = { color: {}, style: {} };
              const br_obj: any = { color: {}, style: {} };
              const bt_obj: any = { color: {}, style: {} };
              const bb_obj: any = { color: {}, style: {} };

              for (let bd_r = r; bd_r < r + cell.mc.rs!; bd_r += 1) {
                for (let bd_c = c; bd_c < c + cell.mc.cs!; bd_c += 1) {
                  if (
                    bd_r === r &&
                    borderInfoCompute[`${bd_r}_${bd_c}`] &&
                    borderInfoCompute[`${bd_r}_${bd_c}`].t
                  ) {
                    const linetype =
                      borderInfoCompute[`${bd_r}_${bd_c}`].t.style;
                    const bcolor = borderInfoCompute[`${bd_r}_${bd_c}`].t.color;

                    if (_.isNil(bt_obj.style[linetype])) {
                      bt_obj.style[linetype] = 1;
                    } else {
                      bt_obj.style[linetype] += 1;
                    }

                    if (_.isNil(bt_obj.color[bcolor])) {
                      bt_obj.color[bcolor] = 1;
                    } else {
                      bt_obj.color[bcolor] += 1;
                    }
                  }

                  if (
                    bd_r === r + cell.mc.rs! - 1 &&
                    borderInfoCompute[`${bd_r}_${bd_c}`] &&
                    borderInfoCompute[`${bd_r}_${bd_c}`].b
                  ) {
                    const linetype =
                      borderInfoCompute[`${bd_r}_${bd_c}`].b.style;
                    const bcolor = borderInfoCompute[`${bd_r}_${bd_c}`].b.color;

                    if (_.isNil(bb_obj.style[linetype])) {
                      bb_obj.style[linetype] = 1;
                    } else {
                      bb_obj.style[linetype] += 1;
                    }

                    if (_.isNil(bb_obj.color[bcolor])) {
                      bb_obj.color[bcolor] = 1;
                    } else {
                      bb_obj.color[bcolor] += 1;
                    }
                  }

                  if (
                    bd_c === c &&
                    borderInfoCompute[`${bd_r}_${bd_c}`] &&
                    borderInfoCompute[`${bd_r}_${bd_c}`].l
                  ) {
                    const linetype = borderInfoCompute[`${r}_${c}`].l.style;
                    const bcolor = borderInfoCompute[`${bd_r}_${bd_c}`].l.color;

                    if (_.isNil(bl_obj.style[linetype])) {
                      bl_obj.style[linetype] = 1;
                    } else {
                      bl_obj.style[linetype] += 1;
                    }

                    if (_.isNil(bl_obj.color[bcolor])) {
                      bl_obj.color[bcolor] = 1;
                    } else {
                      bl_obj.color[bcolor] += 1;
                    }
                  }

                  if (
                    bd_c === c + cell.mc.cs! - 1 &&
                    borderInfoCompute[`${bd_r}_${bd_c}`] &&
                    borderInfoCompute[`${bd_r}_${bd_c}`].r
                  ) {
                    const linetype =
                      borderInfoCompute[`${bd_r}_${bd_c}`].r.style;
                    const bcolor = borderInfoCompute[`${bd_r}_${bd_c}`].r.color;

                    if (_.isNil(br_obj.style[linetype])) {
                      br_obj.style[linetype] = 1;
                    } else {
                      br_obj.style[linetype] += 1;
                    }

                    if (_.isNil(br_obj.color[bcolor])) {
                      br_obj.color[bcolor] = 1;
                    } else {
                      br_obj.color[bcolor] += 1;
                    }
                  }
                }
              }

              const rowlen = cell.mc.rs!;
              const collen = cell.mc.cs!;

              if (JSON.stringify(bl_obj).length > 23) {
                let bl_color = null;
                let bl_style = null;

                Object.keys(bl_obj.color).forEach((x) => {
                  if (bl_obj.color[x] >= rowlen / 2) {
                    bl_color = x;
                  }
                });

                Object.keys(bl_obj.style).forEach((x) => {
                  if (bl_obj.style[x] >= rowlen / 2) {
                    bl_style = x;
                  }
                });

                if (!_.isNil(bl_color) && !_.isNil(bl_style)) {
                  style += `border-left:${getHtmlBorderStyle(
                    bl_style,
                    bl_color
                  )}`;
                }
              }

              if (JSON.stringify(br_obj).length > 23) {
                let br_color = null;
                let br_style = null;

                Object.keys(br_obj.color).forEach((x) => {
                  if (br_obj.color[x] >= rowlen / 2) {
                    br_color = x;
                  }
                });

                Object.keys(br_obj.style).forEach((x) => {
                  if (br_obj.style[x] >= rowlen / 2) {
                    br_style = x;
                  }
                });

                if (!_.isNil(br_color) && !_.isNil(br_style)) {
                  style += `border-right:${getHtmlBorderStyle(
                    br_style,
                    br_color
                  )}`;
                }
              }

              if (JSON.stringify(bt_obj).length > 23) {
                let bt_color = null;
                let bt_style = null;

                Object.keys(bt_obj.color).forEach((x) => {
                  if (bt_obj.color[x] >= collen / 2) {
                    bt_color = x;
                  }
                });

                Object.keys(bt_obj.style).forEach((x) => {
                  if (bt_obj.style[x] >= collen / 2) {
                    bt_style = x;
                  }
                });

                if (!_.isNil(bt_color) && !_.isNil(bt_style)) {
                  style += `border-top:${getHtmlBorderStyle(
                    bt_style,
                    bt_color
                  )}`;
                }
              }

              if (JSON.stringify(bb_obj).length > 23) {
                let bb_color = null;
                let bb_style = null;

                Object.keys(bb_obj.color).forEach((x) => {
                  if (bb_obj.color[x] >= collen / 2) {
                    bb_color = x;
                  }
                });

                Object.keys(bb_obj.style).forEach((x) => {
                  if (bb_obj.style[x] >= collen / 2) {
                    bb_style = x;
                  }
                });

                if (!_.isNil(bb_color) && !_.isNil(bb_style)) {
                  style += `border-bottom:${getHtmlBorderStyle(
                    bb_style,
                    bb_color
                  )}`;
                }
              }
            }
          } else {
            continue;
          }
        } else {
          // 边框
          if (borderInfoCompute && borderInfoCompute[`${r}_${c}`]) {
            // 左边框
            if (borderInfoCompute[`${r}_${c}`].l) {
              const linetype = borderInfoCompute[`${r}_${c}`].l.style;
              const bcolor = borderInfoCompute[`${r}_${c}`].l.color;
              style += `border-left:${getHtmlBorderStyle(linetype, bcolor)}`;
            }

            // 右边框
            if (borderInfoCompute[`${r}_${c}`].r) {
              const linetype = borderInfoCompute[`${r}_${c}`].r.style;
              const bcolor = borderInfoCompute[`${r}_${c}`].r.color;
              style += `border-right:${getHtmlBorderStyle(linetype, bcolor)}`;
            }

            // 下边框
            if (borderInfoCompute[`${r}_${c}`].b) {
              const linetype = borderInfoCompute[`${r}_${c}`].b.style;
              const bcolor = borderInfoCompute[`${r}_${c}`].b.color;
              style += `border-bottom:${getHtmlBorderStyle(linetype, bcolor)}`;
            }

            // 上边框
            if (borderInfoCompute[`${r}_${c}`].t) {
              const linetype = borderInfoCompute[`${r}_${c}`].t.style;
              const bcolor = borderInfoCompute[`${r}_${c}`].t.color;
              style += `border-top:${getHtmlBorderStyle(linetype, bcolor)}`;
            }
          }
        }

        column = replaceHtml(column, { style, span });

        if (_.isNil(c_value)) {
          c_value = getCellValue(r, c, d);
        }
        // if (
        //   _.isNil(c_value) &&
        //   d[r][c] &&
        //   d[r][c].ct &&
        //   d[r][c].ct.t === "inlineStr"
        // ) {
        //   c_value = d[r][c].ct.s
        //     .map((val) => {
        //       const font = $("<font></font>");
        //       val.fs && font.css("font-size", val.fs);
        //       val.bl && font.css("font-weight", val.border);
        //       val.it && font.css("font-style", val.italic);
        //       val.cl === 1 && font.css("text-decoration", "underline");
        //       font.text(val.v);
        //       return font[0].outerHTML;
        //     })
        //     .join("");
        // }

        if (_.isNil(c_value)) {
          c_value = "";
        }

        column += c_value;
      } else {
        let style = "";

        // 边框
        if (borderInfoCompute && borderInfoCompute[`${r}_${c}`]) {
          // 左边框
          if (borderInfoCompute[`${r}_${c}`].l) {
            const linetype = borderInfoCompute[`${r}_${c}`].l.style;
            const bcolor = borderInfoCompute[`${r}_${c}`].l.color;
            style += `border-left:${getHtmlBorderStyle(linetype, bcolor)}`;
          }

          // 右边框
          if (borderInfoCompute[`${r}_${c}`].r) {
            const linetype = borderInfoCompute[`${r}_${c}`].r.style;
            const bcolor = borderInfoCompute[`${r}_${c}`].r.color;
            style += `border-right:${getHtmlBorderStyle(linetype, bcolor)}`;
          }

          // 下边框
          if (borderInfoCompute[`${r}_${c}`].b) {
            const linetype = borderInfoCompute[`${r}_${c}`].b.style;
            const bcolor = borderInfoCompute[`${r}_${c}`].b.color;
            style += `border-bottom:${getHtmlBorderStyle(linetype, bcolor)}`;
          }

          // 上边框
          if (borderInfoCompute[`${r}_${c}`].t) {
            const linetype = borderInfoCompute[`${r}_${c}`].t.style;
            const bcolor = borderInfoCompute[`${r}_${c}`].t.color;
            style += `border-top:${getHtmlBorderStyle(linetype, bcolor)}`;
          }
        }

        column += "";

        if (r === rowIndexArr[0]) {
          if (
            _.isNil(sheet.config) ||
            _.isNil(sheet.config.columnlen) ||
            _.isNil(sheet.config.columnlen[c.toString()])
          ) {
            colgroup += '<colgroup width="72px"></colgroup>';
          } else {
            colgroup += `<colgroup width="${
              sheet.config.columnlen[c.toString()]
            }px"></colgroup>`;
          }
        }

        if (c === colIndexArr[0]) {
          if (
            _.isNil(sheet.config) ||
            _.isNil(sheet.config.rowlen) ||
            _.isNil(sheet.config.rowlen[r.toString()])
          ) {
            style += "height:19px;";
          } else {
            style += `height:${sheet.config.rowlen[r.toString()]}px;`;
          }
        }

        column = replaceHtml(column, { style, span: "" });
        column += "";
      }

      column += "</td>";
      cpdata += column;
    }

    cpdata += "</tr>";
  }

  return `<table data-type="fortune-copy-action-table">${colgroup}${cpdata}</table>`;
}

export function copy(ctx: Context) {
  const flowdata = getFlowdata(ctx);

  ctx.luckysheet_selection_range = [];
  // copy范围
  const copyRange = [];
  let RowlChange = false;
  let HasMC = false;

  for (let s = 0; s < (ctx.luckysheet_select_save?.length ?? 0); s += 1) {
    const range = ctx.luckysheet_select_save![s];

    const r1 = range.row[0];
    const r2 = range.row[1];
    const c1 = range.column[0];
    const c2 = range.column[1];

    for (let copyR = r1; copyR <= r2; copyR += 1) {
      if (
        !_.isNil(ctx.config.rowhidden) &&
        !_.isNil(ctx.config.rowhidden[copyR])
      ) {
        continue;
      }

      if (!_.isNil(ctx.config.rowlen) && copyR in ctx.config.rowlen) {
        RowlChange = true;
      }

      for (let copyC = c1; copyC <= c2; copyC += 1) {
        if (
          !_.isNil(ctx.config.colhidden) &&
          !_.isNil(ctx.config.colhidden[copyC])
        ) {
          continue;
        }

        const cell = flowdata?.[copyR]?.[copyC];

        if (!_.isNil(cell?.mc?.rs)) {
          HasMC = true;
        }
      }
    }

    ctx.luckysheet_selection_range.push({
      row: range.row,
      column: range.column,
    });
    copyRange.push({ row: range.row, column: range.column });
  }

  // selectionCopyShow();

  // luckysheet内copy保存
  ctx.luckysheet_copy_save = {
    dataSheetId: ctx.currentSheetId,
    copyRange,
    RowlChange,
    HasMC,
  };

  const cpdata = rangeValueToHtml(
    ctx,
    ctx.currentSheetId,
    ctx.luckysheet_select_save
  );

  if (cpdata) {
    ctx.iscopyself = true;
    clipboard.writeHtml(cpdata);
  }
}

export function deleteSelectedCellText(ctx: Context) {
  // if (
  //   !checkProtectionLockedRangeList(
  //     ctx.luckysheet_select_save,
  //     ctx.currentSheetId
  //   )
  // ) {
  //   return;
  // }

  // $("#luckysheet-rightclick-menu").hide();
  // luckysheetContainerFocus();

  if (ctx.allowEdit === false) {
    return;
  }

  const selection = ctx.luckysheet_select_save;
  if (selection && !_.isEmpty(selection)) {
    const d = getFlowdata(ctx);
    if (!d) return;

    let has_PartMC = false;

    for (let s = 0; s < selection.length; s += 1) {
      const r1 = selection[s].row[0];
      const r2 = selection[s].row[1];
      const c1 = selection[s].column[0];
      const c2 = selection[s].column[1];

      if (hasPartMC(ctx, ctx.config, r1, r2, c1, c2)) {
        has_PartMC = true;
        break;
      }
    }

    if (has_PartMC) {
      // const locale_drag = locale().drag;

      // if (isEditMode()) {
      //   alert(locale_drag.noPartMerge);
      // } else {
      //   tooltip.info(locale_drag.noPartMerge, "");
      // }

      return;
    }
    const hyperlinkMap =
      ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!].hyperlink;

    for (let s = 0; s < selection.length; s += 1) {
      const r1 = selection[s].row[0];
      const r2 = selection[s].row[1];
      const c1 = selection[s].column[0];
      const c2 = selection[s].column[1];

      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
          // if (pivotTable.isPivotRange(r, c)) {
          //   continue;
          // }

          if (_.isPlainObject(d[r][c])) {
            const cell = d[r][c]!;
            delete cell.m;
            delete cell.v;

            if (cell.f != null) {
              delete cell.f;
              delFunctionGroup(ctx, r, c, ctx.currentSheetId);

              delete cell.spl;
            }

            if (cell.ct != null && cell.ct.t === "inlineStr") {
              delete cell.ct;
            }
          } else {
            d[r][c] = null;
          }
          // 同步清除 hyperlink
          if (hyperlinkMap && hyperlinkMap[`${r}_${c}`]) {
            delete hyperlinkMap[`${r}_${c}`];
          }
        }
      }
    }

    // jfrefreshgrid(d, ctx.luckysheet_select_save);

    // // 清空编辑框的内容
    // // 备注：在functionInputHanddler方法中会把该标签的内容拷贝到 #luckysheet-functionbox-cell
    // $("#luckysheet-rich-text-editor").html("");
  }
}

// 选区是否重叠
export function selectIsOverlap(ctx: Context, range?: any) {
  if (range == null) {
    range = ctx.luckysheet_select_save;
  }
  range = _.cloneDeep(range);

  let overlap = false;
  const map: any = {};

  for (let s = 0; s < range.length; s += 1) {
    const str_r = range[s].row[0];
    const end_r = range[s].row[1];
    const str_c = range[s].column[0];
    const end_c = range[s].column[1];

    for (let r = str_r; r <= end_r; r += 1) {
      for (let c = str_c; c <= end_c; c += 1) {
        if (`${r}_${c}` in map) {
          overlap = true;
          break;
        } else {
          map[`${r}_${c}`] = 0;
        }
      }
    }
  }

  return overlap;
}

export function selectAll(ctx: Context) {
  // 全选表格
  // if (!checkProtectionAllSelected(ctx.currentSheetId)) {
  //   return;
  // }

  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;

  // $("#luckysheet-wa-functionbox-confirm").click();
  ctx.luckysheet_select_status = false;

  ctx.luckysheet_select_save = [
    {
      row: [0, flowdata.length - 1],
      column: [0, flowdata[0].length - 1],
      row_focus: 0,
      column_focus: 0,
      row_select: true,
      column_select: true,
    },
  ];

  normalizeSelection(ctx, ctx.luckysheet_select_save);
}

export function getSelectionStyle(
  ctx: Context,
  selection: Selection,
  freeze: Freezen | undefined
): {
  left: number | undefined;
  top: number | undefined;
  width: number | undefined;
  height: number | undefined;
  display: string;
} {
  const ret = {
    left: selection.left_move,
    top: selection.top_move,
    width: selection.width_move,
    height: selection.height_move,
    display: "block",
  };
  if (!freeze) return ret;

  const { scrollTop } = ctx;
  const { scrollLeft } = ctx;

  const freezenverticaldata = freeze?.vertical?.freezenverticaldata;
  const freezenhorizontaldata = freeze?.horizontal?.freezenhorizontaldata;

  const obj = selection;

  let rangeshow = true;

  if (freezenhorizontaldata != null) {
    const freezenTop = freezenhorizontaldata[0];
    const freezen_rowindex = freezenhorizontaldata[1];
    const offTop = scrollTop - freezenhorizontaldata[2];

    const r1 = obj.row[0];
    const r2 = obj.row[1];

    const row = ctx.visibledatarow[r2];
    const row_pre = r1 - 1 === -1 ? 0 : ctx.visibledatarow[r1 - 1];

    const top_move = row_pre;
    const height_move = row - row_pre - 1;

    if (r1 >= freezen_rowindex) {
      // 原选区在冻结区外
      if (top_move + height_move < freezenTop + offTop) {
        rangeshow = false;
      } else if (top_move < freezenTop + offTop) {
        ret.top = freezenTop + offTop;
        ret.height = height_move - (freezenTop + offTop - top_move);
      } else {
      }
    } else if (r2 >= freezen_rowindex) {
      // 原选区有一部分在冻结区内
      if (top_move + height_move < freezenTop + offTop) {
        ret.top = top_move + offTop;
        ret.height = freezenTop - top_move;
      } else {
        ret.top = top_move + offTop;
        ret.height = height_move - offTop;
      }
    } else {
      // 原选区在冻结区内
      ret.top = top_move + offTop;
    }
  }

  if (freezenverticaldata != null) {
    const freezenLeft = freezenverticaldata[0];
    const freezen_colindex = freezenverticaldata[1];
    const offLeft = scrollLeft - freezenverticaldata[2];

    const c1 = obj.column[0];
    const c2 = obj.column[1];

    const col = ctx.visibledatacolumn[c2];
    const col_pre = c1 - 1 === -1 ? 0 : ctx.visibledatacolumn[c1 - 1];

    const left_move = col_pre;
    const width_move = col - col_pre - 1;

    if (c1 >= freezen_colindex) {
      // 原选区在冻结区外
      if (left_move + width_move < freezenLeft + offLeft) {
        rangeshow = false;
      } else if (left_move < freezenLeft + offLeft) {
        ret.left = freezenLeft + offLeft;
        ret.width = width_move - (freezenLeft + offLeft - left_move);
      } else {
      }
    } else if (c2 >= freezen_colindex) {
      // 原选区有一部分在冻结区内
      if (left_move + width_move < freezenLeft + offLeft) {
        ret.left = left_move + offLeft;
        ret.width = freezenLeft - left_move;
      } else {
        ret.left = left_move + offLeft;
        ret.width = width_move - offLeft;
      }
    } else {
      // 原选区在冻结区内
      ret.left = left_move + offLeft;
    }
  }
  if (!rangeshow) {
    ret.display = "none";
  }
  return ret;
}
