import _ from "lodash";
import { Context, getFlowdata } from "../context";
import { locale } from "../locale";
import {
  delFunctionGroup,
  execfunction,
  execFunctionGroup,
  functionCopy,
} from "../modules/formula";
import { getdatabyselection, getQKBorder } from "../modules/cell";
import { genarate, update } from "../modules/format";
import { normalizeSelection, selectionCache } from "../modules/selection";
import { Cell, CellMatrix } from "../types";
import { getSheetIndex, isAllowEdit } from "../utils";
import { hasPartMC, isRealNum } from "../modules/validation";
import { getBorderInfoCompute } from "../modules/border";
import { expandRowsAndColumns, storeSheetParamALL } from "../modules/sheet";
import { jfrefreshgrid } from "../modules/refresh";
import { setRowHeight } from "../api";
import { CFSplitRange } from "../modules";

function postPasteCut(
  ctx: Context,
  source: any,
  target: any,
  RowlChange: boolean
) {
  // 单元格数据更新联动
  const execF_rc: any = {};
  ctx.formulaCache.execFunctionExist = [];
  // clearTimeout(refreshCanvasTimeOut);
  for (let r = source.range.row[0]; r <= source.range.row[1]; r += 1) {
    for (let c = source.range.column[0]; c <= source.range.column[1]; c += 1) {
      if (`${r}_${c}_${source.sheetId}` in execF_rc) {
        continue;
      }

      execF_rc[`${r}_${c}_${source.sheetId}`] = 0;
      ctx.formulaCache.execFunctionExist.push({ r, c, i: source.sheetId });
    }
  }

  for (let r = target.range.row[0]; r <= target.range.row[1]; r += 1) {
    for (let c = target.range.column[0]; c <= target.range.column[1]; c += 1) {
      if (`${r}_${c}_${target.sheetId}` in execF_rc) {
        continue;
      }

      execF_rc[`${r}_${c}_${target.sheetId}`] = 0;
      ctx.formulaCache.execFunctionExist.push({ r, c, i: target.sheetId });
    }
  }

  // config
  let rowHeight;
  if (ctx.currentSheetId === source.sheetId) {
    ctx.config = source.curConfig;
    rowHeight = source.curData.length;
    ctx.luckysheetfile[getSheetIndex(ctx, target.sheetId)!].config =
      target.curConfig;
  } else if (ctx.currentSheetId === target.sheetId) {
    ctx.config = target.curConfig;
    rowHeight = target.curData.length;
    ctx.luckysheetfile[getSheetIndex(ctx, source.sheetId)!].config =
      source.curConfig;
  }

  if (RowlChange) {
    ctx.visibledatarow = [];
    ctx.rh_height = 0;

    for (let i = 0; i < rowHeight; i += 1) {
      let rowlen = ctx.defaultrowlen;

      if (ctx.config.rowlen != null && ctx.config.rowlen[i] != null) {
        rowlen = ctx.config.rowlen[i];
      }

      if (ctx.config.rowhidden != null && ctx.config.rowhidden[i] != null) {
        rowlen = ctx.config.rowhidden[i];
        ctx.visibledatarow.push(ctx.rh_height);
        continue;
      } else {
        ctx.rh_height += rowlen + 1;
      }

      ctx.visibledatarow.push(ctx.rh_height); // 行的临时长度分布
    }
    ctx.rh_height += 80;
    // sheetmanage.showSheet();

    if (ctx.currentSheetId === source.sheetId) {
      // const rowlenArr = computeRowlenArr(
      //   ctx,
      //   target.curData.length,
      //   target.curConfig
      // );
      // ctx.luckysheetfile[
      //   getSheetIndex(ctx, target.sheetId)!
      // ].visibledatarow = rowlenArr;
    } else if (ctx.currentSheetId === target.sheetId) {
      // const rowlenArr = computeRowlenArr(
      //   ctx,
      //   source.curData.length,
      //   source.curConfig
      // );
      // ctx.luckysheetfile[getSheetIndex(ctx, source.sheetId)].visibledatarow =
      //   rowlenArr;
    }
  }

  // ctx.flowdata
  if (ctx.currentSheetId === source.sheetId) {
    // ctx.flowdata = source.curData;
    ctx.luckysheetfile[getSheetIndex(ctx, target.sheetId)!].data =
      target.curData;
  } else if (ctx.currentSheetId === target.sheetId) {
    // ctx.flowdata = target.curData;
    ctx.luckysheetfile[getSheetIndex(ctx, source.sheetId)!].data =
      source.curData;
  }
  // editor.webWorkerFlowDataCache(ctx.flowdata); // worker存数据
  // ctx.luckysheetfile[getSheetIndex(ctx.currentSheetId)].data = ctx.flowdata;

  // luckysheet_select_save
  if (ctx.currentSheetId === target.sheetId) {
    ctx.luckysheet_select_save = [
      { row: target.range.row, column: target.range.column },
    ];
  } else {
    ctx.luckysheet_select_save = [
      { row: source.range.row, column: source.range.column },
    ];
  }
  if (ctx.luckysheet_select_save.length > 0) {
    // 有选区时，刷新一下选区
    // selectHightlightShow();
  }
  // 条件格式
  ctx.luckysheetfile[
    getSheetIndex(ctx, source.sheetId)!
  ].luckysheet_conditionformat_save = source.curCdformat;
  ctx.luckysheetfile[
    getSheetIndex(ctx, target.sheetId)!
  ].luckysheet_conditionformat_save = target.curCdformat;

  // 数据验证
  // if (ctx.currentSheetId === source.sheetId) {
  //   dataVerificationCtrl.dataVerification = source.curDataVerification;
  // } else if (ctx.currentSheetId === target.sheetId) {
  //   dataVerificationCtrl.dataVerification = target.curDataVerification;
  // }
  ctx.luckysheetfile[getSheetIndex(ctx, source.sheetId)!].dataVerification =
    source.curDataVerification;
  ctx.luckysheetfile[getSheetIndex(ctx, target.sheetId)!].dataVerification =
    target.curDataVerification;

  ctx.formulaCache.execFunctionExist.reverse();
  // @ts-ignore
  execFunctionGroup(ctx, null, null, null, null, target.curData);
  ctx.formulaCache.execFunctionGlobalData = null;

  // const index = getSheetIndex(ctx, ctx.currentSheetId);
  // const file = ctx.luckysheetfile[index];
  // file.scrollTop = $("#luckysheet-cell-main").scrollTop();
  // file.scrollLeft = $("#luckysheet-cell-main").scrollLeft();

  // showSheet();

  // refreshCanvasTimeOut = setTimeout(function () {
  //   luckysheetrefreshgrid();
  // }, 1);

  storeSheetParamALL(ctx);

  // saveparam
  // //来源表
  // server.saveParam("all", source["sheetId"], source["curConfig"], {
  //   k: "config",
  // });
  // //目的表
  // server.saveParam("all", target["sheetId"], target["curConfig"], {
  //   k: "config",
  // });

  // //来源表
  // server.historyParam(source["curData"], source["sheetId"], {
  //   row: source["range"]["row"],
  //   column: source["range"]["column"],
  // });
  // //目的表
  // server.historyParam(target["curData"], target["sheetId"], {
  //   row: target["range"]["row"],
  //   column: target["range"]["column"],
  // });

  // //来源表
  // server.saveParam("all", source["sheetId"], source["curCdformat"], {
  //   k: "luckysheet_conditionformat_save",
  // });
  // //目的表
  // server.saveParam("all", target["sheetId"], target["curCdformat"], {
  //   k: "luckysheet_conditionformat_save",
  // });

  // //来源表
  // server.saveParam("all", source["sheetId"], source["curDataVerification"], {
  //   k: "dataVerification",
  // });
  // //目的表
  // server.saveParam("all", target["sheetId"], target["curDataVerification"], {
  //   k: "dataVerification",
  // });
}

