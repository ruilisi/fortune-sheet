import _ from "lodash";
import { Context, getFlowdata } from "../context";
import { locale } from "../locale";
import { getdatabyselection, getQKBorder } from "../modules/cell";
import { genarate } from "../modules/format";
import { selectionCache } from "../modules/selection";
import { Cell } from "../types";
import { getSheetIndex } from "../utils";
import { hasPartMC } from "../modules/validation";
import { getBorderInfoCompute } from "../modules/border";

function pasteHandlerOfCopyPaste(ctx: Context, copyRange) {
  // if (
  //   !checkProtectionLockedRangeList(
  //     ctx.luckysheet_select_save,
  //     ctx.currentSheetIndex
  //   )
  // ) {
  //   return;
  // }
  const cfg = ctx.config;
  if (_.isNil(cfg.merge)) {
    cfg.merge = {};
  }

  // 复制范围
  const copyHasMC = copyRange.HasMC;
  const copyRowlChange = copyRange.RowlChange;
  const copySheetIndex = copyRange.dataSheetIndex;

  const c_r1 = copyRange.copyRange[0].row[0];
  const c_r2 = copyRange.copyRange[0].row[1];
  const c_c1 = copyRange.copyRange[0].column[0];
  const c_c2 = copyRange.copyRange[0].column[1];

  let arr: any = [];
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
        if (!_.isNil(copyData[i][j]) && !_.isNil(copyData[i][j].f)) {
          delete copyData[i][j].f;
          delete copyData[i][j].spl;
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
    if (isEditMode()) {
      alert("不能对合并单元格做部分更改");
    } else {
      tooltip.info(
        '<i class="fa fa-exclamation-triangle"></i>提示',
        "不能对合并单元格做部分更改"
      );
    }
    return;
  }

  const timesH = (maxh - minh + 1) / copyh;
  const timesC = (maxc - minc + 1) / copyc;

  let d = getFlowdata(ctx); // 取数据
  if (!d) return;

  const rowMaxLength = d.length;
  const cellMaxLength = d[0].length;

  // 若应用范围超过最大行或最大列，增加行列
  const addr = copyh + minh - rowMaxLength;
  const addc = copyc + minc - cellMaxLength;
  if (addr > 0 || addc > 0) {
    d = datagridgrowth([].concat(d), addr, addc, true);
  }

  const borderInfoCompute = getBorderInfoCompute(ctx, copySheetIndex);
  const c_dataVerification =
    _.cloneDeep(
      ctx.luckysheetfile[getSheetIndex(ctx, copySheetIndex)].dataVerification
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
        const x = [].concat(d[h]);

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
          }

          // 数据验证 复制
          if (c_dataVerification[`${c_r1 + h - mth}_${c_c1 + c - mtc}`]) {
            if (_.isNil(dataVerification)) {
              dataVerification = _.cloneDeep(
                ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetIndex)]
                  ?.dataVerification || {}
              );
            }

            dataVerification[`${h}_${c}`] =
              c_dataVerification[`${c_r1 + h - mth}_${c_c1 + c - mtc}`];
          }

          if (x[c]?.mc) {
            if ("rs" in x[c].mc) {
              delete cfg.merge[`${x[c].mc.r}_${x[c].mc.c}`];
            }
            delete x[c].mc;
          }

          let value = null;
          if (copyData[h - mth]?.[c - mtc]) {
            value = _.cloneDeep(copyData[h - mth][c - mtc]);
          }

          if (!_.isNil(value) && !_.isNil(value.f)) {
            let func = value.f;

            if (offsetRow > 0) {
              func = `=${formula.functionCopy(func, "down", offsetRow)}`;
            }

            if (offsetRow < 0) {
              func = `=${formula.functionCopy(
                func,
                "up",
                Math.abs(offsetRow)
              )}`;
            }

            if (offsetCol > 0) {
              func = `=${formula.functionCopy(func, "right", offsetCol)}`;
            }

            if (offsetCol < 0) {
              func = `=${formula.functionCopy(
                func,
                "left",
                Math.abs(offsetCol)
              )}`;
            }

            const funcV = formula.execfunction(func, h, c, undefined, true);

            if (!_.isNil(value.spl)) {
              // value.f = funcV[2];
              // value.v = funcV[1];
              // value.spl = funcV[3].data;
            } else {
              value.f = funcV[2];
              value.v = funcV[1];

              if (!_.isNil(value.ct) && !_.isNil(value.ct.fa)) {
                value.m = update(value.ct.fa, funcV[1]);
              }
            }
          }

          x[c] = _.cloneDeep(value);

          if (!_.isNil(value) && copyHasMC && "mc" in x[c]) {
            if (!_.isNil(x[c].mc.rs)) {
              x[c].mc.r = h;
              x[c].mc.c = c;

              cfg.merge[`${x[c].mc.r}_${x[c].mc.c}`] = x[c].mc;

              offsetMC[`${value.mc.r}_${value.mc.c}`] = [x[c].mc.r, x[c].mc.c];
            } else {
              x[c] = {
                mc: {
                  r: offsetMC[`${value.mc.r}_${value.mc.c}`][0],
                  c: offsetMC[`${value.mc.r}_${value.mc.c}`][1],
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
  const cdformat = null;
  /*
  if (copyRange.copyRange.length === 1) {
    const c_file = ctx.luckysheetfile[getSheetIndex(ctx, copySheetIndex)];
    const a_file =
      ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetIndex)];

    const ruleArr_cf = _.cloneDeep(c_file.luckysheet_conditionformat_save);

    if (!_.isNil(ruleArr_cf) && ruleArr_cf.length > 0) {
      cdformat = _.cloneDeep(a_file.luckysheet_conditionformat_save);

      for (let i = 0; i < ruleArr_cf.length; i += 1) {
        const cf_range = ruleArr_cf[i].cellrange;

        let emptyRange = [];

        for (let th = 1; th <= timesH; th += 1) {
          for (let tc = 1; tc <= timesC; tc += 1) {
            mth = minh + (th - 1) * copyh;
            mtc = minc + (tc - 1) * copyc;
            maxrowCache = minh + th * copyh;
            maxcellCahe = minc + tc * copyc;

            for (let j = 0; j < cf_range.length; j += 1) {
              const range = conditionformat.CFSplitRange(
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
  */

  last.row = [minh, maxh];
  last.column = [minc, maxc];

  const file = ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetIndex)!];
  file.config = cfg;
  file.luckysheet_conditionformat_save = cdformat;
  file.dataVerification = dataVerification;

  if (copyRowlChange || addr > 0 || addc > 0) {
    // cfg = rowlenByRange(d, minh, maxh, cfg);
    // const allParam = {
    //   cfg,
    //   RowlChange: true,
    //   cdformat,
    //   dataVerification,
    // };
    // jfrefreshgrid(d, ctx.luckysheet_select_save, allParam);
  } else {
    // const allParam = {
    //   cfg,
    //   cdformat,
    //   dataVerification,
    // };
    // jfrefreshgrid(d, ctx.luckysheet_select_save, allParam);
    // selectHightlightShow();
  }
}

export function handlePaste(ctx: Context, e: ClipboardEvent) {
  // if (isEditMode()) {
  //   // 此模式下禁用粘贴
  //   return;
  // }

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
      txtdata.indexOf("luckysheet_copy_action_table") > -1 &&
      !_.isNil(ctx.luckysheet_copy_save.copyRange) &&
      ctx.luckysheet_copy_save.copyRange.length > 0
    ) {
      // 剪贴板内容解析
      const cpDataArr = [];

      const reg = new RegExp("<tr.*?>(.*?)</tr>", "g");
      const reg2 = new RegExp("<td.*?>(.*?)</td>", "g");

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

      const copy_index = ctx.luckysheet_copy_save.dataSheetIndex;

      let d;
      if (copy_index === ctx.currentSheetIndex) {
        d = getFlowdata(ctx);
      } else {
        const sheetIndex = getSheetIndex(ctx, copy_index);
        if (_.isNil(sheetIndex)) return;
        d = ctx.luckysheetfile[sheetIndex].data;
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
            if (cpDataArr[r - copy_r1][c - copy_c1] !== v) {
              isEqual = false;
              break;
            }
          }
        }
      }
    }

    const locale_fontjson = locale().fontjson;

    // hook
    // if (
    //   !method.createHookFunction(
    //     "rangePasteBefore",
    //     ctx.luckysheet_select_save,
    //     txtdata
    //   )
    // ) {
    //   return;
    // }

    if (
      txtdata.indexOf("luckysheet_copy_action_table") > -1 &&
      !_.isNil(ctx.luckysheet_copy_save.copyRange) &&
      ctx.luckysheet_copy_save.copyRange.length > 0 &&
      isEqual
    ) {
      // 剪切板内容 和 luckysheet本身复制的内容 一致
      if (ctx.luckysheet_paste_iscut) {
        ctx.luckysheet_paste_iscut = false;
        selection.pasteHandlerOfCutPaste(ctx.luckysheet_copy_save);
        selection.clearcopy(e);
      } else {
        pasteHandlerOfCopyPaste(ctx, ctx.luckysheet_copy_save);
      }
    } else if (txtdata.indexOf("luckysheet_copy_action_image") > -1) {
      imageCtrl.pasteImgItem();
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
        _.forEach(trList, (tr) => {
          let c = 0;
          _.forEach(tr.querySelectorAll("td"), (td) => {
            // build cell from td
            const cell: Cell = {};
            const txt = td.innerText;
            if (_.trim(txt).length === 0) {
              cell.v = undefined;
              cell.m = "";
            } else {
              const mask = genarate(txt);
              // @ts-ignore
              [cell.m, cell.ct, cell.v] = mask;
            }

            let bg: string | undefined = td.style.backgroundColor;
            if (bg === "rgba(0, 0, 0, 0)") {
              bg = undefined;
            }

            cell.bg = bg;

            const fontWight = td.style.fontWeight;
            cell.bl =
              fontWight.toString() === "400" || fontWight === "normal" ? 0 : 1;

            cell.it = td.style.fontStyle === "normal" ? 0 : 1;

            const ff = td.style.fontFamily;
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
            const fs = Math.round((parseInt(td.style.fontSize, 10) * 72) / 96);
            cell.fs = fs;

            cell.fc = td.style.color;

            const ht = td.style.textAlign;
            if (ht === "center") {
              cell.ht = 0;
            } else if (ht === "right") {
              cell.ht = 2;
            } else {
              cell.ht = 1;
            }

            const vt = td.style.verticalAlign;
            if (vt === "middle") {
              cell.vt = 0;
            } else if (vt === "top" || vt === "text-top") {
              cell.vt = 1;
            } else {
              cell.vt = 2;
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
        selection.pasteHandler(data, borderInfo);
        $("#luckysheet-copy-content").empty();
        ele.remove();
      }
      // 复制的是图片
      else if (
        clipboardData.files.length === 1 &&
        clipboardData.files[0].type.indexOf("image") > -1
      ) {
        imageCtrl.insertImg(clipboardData.files[0]);
      } else {
        txtdata = clipboardData.getData("text/plain");
        selection.pasteHandler(txtdata);
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

export function handlePasteByClick(ctx: Context) {
  if (ctx.allowEdit === false) {
    return;
  }

  const _locale = locale();
  const local_drag = _locale.drag;

  const textarea = document.querySelector("#luckysheet-copy-content");
  // textarea.focus();
  // textarea.select();

  // 等50毫秒，keyPress事件发生了再去处理数据
  // setTimeout(function () {
  const data = textarea?.innerHTML;
  if (!data) return;

  if (
    data.indexOf("luckysheet_copy_action_table") > -1 &&
    ctx.luckysheet_copy_save.copyRange != null &&
    ctx.luckysheet_copy_save.copyRange.length > 0
  ) {
    if (ctx.luckysheet_paste_iscut) {
      ctx.luckysheet_paste_iscut = false;
      pasteHandlerOfCutPaste(ctx.luckysheet_copy_save);
      clearcopy(e);
    } else {
      pasteHandlerOfCopyPaste(ctx, ctx.luckysheet_copy_save);
    }
  } else if (data.indexOf("luckysheet_copy_action_image") > -1) {
    imageCtrl.pasteImgItem();
  } else if (triggerType != "btn") {
    pasteHandler(data);
  } else {
    if (isEditMode()) {
      alert(local_drag.pasteMustKeybordAlert);
    } else {
      tooltip.info(
        local_drag.pasteMustKeybordAlertHTMLTitle,
        local_drag.pasteMustKeybordAlertHTML
      );
    }
  }
  // }, 10);
}
