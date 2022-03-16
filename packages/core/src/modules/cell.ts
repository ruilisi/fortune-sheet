import _ from "lodash";
import { Context } from "../context";
import { getSheetByIndex, getSheetIndex, rgbToHex } from "../utils";
import { genarate, update } from "./format";
import { delFunctionGroup, execfunction, execFunctionGroup } from "./formula";
import {
  convertSpanToShareString,
  isInlineStringCell,
  isInlineStringCT,
} from "./inline-string";
import { colLocationByIndex } from "./location";
import { getCellTextInfo } from "./text";
import { isRealNull, isRealNum, valueIsError } from "./validation";

// TODO put these in context ref
let rangestart = false;
let rangedrag_column_start = false;
let rangedrag_row_start = false;
const rangetosheet: number | undefined = undefined;

export function normalizedCellAttr(cell: any, attr: string): any {
  const tf = { bl: 1, it: 1, ff: 1, cl: 1, un: 1 };
  let value: any = cell?.[attr];

  if (attr in tf || (attr === "fs" && isInlineStringCell(cell))) {
    value ||= "0";
  } else if (["fc", "bg", "bc"].includes(attr)) {
    if (["fc", "bc"].includes(attr)) {
      value ||= "#000000";
    }
    if (value?.indexOf("rgba") > -1) {
      value = rgbToHex(value);
    }
  } else if (attr.substring(0, 2) === "bs") {
    value ||= "none";
  } else if (attr === "ht" || attr === "vt") {
    const defaultValue = attr === "ht" ? "1" : "0";
    value ||= defaultValue;
    if (["0", "1", "2"].indexOf(value.toString()) === -1) {
      value = defaultValue;
    }
  } else if (attr === "fs") {
    value ||= "10";
  } else if (attr === "tb" || attr === "tr") {
    value ||= "0";
  }

  return value;
}

export function normalizedAttr(
  data: any,
  r: number,
  c: number,
  attr: string
): any {
  if (!data || !data[r]) {
    console.warn("cell (%d, %d) is null", r, c);
    return null;
  }
  const cell = data[r][c];
  return normalizedCellAttr(cell, attr);
}

export function getCellValue(r: number, c: number, data: any, attr?: string) {
  if (!attr) {
    attr = "v";
  }

  let d_value;

  if (!_.isNil(r) && !_.isNil(c)) {
    d_value = data[r][c];
  } else if (!_.isNil(r)) {
    d_value = data[r];
  } else if (!_.isNil(c)) {
    const newData = data[0].map((col: any, i: number) => {
      return data.map((row: any) => {
        return row[i];
      });
    });
    d_value = newData[c];
  } else {
    return data;
  }

  let retv = d_value;

  if (_.isPlainObject(d_value)) {
    retv = d_value[attr];

    if (attr === "f" && !_.isNil(retv)) {
      // retv = formula.functionHTMLGenerate(retv);
    } else if (attr === "f") {
      retv = d_value.v;
    } else if (d_value && d_value.ct && d_value.ct.t === "d") {
      retv = d_value.m;
    }
  }

  if (retv === undefined) {
    retv = null;
  }

  return retv;
}