function pasteHandler(ctx: Context, data: any, borderInfo?: any) {
  // if (
  //   !checkProtectionLockedRangeList(
  //     ctx.luckysheet_select_save,
  //     ctx.currentSheetId
  //   )
  // ) {
  //   return;
  // }
  const allowEdit = isAllowEdit(ctx);
  if (!allowEdit) return;

  if ((ctx.luckysheet_select_save?.length ?? 0) !== 1) {
    // if (isEditMode()) {
    //   alert("不能对多重选择区域执行此操作，请选择单个区域，然后再试");
    // } else {
    //   tooltip.info(
    //     '<i class="fa fa-exclamation-triangle"></i>提示',
    //     "不能对多重选择区域执行此操作，请选择单个区域，然后再试"
    //   );
    // }
    return;
  }

  if (typeof data === "object") {
    if (data.length === 0) {
      return;
    }

    const cfg = ctx.config || {};
    if (cfg.merge == null) {
      cfg.merge = {};
    }

    if (JSON.stringify(borderInfo).length > 2 && cfg.borderInfo == null) {
      cfg.borderInfo = [];
    }

    const copyh = data.length;
    const copyc = data[0].length;

    const minh = ctx.luckysheet_select_save![0].row[0]; // 应用范围首尾行
    const maxh = minh + copyh - 1;
    const minc = ctx.luckysheet_select_save![0].column[0]; // 应用范围首尾列
    const maxc = minc + copyc - 1;

    // 应用范围包含部分合并单元格，则return提示
    let has_PartMC = false;
    if (cfg.merge != null) {
      has_PartMC = hasPartMC(ctx, cfg, minh, maxh, minc, maxc);
    }

    if (has_PartMC) {
      // if (isEditMode()) {
      //   alert("不能对合并单元格做部分更改");
      // } else {
      //   tooltip.info(
      //     '<i class="fa fa-exclamation-triangle"></i>提示',
      //     "不能对合并单元格做部分更改"
      //   );
      // }
      return;
    }

    const d = getFlowdata(ctx); // 取数据
    if (!d) return;

    const rowMaxLength = d.length;
    const cellMaxLength = d[0].length;

    // 若应用范围超过最大行或最大列，增加行列
    const addr = maxh - rowMaxLength + 1;
    const addc = maxc - cellMaxLength + 1;
    if (addr > 0 || addc > 0) {
      expandRowsAndColumns(d, addr, addc);
    }
    if (!d) return;

    if (cfg.rowlen == null) {
      cfg.rowlen = {};
    }

    const RowlChange = false;
    const offsetMC: any = {};
    for (let h = minh; h <= maxh; h += 1) {
      const x = d[h];

      let currentRowLen = ctx.defaultrowlen;
      if (cfg.rowlen[h] != null) {
        currentRowLen = cfg.rowlen[h];
      }

      for (let c = minc; c <= maxc; c += 1) {
        if (x?.[c]?.mc) {
          if ("rs" in x[c]!.mc!) {
            delete cfg.merge[`${x[c]!.mc!.r}_${x[c]!.mc!.c}`];
          }
          delete x![c]!.mc;
        }

        let value = null;
        if (data[h - minh] != null && data[h - minh][c - minc] != null) {
          value = data[h - minh][c - minc];
        }

        x[c] = value;

        if (value != null && x?.[c]?.mc) {
          if (x![c]!.mc!.rs != null) {
            x![c]!.mc!.r = h;
            x![c]!.mc!.c = c;

            // @ts-ignore
            cfg.merge[`${x[c]!.mc!.r}_${x[c]!.mc!.c}`] = x[c]!.mc!;

            offsetMC[`${value.mc.r}_${value.mc.c}`] = [
              x[c]!.mc!.r,
              x[c]!.mc!.c,
            ];
          } else {
            x[c] = {
              mc: {
                r: offsetMC[`${value.mc.r}_${value.mc.c}`][0],
                c: offsetMC[`${value.mc.r}_${value.mc.c}`][1],
              },
            };
          }
        }

        if (borderInfo[`${h - minh}_${c - minc}`]) {
          const bd_obj = {
            rangeType: "cell",
            value: {
              row_index: h,
              col_index: c,
              l: borderInfo[`${h - minh}_${c - minc}`].l,
              r: borderInfo[`${h - minh}_${c - minc}`].r,
              t: borderInfo[`${h - minh}_${c - minc}`].t,
              b: borderInfo[`${h - minh}_${c - minc}`].b,
            },
          };

          cfg.borderInfo?.push(bd_obj);
        }

        // const fontset = luckysheetfontformat(x[c]);
        // const oneLineTextHeight = menuButton.getTextSize("田", fontset)[1];
        // // 比较计算高度和当前高度取最大高度
        // if (oneLineTextHeight > currentRowLen) {
        //   currentRowLen = oneLineTextHeight;
        //   RowlChange = true;
        // }
      }
      d[h] = x;

      if (currentRowLen !== ctx.defaultrowlen) {
        cfg.rowlen[h] = currentRowLen;
      }
    }

    ctx.luckysheet_select_save = [{ row: [minh, maxh], column: [minc, maxc] }];

    if (addr > 0 || addc > 0 || RowlChange) {
      // const allParam = {
      //   cfg,
      //   RowlChange: true,
      // };
      ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!].config = cfg;
      // jfrefreshgrid(d, ctx.luckysheet_select_save, allParam);
    } else {
      // const allParam = {
      //   cfg,
      // };
      ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!].config = cfg;
      // jfrefreshgrid(d, ctx.luckysheet_select_save, allParam);
      // selectHightlightShow();
    }
    jfrefreshgrid(ctx, null, undefined);
  } else {
    data = data.replace(/\r/g, "");
    const dataChe = [];
    const che = data.split("\n");
    const colchelen = che[0].split("\t").length;

    for (let i = 0; i < che.length; i += 1) {
      if (che[i].split("\t").length < colchelen) {
        continue;
      }

      dataChe.push(che[i].split("\t"));
    }

    const d = getFlowdata(ctx); // 取数据
    if (!d) return;

    const last =
      ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
    if (!last) return;

    const curR = last.row == null ? 0 : last.row[0];
    const curC = last.column == null ? 0 : last.column[0];
    const rlen = dataChe.length;
    const clen = dataChe[0].length;

    // 应用范围包含部分合并单元格，则return提示
    let has_PartMC = false;
    if (ctx.config.merge != null) {
      has_PartMC = hasPartMC(
        ctx,
        ctx.config,
        curR,
        curR + rlen - 1,
        curC,
        curC + clen - 1
      );
    }

    if (has_PartMC) {
      // if (isEditMode()) {
      //   alert("不能对合并单元格做部分更改");
      // } else {
      //   tooltip.info(
      //     '<i class="fa fa-exclamation-triangle"></i>提示',
      //     "不能对合并单元格做部分更改"
      //   );
      // }
      return;
    }

    const addr = curR + rlen - d.length;
    const addc = curC + clen - d[0].length;
    if (addr > 0 || addc > 0) {
      expandRowsAndColumns(d, addr, addc);
    }
    if (!d) return;

    for (let r = 0; r < rlen; r += 1) {
      const x = d[r + curR];
      for (let c = 0; c < clen; c += 1) {
        const originCell = x[c + curC];
        let value = dataChe[r][c];
        if (isRealNum(value)) {
          // 如果单元格设置了纯文本格式，那么就不要转成数值类型了，防止数值过大自动转成科学计数法
          if (originCell && originCell.ct && originCell.ct.fa === "@") {
            value = String(value);
          } else {
            value = parseFloat(value);
          }
        }
        if (originCell) {
          originCell.v = value;
          if (originCell.ct != null && originCell.ct.fa != null) {
            originCell.m = update(originCell.ct.fa, value);
          } else {
            originCell.m = value;
          }

          if (originCell.f != null && originCell.f.length > 0) {
            originCell.f = "";
            delFunctionGroup(ctx, r + curR, c + curC, ctx.currentSheetId);
          }
        } else {
          const cell: Cell = {};
          const mask = genarate(value);
          [cell.m, cell.ct, cell.v] = mask!;

          x[c + curC] = cell;
        }
      }
      d[r + curR] = x;
    }

    last.row = [curR, curR + rlen - 1];
    last.column = [curC, curC + clen - 1];

    // if (addr > 0 || addc > 0) {
    //   const allParam = {
    //     RowlChange: true,
    //   };
    //   jfrefreshgrid(d, ctx.luckysheet_select_save, allParam);
    // } else {
    //   jfrefreshgrid(d, ctx.luckysheet_select_save);
    //   selectHightlightShow();
    // }
    jfrefreshgrid(ctx, null, undefined);
  }
}