export function setCellValue(
  ctx: Context,
  r: number,
  c: number,
  d: any,
  v: any
) {
  if (_.isNil(d)) {
    d = ctx.flowdata;
  }
  // 若采用深拷贝，初始化时的单元格属性丢失
  // let cell = $.extend(true, {}, d[r][c]);
  let cell = d[r][c];

  let vupdate;

  if (_.isPlainObject(v)) {
    if (_.isNil(cell)) {
      cell = v;
    } else {
      if (!_.isNil(v.f)) {
        cell.f = v.f;
      } else if ("f" in cell) {
        delete cell.f;
      }

      if (!_.isNil(v.spl)) {
        cell.spl = v.spl;
      }

      if (!_.isNil(v.ct)) {
        cell.ct = v.ct;
      }
    }

    if (_.isPlainObject(v.v)) {
      vupdate = v.v.v;
    } else {
      vupdate = v.v;
    }
  } else {
    vupdate = v;
  }

  if (isRealNull(vupdate)) {
    if (_.isPlainObject(cell)) {
      delete cell.m;
      delete cell.v;
    } else {
      cell = null;
    }

    d[r][c] = cell;

    return;
  }

  // 1.为null
  // 2.数据透视表的数据，flowdata的每个数据可能为字符串，结果就是cell === v === 一个字符串或者数字数据
  if (
    isRealNull(cell) ||
    ((_.isString(cell) || _.isNumber(cell)) && cell === v)
  ) {
    cell = {};
  }

  const vupdateStr = vupdate.toString();

  if (vupdateStr.substr(0, 1) === "'") {
    cell.m = vupdateStr.substr(1);
    cell.ct = { fa: "@", t: "s" };
    cell.v = vupdateStr.substr(1);
    cell.qp = 1;
  } else if (cell.qp === 1) {
    cell.m = vupdateStr;
    cell.ct = { fa: "@", t: "s" };
    cell.v = vupdateStr;
  } else if (vupdateStr.toUpperCase() === "TRUE") {
    cell.m = "TRUE";
    cell.ct = { fa: "General", t: "b" };
    cell.v = true;
  } else if (vupdateStr.toUpperCase() === "FALSE") {
    cell.m = "FALSE";
    cell.ct = { fa: "General", t: "b" };
    cell.v = false;
  } else if (
    vupdateStr.substr(-1) === "%" &&
    isRealNum(vupdateStr.substring(0, vupdateStr.length - 1))
  ) {
    cell.ct = { fa: "0%", t: "n" };
    cell.v = vupdateStr.substring(0, vupdateStr.length - 1) / 100;
    cell.m = vupdate;
  } else if (valueIsError(vupdate)) {
    cell.m = vupdateStr;
    // cell.ct = { "fa": "General", "t": "e" };
    if (!_.isNil(cell.ct)) {
      cell.ct.t = "e";
    } else {
      cell.ct = { fa: "General", t: "e" };
    }
    cell.v = vupdate;
  } else {
    if (
      !_.isNil(cell.f) &&
      isRealNum(vupdate) &&
      !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(
        vupdate
      )
    ) {
      cell.v = parseFloat(vupdate);
      if (_.isNil(cell.ct)) {
        cell.ct = { fa: "General", t: "n" };
      }

      if (cell.v === Infinity || cell.v === -Infinity) {
        cell.m = cell.v.toString();
      } else {
        if (cell.v.toString().indexOf("e") > -1) {
          let len;
          if (cell.v.toString().split(".").length === 1) {
            len = 0;
          } else {
            len = cell.v.toString().split(".")[1].split("e")[0].length;
          }
          if (len > 5) {
            len = 5;
          }

          cell.m = cell.v.toExponential(len).toString();
        } else {
          const v_p = Math.round(cell.v * 1000000000) / 1000000000;
          if (_.isNil(cell.ct)) {
            const mask = genarate(v_p);
            cell.m = mask[0].toString();
          } else {
            const mask = update(cell.ct.fa, v_p);
            cell.m = mask.toString();
          }

          // cell.m = mask[0].toString();
        }
      }
    } else if (!_.isNil(cell.ct) && cell.ct.fa === "@") {
      cell.m = vupdateStr;
      cell.v = vupdate;
    } else if (
      !_.isNil(cell.ct) &&
      !_.isNil(cell.ct.fa) &&
      cell.ct.fa !== "General"
    ) {
      if (isRealNum(vupdate)) {
        vupdate = parseFloat(vupdate);
      }

      let mask = update(cell.ct.fa, vupdate);

      if (mask === vupdate) {
        // 若原来单元格格式 应用不了 要更新的值，则获取更新值的 格式
        mask = genarate(vupdate);

        cell.m = mask[0].toString();
        [, cell.ct, cell.v] = mask;
      } else {
        cell.m = mask.toString();
        cell.v = vupdate;
      }
    } else {
      if (
        isRealNum(vupdate) &&
        !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(
          vupdate
        )
      ) {
        if (typeof vupdate === "string") {
          const flag = vupdate
            .split("")
            .every((ele) => ele === "0" || ele === ".");
          if (flag) {
            vupdate = parseFloat(vupdate);
          }
        }
        cell.v =
          vupdate; /* 备注：如果使用parseFloat，1.1111111111111111会转换为1.1111111111111112 ? */
        cell.ct = { fa: "General", t: "n" };
        if (cell.v === Infinity || cell.v === -Infinity) {
          cell.m = cell.v.toString();
        } else {
          const mask = genarate(cell.v);
          cell.m = mask[0].toString();
        }
      } else {
        const mask = genarate(vupdate);

        cell.m = mask[0].toString();
        [, cell.ct, cell.v] = mask;
      }
    }
  }

  // if (!server.allowUpdate && !luckysheetConfigsetting.pointEdit) {
  //   if (
  //     !_.isNil(cell.ct) &&
  //     /^(w|W)((0?)|(0\.0+))$/.test(cell.ct.fa) === false &&
  //     cell.ct.t === "n" &&
  //     !_.isNil(cell.v) &&
  //     parseInt(cell.v, 10).toString().length > 4
  //   ) {
  //     const autoFormatw = luckysheetConfigsetting.autoFormatw
  //       .toString()
  //       .toUpperCase();
  //     const { accuracy } = luckysheetConfigsetting;

  //     const sfmt = setAccuracy(autoFormatw, accuracy);

  //     if (sfmt !== "General") {
  //       cell.ct.fa = sfmt;
  //       cell.m = update(sfmt, cell.v);
  //     }
  //   }
  // }

  d[r][c] = cell;
}

export function getRealCellValue(
  r: number,
  c: number,
  data: any,
  attr?: string
) {
  let value = getCellValue(r, c, data, "m");
  if (_.isNil(value)) {
    value = getCellValue(r, c, data, attr);
    if (_.isNil(value)) {
      const ct = getCellValue(r, c, data, "ct");
      if (isInlineStringCT(ct)) {
        value = ct.s;
      }
    }
  }

  return value;
}

export function mergeBorder(
  ctx: Context,
  d: any[][],
  row_index: number,
  col_index: number
) {
  if (!d || !d[row_index]) {
    console.warn("Merge info is null", row_index, col_index);
    return null;
  }
  const value = d[row_index][col_index];

  if (_.isPlainObject(value) && "mc" in value) {
    const margeMaindata = value.mc;
    if (!margeMaindata) {
      console.warn("Merge info is null", row_index, col_index);
      return null;
    }
    col_index = margeMaindata.c;
    row_index = margeMaindata.r;

    if (_.isNil(d?.[row_index]?.[col_index])) {
      console.warn("Main merge Cell info is null", row_index, col_index);
      return null;
    }
    const col_rs = d[row_index][col_index].mc.cs;
    const row_rs = d[row_index][col_index].mc.rs;

    const margeMain = d[row_index][col_index].mc;

    let start_r: number;
    let end_r: number;
    let row: number | undefined;
    let row_pre: number | undefined;
    for (let r = row_index; r < margeMain.rs + row_index; r += 1) {
      if (r === 0) {
        start_r = -1;
      } else {
        start_r = ctx.visibledatarow[r - 1] - 1;
      }

      end_r = ctx.visibledatarow[r];

      if (row_pre === undefined) {
        row_pre = start_r;
        row = end_r;
      } else if (row !== undefined) {
        row += end_r - start_r - 1;
      }
    }

    let start_c: number;
    let end_c: number;
    let col: number | undefined;
    let col_pre: number | undefined;

    for (let c = col_index; c < margeMain.cs + col_index; c += 1) {
      if (c === 0) {
        start_c = 0;
      } else {
        start_c = ctx.visibledatacolumn[c - 1];
      }

      end_c = ctx.visibledatacolumn[c];

      if (col_pre === undefined) {
        col_pre = start_c;
        col = end_c;
      } else if (col !== undefined) {
        col += end_c - start_c;
      }
    }

    return {
      row: [row_pre, row, row_index, row_index + row_rs - 1],
      column: [col_pre, col, col_index, col_index + col_rs - 1],
    };
  }
  return null;
}

export function canceFunctionrangeSelected(ctx: Context) {
  // $("#luckysheet-formula-functionrange-select").hide();
  // $("#luckysheet-row-count-show, #luckysheet-column-count-show").hide();
  // // $("#luckysheet-cols-h-selected, #luckysheet-rows-h-selected").hide();
  // $("#luckysheet-formula-search-c, #luckysheet-formula-help-c").hide();
}

export function cancelNormalSelected(ctx: Context) {
  canceFunctionrangeSelected(ctx);

  ctx.luckysheetCellUpdate = [];
  // $("#luckysheet-formula-functionrange .luckysheet-formula-functionrange-highlight").remove();
  // $("#luckysheet-input-box").removeAttr("style");
  // $("#luckysheet-input-box-index").hide();
  // $("#luckysheet-wa-functionbox-cancel, #luckysheet-wa-functionbox-confirm").removeClass("luckysheet-wa-calculate-active");

  rangestart = false;
  rangedrag_column_start = false;
  rangedrag_row_start = false;
}