function setCellHyperlink(
  ctx: Context,
  id: string,
  r: number,
  c: number,
  link: { linkType: string; linkAddress: string }
) {
  const index = getSheetIndex(ctx, id) as number;
  if (!ctx.luckysheetfile[index].hyperlink) {
    ctx.luckysheetfile[index].hyperlink = {};
  }
  ctx.luckysheetfile[index]!.hyperlink![`${r}_${c}`] = link;
}

function pasteHandlerOfCutPaste(
  ctx: Context,
  copyRange: Context["luckysheet_copy_save"]
) {
  // if (
  //   !checkProtectionLockedRangeList(
  //     ctx.luckysheet_select_save,
  //     ctx.currentSheetId
  //   )
  // ) {
  //   return;
  // }
  const allowEdit = isAllowEdit(ctx);
  if (!allowEdit) return;

  if (!copyRange) return;

  const cfg = ctx.config || {};
  if (cfg.merge == null) {
    cfg.merge = {};
  }

  // 复制范围
  const copyHasMC = copyRange.HasMC;
  const copyRowlChange = copyRange.RowlChange;
  const copySheetId = copyRange.dataSheetId;

  const c_r1 = copyRange.copyRange[0].row[0];
  const c_r2 = copyRange.copyRange[0].row[1];
  const c_c1 = copyRange.copyRange[0].column[0];
  const c_c2 = copyRange.copyRange[0].column[1];

  const copyData = _.cloneDeep(
    getdatabyselection(
      ctx,
      { row: [c_r1, c_r2], column: [c_c1, c_c2] },
      copySheetId
    )
  );

  const copyh = copyData.length;
  const copyc = copyData[0].length;

  // 应用范围
  const last =
    ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
  if (!last || last.row_focus == null || last.column_focus == null) return;

  const minh = last.row_focus;
  const maxh = minh + copyh - 1; // 应用范围首尾行
  const minc = last.column_focus;
  const maxc = minc + copyc - 1; // 应用范围首尾列

  // 应用范围包含部分合并单元格，则提示
  let has_PartMC = false;
  if (cfg.merge != null) {
    has_PartMC = hasPartMC(ctx, cfg, minh, maxh, minc, maxc);
  }

  if (has_PartMC) {
    // if (isEditMode()) {
    //   alert("不能对合并单元格做部分更改");
    // } else {
    //   tooltip.info(
    //     '<i class="fa fa-exclamation-triangle"></i>提示',
    //     "不能对合并单元格做部分更改"
    //   );
    // }
    return;
  }

  const d = getFlowdata(ctx); // 取数据
  if (!d) return;
  const rowMaxLength = d.length;
  const cellMaxLength = d[0].length;

  const addr = copyh + minh - rowMaxLength;
  const addc = copyc + minc - cellMaxLength;
  if (addr > 0 || addc > 0) {
    expandRowsAndColumns(d, addr, addc);
  }

  const borderInfoCompute = getBorderInfoCompute(ctx, copySheetId);
  const c_dataVerification =
    _.cloneDeep(
      ctx.luckysheetfile[getSheetIndex(ctx, copySheetId)!].dataVerification
    ) || {};
  const dataVerification =
    _.cloneDeep(
      ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!]
        .dataVerification
    ) || {};

  // 若选区内包含超链接
  if (
    ctx.luckysheet_select_save?.length === 1 &&
    ctx.luckysheet_copy_save?.copyRange.length === 1
  ) {
    _.forEach(ctx.luckysheet_copy_save?.copyRange, (range) => {
      for (let r = 0; r <= range.row[1] - range.row[0]; r += 1) {
        for (let c = 0; c <= range.column[1] - range.column[0]; c += 1) {
          const index = getSheetIndex(
            ctx,
            ctx.luckysheet_copy_save?.dataSheetId as string
          ) as number;
          if (
            ctx.luckysheetfile[index]!.data![r + range.row[0]][
              c + range.column[0]
            ]?.hl &&
            ctx.luckysheetfile[index].hyperlink![`${r}_${c}`]
          ) {
            setCellHyperlink(
              ctx,
              ctx.luckysheet_copy_save?.dataSheetId as string,
              r + ctx.luckysheet_select_save![0].row[0],
              c + ctx.luckysheet_select_save![0].column[0],
              ctx.luckysheetfile[index].hyperlink![`${r}_${c}`]
            );
          }
        }
      }
    });
  }

  // 剪切粘贴在当前表操作，删除剪切范围内数据、合并单元格、数据验证和超链接
  if (ctx.currentSheetId === copySheetId) {
    for (let i = c_r1; i <= c_r2; i += 1) {
      for (let j = c_c1; j <= c_c2; j += 1) {
        const cell = d[i][j];

        if (cell && _.isPlainObject(cell) && "mc" in cell) {
          if (cell.mc?.rs != null) {
            delete cfg.merge[`${cell.mc.r}_${cell.mc.c}`];
          }
          delete cell.mc;
        }

        d[i][j] = null;

        delete dataVerification[`${i}_${j}`];

        delete ctx.luckysheetfile[
          getSheetIndex(ctx, ctx.currentSheetId) as number
        ].hyperlink?.[`${i}_${j}`];
      }
    }

    // 边框
    if (cfg.borderInfo && cfg.borderInfo.length > 0) {
      const source_borderInfo = [];

      for (let i = 0; i < cfg.borderInfo.length; i += 1) {
        const bd_rangeType = cfg.borderInfo[i].rangeType;

        if (bd_rangeType === "range") {
          const bd_range = cfg.borderInfo[i].range;
          let bd_emptyRange: any = [];

          for (let j = 0; j < bd_range.length; j += 1) {
            bd_emptyRange = bd_emptyRange.concat(
              CFSplitRange(
                bd_range[j],
                { row: [c_r1, c_r2], column: [c_c1, c_c2] },
                { row: [minh, maxh], column: [minc, maxc] },
                "restPart"
              )
            );
          }

          cfg.borderInfo[i].range = bd_emptyRange;

          source_borderInfo.push(cfg.borderInfo[i]);
        } else if (bd_rangeType === "cell") {
          const bd_r = cfg.borderInfo[i].value.row_index;
          const bd_c = cfg.borderInfo[i].value.col_index;

          if (!(bd_r >= c_r1 && bd_r <= c_r2 && bd_c >= c_c1 && bd_c <= c_c2)) {
            source_borderInfo.push(cfg.borderInfo[i]);
          }
        }
      }

      cfg.borderInfo = source_borderInfo;
    }
  }

  const offsetMC: any = {};
  for (let h = minh; h <= maxh; h += 1) {
    const x = d[h];

    for (let c = minc; c <= maxc; c += 1) {
      if (
        borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`] &&
        !borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].s
      ) {
        const bd_obj = {
          rangeType: "cell",
          value: {
            row_index: h,
            col_index: c,
            l: borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].l,
            r: borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].r,
            t: borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].t,
            b: borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].b,
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
      } else if (borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`]) {
        const bd_obj = {
          rangeType: "range",
          borderType: "border-slash",
          color:
            borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].s.color!,
          style:
            borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].s.style!,
          range: normalizeSelection(ctx, [{ row: [h, h], column: [c, c] }]),
        };

        if (cfg.borderInfo == null) {
          cfg.borderInfo = [];
        }

        cfg.borderInfo.push(bd_obj);
      }

      // 数据验证 剪切
      if (c_dataVerification[`${c_r1 + h - minh}_${c_c1 + c - minc}`]) {
        dataVerification[`${h}_${c}`] =
          c_dataVerification[`${c_r1 + h - minh}_${c_c1 + c - minc}`];
      }

      if (x[c]?.mc) {
        if (x[c]?.mc?.rs != null) {
          delete cfg.merge[`${x[c]!.mc!.r}_${x[c]!.mc!.c}`];
        }
        delete x[c]!.mc;
      }

      let value = null;
      if (copyData[h - minh] != null && copyData[h - minh][c - minc] != null) {
        value = copyData[h - minh][c - minc];
      }

      x[c] = _.cloneDeep(value);

      if (value != null && copyHasMC && x[c]?.mc) {
        if (x[c]!.mc!.rs != null) {
          x[c]!.mc!.r = h;
          x[c]!.mc!.c = c;

          // @ts-ignore
          cfg.merge[`${x[c]!.mc!.r}_${x[c]!.mc!.c}`] = x[c]!.mc!;

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
    }

    d[h] = x;
  }

  last.row = [minh, maxh];
  last.column = [minc, maxc];

  // 若有行高改变，重新计算行高改变
  if (copyRowlChange) {
    // if (ctx.currentSheetId !== copySheetIndex) {
    //   cfg = rowlenByRange(d, minh, maxh, cfg);
    // } else {
    //   cfg = rowlenByRange(d, c_r1, c_r2, cfg);
    //   cfg = rowlenByRange(d, minh, maxh, cfg);
    // }
  }

  let source;
  let target;
  if (ctx.currentSheetId !== copySheetId) {
    // 跨表操作
    const sourceData = _.cloneDeep(
      ctx.luckysheetfile[getSheetIndex(ctx, copySheetId)!].data!
    );
    const sourceConfig = _.cloneDeep(
      ctx.luckysheetfile[getSheetIndex(ctx, copySheetId)!].config
    );

    const sourceCurData = _.cloneDeep(sourceData);
    const sourceCurConfig = _.cloneDeep(sourceConfig) || {};
    if (sourceCurConfig.merge == null) {
      sourceCurConfig.merge = {};
    }

    for (let source_r = c_r1; source_r <= c_r2; source_r += 1) {
      for (let source_c = c_c1; source_c <= c_c2; source_c += 1) {
        const cell = sourceCurData[source_r][source_c];

        if (cell?.mc) {
          if ("rs" in cell.mc) {
            delete sourceCurConfig.merge[`${cell.mc.r}_${cell.mc.c}`];
          }
          delete cell.mc;
        }
        sourceCurData[source_r][source_c] = null;
      }
    }

    if (copyRowlChange) {
      // sourceCurConfig = rowlenByRange(
      //   sourceCurData,
      //   c_r1,
      //   c_r2,
      //   sourceCurConfig
      // );
    }

    // 边框
    if (sourceCurConfig.borderInfo && sourceCurConfig.borderInfo.length > 0) {
      const source_borderInfo = [];

      for (let i = 0; i < sourceCurConfig.borderInfo.length; i += 1) {
        const bd_rangeType = sourceCurConfig.borderInfo[i].rangeType;

        if (bd_rangeType === "range") {
          const bd_range = sourceCurConfig.borderInfo[i].range;
          let bd_emptyRange: any = [];

          for (let j = 0; j < bd_range.length; j += 1) {
            bd_emptyRange = bd_emptyRange.concat(
              CFSplitRange(
                bd_range[j],
                { row: [c_r1, c_r2], column: [c_c1, c_c2] },
                { row: [minh, maxh], column: [minc, maxc] },
                "restPart"
              )
            );
          }

          sourceCurConfig.borderInfo[i].range = bd_emptyRange;

          source_borderInfo.push(sourceCurConfig.borderInfo[i]);
        } else if (bd_rangeType === "cell") {
          const bd_r = sourceCurConfig.borderInfo[i].value.row_index;
          const bd_c = sourceCurConfig.borderInfo[i].value.col_index;

          if (!(bd_r >= c_r1 && bd_r <= c_r2 && bd_c >= c_c1 && bd_c <= c_c2)) {
            source_borderInfo.push(sourceCurConfig.borderInfo[i]);
          }
        }
      }

      sourceCurConfig.borderInfo = source_borderInfo;
    }

    // 条件格式
    const source_cdformat = _.cloneDeep(
      ctx.luckysheetfile[getSheetIndex(ctx, copySheetId)!]
        .luckysheet_conditionformat_save
    );
    const source_curCdformat = _.cloneDeep(source_cdformat);
    const ruleArr: any[] = [];

    if (source_curCdformat != null && source_curCdformat.length > 0) {
      for (let i = 0; i < source_curCdformat.length; i += 1) {
        const source_curCdformat_cellrange = source_curCdformat[i].cellrange;
        let emptyRange: any = [];
        let emptyRange2: any = [];

        for (let j = 0; j < source_curCdformat_cellrange.length; j += 1) {
          const range = CFSplitRange(
            source_curCdformat_cellrange[j],
            { row: [c_r1, c_r2], column: [c_c1, c_c2] },
            { row: [minh, maxh], column: [minc, maxc] },
            "restPart"
          );

          emptyRange = emptyRange.concat(range);

          const range2 = CFSplitRange(
            source_curCdformat_cellrange[j],
            { row: [c_r1, c_r2], column: [c_c1, c_c2] },
            { row: [minh, maxh], column: [minc, maxc] },
            "operatePart"
          );

          if (range2.length > 0) {
            emptyRange2 = emptyRange2.concat(range2);
          }
        }

        source_curCdformat[i].cellrange = emptyRange;

        if (emptyRange2.length > 0) {
          const ruleObj = source_curCdformat[i] ?? {};
          ruleObj.cellrange = emptyRange2;
          ruleArr.push(ruleObj);
        }
      }
    }

    const target_cdformat = _.cloneDeep(
      ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!]
        .luckysheet_conditionformat_save
    );
    let target_curCdformat = _.cloneDeep(target_cdformat);
    if (ruleArr.length > 0) {
      target_curCdformat = target_curCdformat?.concat(ruleArr);
    }

    // 数据验证
    for (let i = c_r1; i <= c_r2; i += 1) {
      for (let j = c_c1; j <= c_c2; j += 1) {
        delete c_dataVerification[`${i}_${j}`];
      }
    }

    source = {
      sheetId: copySheetId,
      data: sourceData,
      curData: sourceCurData,
      config: sourceConfig,
      curConfig: sourceCurConfig,
      cdformat: source_cdformat,
      curCdformat: source_curCdformat,
      dataVerification: _.cloneDeep(
        ctx.luckysheetfile[getSheetIndex(ctx, copySheetId)!].dataVerification
      ),
      curDataVerification: c_dataVerification,
      range: {
        row: [c_r1, c_r2],
        column: [c_c1, c_c2],
      },
    };
    target = {
      sheetId: ctx.currentSheetId,
      data: getFlowdata(ctx),
      curData: d,
      config: _.cloneDeep(ctx.config),
      curConfig: cfg,
      cdformat: target_cdformat,
      curCdformat: target_curCdformat,
      dataVerification: _.cloneDeep(
        ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!]
          .dataVerification
      ),
      curDataVerification: dataVerification,
      range: {
        row: [minh, maxh],
        column: [minc, maxc],
      },
    };
  } else {
    // 条件格式
    const cdformat = _.cloneDeep(
      ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!]
        .luckysheet_conditionformat_save
    );
    const curCdformat = _.cloneDeep(cdformat);
    if (curCdformat != null && curCdformat.length > 0) {
      for (let i = 0; i < curCdformat.length; i += 1) {
        const { cellrange } = curCdformat[i];
        let emptyRange: any = [];
        for (let j = 0; j < cellrange.length; j += 1) {
          const range = CFSplitRange(
            cellrange[j],
            { row: [c_r1, c_r2], column: [c_c1, c_c2] },
            { row: [minh, maxh], column: [minc, maxc] },
            "allPart"
          );
          emptyRange = emptyRange.concat(range);
        }
        curCdformat[i].cellrange = emptyRange;
      }
    }

    // 当前表操作
    source = {
      sheetId: ctx.currentSheetId,
      data: getFlowdata(ctx),
      curData: d,
      config: _.cloneDeep(ctx.config),
      curConfig: cfg,
      cdformat,
      curCdformat,
      dataVerification: _.cloneDeep(
        ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!]
          .dataVerification
      ),
      curDataVerification: dataVerification,
      range: {
        row: [c_r1, c_r2],
        column: [c_c1, c_c2],
      },
    };
    target = {
      sheetId: ctx.currentSheetId,
      data: getFlowdata(ctx),
      curData: d,
      config: _.cloneDeep(ctx.config),
      curConfig: cfg,
      cdformat,
      curCdformat,
      dataVerification: _.cloneDeep(
        ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!]
          .dataVerification
      ),
      curDataVerification: dataVerification,
      range: {
        row: [minh, maxh],
        column: [minc, maxc],
      },
    };
  }

  if (addr > 0 || addc > 0) {
    postPasteCut(ctx, source, target, true);
  } else {
    postPasteCut(ctx, source, target, copyRowlChange);
  }
}