export function updateCell(
  ctx: Context,
  r: number,
  c: number,
  $input: HTMLDivElement,
  value?: any,
  isRefresh = true
) {
  let inputText = $input.innerText;
  const inputHtml = $input.innerHTML;

  // if (!_.isNil(rangetosheet) && rangetosheet !== ctx.currentSheetIndex) {
  //   sheetmanage.changeSheetExec(rangetosheet);
  // }

  // if (!checkProtectionLocked(r, c, ctx.currentSheetIndex)) {
  //   return;
  // }

  // 数据验证 输入数据无效时禁止输入
  /*
  if (!_.isNil(dataVerificationCtrl.dataVerification)) {
    const dvItem = dataVerificationCtrl.dataVerification[`${r}_${c}`];

    if (
      !_.isNil(dvItem) &&
      dvItem.prohibitInput &&
      !dataVerificationCtrl.validateCellData(inputText, dvItem)
    ) {
      const failureText = dataVerificationCtrl.getFailureText(dvItem);
      tooltip.info(failureText, "");
      cancelNormalSelected(ctx);
      return;
    }
  }
  */

  let curv = ctx.flowdata[r][c];

  // ctx.old value for hook function
  const oldValue = JSON.stringify(curv);

  const isPrevInline = isInlineStringCell(curv);
  let isCurInline =
    inputText.slice(0, 1) !== "=" && inputHtml.substring(0, 5) === "<span";

  let isCopyVal = false;
  if (!isCurInline && inputText && inputText.length > 0) {
    const splitArr = inputText
      .replace(/\r\n/g, "_x000D_")
      .replace(/&#13;&#10;/g, "_x000D_")
      .replace(/\r/g, "_x000D_")
      .replace(/\n/g, "_x000D_")
      .split("_x000D_");
    if (splitArr.length > 1) {
      isCopyVal = true;
      isCurInline = true;
      inputText = splitArr.join("\r\n");
    }
  }

  if (!value && !isCurInline && isPrevInline) {
    delete curv.ct.s;
    curv.ct.t = "g";
    curv.ct.fa = "General";
    value = "";
  } else if (isCurInline) {
    if (!_.isPlainObject(curv)) {
      curv = {};
    }
    delete curv.f;
    delete curv.v;
    delete curv.m;

    if (!curv.ct) {
      curv.ct = {};
      curv.ct.fa = "General";
    }

    curv.ct.t = "inlineStr";
    curv.ct.s = convertSpanToShareString($input.querySelectorAll("span"));
    if (isCopyVal) {
      curv.ct.s = [
        {
          v: inputText,
        },
      ];
    }
  }

  // API, we get value from user
  value = value || $input.innerText;

  // Hook function
  // if (!method.createHookFunction("cellUpdateBefore", r, c, value, isRefresh)) {
  //   cancelNormalSelected(ctx);
  //   return;
  // }

  if (!isCurInline) {
    if (isRealNull(value) && !isPrevInline) {
      if (!curv || (isRealNull(curv.v) && !curv.spl && !curv.f)) {
        cancelNormalSelected(ctx);
        return;
      }
    } else if (curv && curv.qp !== 1) {
      if (
        _.isPlainObject(curv) &&
        (value === curv.f || value === curv.v || value === curv.m)
      ) {
        cancelNormalSelected(ctx);
        return;
      }
      if (value === curv) {
        cancelNormalSelected(ctx);
        return;
      }
    }

    if (_.isString(value) && value.slice(0, 1) === "=" && value.length > 1) {
    } else if (
      _.isPlainObject(curv) &&
      curv.ct &&
      curv.ct.fa &&
      curv.ct.fa !== "@" &&
      !isRealNull(value)
    ) {
      delete curv.m; // 更新时间m处理 ， 会实际删除单元格数据的参数（flowdata时已删除）
      if (curv.f) {
        // 如果原来是公式，而更新的数据不是公式，则把公式删除
        delete curv.f;
        delete curv.spl; // 删除单元格的sparklines的配置串
      }
    }
  }

  // TODO window.luckysheet_getcelldata_cache = null;

  let isRunExecFunction = true;

  const d = ctx.flowdata; // TODO const d = editor.deepCopyFlowData(ctx.flowdata);
  let dynamicArrayItem = null; // 动态数组

  if (_.isPlainObject(curv)) {
    if (!isCurInline) {
      if (_.isString(value) && value.slice(0, 1) === "=" && value.length > 1) {
        const v = execfunction(ctx, value, r, c, undefined, true);
        isRunExecFunction = false;
        curv = _.cloneDeep(d?.[r]?.[c] || {});
        [, curv.v, curv.f] = v;

        // 打进单元格的sparklines的配置串， 报错需要单独处理。
        if (v.length === 4 && v[3].type === "sparklines") {
          delete curv.m;
          delete curv.v;

          const curCalv = v[3].data;

          if (_.isArray(curCalv) && !_.isPlainObject(curCalv[0])) {
            [curv.v] = curCalv;
          } else {
            curv.spl = v[3].data;
          }
        } else if (v.length === 4 && v[3].type === "dynamicArrayItem") {
          dynamicArrayItem = v[3].data;
        }
      }
      // from API setCellValue,luckysheet.setCellValue(0, 0, {f: "=sum(D1)", bg:"#0188fb"}),value is an object, so get attribute f as value
      else if (_.isPlainObject(value)) {
        const valueFunction = value.f;

        if (
          _.isString(valueFunction) &&
          valueFunction.slice(0, 1) === "=" &&
          valueFunction.length > 1
        ) {
          const v = execfunction(ctx, valueFunction, r, c, undefined, true);
          isRunExecFunction = false;
          // get v/m/ct

          curv = _.cloneDeep(d?.[r]?.[c] || {});
          [, curv.v, curv.f] = v;

          // 打进单元格的sparklines的配置串， 报错需要单独处理。
          if (v.length === 4 && v[3].type === "sparklines") {
            delete curv.m;
            delete curv.v;

            const curCalv = v[3].data;

            if (_.isArray(curCalv) && !_.isPlainObject(curCalv[0])) {
              [curv.v] = curCalv;
            } else {
              curv.spl = v[3].data;
            }
          } else if (v.length === 4 && v[3].type === "dynamicArrayItem") {
            dynamicArrayItem = v[3].data;
          }
        }
        // from API setCellValue,luckysheet.setCellValue(0, 0, {f: "=sum(D1)", bg:"#0188fb"}),value is an object, so get attribute f as value
        else {
          Object.keys(value).forEach((attr) => {
            curv[attr] = value[attr];
          });
        }
      } else {
        delFunctionGroup(ctx, r, c);
        execFunctionGroup(ctx, r, c, value);
        isRunExecFunction = false;

        curv = _.cloneDeep(d?.[r]?.[c] || {});
        curv.v = value;

        delete curv.f;
        delete curv.spl;

        if (curv.qp === 1 && `${value}`.substring(0, 1) !== "'") {
          // if quotePrefix is 1, cell is force string, cell clear quotePrefix when it is updated
          curv.qp = 0;
          if (curv.ct) {
            curv.ct.fa = "General";
            curv.ct.t = "n";
          }
        }
      }
    }
    value = curv;
  } else {
    if (_.isString(value) && value.slice(0, 1) === "=" && value.length > 1) {
      const v = execfunction(ctx, value, r, c, undefined, true);
      isRunExecFunction = false;
      value = {
        v: v[1],
        f: v[2],
      };

      // 打进单元格的sparklines的配置串， 报错需要单独处理。
      if (v.length === 4 && v[3].type === "sparklines") {
        const curCalv = v[3].data;

        if (_.isArray(curCalv) && !_.isPlainObject(curCalv[0])) {
          [value.v] = curCalv;
        } else {
          value.spl = v[3].data;
        }
      } else if (v.length === 4 && v[3].type === "dynamicArrayItem") {
        dynamicArrayItem = v[3].data;
      }
    }
    // from API setCellValue,luckysheet.setCellValue(0, 0, {f: "=sum(D1)", bg:"#0188fb"}),value is an object, so get attribute f as value
    else if (_.isPlainObject(value)) {
      const valueFunction = value.f;

      if (
        _.isString(valueFunction) &&
        valueFunction.slice(0, 1) === "=" &&
        valueFunction.length > 1
      ) {
        const v = execfunction(ctx, valueFunction, r, c, undefined, true);
        isRunExecFunction = false;
        // value = {
        //     "v": v[1],
        //     "f": v[2]
        // };

        // update attribute v
        [, value.v, value.f] = v;

        // 打进单元格的sparklines的配置串， 报错需要单独处理。
        if (v.length === 4 && v[3].type === "sparklines") {
          const curCalv = v[3].data;

          if (_.isArray(curCalv) && !_.isPlainObject(curCalv[0])) {
            [value.v] = curCalv;
          } else {
            value.spl = v[3].data;
          }
        } else if (v.length === 4 && v[3].type === "dynamicArrayItem") {
          dynamicArrayItem = v[3].data;
        }
      } else {
        const v = curv;
        if (_.isNil(value.v)) {
          value.v = v;
        }
      }
    } else {
      delFunctionGroup(ctx, r, c);
      execFunctionGroup(ctx, r, c, value);
      isRunExecFunction = false;
    }
  }

  // value maybe an object
  setCellValue(ctx, r, c, d, value);
  cancelNormalSelected(ctx);

  /*
  let RowlChange = false;
  const cfg =
    ctx.luckysheetfile?.[getSheetIndex(ctx, ctx.currentSheetIndex)]?.config ||
    {};
  if (!cfg.rowlen) {
    cfg.rowlen = {};
  }
  */

  /*
  if ((d[r][c].tb === "2" && d[r][c].v) || isInlineStringCell(d[r][c])) {
    // 自动换行
    const { defaultrowlen } = ctx;

    const canvas = $("#luckysheetTableContent").get(0).getContext("2d");
    // offlinecanvas.textBaseline = 'top'; //textBaseline以top计算

    // let fontset = luckysheetfontformat(d[r][c]);
    // offlinecanvas.font = fontset;

    if (cfg.customHeight && cfg.customHeight[r] === 1) {
    } else {
      // let currentRowLen = defaultrowlen;
      // if(!_.isNil(cfg["rowlen"][r])){
      //     currentRowLen = cfg["rowlen"][r];
      // }

      const colLoc = colLocationByIndex(c, ctx.visibledatacolumn);
      const cellWidth = colLoc[1] - colLoc[0] - 2;

      const textInfo = getCellTextInfo(d[r][c], canvas, ctx, {
        r,
        c,
        cellWidth,
      });

      let currentRowLen = defaultrowlen;
      // console.log("rowlen", textInfo);
      if (textInfo) {
        currentRowLen = textInfo.textHeightAll + 2;
      }

      if (currentRowLen > defaultrowlen) {
        cfg.rowlen[r] = currentRowLen;
        RowlChange = true;
      }
    }
  }
  */

  // 动态数组
  /*
  let dynamicArray = null;
  if (dynamicArrayItem) {
    // let file = ctx.luckysheetfile[getSheetIndex(ctx.currentSheetIndex)];
    dynamicArray = $.extend(
      true,
      [],
      this.insertUpdateDynamicArray(dynamicArrayItem)
    );
    // dynamicArray.push(dynamicArrayItem);
  }

  let allParam = {
    dynamicArray,
  };

  if (RowlChange) {
    allParam = {
      cfg,
      dynamicArray,
      RowlChange,
    };
  }
  */

  // setTimeout(() => {
  //   // Hook function
  //   method.createHookFunction(
  //     "cellUpdated",
  //     r,
  //     c,
  //     JSON.parse(oldValue),
  //     ctx.flowdata[r][c],
  //     isRefresh
  //   );
  // }, 0);

  /*
  if (isRefresh) {
    jfrefreshgrid(
      d,
      [{ row: [r, r], column: [c, c] }],
      allParam,
      isRunExecFunction
    );
    // ctx.luckysheetCellUpdate.length = 0; //clear array
    _this.execFunctionGlobalData = null; // 销毁
  } else {
    return {
      data: d,
      allParam,
    };
  }
  */
}

export function getOrigincell(
  ctx: Context,
  r: number,
  c: number,
  i: number | string
) {
  if (_.isNil(r) || _.isNil(c)) {
    return null;
  }
  let data;
  if (_.isNil(i)) {
    data = ctx.flowdata;
  } else {
    const sheet = getSheetByIndex(ctx, i);
    data = sheet?.data;
  }

  if (!data || !data[r] || !data[r][c]) {
    return null;
  }
  return data[r][c];
}

export function getcellFormula(
  ctx: Context,
  r: number,
  c: number,
  i: string | number,
  data?: any
) {
  let cell;
  if (!_.isNil(data)) {
    cell = data[r][c];
  } else {
    cell = getOrigincell(ctx, r, c, i);
  }

  if (_.isNil(cell)) {
    return null;
  }

  return cell.f;
}