function pasteHandlerOfCopyPaste(
  ctx: Context,
  copyRange: Context["luckysheet_copy_save"]
) {
  // if (
  //   !checkProtectionLockedRangeList(
  //     ctx.luckysheet_select_save,
  //     ctx.currentSheetId
  //   )
  // ) {
  //   return;
  // }
  const allowEdit = isAllowEdit(ctx);
  if (!allowEdit) return;

  if (!copyRange) return;

  const cfg = ctx.config;
  if (_.isNil(cfg.merge)) {
    cfg.merge = {};
  }

  // 复制范围
  const copyHasMC = copyRange.HasMC;
  const copyRowlChange = copyRange.RowlChange;
  const copySheetIndex = copyRange.dataSheetId;

  const c_r1 = copyRange.copyRange[0].row[0];
  const c_r2 = copyRange.copyRange[0].row[1];
  const c_c1 = copyRange.copyRange[0].column[0];
  const c_c2 = copyRange.copyRange[0].column[1];

  let arr: CellMatrix = [];
  let isSameRow = false;
  for (let i = 0; i < copyRange.copyRange.length; i += 1) {
    let arrData = getdatabyselection(
      ctx,
      {
        row: copyRange.copyRange[i].row,
        column: copyRange.copyRange[i].column,
      },
      copySheetIndex
    );
    if (copyRange.copyRange.length > 1) {
      if (
        c_r1 === copyRange.copyRange[1].row[0] &&
        c_r2 === copyRange.copyRange[1].row[1]
      ) {
        arrData = arrData[0].map((col, a) => {
          return arrData.map((row) => {
            return row[a];
          });
        });

        arr = arr.concat(arrData);

        isSameRow = true;
      } else if (
        c_c1 === copyRange.copyRange[1].column[0] &&
        c_c2 === copyRange.copyRange[1].column[1]
      ) {
        arr = arr.concat(arrData);
      }
    } else {
      arr = arrData;
    }
  }

  if (isSameRow) {
    arr = arr[0].map((col, b) => {
      return arr.map((row) => {
        return row[b];
      });
    });
  }

  const copyData = _.cloneDeep(arr);

  // 多重选择选择区域 单元格如果有函数 则只取值 不取函数
  if (copyRange.copyRange.length > 1) {
    for (let i = 0; i < copyData.length; i += 1) {
      for (let j = 0; j < copyData[i].length; j += 1) {
        if (copyData[i][j] != null && copyData[i]![j]!.f != null) {
          delete copyData[i]![j]!.f;
          delete copyData[i]![j]!.spl;
        }
      }
    }
  }

  const copyh = copyData.length;
  const copyc = copyData[0].length;

  // 应用范围
  const last =
    ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
  if (!last) return;
  const minh = last.row[0];
  let maxh = last.row[1]; // 应用范围首尾行
  const minc = last.column[0];
  let maxc = last.column[1]; // 应用范围首尾列

  const mh = (maxh - minh + 1) % copyh;
  const mc = (maxc - minc + 1) % copyc;

  if (mh !== 0 || mc !== 0) {
    // 若应用范围不是copydata行列数的整数倍，则取copydata的行列数
    maxh = minh + copyh - 1;
    maxc = minc + copyc - 1;
  }

  // 应用范围包含部分合并单元格，则提示
  let has_PartMC = false;
  if (!_.isNil(cfg.merge)) {
    has_PartMC = hasPartMC(ctx, cfg, minh, maxh, minc, maxc);
  }

  if (has_PartMC) {
    // if (isEditMode()) {
    //   alert("不能对合并单元格做部分更改");
    // } else {
    //   tooltip.info(
    //     '<i class="fa fa-exclamation-triangle"></i>提示',
    //     "不能对合并单元格做部分更改"
    //   );
    // }
    return;
  }

  const timesH = (maxh - minh + 1) / copyh;
  const timesC = (maxc - minc + 1) / copyc;

  const d = getFlowdata(ctx); // 取数据
  if (!d) return;

  const rowMaxLength = d.length;
  const cellMaxLength = d[0].length;

  // 若应用范围超过最大行或最大列，增加行列
  const addr = copyh + minh - rowMaxLength;
  const addc = copyc + minc - cellMaxLength;
  if (addr > 0 || addc > 0) {
    expandRowsAndColumns(d, addr, addc);
  }

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
      maxrowCache = minh + th * copyh;
      maxcellCahe = minc + tc * copyc;

      // 行列位移值 用于单元格有函数
      const offsetRow = mth - c_r1;
      const offsetCol = mtc - c_c1;

      const offsetMC: any = {};
      for (let h = mth; h < maxrowCache; h += 1) {
        const x = d[h];

        for (let c = mtc; c < maxcellCahe; c += 1) {
          if (
            borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`] &&
            !borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`].s
          ) {
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

            if (_.isNil(cfg.borderInfo)) {
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

            if (_.isNil(cfg.borderInfo)) {
              cfg.borderInfo = [];
            }

            cfg.borderInfo.push(bd_obj);
          } else if (borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`]) {
            const bd_obj = {
              rangeType: "range",
              borderType: "border-slash",
              color:
                borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].s
                  .color!,
              style:
                borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].s
                  .style!,
              range: normalizeSelection(ctx, [{ row: [h, h], column: [c, c] }]),
            };

            if (cfg.borderInfo == null) {
              cfg.borderInfo = [];
            }

            cfg.borderInfo.push(bd_obj);
          }

          // 数据验证 复制
          if (c_dataVerification[`${c_r1 + h - mth}_${c_c1 + c - mtc}`]) {
            if (_.isNil(dataVerification)) {
              dataVerification = _.cloneDeep(
                ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!]
                  ?.dataVerification || {}
              );
            }

            dataVerification[`${h}_${c}`] =
              c_dataVerification[`${c_r1 + h - mth}_${c_c1 + c - mtc}`];
          }

          if (x[c]?.mc != null) {
            if ("rs" in x[c]!.mc!) {
              delete cfg.merge[`${x[c]!.mc!.r}_${x[c]!.mc!.c}`];
            }
            delete x[c]!.mc;
          }

          let value = null;
          if (copyData[h - mth]?.[c - mtc]) {
            value = _.cloneDeep(copyData[h - mth][c - mtc]);
          }

          if (!_.isNil(value) && !_.isNil(value.f)) {
            let func = value.f;

            if (offsetRow > 0) {
              func = `=${functionCopy(ctx, func, "down", offsetRow)}`;
            }

            if (offsetRow < 0) {
              func = `=${functionCopy(ctx, func, "up", Math.abs(offsetRow))}`;
            }

            if (offsetCol > 0) {
              func = `=${functionCopy(ctx, func, "right", offsetCol)}`;
            }

            if (offsetCol < 0) {
              func = `=${functionCopy(ctx, func, "left", Math.abs(offsetCol))}`;
            }

            const funcV = execfunction(ctx, func, h, c, undefined, true);

            if (!_.isNil(value.spl)) {
              // value.f = funcV[2];
              // value.v = funcV[1];
              // value.spl = funcV[3].data;
            } else {
              [, value.v, value.f] = funcV;

              if (!_.isNil(value.ct) && !_.isNil(value.ct.fa)) {
                value.m = update(value.ct.fa, funcV[1]);
              }
            }
          }

          x[c] = _.cloneDeep(value);

          if (value != null && copyHasMC && x?.[c]?.mc) {
            if (x?.[c]?.mc?.rs != null) {
              x![c]!.mc!.r = h;
              x![c]!.mc!.c = c;

              // @ts-ignore
              cfg.merge[`${h}_${c}`] = x![c]!.mc!;

              offsetMC[`${value!.mc!.r}_${value!.mc!.c}`] = [
                x![c]!.mc!.r,
                x![c]!.mc!.c,
              ];
            } else {
              x[c] = {
                mc: {
                  r: offsetMC[`${value!.mc!.r}_${value!.mc!.c}`][0],
                  c: offsetMC[`${value!.mc!.r}_${value!.mc!.c}`][1],
                },
              };
            }
          }
        }
        d[h] = x;
      }
    }
  }

  // 复制范围 是否有 条件格式和数据验证
  let cdformat: any = null;
  if (copyRange.copyRange.length === 1) {
    const c_file =
      ctx.luckysheetfile[getSheetIndex(ctx, copySheetIndex) as number];
    const a_file =
      ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId) as number];

    const ruleArr_cf = _.cloneDeep(c_file.luckysheet_conditionformat_save);

    if (!_.isNil(ruleArr_cf) && ruleArr_cf.length > 0) {
      cdformat = _.cloneDeep(a_file.luckysheet_conditionformat_save) ?? [];

      for (let i = 0; i < ruleArr_cf.length; i += 1) {
        const cf_range = ruleArr_cf[i].cellrange;

        let emptyRange: any = [];

        for (let th = 1; th <= timesH; th += 1) {
          for (let tc = 1; tc <= timesC; tc += 1) {
            mth = minh + (th - 1) * copyh;
            mtc = minc + (tc - 1) * copyc;
            maxrowCache = minh + th * copyh;
            maxcellCahe = minc + tc * copyc;

            for (let j = 0; j < cf_range.length; j += 1) {
              const range = CFSplitRange(
                cf_range[j],
                { row: [c_r1, c_r2], column: [c_c1, c_c2] },
                { row: [mth, maxrowCache - 1], column: [mtc, maxcellCahe - 1] },
                "operatePart"
              );

              if (range.length > 0) {
                emptyRange = emptyRange.concat(range);
              }
            }
          }
        }

        if (emptyRange.length > 0) {
          ruleArr_cf[i].cellrange = emptyRange;
          cdformat.push(ruleArr_cf[i]);
        }
      }
    }
  }

  last.row = [minh, maxh];
  last.column = [minc, maxc];

  const file = ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)!];
  file.config = cfg;
  file.luckysheet_conditionformat_save = cdformat;
  file.dataVerification = dataVerification;

  // 若选区内包含超链接
  if (
    ctx.luckysheet_select_save?.length === 1 &&
    ctx.luckysheet_copy_save?.copyRange.length === 1
  ) {
    _.forEach(ctx.luckysheet_copy_save?.copyRange, (range) => {
      for (let r = 0; r <= range.row[1] - range.row[0]; r += 1) {
        for (let c = 0; c <= range.column[1] - range.column[0]; c += 1) {
          const index = getSheetIndex(
            ctx,
            ctx.luckysheet_copy_save?.dataSheetId as string
          ) as number;
          if (
            ctx.luckysheetfile[index]!.data![r + range.row[0]][
              c + range.column[0]
            ]?.hl &&
            ctx.luckysheetfile[index].hyperlink![`${r}_${c}`]
          ) {
            setCellHyperlink(
              ctx,
              ctx.luckysheet_copy_save?.dataSheetId as string,
              r + ctx.luckysheet_select_save![0].row[0],
              c + ctx.luckysheet_select_save![0].column[0],
              ctx.luckysheetfile[index].hyperlink![`${r}_${c}`]
            );
          }
        }
      }
    });
  }

  if (copyRowlChange || addr > 0 || addc > 0) {
    // cfg = rowlenByRange(d, minh, maxh, cfg);
    // const allParam = {
    //   cfg,
    //   RowlChange: true,
    //   cdformat,
    //   dataVerification,
    // };
    jfrefreshgrid(ctx, d, ctx.luckysheet_select_save);
  } else {
    // const allParam = {
    //   cfg,
    //   cdformat,
    //   dataVerification,
    // };
    jfrefreshgrid(ctx, d, ctx.luckysheet_select_save);
    // selectHightlightShow();
  }
}

export function handlePaste(ctx: Context, e: ClipboardEvent) {
  // if (isEditMode()) {
  //   // 此模式下禁用粘贴
  //   return;
  // }
  const allowEdit = isAllowEdit(ctx);
  if (!allowEdit) return;

  if (selectionCache.isPasteAction) {
    ctx.luckysheetCellUpdate = [];
    // $("#luckysheet-rich-text-editor").blur();
    selectionCache.isPasteAction = false;

    let { clipboardData } = e;
    if (!clipboardData) {
      // @ts-ignore
      // for IE
      clipboardData = window.clipboardData;
    }

    if (!clipboardData) return;

    let txtdata =
      clipboardData.getData("text/html") || clipboardData.getData("text/plain");

    // 如果标示是qksheet复制的内容，判断剪贴板内容是否是当前页面复制的内容
    let isEqual = true;
    if (
      txtdata.indexOf("fortune-copy-action-table") > -1 &&
      ctx.luckysheet_copy_save?.copyRange != null &&
      ctx.luckysheet_copy_save.copyRange.length > 0
    ) {
      // 剪贴板内容解析
      const cpDataArr = [];

      const reg = /<tr.*?>(.*?)<\/tr>/g;
      const reg2 = /<td.*?>(.*?)<\/td>/g;

      const regArr = txtdata.match(reg) || [];

      for (let i = 0; i < regArr.length; i += 1) {
        const cpRowArr = [];

        const reg2Arr = regArr[i].match(reg2);

        if (!_.isNil(reg2Arr)) {
          for (let j = 0; j < reg2Arr.length; j += 1) {
            const cpValue = reg2Arr[j]
              .replace(/<td.*?>/g, "")
              .replace(/<\/td>/g, "");
            cpRowArr.push(cpValue);
          }
        }

        cpDataArr.push(cpRowArr);
      }

      // 当前页面复制区内容
      const copy_r1 = ctx.luckysheet_copy_save.copyRange[0].row[0];
      const copy_r2 = ctx.luckysheet_copy_save.copyRange[0].row[1];
      const copy_c1 = ctx.luckysheet_copy_save.copyRange[0].column[0];
      const copy_c2 = ctx.luckysheet_copy_save.copyRange[0].column[1];

      const copy_index = ctx.luckysheet_copy_save.dataSheetId;

      let d;
      if (copy_index === ctx.currentSheetId) {
        d = getFlowdata(ctx);
      } else {
        const index = getSheetIndex(ctx, copy_index);
        if (_.isNil(index)) return;
        d = ctx.luckysheetfile[index].data;
      }
      if (!d) return;

      for (let r = copy_r1; r <= copy_r2; r += 1) {
        if (r - copy_r1 > cpDataArr.length - 1) {
          break;
        }

        for (let c = copy_c1; c <= copy_c2; c += 1) {
          const cell = d[r][c];
          let isInlineStr = false;
          if (!_.isNil(cell) && !_.isNil(cell.mc) && _.isNil(cell.mc.rs)) {
            continue;
          }

          let v;
          if (!_.isNil(cell)) {
            if ((cell.ct?.fa?.indexOf("w") ?? -1) > -1) {
              v = d[r]?.[c]?.v;
            } else {
              v = d[r]?.[c]?.m;
            }
          } else {
            v = "";
          }

          if (_.isNil(v) && d[r]?.[c]?.ct?.t === "inlineStr") {
            v = d[r]![c]!.ct!.s!.map((val: any) => val.v).join("");
            isInlineStr = true;
          }
          if (_.isNil(v)) {
            v = "";
          }
          if (isInlineStr) {
            // const cpData = $(cpDataArr[r - copy_r1][c - copy_c1])
            //   .text()
            //   .replace(/\s|\n/g, " ");
            // const ctx.alue = v.replace(/\n/g, "").replace(/\s/g, " ");
            // if (cpData !== ctx.alue) {
            //   isEqual = false;
            //   break;
            // }
          } else {
            if (_.trim(cpDataArr[r - copy_r1][c - copy_c1]) !== _.trim(v)) {
              isEqual = false;
              break;
            }
          }
        }
      }
    }

    const locale_fontjson = locale(ctx).fontjson;

    if (
      ctx.hooks.beforePaste?.(ctx.luckysheet_select_save, txtdata) === false
    ) {
      return;
    }

    if (
      txtdata.indexOf("fortune-copy-action-table") > -1 &&
      ctx.luckysheet_copy_save?.copyRange != null &&
      ctx.luckysheet_copy_save.copyRange.length > 0 &&
      isEqual
    ) {
      // 剪切板内容 和 luckysheet本身复制的内容 一致
      if (ctx.luckysheet_paste_iscut) {
        ctx.luckysheet_paste_iscut = false;
        pasteHandlerOfCutPaste(ctx, ctx.luckysheet_copy_save);
        ctx.luckysheet_selection_range = [];
        // selection.clearcopy(e);
      } else {
        pasteHandlerOfCopyPaste(ctx, ctx.luckysheet_copy_save);
      }
    } else if (txtdata.indexOf("fortune-copy-action-image") > -1) {
      // imageCtrl.pasteImgItem();
    } else {
      if (txtdata.indexOf("table") > -1) {
        const ele = document.createElement("div");
        ele.innerHTML = txtdata;

        const trList = ele.querySelectorAll("table tr");
        if (trList.length === 0) {
          ele.remove();
          return;
        }

        const data = new Array(trList.length);
        let colLen = 0;
        _.forEach(trList[0].querySelectorAll("td"), (td) => {
          let colspan = td.colSpan;
          if (Number.isNaN(colspan)) {
            colspan = 1;
          }
          colLen += colspan;
        });

        for (let i = 0; i < data.length; i += 1) {
          data[i] = new Array(colLen);
        }

        let r = 0;
        const borderInfo: any = {};
        const styleInner = ele.querySelectorAll("style")[0]?.innerHTML || "";
        const patternReg = /{([^}]*)}/g;
        const patternStyle = styleInner.match(patternReg);
        const nameReg = /^[^\t].*/gm;
        const patternName = _.initial(styleInner.match(nameReg));
        const allStyleList =
          patternName.length === patternStyle?.length &&
          typeof patternName === typeof patternStyle
            ? _.fromPairs(_.zip(patternName, patternStyle))
            : {};
        _.forEach(trList, (tr) => {
          let c = 0;
          const targetR = ctx.luckysheet_select_save![0].row[0] + r;

          const index = getSheetIndex(ctx, ctx.currentSheetId);
          if (!_.isNil(index)) {
            if (_.isNil(ctx.luckysheetfile[index].config)) {
              ctx.luckysheetfile[index].config = {};
            }
            if (_.isNil(ctx.luckysheetfile[index].config!.rowlen)) {
              ctx.luckysheetfile[index].config!.rowlen = {} as Record<
                number,
                number
              >;
            }
            const targetRowHeight = !_.isNil(tr.getAttribute("height"))
              ? parseInt(tr.getAttribute("height") as string, 10)
              : null;
            if (
              (_.has(ctx.luckysheetfile[index].config!.rowlen, targetR) &&
                ctx.luckysheetfile[index].config!.rowlen![targetR] !==
                  targetRowHeight) ||
              (!_.has(ctx.luckysheetfile[index].config!.rowlen, targetR) &&
                ctx.luckysheetfile[index].defaultRowHeight !== targetRowHeight)
            ) {
              const rowHeightList = ctx.luckysheetfile[index].config!.rowlen!;
              rowHeightList[targetR] = targetRowHeight as number;
              setRowHeight(ctx, rowHeightList);
            }
          }

          _.forEach(tr.querySelectorAll("td"), (td) => {
            // build cell from td
            const { className } = td;
            const cell: Cell = {};
            const txt = td.innerText || td.innerHTML;
            if (_.trim(txt).length === 0) {
              cell.v = undefined;
              cell.m = "";
            } else {
              const mask = genarate(txt);
              // @ts-ignore
              [cell.m, cell.ct, cell.v] = mask;
            }
            const styleString =
              typeof allStyleList[`.${className}`] === "string"
                ? allStyleList[`.${className}`]
                    .substring(1, allStyleList[`.${className}`].length - 1)
                    .split("\n\t")
                : [];
            const styles: Record<string, string> = {};
            _.forEach(styleString, (s) => {
              const styleList = s.split(":");
              styles[styleList[0]] = styleList?.[1].replace(";", "");
            });
            if (!_.isNil(styles.border)) td.style.border = styles.border;
            let bg: string | undefined =
              td.style.backgroundColor || styles.background;
            if (bg === "rgba(0, 0, 0, 0)" || _.isEmpty(bg)) {
              bg = undefined;
            }

            cell.bg = bg;

            const fontWight = td.style.fontWeight;
            cell.bl =
              (fontWight.toString() === "400" ||
                fontWight === "normal" ||
                _.isEmpty(fontWight)) &&
              !_.includes(styles["font-style"], "bold") &&
              (!styles["font-weight"] || styles["font-weight"] === "400")
                ? 0
                : 1;

            cell.it =
              (td.style.fontStyle === "normal" ||
                _.isEmpty(td.style.fontStyle)) &&
              !_.includes(styles["font-style"], "italic")
                ? 0
                : 1;

            cell.un = !_.includes(styles["text-decoration"], "underline")
              ? undefined
              : 1;

            cell.cl = !_.includes(td.innerHTML, "<s>") ? undefined : 1;

            const ff = td.style.fontFamily || styles["font-family"] || "";
            const ffs = ff.split(",");
            for (let i = 0; i < ffs.length; i += 1) {
              let fa = _.trim(ffs[i].toLowerCase());
              // @ts-ignore
              fa = locale_fontjson[fa];
              if (_.isNil(fa)) {
                cell.ff = 0;
              } else {
                cell.ff = fa;
                break;
              }
            }
            const fs = Math.round(
              styles["font-size"]
                ? parseInt(styles["font-size"].replace("pt", ""), 10)
                : (parseInt(td.style.fontSize || "13", 10) * 72) / 96
            );
            cell.fs = fs;

            cell.fc = td.style.color || styles.color;

            const ht = td.style.textAlign || styles["text-align"] || "left";
            if (ht === "center") {
              cell.ht = 0;
            } else if (ht === "right") {
              cell.ht = 2;
            } else {
              cell.ht = 1;
            }

            const regex = /vertical-align:\s*(.*?);/;
            const vt =
              td.style.verticalAlign ||
              styles["vertical-align"] ||
              (!_.isNil(allStyleList.td) &&
                allStyleList.td.match(regex).length > 0 &&
                allStyleList.td.match(regex)[1]) ||
              "top";
            if (vt === "middle") {
              cell.vt = 0;
            } else if (vt === "top" || vt === "text-top") {
              cell.vt = 1;
            } else {
              cell.vt = 2;
            }

            if ("mso-rotate" in styles) {
              const rt = styles["mso-rotate"];
              cell.rt = parseFloat(rt);
            }

            while (c < colLen && !_.isNil(data[r][c])) {
              c += 1;
            }

            if (c === colLen) {
              return true;
            }

            if (_.isNil(data[r][c])) {
              data[r][c] = cell;
              // @ts-ignore
              let rowspan = parseInt(td.getAttribute("rowspan"), 10);
              // @ts-ignore
              let colspan = parseInt(td.getAttribute("colspan"), 10);

              if (Number.isNaN(rowspan)) {
                rowspan = 1;
              }

              if (Number.isNaN(colspan)) {
                colspan = 1;
              }

              const r_ab = ctx.luckysheet_select_save![0].row[0] + r;
              const c_ab = ctx.luckysheet_select_save![0].column[0] + c;

              for (let rp = 0; rp < rowspan; rp += 1) {
                for (let cp = 0; cp < colspan; cp += 1) {
                  if (rp === 0) {
                    const bt = td.style.borderTop;
                    if (
                      !_.isEmpty(bt) &&
                      bt.substring(0, 3).toLowerCase() !== "0px"
                    ) {
                      const width = td.style.borderTopWidth;
                      const type = td.style.borderTopStyle;
                      const color = td.style.borderTopColor;
                      const borderconfig = getQKBorder(width, type, color);

                      if (!borderInfo[`${r + rp}_${c + cp}`]) {
                        borderInfo[`${r + rp}_${c + cp}`] = {};
                      }

                      borderInfo[`${r + rp}_${c + cp}`].t = {
                        style: borderconfig[0],
                        color: borderconfig[1],
                      };
                    }
                  }

                  if (rp === rowspan - 1) {
                    const bb = td.style.borderBottom;
                    if (
                      !_.isEmpty(bb) &&
                      bb.substring(0, 3).toLowerCase() !== "0px"
                    ) {
                      const width = td.style.borderBottomWidth;
                      const type = td.style.borderBottomStyle;
                      const color = td.style.borderBottomColor;
                      const borderconfig = getQKBorder(width, type, color);

                      if (!borderInfo[`${r + rp}_${c + cp}`]) {
                        borderInfo[`${r + rp}_${c + cp}`] = {};
                      }

                      borderInfo[`${r + rp}_${c + cp}`].b = {
                        style: borderconfig[0],
                        color: borderconfig[1],
                      };
                    }
                  }

                  if (cp === 0) {
                    const bl = td.style.borderLeft;
                    if (
                      !_.isEmpty(bl) &&
                      bl.substring(0, 3).toLowerCase() !== "0px"
                    ) {
                      const width = td.style.borderLeftWidth;
                      const type = td.style.borderLeftStyle;
                      const color = td.style.borderLeftColor;
                      const borderconfig = getQKBorder(width, type, color);

                      if (!borderInfo[`${r + rp}_${c + cp}`]) {
                        borderInfo[`${r + rp}_${c + cp}`] = {};
                      }

                      borderInfo[`${r + rp}_${c + cp}`].l = {
                        style: borderconfig[0],
                        color: borderconfig[1],
                      };
                    }
                  }

                  if (cp === colspan - 1) {
                    const br = td.style.borderLeft;
                    if (
                      !_.isEmpty(br) &&
                      br.substring(0, 3).toLowerCase() !== "0px"
                    ) {
                      const width = td.style.borderRightWidth;
                      const type = td.style.borderRightStyle;
                      const color = td.style.borderRightColor;
                      const borderconfig = getQKBorder(width, type, color);

                      if (!borderInfo[`${r + rp}_${c + cp}`]) {
                        borderInfo[`${r + rp}_${c + cp}`] = {};
                      }

                      borderInfo[`${r + rp}_${c + cp}`].r = {
                        style: borderconfig[0],
                        color: borderconfig[1],
                      };
                    }
                  }

                  if (rp === 0 && cp === 0) {
                    continue;
                  }

                  data[r + rp][c + cp] = { mc: { r: r_ab, c: c_ab } };
                }
              }

              if (rowspan > 1 || colspan > 1) {
                const first = { rs: rowspan, cs: colspan, r: r_ab, c: c_ab };
                data[r][c].mc = first;
              }
            }
            c += 1;
            if (c === colLen) {
              return true;
            }
            return true;
          });
          r += 1;
        });
        ctx.luckysheet_selection_range = [];
        pasteHandler(ctx, data, borderInfo);
        // $("#fortune-copy-content").empty();
        ele.remove();
      }
      // 复制的是图片
      else if (
        clipboardData.files.length === 1 &&
        clipboardData.files[0].type.indexOf("image") > -1
      ) {
        //   imageCtrl.insertImg(clipboardData.files[0]);
      } else {
        txtdata = clipboardData.getData("text/plain");
        pasteHandler(ctx, txtdata);
      }
    }
  } else if (ctx.luckysheetCellUpdate.length > 0) {
    // 阻止默认粘贴
    e.preventDefault();

    let { clipboardData } = e;
    if (!clipboardData) {
      // for IE
      // @ts-ignore
      clipboardData = window.clipboardData;
    }
    const text = clipboardData?.getData("text/plain");
    if (text) {
      document.execCommand("insertText", false, text);
    }
  }
}

export function handlePasteByClick(ctx: Context, triggerType?: string) {
  const allowEdit = isAllowEdit(ctx);
  if (!allowEdit) return;

  const textarea = document.querySelector("#fortune-copy-content");
  // textarea.focus();
  // textarea.select();

  // 等50毫秒，keyPress事件发生了再去处理数据
  // setTimeout(function () {
  const data = textarea?.innerHTML;
  if (!data) return;

  if (
    data.indexOf("fortune-copy-action-table") > -1 &&
    ctx.luckysheet_copy_save?.copyRange != null &&
    ctx.luckysheet_copy_save.copyRange.length > 0
  ) {
    if (ctx.luckysheet_paste_iscut) {
      ctx.luckysheet_paste_iscut = false;
      pasteHandlerOfCutPaste(ctx, ctx.luckysheet_copy_save);
      // clearcopy(e);
    } else {
      pasteHandlerOfCopyPaste(ctx, ctx.luckysheet_copy_save);
    }
  } else if (data.indexOf("fortune-copy-action-image") > -1) {
    // imageCtrl.pasteImgItem();
  } else if (triggerType !== "btn") {
    // pasteHandler(data);
  } else {
    // if (isEditMode()) {
    //   alert(local_drag.pasteMustKeybordAlert);
    // } else {
    //   tooltip.info(
    //     local_drag.pasteMustKeybordAlertHTMLTitle,
    //     local_drag.pasteMustKeybordAlertHTML
    //   );
    // }
  }
  // }, 10);
}
