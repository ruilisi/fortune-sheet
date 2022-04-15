import _ from "lodash";
// @ts-ignore
import { Parser } from "@fortune-sheet/formula-parser";
import type { Cell, Selection } from "../types";
import { Context, getFlowdata } from "../context";
import {
  columnCharToIndex,
  escapeScriptTag,
  getSheetIndex,
  indexToColumnChar,
} from "../utils";
import { getcellFormula, setCellValue } from "./cell";
import { error } from "./validation";
import { moveToEnd } from "./cursor";
import { locale } from "../locale";
import { colors } from "./color";

export const formulaCache: {
  func_selectedrange: Selection | undefined;
} & Record<string, any> = {
  func_selectedrange: undefined,
  data_parm_index: 0,
  rangechangeindex: null,
  rangedragged: () => {},
  rangeResizeObj: null,
  rangeResize: null,
  rangeResizeIndex: null,
  rangeResizexy: null,
  rangeResizeWinH: null,
  rangeResizeWinW: null,
  rangeResizeTo: null,
  rangeSetValueTo: null,
  rangestart: false,
  rangetosheet: null,
  rangedrag_column_start: false,
  rangedrag_row_start: false,
  functionHTMLIndex: 0,
  functionRangeIndex: null,
  functionlistMap: {},
  execFunctionExist: null,
  execFunctionGlobalData: {},
  groupValuesRefreshData: [],
};

let formulaContainSheetList: any = {};
let cellTextToIndexList: any = {};
let operatorjson: any = null;
const operator = "==|!=|<>|<=|>=|=|+|-|>|<|/|*|%|&|^";
const operatorPriority: any = {
  "^": 0,
  "%": 1,
  "*": 1,
  "/": 1,
  "+": 2,
  "-": 2,
};
let isFunctionRangeSave = false;

let currentContext: Context | undefined;

function tryGetCellAsNumber(cell: Cell) {
  if (cell?.ct?.t === "n") {
    const n = Number(cell?.v);
    return Number.isNaN(n) ? cell.v : n;
  }
  return cell?.v;
}

const parser = new Parser();

parser.on("callCellValue", (cellCoord: any, done: any) => {
  const flowdata = getFlowdata(currentContext);
  const index = currentContext?.currentSheetIndex;
  const cell =
    formulaCache.execFunctionGlobalData[
      `${cellCoord.row.index}_${cellCoord.column.index}_${index}`
    ] || flowdata?.[cellCoord.row.index]?.[cellCoord.column.index];
  const v = tryGetCellAsNumber(cell);
  done(v);
});

parser.on(
  "callRangeValue",
  (startCellCoord: any, endCellCoord: any, done: any) => {
    const flowdata = getFlowdata(currentContext);
    const index = currentContext?.currentSheetIndex;
    const fragment = [];

    for (
      let row = startCellCoord.row.index;
      row <= endCellCoord.row.index;
      row += 1
    ) {
      const colFragment = [];

      for (
        let col = startCellCoord.column.index;
        col <= endCellCoord.column.index;
        col += 1
      ) {
        const cell =
          formulaCache.execFunctionGlobalData[`${row}_${col}_${index}`] ||
          flowdata?.[row]?.[col];
        const v = tryGetCellAsNumber(cell);
        colFragment.push(v);
      }
      fragment.push(colFragment);
    }

    if (fragment) {
      done(fragment);
    }
  }
);

export function iscelldata(txt: string) {
  // 判断是否为单元格格式
  const val = txt.split("!");
  let rangetxt: string;

  if (val.length > 1) {
    [, rangetxt] = val;
  } else {
    [rangetxt] = val;
  }

  const reg_cell = /^(([a-zA-Z]+)|([$][a-zA-Z]+))(([0-9]+)|([$][0-9]+))$/g; // 增加正则判断单元格为字母+数字的格式：如 A1:B3
  let reg_cellRange =
    /^(((([a-zA-Z]+)|([$][a-zA-Z]+))(([0-9]+)|([$][0-9]+)))|((([a-zA-Z]+)|([$][a-zA-Z]+))))$/g; // 增加正则判断单元格为字母+数字或字母的格式：如 A1:B3，A:A

  if (rangetxt.indexOf(":") === -1) {
    const row = parseInt(rangetxt.replace(/[^0-9]/g, ""), 10) - 1;
    const col = columnCharToIndex(rangetxt.replace(/[^A-Za-z]/g, ""));

    if (
      !Number.isNaN(row) &&
      !Number.isNaN(col) &&
      rangetxt.toString().match(reg_cell)
    ) {
      return true;
    }
    if (!Number.isNaN(row)) {
      return false;
    }
    if (!Number.isNaN(col)) {
      return false;
    }

    return false;
  }

  reg_cellRange =
    /^(((([a-zA-Z]+)|([$][a-zA-Z]+))(([0-9]+)|([$][0-9]+)))|((([a-zA-Z]+)|([$][a-zA-Z]+)))|((([0-9]+)|([$][0-9]+s))))$/g;

  const rangetxtArr = rangetxt.split(":");

  const row = [];
  const col = [];
  row[0] = parseInt(rangetxtArr[0].replace(/[^0-9]/g, ""), 10) - 1;
  row[1] = parseInt(rangetxtArr[1].replace(/[^0-9]/g, ""), 10) - 1;
  if (row[0] > row[1]) {
    return false;
  }

  col[0] = columnCharToIndex(rangetxtArr[0].replace(/[^A-Za-z]/g, ""));
  col[1] = columnCharToIndex(rangetxtArr[1].replace(/[^A-Za-z]/g, ""));
  if (col[0] > col[1]) {
    return false;
  }

  if (
    rangetxtArr[0].toString().match(reg_cellRange) &&
    rangetxtArr[1].toString().match(reg_cellRange)
  ) {
    return true;
  }

  return false;
}

function addToCellIndexList(txt: string, infoObj: any) {
  if (_.isNil(txt) || txt.length === 0 || _.isNil(infoObj)) {
    return;
  }
  if (_.isNil(cellTextToIndexList)) {
    cellTextToIndexList = {};
  }

  if (txt.indexOf("!") > -1) {
    txt = txt.replace(/\\'/g, "'").replace(/''/g, "'");
    cellTextToIndexList[txt] = infoObj;
  } else {
    cellTextToIndexList[`${txt}_${infoObj.sheetIndex}`] = infoObj;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addToSheetIndexList(
  ctx: Context,
  formulaTxt: string,
  sheetIndex: string,
  obIndex: string
) {
  if (_.isEmpty(formulaTxt)) {
    return;
  }

  if (_.isEmpty(sheetIndex)) {
    sheetIndex = ctx.currentSheetIndex;
  }

  if (_.isEmpty(obIndex)) {
    obIndex = "";
  }

  if (_.isNil(formulaContainSheetList)) {
    formulaContainSheetList = {};
  }

  if (_.isNil(formulaContainSheetList[formulaTxt])) {
    formulaContainSheetList[formulaTxt] = {};
  }

  formulaContainSheetList[formulaTxt][sheetIndex] = obIndex;
}

function getcellrange(ctx: Context, txt: string, formulaIndex?: string) {
  if (_.isNil(txt) || txt.length === 0) {
    return null;
  }
  const flowdata = getFlowdata(ctx);

  let sheettxt = "";
  let rangetxt = "";
  let sheetIndex = null;
  let sheetdata = null;

  const { luckysheetfile } = ctx;

  if (txt.indexOf("!") > -1) {
    if (txt in cellTextToIndexList) {
      return cellTextToIndexList[txt];
    }

    const val = txt.split("!");
    [sheettxt, rangetxt] = val;

    sheettxt = sheettxt.replace(/\\'/g, "'").replace(/''/g, "'");
    if (
      sheettxt.substring(0, 1) === "'" &&
      sheettxt.substring(sheettxt.length - 1, 1) === "'"
    ) {
      sheettxt = sheettxt.substring(1, sheettxt.length - 1);
    }
    _.forEach(luckysheetfile, (f) => {
      if (sheettxt === f.name) {
        sheetIndex = f.index;
        sheetdata = f.data;
        return false;
      }
      return true;
    });
  } else {
    let i = formulaIndex;
    if (_.isNil(i)) {
      i = ctx.currentSheetIndex;
    }
    if (`${txt}_${i}` in cellTextToIndexList) {
      return cellTextToIndexList[`${txt}_${i}`];
    }
    const index = getSheetIndex(ctx, i);
    if (_.isNil(index)) {
      return null;
    }
    sheettxt = luckysheetfile[index].name;
    sheetIndex = luckysheetfile[index].index;
    sheetdata = flowdata;
    rangetxt = txt;
  }

  if (_.isNil(sheetdata)) {
    return null;
  }

  if (rangetxt.indexOf(":") === -1) {
    const row = parseInt(rangetxt.replace(/[^0-9]/g, ""), 10) - 1;
    const col = columnCharToIndex(rangetxt.replace(/[^A-Za-z]/g, ""));

    if (!Number.isNaN(row) && !Number.isNaN(col)) {
      const item = {
        row: [row, row],
        column: [col, col],
        sheetIndex,
      };
      addToCellIndexList(txt, item);
      return item;
    }
    return null;
  }
  const rangetxtArr = rangetxt.split(":");
  const row = [];
  const col = [];
  row[0] = parseInt(rangetxtArr[0].replace(/[^0-9]/g, ""), 10) - 1;
  row[1] = parseInt(rangetxtArr[1].replace(/[^0-9]/g, ""), 10) - 1;
  if (Number.isNaN(row[0])) {
    row[0] = 0;
  }
  if (Number.isNaN(row[1])) {
    row[1] = sheetdata.length - 1;
  }
  if (row[0] > row[1]) {
    return null;
  }
  col[0] = columnCharToIndex(rangetxtArr[0].replace(/[^A-Za-z]/g, ""));
  col[1] = columnCharToIndex(rangetxtArr[1].replace(/[^A-Za-z]/g, ""));
  if (Number.isNaN(col[0])) {
    col[0] = 0;
  }
  if (Number.isNaN(col[1])) {
    col[1] = sheetdata[0].length - 1;
  }
  if (col[0] > col[1]) {
    return null;
  }

  const item = {
    row,
    column: col,
    sheetIndex,
  };
  addToCellIndexList(txt, item);
  return item;
}

function isFunctionRangeSaveChange(
  ctx: Context,
  str: string,
  r: number | null,
  c: number | null,
  index: string,
  dynamicArray_compute?: any
) {
  if (r != null && c != null) {
    const range = getcellrange(ctx, _.trim(str), index);
    if (_.isNil(range)) {
      return;
    }
    const { row } = range;
    const col = range.column;
    const { sheetIndex } = range;

    if (
      `${r}_${c}` in dynamicArray_compute &&
      (index === sheetIndex || _.isNil(index))
    ) {
      let isd_range = false;

      for (let d_r = row[0]; d_r <= row[1]; d_r += 1) {
        for (let d_c = col[0]; d_c <= col[1]; d_c += 1) {
          if (
            `${d_r}_${d_c}` in dynamicArray_compute &&
            dynamicArray_compute[`${d_r}_${d_c}`].r === r &&
            dynamicArray_compute[`${d_r}_${d_c}`].c === c
          ) {
            isd_range = true;
          }
        }
      }

      if (isd_range) {
        isFunctionRangeSave ||= true;
      } else {
        isFunctionRangeSave ||= false;
      }
    } else {
      if (
        r >= row[0] &&
        r <= row[1] &&
        c >= col[0] &&
        c <= col[1] &&
        (index === sheetIndex || _.isNil(index))
      ) {
        isFunctionRangeSave ||= true;
      } else {
        isFunctionRangeSave ||= false;
      }
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isFunctionRangeSave ||= false;
  }
}

function calPostfixExpression(cal: any[]) {
  if (cal.length === 0) {
    return "";
  }
  const stack: string[] = [];
  for (let i = cal.length - 1; i >= 0; i -= 1) {
    const c = cal[i];
    if (c in operatorjson) {
      const s2 = stack.pop();
      const s1 = stack.pop();
      const str = `luckysheet_compareWith(${s1},'${c}', ${s2})`;
      stack.push(str);
    } else {
      stack.push(c);
    }
  }

  if (stack.length > 0) {
    return stack[0];
  }

  return "";
}

function checkSpecialFunctionRange(
  ctx: Context,
  function_str: string,
  r: number | null,
  c: number | null,
  index: string,
  dynamicArray_compute?: any,
  cellRangeFunction?: any
) {
  if (
    function_str.substring(0, 30) === "luckysheet_getSpecialReference" ||
    function_str.substring(0, 20) === "luckysheet_function."
  ) {
    if (function_str.substring(0, 20) === "luckysheet_function.") {
      let funcName = function_str.split(".")[1];
      if (!_.isNil(funcName)) {
        funcName = funcName.toUpperCase();
        if (
          funcName !== "INDIRECT" &&
          funcName !== "OFFSET" &&
          funcName !== "INDEX"
        ) {
          return;
        }
      }
    }
    try {
      ctx.calculateSheetIndex = index;
      let str = new Function(`return ${function_str}`)();

      if (str instanceof Object && !_.isNil(str.startCell)) {
        str = str.startCell;
      }
      const str_nb = _.trim(str);
      // console.log(function_str, tempFunc,str, this.iscelldata(str_nb),this.isFunctionRangeSave,r,c);
      if (iscelldata(str_nb)) {
        if (typeof cellRangeFunction === "function") {
          cellRangeFunction(str_nb);
        }
        // this.isFunctionRangeSaveChange(str, r, c, index, dynamicArray_compute);
        // console.log(function_str, str, this.isFunctionRangeSave,r,c);
      }
    } catch {}
  }
}

function isFunctionRange(
  ctx: Context,
  txt: string,
  r: number | null,
  c: number | null,
  index: string,
  dynamicArray_compute: any,
  cellRangeFunction: any
) {
  if (_.isNil(operatorjson)) {
    const arr = operator.split("|");
    const op: any = {};

    for (let i = 0; i < arr.length; i += 1) {
      op[arr[i].toString()] = 1;
    }

    operatorjson = op;
  }

  if (txt.substring(0, 1) === "=") {
    txt = txt.substring(1);
  }

  const funcstack = txt.split("");
  let i = 0;
  let str = "";
  let function_str = "";

  const matchConfig = {
    bracket: 0,
    comma: 0,
    squote: 0,
    dquote: 0,
    compare: 0,
    braces: 0,
  };

  // let luckysheetfile = getluckysheetfile();
  // let dynamicArray_compute = luckysheetfile[getSheetIndex(Store.currentSheetIndex)_.isNil(]["dynamicArray_compute"]) ? {} : luckysheetfile[getSheetIndex(Store.currentSheetIndex)]["dynamicArray_compute"];

  // bracket 0为运算符括号、1为函数括号
  const cal1: any[] = [];
  const cal2: any[] = [];
  const bracket: any[] = [];
  let firstSQ = -1;
  while (i < funcstack.length) {
    const s = funcstack[i];

    if (
      s === "(" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      if (str.length > 0 && bracket.length === 0) {
        str = str.toUpperCase();
        if (str.indexOf(":") > -1) {
          const funcArray = str.split(":");
          function_str += `luckysheet_getSpecialReference(true,'${_.trim(
            funcArray[0]
          ).replace(/'/g, "\\'")}', luckysheet_function.${
            funcArray[1]
          }.f(#lucky#`;
        } else {
          function_str += `luckysheet_function.${str}.f(`;
        }
        bracket.push(1);
        str = "";
      } else if (bracket.length === 0) {
        function_str += "(";
        bracket.push(0);
        str = "";
      } else {
        bracket.push(0);
        str += s;
      }
    } else if (
      s === ")" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      bracket.pop();

      if (bracket.length === 0) {
        // function_str += _this.isFunctionRange(str,r,c, index,dynamicArray_compute,cellRangeFunction) + ")";
        // str = "";

        let functionS = isFunctionRange(
          ctx,
          str,
          r,
          c,
          index,
          dynamicArray_compute,
          cellRangeFunction
        );
        if (functionS.indexOf("#lucky#") > -1) {
          functionS = `${functionS.replace(/#lucky#/g, "")})`;
        }
        function_str += `${functionS})`;
        str = "";
      } else {
        str += s;
      }
    } else if (
      s === "{" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0
    ) {
      str += "{";
      matchConfig.braces += 1;
    } else if (
      s === "}" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0
    ) {
      str += "}";
      matchConfig.braces -= 1;
    } else if (s === '"' && matchConfig.squote === 0) {
      if (matchConfig.dquote > 0) {
        // 如果是""代表着输出"
        if (i < funcstack.length - 1 && funcstack[i + 1] === '"') {
          i += 1;
          str += "\x7F"; // 用DEL替换一下""
        } else {
          matchConfig.dquote -= 1;
          str += '"';
        }
      } else {
        matchConfig.dquote += 1;
        str += '"';
      }
    } else if (s === "'" && matchConfig.dquote === 0) {
      str += "'";

      if (matchConfig.squote > 0) {
        // if (firstSQ === i - 1)//配对的单引号后第一个字符不能是单引号
        // {
        //    代码到了此处应该是公式错误
        // }
        // 如果是''代表着输出'
        if (i < funcstack.length - 1 && funcstack[i + 1] === "'") {
          i += 1;
          str += "'";
        } else {
          // 如果下一个字符不是'代表单引号结束
          // if (funcstack[i - 1] === "'") {//配对的单引号后最后一个字符不能是单引号
          //    代码到了此处应该是公式错误
          // } else {
          matchConfig.squote -= 1;
          // }
        }
      } else {
        matchConfig.squote += 1;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        firstSQ = i;
      }
    } else if (
      s === "," &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      if (bracket.length <= 1) {
        // function_str += _this.isFunctionRange(str, r, c, index,dynamicArray_compute,cellRangeFunction) + ",";
        // str = "";

        let functionS = isFunctionRange(
          ctx,
          str,
          r,
          c,
          index,
          dynamicArray_compute,
          cellRangeFunction
        );
        if (functionS.indexOf("#lucky#") > -1) {
          functionS = `${functionS.replace(/#lucky#/g, "")})`;
        }
        function_str += `${functionS},`;
        str = "";
      } else {
        str += ",";
      }
    } else if (
      s in operatorjson &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      let s_next = "";
      const op = operatorPriority;

      if (i + 1 < funcstack.length) {
        s_next = funcstack[i + 1];
      }

      if (s + s_next in operatorjson) {
        if (bracket.length === 0) {
          if (_.trim(str).length > 0) {
            cal2.unshift(
              isFunctionRange(
                ctx,
                _.trim(str),
                r,
                c,
                index,
                dynamicArray_compute,
                cellRangeFunction
              )
            );
          } else if (_.trim(function_str).length > 0) {
            cal2.unshift(_.trim(function_str));
          }

          if (cal1[0] in operatorjson) {
            let stackCeilPri = op[cal1[0]];

            while (cal1.length > 0 && !_.isNil(stackCeilPri)) {
              cal2.unshift(cal1.shift());
              stackCeilPri = op[cal1[0]];
            }
          }

          cal1.unshift(s + s_next);

          function_str = "";
          str = "";
        } else {
          str += s + s_next;
        }

        i += 1;
      } else {
        if (bracket.length === 0) {
          if (_.trim(str).length > 0) {
            cal2.unshift(
              isFunctionRange(
                ctx,
                _.trim(str),
                r,
                c,
                index,
                dynamicArray_compute,
                cellRangeFunction
              )
            );
          } else if (_.trim(function_str).length > 0) {
            cal2.unshift(_.trim(function_str));
          }

          if (cal1[0] in operatorjson) {
            let stackCeilPri = op[cal1[0]];
            stackCeilPri = _.isNil(stackCeilPri) ? 1000 : stackCeilPri;

            let sPri = op[s];
            sPri = _.isNil(sPri) ? 1000 : sPri;

            while (cal1.length > 0 && sPri >= stackCeilPri) {
              cal2.unshift(cal1.shift());

              stackCeilPri = op[cal1[0]];
              stackCeilPri = _.isNil(stackCeilPri) ? 1000 : stackCeilPri;
            }
          }

          cal1.unshift(s);

          function_str = "";
          str = "";
        } else {
          str += s;
        }
      }
    } else {
      if (matchConfig.dquote === 0 && matchConfig.squote === 0) {
        str += _.trim(s);
      } else {
        str += s;
      }
    }

    if (i === funcstack.length - 1) {
      let endstr = "";
      let str_nb = _.trim(str).replace(/'/g, "\\'");
      if (iscelldata(str_nb) && str_nb.substring(0, 1) !== ":") {
        // endstr = "luckysheet_getcelldata('" + _.trim(str) + "')";
        endstr = `luckysheet_getcelldata('${str_nb}')`;
        isFunctionRangeSaveChange(ctx, str, r, c, index, dynamicArray_compute);
      } else if (str_nb.substring(0, 1) === ":") {
        str_nb = str_nb.substring(1);
        if (iscelldata(str_nb)) {
          endstr = `luckysheet_getSpecialReference(false,${function_str},'${str_nb}')`;
        }
      } else {
        str = _.trim(str);

        const regx = /{.*?}/;
        if (
          regx.test(str) &&
          str.substring(0, 1) !== '"' &&
          str.substring(str.length - 1, 1) !== '"'
        ) {
          const arraytxt = regx.exec(str)?.[0];
          const arraystart = str.search(regx);

          if (arraystart > 0) {
            endstr += str.substring(0, arraystart);
          }

          endstr += `luckysheet_getarraydata('${arraytxt}')`;

          if (arraystart + arraytxt!.length < str.length) {
            endstr += str.substring(arraystart + arraytxt!.length, str.length);
          }
        } else {
          endstr = str;
        }
      }

      if (endstr.length > 0) {
        cal2.unshift(endstr);
      }

      if (cal1.length > 0) {
        if (function_str.length > 0) {
          cal2.unshift(function_str);
          function_str = "";
        }

        while (cal1.length > 0) {
          cal2.unshift(cal1.shift());
        }
      }

      if (cal2.length > 0) {
        function_str = calPostfixExpression(cal2);
      } else {
        function_str += endstr;
      }
    }

    i += 1;
  }
  // console.log(function_str);
  checkSpecialFunctionRange(
    ctx,
    function_str,
    r,
    c,
    index,
    dynamicArray_compute,
    cellRangeFunction
  );
  return function_str;
}

export function getAllFunctionGroup(ctx: Context) {
  const { luckysheetfile } = ctx;
  let ret: any[] = [];
  for (let i = 0; i < luckysheetfile.length; i += 1) {
    const file = luckysheetfile[i];
    let { calcChain } = file;

    /* 备注：再次加载表格获取的数据可能是JSON字符串格式(需要进行发序列化处理) */
    if (calcChain) {
      const tempCalcChain: any[] = [];
      calcChain.forEach((item) => {
        if (typeof item === "string") {
          tempCalcChain.push(JSON.parse(item));
        } else {
          tempCalcChain.push(item);
        }
      });
      calcChain = tempCalcChain;
      file.calcChain = tempCalcChain;
    }

    let { dynamicArray_compute } = file;
    if (_.isNil(calcChain)) {
      calcChain = [];
    }

    if (_.isNil(dynamicArray_compute)) {
      dynamicArray_compute = [];
    }

    ret = ret.concat(calcChain);

    for (let j = 0; j < dynamicArray_compute.length; j += 1) {
      const d = dynamicArray_compute[0];
      ret.push({
        r: d.r,
        c: d.c,
        index: d.index,
      });
    }
  }

  return ret;
}

export function delFunctionGroup(
  ctx: Context,
  r: number,
  c: number,
  index?: string
) {
  if (_.isNil(index)) {
    index = ctx.currentSheetIndex;
  }

  const file = ctx.luckysheetfile[getSheetIndex(ctx, index)!];

  const { calcChain } = file;
  if (!_.isNil(calcChain)) {
    for (let i = 0; i < calcChain.length; i += 1) {
      const calc = calcChain[i];
      if (calc.r === r && calc.c === c && calc.index === index) {
        calcChain.splice(i, 1);
        // server.saveParam("fc", index, calc, {
        //   op: "del",
        //   pos: i,
        // });
        break;
      }
    }
  }

  const { dynamicArray } = file;
  if (!_.isNil(dynamicArray)) {
    for (let i = 0; i < dynamicArray.length; i += 1) {
      const calc = dynamicArray[i];
      if (
        calc.r === r &&
        calc.c === c &&
        (_.isNil(calc.index) || calc.index === index)
      ) {
        dynamicArray.splice(i, 1);
        // server.saveParam("ac", index, null, {
        //   op: "del",
        //   pos: i,
        // });
        break;
      }
    }
  }
}

function checkBracketNum(fp: string) {
  const bra_l = fp.match(/\(/g);
  const bra_r = fp.match(/\)/g);
  const bra_tl_txt = fp.match(/(['"])(?:(?!\1).)*?\1/g);
  const bra_tr_txt = fp.match(/(['"])(?:(?!\1).)*?\1/g);

  let bra_l_len = 0;
  let bra_r_len = 0;
  if (!_.isNil(bra_l)) {
    bra_l_len += bra_l.length;
  }
  if (!_.isNil(bra_r)) {
    bra_r_len += bra_r.length;
  }

  let bra_tl_len = 0;
  let bra_tr_len = 0;
  if (!_.isNil(bra_tl_txt)) {
    for (let i = 0; i < bra_tl_txt.length; i += 1) {
      const bra_tl = bra_tl_txt[i].match(/\(/g);
      if (!_.isNil(bra_tl)) {
        bra_tl_len += bra_tl.length;
      }
    }
  }

  if (!_.isNil(bra_tr_txt)) {
    for (let i = 0; i < bra_tr_txt.length; i += 1) {
      const bra_tr = bra_tr_txt[i].match(/\)/g);
      if (!_.isNil(bra_tr)) {
        bra_tr_len += bra_tr.length;
      }
    }
  }

  bra_l_len -= bra_tl_len;
  bra_r_len -= bra_tr_len;

  if (bra_l_len !== bra_r_len) {
    return false;
  }

  return true;
}

/*
function functionParser(txt: string, cellRangeFunction?: any) {
  if (_.isNil(operatorjson)) {
    const arr = operator.split("|");
    const op: any = {};

    for (let i = 0; i < arr.length; i += 1) {
      op[arr[i].toString()] = 1;
    }

    operatorjson = op;
  }

  if (_.isNil(txt)) {
    return "";
  }

  if (txt.substring(0, 2) === "=+") {
    txt = txt.substring(2);
  } else if (txt.substring(0, 1) === "=") {
    txt = txt.substring(1);
  }

  const funcstack = txt.split("");
  let i = 0;
  let str = "";
  let function_str = "";

  const matchConfig = {
    bracket: 0,
    comma: 0,
    squote: 0,
    dquote: 0,
    compare: 0,
    braces: 0,
  };

  //= (sum(b1:c10)+10)*5-100

  //= MAX(B1:C10,10)*5-100

  // =(sum(max(B1:C10,10)*5-100,((1+1)*2+5)/2,10)+count(B1:C10,10*5-100))*5-100

  //= SUM(MAX(B1:C10,10)*5-100,((1+1)*2+5)/2,10)+COUNT(B1:C10,10*5-100)

  //= SUM(MAX(B1:C10,10)*5-100,((1+1)*2+5)/2,10)

  //= SUM(10,((1+1)*2+5)/2,10)

  //= SUM(MAX(B1:C10,10)*5-100)

  //= IFERROR(IF(ROW()-ROW($G$3)=1,$F4+$D4,SUM($D1:INDEX($D$4:$D$9,1,1),$F1:INDEX($F$4:$F$9,1,1))), "")

  //= IFERROR(IF(ROW()-ROW($G$3)=1,$F4+$D4,SUM(INDEX($D$4:$D$9,1,1):$D4,INDEX($F$4:$F$9,1,1):$F4)), "")

  //= SUM(I$4:OFFSET(I10,0,0))

  // bracket 0为运算符括号、1为函数括号
  const cal1: any[] = [];
  const cal2: any[] = [];
  const bracket: any[] = [];
  let firstSQ = -1;
  while (i < funcstack.length) {
    const s = funcstack[i];

    if (
      s === "(" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      if (str.length > 0 && bracket.length === 0) {
        str = str.toUpperCase();
        if (str.indexOf(":") > -1) {
          const funcArray = str.split(":");
          function_str += `luckysheet_getSpecialReference(true,'${_.trim(
            funcArray[0]
          ).replace(/'/g, "\\'")}', luckysheet_function.${
            funcArray[1]
          }.f(#lucky#`;
        } else {
          function_str += `luckysheet_function.${str}.f(`;
        }
        bracket.push(1);
        str = "";
      } else if (bracket.length === 0) {
        function_str += "(";
        bracket.push(0);
        str = "";
      } else {
        bracket.push(0);
        str += s;
      }
    } else if (
      s === ")" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      const bt = bracket.pop();

      if (bracket.length === 0) {
        let functionS = functionParser(str, cellRangeFunction);
        if (functionS.indexOf("#lucky#") > -1) {
          functionS = `${functionS.replace(/#lucky#/g, "")})`;
        }
        function_str += `${functionS})`;
        str = "";
      } else {
        str += s;
      }
    } else if (
      s === "{" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0
    ) {
      str += "{";
      matchConfig.braces += 1;
    } else if (
      s === "}" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0
    ) {
      str += "}";
      matchConfig.braces -= 1;
    } else if (s === '"' && matchConfig.squote === 0) {
      if (matchConfig.dquote > 0) {
        // 如果是""代表着输出"
        if (i < funcstack.length - 1 && funcstack[i + 1] === '"') {
          i += 1;
          str += "\x7F"; // 用非打印控制字符DEL替换一下""
        } else {
          matchConfig.dquote -= 1;
          str += '"';
        }
      } else {
        matchConfig.dquote += 1;
        str += '"';
      }
    } else if (s === "'" && matchConfig.dquote === 0) {
      str += "'";

      if (matchConfig.squote > 0) {
        if (firstSQ === i - 1) {
          // 配对的单引号后第一个字符不能是单引号
          return "";
        }
        // 如果是''代表着输出'
        if (i < funcstack.length - 1 && funcstack[i + 1] === "'") {
          i += 1;
          str += "'";
        } else {
          // 如果下一个字符不是'代表单引号结束
          if (funcstack[i - 1] === "'") {
            // 配对的单引号后最后一个字符不能是单引号
            return "";
          }
          matchConfig.squote -= 1;
        }
      } else {
        matchConfig.squote += 1;
        firstSQ = i;
      }
    } else if (
      s === "," &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      if (bracket.length <= 1) {
        let functionS = functionParser(str, cellRangeFunction);
        if (functionS.indexOf("#lucky#") > -1) {
          functionS = `${functionS.replace(/#lucky#/g, "")})`;
        }
        function_str += `${functionS},`;
        str = "";
      } else {
        str += ",";
      }
    } else if (
      s in operatorjson &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      let s_next = "";
      const op = operatorPriority;

      if (i + 1 < funcstack.length) {
        s_next = funcstack[i + 1];
      }

      if (s + s_next in operatorjson) {
        if (bracket.length === 0) {
          if (_.trim(str).length > 0) {
            cal2.unshift(functionParser(_.trim(str), cellRangeFunction));
          } else if (_.trim(function_str).length > 0) {
            cal2.unshift(_.trim(function_str));
          }

          if (cal1[0] in operatorjson) {
            let stackCeilPri = op[cal1[0]];

            while (cal1.length > 0 && !_.isNil(stackCeilPri)) {
              cal2.unshift(cal1.shift());
              stackCeilPri = op[cal1[0]];
            }
          }

          cal1.unshift(s + s_next);

          function_str = "";
          str = "";
        } else {
          str += s + s_next;
        }

        i += 1;
      } else {
        if (bracket.length === 0) {
          if (_.trim(str).length > 0) {
            cal2.unshift(functionParser(_.trim(str), cellRangeFunction));
          } else if (_.trim(function_str).length > 0) {
            cal2.unshift(_.trim(function_str));
          }

          if (cal1[0] in operatorjson) {
            let stackCeilPri = op[cal1[0]];
            stackCeilPri = _.isNil(stackCeilPri) ? 1000 : stackCeilPri;

            let sPri = op[s];
            sPri = _.isNil(sPri) ? 1000 : sPri;

            while (cal1.length > 0 && sPri >= stackCeilPri) {
              cal2.unshift(cal1.shift());

              stackCeilPri = op[cal1[0]];
              stackCeilPri = _.isNil(stackCeilPri) ? 1000 : stackCeilPri;
            }
          }

          cal1.unshift(s);

          function_str = "";
          str = "";
        } else {
          str += s;
        }
      }
    } else {
      if (matchConfig.dquote === 0 && matchConfig.squote === 0) {
        // str += _.trim(s);
        str += s; // Do not use _.trim(s). When obtaining the worksheet name that contains spaces, you should keep the spaces
      } else {
        str += s;
      }
    }

    if (i === funcstack.length - 1) {
      let endstr = "";
      let str_nb = _.trim(str).replace(/'/g, "\\'");
      if (iscelldata(str_nb) && str_nb.substring(0, 1) !== ":") {
        endstr = `luckysheet_getcelldata('${str_nb}')`;
        if (typeof cellRangeFunction === "function") {
          cellRangeFunction(str_nb);
        }
      } else if (str_nb.substring(0, 1) === ":") {
        str_nb = str_nb.substring(1);
        if (iscelldata(str_nb)) {
          endstr = `luckysheet_getSpecialReference(false,${function_str},'${str_nb}')`;
        }
      } else {
        str = _.trim(str);

        const regx = /{.*?}/;
        if (
          regx.test(str) &&
          str.substring(0, 1) !== '"' &&
          str.substring(str.length - 1, 1) !== '"'
        ) {
          const arraytxt = regx.exec(str)[0];
          const arraystart = str.search(regx);
          const alltxt = "";

          if (arraystart > 0) {
            endstr += str.substring(0, arraystart);
          }

          endstr += `luckysheet_getarraydata('${arraytxt}')`;

          if (arraystart + arraytxt.length < str.length) {
            endstr += str.substring(arraystart + arraytxt.length, str.length);
          }
        } else {
          endstr = str;
        }
      }

      if (endstr.length > 0) {
        cal2.unshift(endstr);
      }

      if (cal1.length > 0) {
        if (function_str.length > 0) {
          cal2.unshift(function_str);
          function_str = "";
        }

        while (cal1.length > 0) {
          cal2.unshift(cal1.shift());
        }
      }

      if (cal2.length > 0) {
        function_str = calPostfixExpression(cal2);
      } else {
        function_str += endstr;
      }
    }

    i += 1;
  }
  // console.log(function_str);
  return function_str;
}
*/

/*
function functionParserExe(txt: string) {
  return functionParser(txt);
}

function testFunction(txt: string) {
  return txt.substring(0, 1) === "=";
}
*/

function insertUpdateFunctionGroup(
  ctx: Context,
  r: number,
  c: number,
  index?: string
) {
  if (_.isNil(index)) {
    index = ctx.currentSheetIndex;
  }

  // let func = getcellFormula(r, c, index);
  // if (_.isNil(func) || func.length==0) {
  //     this.delFunctionGroup(r, c, index);
  //     return;
  // }

  const { luckysheetfile } = ctx;
  const idx = getSheetIndex(ctx, index);
  if (_.isNil(idx)) {
    return;
  }
  const file = luckysheetfile[idx];

  let { calcChain } = file;
  if (_.isNil(calcChain)) {
    calcChain = [];
  }

  for (let i = 0; i < calcChain.length; i += 1) {
    const calc = calcChain[i];
    if (calc.r === r && calc.c === c && calc.index === index) {
      // server.saveParam("fc", index, calc, {
      //   op: "update",
      //   pos: i,
      // });
      return;
    }
  }

  const cc = {
    r,
    c,
    index,
  };
  calcChain.push(cc);
  file.calcChain = calcChain;

  // server.saveParam("fc", index, cc, {
  //   op: "add",
  //   pos: file.calcChain.length - 1,
  // });
  ctx.luckysheetfile = luckysheetfile;
}

export function execfunction(
  ctx: Context,
  txt: string,
  r: number,
  c: number,
  index?: string,
  isrefresh?: boolean,
  notInsertFunc?: boolean
) {
  currentContext = ctx;
  // const _locale = locale();
  // const locale_formulaMore = _locale.formulaMore;
  // console.log(txt,r,c)
  if (txt.indexOf(error.r) > -1) {
    return [false, error.r, txt];
  }

  if (!checkBracketNum(txt)) {
    txt += ")";
  }

  if (_.isNil(index)) {
    index = ctx.currentSheetIndex;
  }

  ctx.calculateSheetIndex = index;

  /*
  const fp = _.trim(functionParserExe(txt));
  if (
    fp.substring(0, 20) === "luckysheet_function." ||
    fp.substring(0, 22) === "luckysheet_compareWith"
  ) {
    functionHTMLIndex = 0;
  }

  if (!testFunction(txt) || fp === "") {
    // TODO tooltip.info("", locale_formulaMore.execfunctionError);
    return [false, error.n, txt];
  }

  let result = null;
  window.luckysheetCurrentRow = r;
  window.luckysheetCurrentColumn = c;
  window.luckysheetCurrentIndex = index;
  window.luckysheetCurrentFunction = txt;

  let sparklines = null;

  try {
    if (fp.indexOf("luckysheet_getcelldata") > -1) {
      const funcg = fp.split("luckysheet_getcelldata('");

      for (let i = 1; i < funcg.length; i += 1) {
        const funcgStr = funcg[i].split("')")[0];
        const funcgRange = getcellrange(ctx, funcgStr);

        if (funcgRange.row[0] < 0 || funcgRange.column[0] < 0) {
          return [true, error.r, txt];
        }

        if (
          funcgRange.sheetIndex === ctx.calculateSheetIndex &&
          r >= funcgRange.row[0] &&
          r <= funcgRange.row[1] &&
          c >= funcgRange.column[0] &&
          c <= funcgRange.column[1]
        ) {
          // TODO if (isEditMode()) {
          //   alert(locale_formulaMore.execfunctionSelfError);
          // } else {
          //   tooltip.info("", locale_formulaMore.execfunctionSelfErrorResult);
          // }

          return [false, 0, txt];
        }
      }
    }

    result = new Function(`return ${fp}`)();
    if (typeof result === "string") {
      // 把之前的非打印控制字符DEL替换回一个双引号。
      result = result.replace(/\x7F/g, '"');
    }

    // 加入sparklines的参数项目
    if (fp.indexOf("SPLINES") > -1) {
      sparklines = result;
      result = "";
    }
  } catch (e) {
    const err = e;
    // err错误提示处理
    console.log(e, fp);
    result = [error.n, err];
  }

  // 公式结果是对象，则表示只是选区。如果是单个单元格，则返回其值；如果是多个单元格，则返回 #VALUE!。
  if (_.isPlainObject(result) && !_.isNil(result.startCell)) {
    if (_.isArray(result.data)) {
      result = error.v;
    } else {
      if (_.isPlainObject(result.data) && !_.isEmpty(result.data.v)) {
        result = result.data.v;
      } else if (!_.isEmpty(result.data)) {
        // 只有data长或宽大于1才可能是选区
        if (result.cell > 1 || result.rowl > 1) {
          result = result.data;
        } // 否则就是单个不为null的没有值v的单元格
        else {
          result = 0;
        }
      } else {
        result = 0;
      }
    }
  }

  // 公式结果是数组，分错误值 和 动态数组 两种情况
  let dynamicArrayItem = null;

  if (_.isArray(result)) {
    let isErr = false;

    if (!_.isArray(result[0]) && result.length === 2) {
      isErr = valueIsError(result[0]);
    }

    if (!isErr) {
      if (
        _.isArray(result[0]) &&
        result.length === 1 &&
        result[0].length === 1
      ) {
        result = result[0][0];
      } else {
        dynamicArrayItem = { r, c, f: txt, index, data: result };
        result = "";
      }
    } else {
      result = result[0];
    }
  }

  window.luckysheetCurrentRow = null;
  window.luckysheetCurrentColumn = null;
  window.luckysheetCurrentIndex = null;
  window.luckysheetCurrentFunction = null;
  */

  const { result, error: formulaError } = parser.parse(txt.substring(1));

  if (!_.isNil(r) && !_.isNil(c)) {
    if (isrefresh) {
      // eslint-disable-next-line no-use-before-define
      execFunctionGroup(
        ctx,
        r,
        c,
        _.isNil(formulaError) ? result : formulaError,
        index
      );
    }

    if (!notInsertFunc) {
      insertUpdateFunctionGroup(ctx, r, c, index);
    }
  }

  /*
  if (sparklines) {
    return [true, result, txt, { type: "sparklines", data: sparklines }];
  }

  if (dynamicArrayItem) {
    return [
      true,
      result,
      txt,
      { type: "dynamicArrayItem", data: dynamicArrayItem },
    ];
  }
  */

  // console.log(result, txt);
  return [true, _.isNil(formulaError) ? result : formulaError, txt];
}

function insertUpdateDynamicArray(ctx: Context, dynamicArrayItem: any) {
  const { r, c } = dynamicArrayItem;
  let { index } = dynamicArrayItem;
  if (_.isNil(index)) {
    index = ctx.currentSheetIndex;
  }

  const { luckysheetfile } = ctx;
  const idx = getSheetIndex(ctx, index);
  if (idx == null) return [];

  const file = luckysheetfile[idx];

  let { dynamicArray } = file;
  if (_.isNil(dynamicArray)) {
    dynamicArray = [];
  }

  for (let i = 0; i < dynamicArray.length; i += 1) {
    const calc = dynamicArray[i];
    if (calc.r === r && calc.c === c && calc.index === index) {
      calc.data = dynamicArrayItem.data;
      calc.f = dynamicArrayItem.f;
      return dynamicArray;
    }
  }

  dynamicArray.push(dynamicArrayItem);
  return dynamicArray;
}

export function groupValuesRefresh(ctx: Context, refreshData: any[]) {
  const { luckysheetfile } = ctx;
  if (refreshData.length > 0) {
    for (let i = 0; i < refreshData.length; i += 1) {
      const item = refreshData[i];

      // if(item.i !== ctx.currentSheetIndex){
      //     continue;
      // }

      const idx = getSheetIndex(ctx, item.index);
      if (idx == null) continue;

      const file = luckysheetfile[idx];
      const { data } = file;
      if (_.isNil(data)) {
        continue;
      }

      const updateValue: any = {};
      if (!_.isNil(item.spe)) {
        if (item.spe.type === "sparklines") {
          updateValue.spl = item.spe.data;
        } else if (item.spe.type === "dynamicArrayItem") {
          file.dynamicArray = insertUpdateDynamicArray(ctx, item.spe.data);
        }
      }
      updateValue.v = item.v;
      updateValue.f = item.f;
      setCellValue(ctx, item.r, item.c, data, updateValue);
      // server.saveParam("v", item.index, data[item.r][item.c], {
      //     "r": item.r,
      //     "c": item.c
      // });
    }

    // editor.webWorkerFlowDataCache(Store.flowdata); // worker存数据
    // refreshData = [];
  }
}

export function execFunctionGroup(
  ctx: Context,
  origin_r: number,
  origin_c: number,
  value: any,
  index?: string,
  data?: any,
  isForce = false
) {
  if (_.isNil(data)) {
    data = getFlowdata(ctx);
  }

  // if (!window.luckysheet_compareWith) {
  //   window.luckysheet_compareWith = luckysheet_compareWith;
  //   window.luckysheet_getarraydata = luckysheet_getarraydata;
  //   window.luckysheet_getcelldata = luckysheet_getcelldata;
  //   window.luckysheet_parseData = luckysheet_parseData;
  //   window.luckysheet_getValue = luckysheet_getValue;
  //   window.luckysheet_indirect_check = luckysheet_indirect_check;
  //   window.luckysheet_indirect_check_return = luckysheet_indirect_check_return;
  //   window.luckysheet_offset_check = luckysheet_offset_check;
  //   window.luckysheet_calcADPMM = luckysheet_calcADPMM;
  //   window.luckysheet_getSpecialReference = luckysheet_getSpecialReference;
  // }

  if (_.isNil(formulaCache.execFunctionGlobalData)) {
    formulaCache.execFunctionGlobalData = {};
  }
  // let luckysheetfile = getluckysheetfile();
  // let dynamicArray_compute = luckysheetfile[getSheetIndex(ctx.currentSheetIndex)_.isNil(]["dynamicArray_compute"]) ? {} : luckysheetfile[getSheetIndex(ctx.currentSheetIndex)]["dynamicArray_compute"];

  if (_.isNil(index)) {
    index = ctx.currentSheetIndex;
  }

  if (!_.isNil(value)) {
    // 此处setcellvalue 中this.execFunctionGroupData会保存想要更新的值，本函数结尾不要设为null,以备后续函数使用
    // setcellvalue(origin_r, origin_c, _this.execFunctionGroupData, value);
    const cellCache: Cell[][] = [[{ v: undefined }]];
    setCellValue(ctx, 0, 0, cellCache, value);
    [
      [formulaCache.execFunctionGlobalData[`${origin_r}_${origin_c}_${index}`]],
    ] = cellCache;
  }

  // { "r": r, "c": c, "index": index, "func": func}
  const calcChains = getAllFunctionGroup(ctx);
  const formulaObjects: any = {};

  const sheets = ctx.luckysheetfile;
  const sheetData: any = {};
  for (let i = 0; i < sheets.length; i += 1) {
    const sheet = sheets[i];
    sheetData[sheet.index!] = sheet.data;
  }

  // 把修改涉及的单元格存储为对象
  const updateValueOjects: any = {};
  const updateValueArray: any = [];
  if (_.isNil(formulaCache.execFunctionExist)) {
    const key = `r${origin_r}c${origin_c}i${index}`;
    updateValueOjects[key] = 1;
  } else {
    for (let x = 0; x < formulaCache.execFunctionExist.length; x += 1) {
      const cell = formulaCache.execFunctionExist[x];
      const key = `r${cell.r}c${cell.c}i${cell.i}`;
      updateValueOjects[key] = 1;
    }
  }

  const arrayMatchCache: Record<
    string,
    { key: string; r: number; c: number; sheetIndex: string }[]
  > = {};
  const arrayMatch = (
    formulaArray: any,
    _formulaObjects: any,
    _updateValueOjects: any,
    func: any
  ) => {
    for (let a = 0; a < formulaArray.length; a += 1) {
      const range = formulaArray[a];
      const cacheKey = `r${range.row[0]}${range.row[1]}c${range.column[0]}${range.column[1]}index${range.sheetIndex}`;
      if (cacheKey in arrayMatchCache) {
        const amc = arrayMatchCache[cacheKey];
        // console.log(amc);
        amc.forEach((item) => {
          func(item.key, item.r, item.c, item.sheetIndex);
        });
      } else {
        const functionArr = [];
        for (let r = range.row[0]; r <= range.row[1]; r += 1) {
          for (let c = range.column[0]; c <= range.column[1]; c += 1) {
            const key = `r${r}c${c}i${range.sheetIndex}`;
            func(key, r, c, range.sheetIndex);
            if (
              (_formulaObjects && key in _formulaObjects) ||
              (_updateValueOjects && key in _updateValueOjects)
            ) {
              functionArr.push({
                key,
                r,
                c,
                sheetIndex: range.sheetIndex,
              });
            }
          }
        }

        if (_formulaObjects || _updateValueOjects) {
          arrayMatchCache[cacheKey] = functionArr;
        }
      }
    }
  };

  // 创建公式缓存及其范围的缓存
  // console.time("1");
  for (let i = 0; i < calcChains.length; i += 1) {
    const formulaCell = calcChains[i];
    const key = `r${formulaCell.r}c${formulaCell.c}i${formulaCell.index}`;
    const calc_funcStr = getcellFormula(
      ctx,
      formulaCell.r,
      formulaCell.c,
      formulaCell.index
    );
    if (_.isNil(calc_funcStr)) {
      continue;
    }
    const txt1 = calc_funcStr.toUpperCase();
    const isOffsetFunc =
      txt1.indexOf("INDIRECT(") > -1 ||
      txt1.indexOf("OFFSET(") > -1 ||
      txt1.indexOf("INDEX(") > -1;
    const formulaArray = [];

    if (isOffsetFunc) {
      isFunctionRange(
        ctx,
        calc_funcStr,
        null,
        null,
        formulaCell.index,
        null,
        (str_nb: string) => {
          const range = getcellrange(ctx, _.trim(str_nb), formulaCell.index);
          if (!_.isNil(range)) {
            formulaArray.push(range);
          }
        }
      );
    } else if (
      !(
        calc_funcStr.substring(0, 2) === '="' &&
        calc_funcStr.substring(calc_funcStr.length - 1, 1) === '"'
      )
    ) {
      // let formulaTextArray = calc_funcStr.split(/==|!=|<>|<=|>=|[,()=+-\/*%&^><]/g);//无法正确分割单引号或双引号之间有==、!=、-等运算符的情况。导致如='1-2'!A1公式中表名1-2的A1单元格内容更新后，公式的值不更新的bug
      // 解决='1-2'!A1+5会被calc_funcStr.split(/==|!=|<>|<=|>=|[,()=+-\/*%&^><]/g)分割成["","'1","2'!A1",5]的错误情况
      let point = 0; // 指针
      let squote = -1; // 双引号
      let dquote = -1; // 单引号
      const formulaTextArray = [];
      const sq_end_array = []; // 保存了配对的单引号在formulaTextArray的index索引。
      const calc_funcStr_length = calc_funcStr.length;
      for (let j = 0; j < calc_funcStr_length; j += 1) {
        const char = calc_funcStr.charAt(j);
        if (char === "'" && dquote === -1) {
          // 如果是单引号开始
          if (squote === -1) {
            if (point !== j) {
              formulaTextArray.push(
                ...calc_funcStr
                  .substring(point, j)
                  .split(/==|!=|<>|<=|>=|[,()=+-/*%&^><]/)
              );
            }
            squote = j;
            point = j;
          } // 单引号结束
          else {
            // if (squote === i - 1)//配对的单引号后第一个字符不能是单引号
            // {
            //    ;//到此处说明公式错误
            // }
            // 如果是''代表着输出'
            if (
              j < calc_funcStr_length - 1 &&
              calc_funcStr.charAt(j + 1) === "'"
            ) {
              j += 1;
            } else {
              // 如果下一个字符不是'代表单引号结束
              // if (calc_funcStr.charAt(i - 1) === "'") {//配对的单引号后最后一个字符不能是单引号
              //    ;//到此处说明公式错误
              point = j + 1;
              formulaTextArray.push(calc_funcStr.substring(squote, point));
              sq_end_array.push(formulaTextArray.length - 1);
              squote = -1;
              // } else {
              //    point = i + 1;
              //    formulaTextArray.push(calc_funcStr.substring(squote, point));
              //    sq_end_array.push(formulaTextArray.length - 1);
              //    squote = -1;
              // }
            }
          }
        }
        if (char === '"' && squote === -1) {
          // 如果是双引号开始
          if (dquote === -1) {
            if (point !== j) {
              formulaTextArray.push(
                ...calc_funcStr
                  .substring(point, j)
                  .split(/==|!=|<>|<=|>=|[,()=+-/*%&^><]/)
              );
            }
            dquote = j;
            point = j;
          } else {
            // 如果是""代表着输出"
            if (
              j < calc_funcStr_length - 1 &&
              calc_funcStr.charAt(j + 1) === '"'
            ) {
              j += 1;
            } else {
              // 双引号结束
              point = j + 1;
              formulaTextArray.push(calc_funcStr.substring(dquote, point));
              dquote = -1;
            }
          }
        }
      }
      if (point !== calc_funcStr_length) {
        formulaTextArray.push(
          ...calc_funcStr
            .substring(point, calc_funcStr_length)
            .split(/==|!=|<>|<=|>=|[,()=+-/*%&^><]/)
        );
      }
      // 拼接所有配对单引号及之后一个单元格内容，例如["'1-2'","!A1"]拼接为["'1-2'!A1"]
      for (let j = sq_end_array.length - 1; j >= 0; j -= 1) {
        if (sq_end_array[j] !== formulaTextArray.length - 1) {
          formulaTextArray[sq_end_array[j]] +=
            formulaTextArray[sq_end_array[j] + 1];
          formulaTextArray.splice(sq_end_array[j] + 1, 1);
        }
      }
      // 至此=SUM('1-2'!A1:A2&"'1-2'!A2")由原来的["","SUM","'1","2'!A1:A2","",""'1","2'!A2""]更正为["","SUM","","'1-2'!A1:A2","","",""'1-2'!A2""]

      for (let j = 0; j < formulaTextArray.length; j += 1) {
        const t = formulaTextArray[j];
        if (t.length <= 1) {
          continue;
        }

        if (
          t.substring(0, 1) === '"' &&
          t.substring(t.length - 1, 1) === '"' &&
          !iscelldata(t)
        ) {
          continue;
        }

        const range = getcellrange(ctx, _.trim(t), formulaCell.index);

        if (_.isNil(range)) {
          continue;
        }

        formulaArray.push(range);
      }
    }

    const item = {
      formulaArray,
      calc_funcStr,
      key,
      r: formulaCell.r,
      c: formulaCell.c,
      index: formulaCell.index,
      parents: {},
      chidren: {},
      color: "w",
    };

    formulaObjects[key] = item;

    // if(isForce){
    //     updateValueArray.push(item);
    // }
    // else{
    //     arrayMatch(formulaArray, null, function(key){
    //         if(key in updateValueOjects){
    //             updateValueArray.push(item);
    //         }
    //     });
    // }
  }

  // console.timeEnd("1");

  // console.time("2");
  // 形成一个公式之间引用的图结构
  Object.keys(formulaObjects).forEach((key) => {
    const formulaObject = formulaObjects[key];
    arrayMatch(
      formulaObject.formulaArray,
      formulaObjects,
      updateValueOjects,
      (childKey: string) => {
        if (childKey in formulaObjects) {
          const childFormulaObject = formulaObjects[childKey];
          formulaObject.chidren[childKey] = 1;
          childFormulaObject.parents[key] = 1;
        }
        // console.log(childKey,formulaObject.formulaArray);
        if (!isForce && childKey in updateValueOjects) {
          updateValueArray.push(formulaObject);
        }
      }
    );

    if (isForce) {
      updateValueArray.push(formulaObject);
    }
  });

  // console.log(formulaObjects)
  // console.timeEnd("2");

  // console.time("3");
  const formulaRunList = [];
  // 计算，采用深度优先遍历公式形成的图结构

  // updateValueArray.forEach((key)=>{
  //     let formulaObject = formulaObjects[key];

  // });

  let stack = updateValueArray;
  const existsFormulaRunList: any = {};
  while (stack.length > 0) {
    const formulaObject = stack.pop();

    if (_.isNil(formulaObject) || formulaObject.key in existsFormulaRunList) {
      continue;
    }

    if (formulaObject.color === "b") {
      formulaRunList.push(formulaObject);
      existsFormulaRunList[formulaObject.key] = 1;
      continue;
    }

    const cacheStack: any = [];
    Object.keys(formulaObject.parents).forEach((parentKey) => {
      const parentFormulaObject = formulaObjects[parentKey];
      if (!_.isNil(parentFormulaObject)) {
        cacheStack.push(parentFormulaObject);
      }
    });

    if (cacheStack.length === 0) {
      formulaRunList.push(formulaObject);
      existsFormulaRunList[formulaObject.key] = 1;
    } else {
      formulaObject.color = "b";
      stack.push(formulaObject);
      stack = stack.concat(cacheStack);
    }
  }

  formulaRunList.reverse();

  // console.log(formulaObjects, ii)
  // console.timeEnd("3");

  // console.time("4");
  for (let i = 0; i < formulaRunList.length; i += 1) {
    const formulaCell = formulaRunList[i];
    if (formulaCell.level === Math.max) {
      continue;
    }

    const { calc_funcStr } = formulaCell;

    const v = execfunction(
      ctx,
      calc_funcStr,
      formulaCell.r,
      formulaCell.c,
      formulaCell.index
    );

    formulaCache.groupValuesRefreshData.push({
      r: formulaCell.r,
      c: formulaCell.c,
      v: v[1],
      f: v[2],
      spe: v[3],
      index: formulaCell.index,
    });

    // _this.execFunctionGroupData[u.r][u.c] = value;
    formulaCache.execFunctionGlobalData[
      `${formulaCell.r}_${formulaCell.c}_${formulaCell.index}`
    ] = {
      v: v[1],
      f: v[2],
    };
  }
  // console.log(formulaRunList);
  // console.timeEnd("4");

  formulaCache.execFunctionExist = null;
}

function findrangeindex(v: string, vp: string) {
  const re = /<span.*?>/g;
  const v_a = v.replace(re, "").split("</span>");
  const vp_a = vp.replace(re, "").split("</span>");
  v_a.pop();
  vp_a.pop();

  let pfri = formulaCache.functionRangeIndex;
  if (!pfri) return [];

  const vplen = vp_a.length;
  const vlen = v_a.length;
  // 不增加元素输入
  if (vplen === vlen) {
    const i = pfri[0];
    const p = vp_a[i];
    const n = v_a[i];

    if (_.isNil(p)) {
      if (vp_a.length <= i) {
        pfri = [vp_a.length - 1, vp_a.length - 1];
      } else if (v_a.length <= i) {
        pfri = [v_a.length - 1, v_a.length - 1];
      }

      return pfri;
    }
    if (p.length === n.length) {
      if (
        !_.isNil(vp_a[i + 1]) &&
        !_.isNil(v_a[i + 1]) &&
        vp_a[i + 1].length < v_a[i + 1].length
      ) {
        pfri[0] += 1;
        pfri[1] = 1;
      }

      return pfri;
    }
    if (p.length > n.length) {
      if (
        !_.isNil(p) &&
        !_.isNil(v_a[i + 1]) &&
        v_a[i + 1].substring(0, 1) === '"' &&
        (p.indexOf("{") > -1 || p.indexOf("}") > -1)
      ) {
        pfri[0] += 1;
        pfri[1] = 1;
      }

      return pfri;
    }
    if (p.length < n.length) {
      if (pfri[1] > n.length) {
        pfri[1] = n.length;
      }

      return pfri;
    }
  }
  // 减少元素输入
  else if (vplen > vlen) {
    const i = pfri[0];
    const p = vp_a[i];
    const n = v_a[i];

    if (_.isNil(n)) {
      if (v_a[i - 1].indexOf("{") > -1) {
        pfri[0] -= 1;
        const start = v_a[i - 1].search("{");
        pfri[1] += start;
      } else {
        pfri[0] = 0;
        pfri[1] = 0;
      }
    } else if (p.length === n.length) {
      if (
        !_.isNil(v_a[i + 1]) &&
        (v_a[i + 1].substring(0, 1) === '"' ||
          v_a[i + 1].substring(0, 1) === "{" ||
          v_a[i + 1].substring(0, 1) === "}")
      ) {
        pfri[0] += 1;
        pfri[1] = 1;
      } else if (
        !_.isNil(p) &&
        p.length > 2 &&
        p.substring(0, 1) === '"' &&
        p.substring(p.length - 1, 1) === '"'
      ) {
        // pfri[1] = n.length-1;
      } else if (!_.isNil(v_a[i]) && v_a[i] === '")') {
        pfri[1] = 1;
      } else if (!_.isNil(v_a[i]) && v_a[i] === '"}') {
        pfri[1] = 1;
      } else if (!_.isNil(v_a[i]) && v_a[i] === "{)") {
        pfri[1] = 1;
      } else {
        pfri[1] = n.length;
      }

      return pfri;
    } else if (p.length > n.length) {
      if (
        !_.isNil(v_a[i + 1]) &&
        (v_a[i + 1].substring(0, 1) === '"' ||
          v_a[i + 1].substring(0, 1) === "{" ||
          v_a[i + 1].substring(0, 1) === "}")
      ) {
        pfri[0] += 1;
        pfri[1] = 1;
      }

      return pfri;
    } else if (p.length < n.length) {
      return pfri;
    }

    return pfri;
  }
  // 增加元素输入
  else if (vplen < vlen) {
    const i = pfri[0];
    const p = vp_a[i];
    const n = v_a[i];

    if (_.isNil(p)) {
      pfri[0] = v_a.length - 1;

      if (!_.isNil(n)) {
        pfri[1] = n.length;
      } else {
        pfri[1] = 1;
      }
    } else if (p.length === n.length) {
      if (
        _.isNil(vp_a[i + 1]) &&
        (vp_a[i + 1].substring(0, 1) === '"' ||
          vp_a[i + 1].substring(0, 1) === "{" ||
          vp_a[i + 1].substring(0, 1) === "}")
      ) {
        pfri[1] = n.length;
      } else if (
        !_.isNil(v_a[i + 1]) &&
        v_a[i + 1].substring(0, 1) === '"' &&
        (v_a[i + 1].substring(0, 1) === "{" ||
          v_a[i + 1].substring(0, 1) === "}")
      ) {
        pfri[0] += 1;
        pfri[1] = 1;
      } else if (
        !_.isNil(n) &&
        n.substring(0, 1) === '"' &&
        n.substring(n.length - 1, 1) === '"' &&
        p.substring(0, 1) === '"' &&
        p.substring(p.length - 1, 1) === ")"
      ) {
        pfri[1] = n.length;
      } else if (
        !_.isNil(n) &&
        n.substring(0, 1) === "{" &&
        n.substring(n.length - 1, 1) === "}" &&
        p.substring(0, 1) === "{" &&
        p.substring(p.length - 1, 1) === ")"
      ) {
        pfri[1] = n.length;
      } else {
        pfri[0] = pfri[0] + vlen - vplen;
        if (v_a.length > vp_a.length) {
          pfri[1] = v_a[i + 1].length;
        } else {
          pfri[1] = 1;
        }
      }

      return pfri;
    } else if (p.length > n.length) {
      if (!_.isNil(p) && p.substring(0, 1) === '"') {
        pfri[1] = n.length;
      } else if (_.isNil(v_a[i + 1]) && /{.*?}/.test(v_a[i + 1])) {
        pfri[0] += 1;
        pfri[1] = v_a[i + 1].length;
      } else if (
        !_.isNil(p) &&
        v_a[i + 1].substring(0, 1) === '"' &&
        (p.indexOf("{") > -1 || p.indexOf("}") > -1)
      ) {
        pfri[0] += 1;
        pfri[1] = 1;
      } else if (!_.isNil(p) && (p.indexOf("{") > -1 || p.indexOf("}") > -1)) {
      } else {
        pfri[0] = pfri[0] + vlen - vplen - 1;
        pfri[1] = v_a[i - 1].length;
      }

      return pfri;
    } else if (p.length < n.length) {
      return pfri;
    }

    return pfri;
  }

  return null;
}

/*
export function createRangeHightlight() {
  const $span = $("#luckysheet-rich-text-editor").find(
    "span.luckysheet-formula-functionrange-cell"
  );
  $(
    "#luckysheet-formula-functionrange .luckysheet-formula-functionrange-highlight"
  ).remove();

  $span.each(function () {
    const rangeindex = $(this).attr("rangeindex");
    const range = $(this).text();

    $("#luckysheet-formula-functionrange").append(
      replaceHtml(_this.rangeHightlightHTML, {
        id: rangeindex,
      })
    );

    const cellrange = _this.getcellrange(range);
    const rangeid = `luckysheet-formula-functionrange-highlight-${rangeindex}`;

    if (_.isNil(cellrange)) {
    } else if (
      cellrange.sheetIndex === Store.currentSheetIndex ||
      (cellrange.sheetIndex === -1 &&
        _this.rangetosheet === Store.currentSheetIndex)
    ) {
      $(`#${rangeid}`)
        .data("range", cellrange)
        .find(".luckysheet-copy")
        .css({ background: colors[rangeindex] })
        .end()
        .find(".luckysheet-highlight")
        .css({ background: colors[rangeindex] })
        .end()
        .find(".luckysheet-selection-copy-hc")
        .css({ background: colors[rangeindex] });

      seletedHighlistByindex(
        rangeid,
        cellrange.row[0],
        cellrange.row[1],
        cellrange.column[0],
        cellrange.column[1]
      );
    }
  });

  $(
    "#luckysheet-formula-functionrange .luckysheet-formula-functionrange-highlight"
  ).show();
}
*/

export function setCaretPosition(
  textDom: HTMLElement,
  children: number,
  pos: number
) {
  try {
    const el = textDom;
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(el.childNodes[children], pos);
    range.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(range);
    el.focus();
  } catch (err) {
    moveToEnd(formulaCache.rangeResizeTo[0]);
  }
}

function functionRange(obj: HTMLDivElement, v: string, vp: string) {
  if (window.getSelection) {
    // ie11 10 9 ff safari
    const currSelection = window.getSelection();
    if (!currSelection) return;
    const fri = findrangeindex(v, vp);

    if (_.isNil(fri)) {
      currSelection.selectAllChildren(obj);
      currSelection.collapseToEnd();
    } else {
      setCaretPosition(obj.querySelectorAll("span")[fri[0]], 0, fri[1]);
    }
    // @ts-ignore
  } else if (document.selection) {
    // ie10 9 8 7 6 5
    formulaCache.functionRangeIndex.moveToElementText(obj); // range定位到obj
    formulaCache.functionRangeIndex.collapse(false); // 光标移至最后
    formulaCache.functionRangeIndex.select();
  }
}

function searchFunction(ctx: Context, searchtxt: string) {
  const { functionlist } = locale(ctx);

  // // 这里的逻辑在原项目上做了修改
  // if (_.isNil($editer)) {
  //   return;
  // }
  // const inputContent = $editer.innerText.toUpperCase();
  // const reg = /^=([a-zA-Z_]+)\(?/;
  // const match = inputContent.match(reg);
  // if (!match) {
  //   ctx.functionCandidates = [];
  //   return;
  // }

  // const searchtxt = match[1];

  const f: typeof functionlist = [];
  const s: typeof functionlist = [];
  const t: typeof functionlist = [];
  let result_i = 0;

  for (let i = 0; i < functionlist.length; i += 1) {
    const item = functionlist[i];
    const { n } = item;

    if (n === searchtxt) {
      f.unshift(item);
      result_i += 1;
    } else if (n.startsWith(searchtxt)) {
      s.unshift(item);
      result_i += 1;
    } else if (n.indexOf(searchtxt) > -1) {
      t.unshift(item);
      result_i += 1;
    }

    if (result_i >= 10) {
      break;
    }
  }

  const list = [...f, ...s, ...t];
  if (list.length <= 0) {
    return;
  }

  ctx.functionCandidates = list;

  // const listHTML = _this.searchFunctionHTML(list);
  // $("#luckysheet-formula-search-c").html(listHTML).show();
  // $("#luckysheet-formula-help-c").hide();

  // const $c = $editer.parent();
  // const offset = $c.offset();
  // _this.searchFunctionPosition(
  //   $("#luckysheet-formula-search-c"),
  //   $c,
  //   offset.left,
  //   offset.top
  // );
}

function getrangeseleciton() {
  const currSelection = window.getSelection();
  if (!currSelection) return null;
  const { anchorNode, anchorOffset } = currSelection;

  if (!anchorNode) return null;

  if (
    anchorNode.parentNode?.nodeName?.toLowerCase() === "span" &&
    anchorOffset !== 0
  ) {
    let txt = _.trim(anchorNode.textContent || "");
    if (txt.length === 0 && anchorNode.parentNode.previousSibling) {
      const ahr = anchorNode.parentNode.previousSibling;
      txt = _.trim(ahr.textContent || "");
      return ahr;
    }
    return anchorNode.parentNode;
  }
  const anchorElement = anchorNode as HTMLElement;
  if (
    anchorElement.id === "luckysheet-rich-text-editor" ||
    anchorElement.id === "luckysheet-functionbox-cell"
  ) {
    let txt = _.trim(_.last(anchorElement.querySelectorAll("span"))?.innerText);

    if (txt.length === 0 && anchorElement.querySelectorAll("span").length > 1) {
      const ahr = anchorElement.querySelectorAll("span");
      txt = _.trim(ahr[ahr.length - 2].innerText);
      return ahr?.[0];
    }
    return _.last(anchorElement.querySelectorAll("span"));
  }
  if (
    anchorNode?.parentElement?.id === "luckysheet-rich-text-editor" ||
    anchorNode?.parentElement?.id === "luckysheet-functionbox-cell" ||
    anchorOffset === 0
  ) {
    const newAnchorNode =
      anchorOffset === 0 ? anchorNode?.parentNode : anchorNode;

    if (newAnchorNode?.previousSibling) {
      return newAnchorNode?.previousSibling;
    }
  }

  return null;
}

function helpFunctionExe(
  $editer: HTMLDivElement,
  currSelection: Node,
  ctx: Context
) {
  const { functionlist } = locale(ctx);
  // let _locale = locale();
  // let locale_formulaMore = _locale.formulaMore;
  // if ($("#luckysheet-formula-help-c").length === 0) {
  //   $("body").after(
  //     replaceHtml(_this.helpHTML, {
  //       helpClose: locale_formulaMore.helpClose,
  //       helpCollapse: locale_formulaMore.helpCollapse,
  //       helpExample: locale_formulaMore.helpExample,
  //       helpAbstract: locale_formulaMore.helpAbstract,
  //     })
  //   );
  //   $("#luckysheet-formula-help-c .luckysheet-formula-help-close").click(
  //     function () {
  //       $("#luckysheet-formula-help-c").hide();
  //     }
  //   );
  //   $("#luckysheet-formula-help-c .luckysheet-formula-help-collapse").click(
  //     function () {
  //       let $content = $(
  //         "#luckysheet-formula-help-c .luckysheet-formula-help-content"
  //       );
  //       $content.slideToggle(100, function () {
  //         let $c = _this.rangeResizeTo.parent(),
  //           offset = $c.offset();
  //         _this.searchFunctionPosition(
  //           $("#luckysheet-formula-help-c"),
  //           $c,
  //           offset.left,
  //           offset.top,
  //           true
  //         );
  //       });

  //       if ($content.is(":hidden")) {
  //         $(this).html('<i class="fa fa-angle-up" aria-hidden="true"></i>');
  //       } else {
  //         $(this).html('<i class="fa fa-angle-down" aria-hidden="true"></i>');
  //       }
  //     }
  //   );

  //   for (let i = 0; i < functionlist.length; i++) {
  //     _this.functionlistPosition[functionlist[i].n] = i;
  //   }
  // }
  if (_.isEmpty(formulaCache.functionlistMap)) {
    for (let i = 0; i < functionlist.length; i += 1) {
      formulaCache.functionlistMap[functionlist[i].n] = functionlist[i];
    }
  }
  if (!currSelection) {
    return null;
  }

  const $prev = currSelection;
  const $span = $editer.querySelectorAll("span");
  const currentIndex = _.indexOf(
    currSelection.parentNode?.childNodes,
    currSelection
  );
  let i = currentIndex;

  if ($prev == null) {
    return null;
  }

  let funcName = null;
  let paramindex = null;

  if ($span[i].classList.contains("luckysheet-formula-text-func")) {
    funcName = $span[i].textContent;
  } else {
    let $cur = null;
    let exceptIndex = [-1, -1];

    // eslint-disable-next-line no-plusplus
    while (--i > 0) {
      $cur = $span[i];

      if (
        $cur.classList.contains("luckysheet-formula-text-func") ||
        _.trim($cur.textContent || "").toUpperCase() in
          formulaCache.functionlistMap
      ) {
        funcName = $cur.textContent;
        paramindex = null;
        let endstate = true;

        for (let a = i; a <= currentIndex; a += 1) {
          if (!paramindex) {
            paramindex = 0;
          }

          if (a >= exceptIndex[0] && a <= exceptIndex[1]) {
            continue;
          }

          $cur = $span[a];
          if ($cur.classList.contains("luckysheet-formula-text-rpar")) {
            exceptIndex = [i, a];
            funcName = null;
            endstate = false;
            break;
          }

          if ($cur.classList.contains("luckysheet-formula-text-comma")) {
            paramindex += 1;
          }
        }

        if (endstate) {
          break;
        }
      }
    }
  }

  return funcName;
}

export function rangeHightlightselected(ctx: Context, $editor: HTMLDivElement) {
  const currSelection = getrangeseleciton();
  // $("#luckysheet-formula-search-c, #luckysheet-formula-help-c").hide();
  // $(
  //   "#luckysheet-formula-functionrange .luckysheet-formula-functionrange-highlight .luckysheet-selection-copy-hc"
  // ).css("opacity", "0.03");
  // $("#luckysheet-formula-search-c, #luckysheet-formula-help-c").hide();

  // if (
  //   $(currSelection).closest(".luckysheet-formula-functionrange-cell").length ==
  //   0
  // ) {
  if (!currSelection) return;

  const currText = _.trim(currSelection.textContent || "");
  if (currText?.match(/^[a-zA-Z_]+$/)) {
    searchFunction(ctx, currText.toUpperCase());
    ctx.functionHint = null;
  } else {
    const funcName = helpFunctionExe($editor, currSelection, ctx);
    ctx.functionHint = funcName?.toUpperCase();
    ctx.functionCandidates = [];
  }
  // return;
  // }

  // const $anchorOffset = $(currSelection).closest(
  //   ".luckysheet-formula-functionrange-cell"
  // );
  // const rangeindex = $anchorOffset.attr("rangeindex");
  // const rangeid = `luckysheet-formula-functionrange-highlight-${rangeindex}`;

  // $(`#${rangeid}`).find(".luckysheet-selection-copy-hc").css({
  //   opacity: "0.13",
  // });
}

function functionHTML(txt: string) {
  if (_.isNil(operatorjson)) {
    const arr = operator.split("|");
    const op: any = {};

    for (let i = 0; i < arr.length; i += 1) {
      op[arr[i].toString()] = 1;
    }

    operatorjson = op;
  }

  if (txt.substr(0, 1) === "=") {
    txt = txt.substr(1);
  }

  const funcstack = txt.split("");
  let i = 0;
  let str = "";
  let function_str = "";
  const matchConfig = {
    bracket: 0,
    comma: 0,
    squote: 0,
    dquote: 0,
    braces: 0,
  };

  while (i < funcstack.length) {
    const s = funcstack[i];

    if (
      s === "(" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      matchConfig.bracket += 1;

      if (str.length > 0) {
        function_str += `<span dir="auto" class="luckysheet-formula-text-func">${str}</span><span dir="auto" class="luckysheet-formula-text-lpar">(</span>`;
      } else {
        function_str +=
          '<span dir="auto" class="luckysheet-formula-text-lpar">(</span>';
      }

      str = "";
    } else if (
      s === ")" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      matchConfig.bracket -= 1;
      function_str += `${functionHTML(
        str
      )}<span dir="auto" class="luckysheet-formula-text-rpar">)</span>`;
      str = "";
    } else if (
      s === "{" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0
    ) {
      str += "{";
      matchConfig.braces += 1;
    } else if (
      s === "}" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0
    ) {
      str += "}";
      matchConfig.braces -= 1;
    } else if (s === '"' && matchConfig.squote === 0) {
      if (matchConfig.dquote > 0) {
        if (str.length > 0) {
          function_str += `${str}"</span>`;
        } else {
          function_str += '"</span>';
        }

        matchConfig.dquote -= 1;
        str = "";
      } else {
        matchConfig.dquote += 1;

        if (str.length > 0) {
          function_str += `${functionHTML(
            str
          )}<span dir="auto" class="luckysheet-formula-text-string">"`;
        } else {
          function_str +=
            '<span dir="auto" class="luckysheet-formula-text-string">"';
        }

        str = "";
      }
    }
    // 修正例如输入公式='1-2'!A1时，只有2'!A1是luckysheet-formula-functionrange-cell色，'1-是黑色的问题。
    else if (s === "'" && matchConfig.dquote === 0) {
      str += "'";
      matchConfig.squote = matchConfig.squote === 0 ? 1 : 0;
    } else if (
      s === "," &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      // matchConfig.comma += 1;
      function_str += `${functionHTML(
        str
      )}<span dir="auto" class="luckysheet-formula-text-comma">,</span>`;
      str = "";
    } else if (
      s === "&" &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      if (str.length > 0) {
        function_str +=
          `${functionHTML(
            str
          )}<span dir="auto" class="luckysheet-formula-text-calc">` +
          `&` +
          `</span>`;
        str = "";
      } else {
        function_str +=
          '<span dir="auto" class="luckysheet-formula-text-calc">' +
          "&" +
          "</span>";
      }
    } else if (
      s in operatorjson &&
      matchConfig.squote === 0 &&
      matchConfig.dquote === 0 &&
      matchConfig.braces === 0
    ) {
      let s_next = "";
      if (i + 1 < funcstack.length) {
        s_next = funcstack[i + 1];
      }

      let p = i - 1;
      let s_pre = null;
      if (p >= 0) {
        do {
          s_pre = funcstack[(p -= 1)];
        } while (p >= 0 && s_pre === " ");
      }

      if (s + s_next in operatorjson) {
        if (str.length > 0) {
          function_str += `${functionHTML(
            str
          )}<span dir="auto" class="luckysheet-formula-text-calc">${s}${s_next}</span>`;
          str = "";
        } else {
          function_str += `<span dir="auto" class="luckysheet-formula-text-calc">${s}${s_next}</span>`;
        }

        i += 1;
      } else if (
        !/[^0-9]/.test(s_next) &&
        s === "-" &&
        (s_pre === "(" ||
          _.isNil(s_pre) ||
          s_pre === "," ||
          s_pre === " " ||
          s_pre in operatorjson)
      ) {
        str += s;
      } else {
        if (str.length > 0) {
          function_str += `${functionHTML(
            str
          )}<span dir="auto" class="luckysheet-formula-text-calc">${s}</span>`;
          str = "";
        } else {
          function_str += `<span dir="auto" class="luckysheet-formula-text-calc">${s}</span>`;
        }
      }
    } else {
      str += s;
    }

    if (i === funcstack.length - 1) {
      // function_str += str;
      if (iscelldata(_.trim(str))) {
        function_str += `<span class="luckysheet-formula-functionrange-cell" rangeindex="${
          formulaCache.functionHTMLIndex
        }" dir="auto" style="color:${
          colors[formulaCache.functionHTMLIndex]
        };">${str}</span>`;
        formulaCache.functionHTMLIndex += 1;
      } else if (matchConfig.dquote > 0) {
        function_str += `${str}</span>`;
      } else if (str.indexOf("</span>") === -1 && str.length > 0) {
        const regx = /{.*?}/;

        if (regx.test(_.trim(str))) {
          const arraytxt = regx.exec(str)![0];
          const arraystart = str.search(regx);
          let alltxt = "";

          if (arraystart > 0) {
            alltxt += `<span dir="auto" class="luckysheet-formula-text-color">${str.substr(
              0,
              arraystart
            )}</span>`;
          }

          alltxt += `<span dir="auto" style="color:#959a05" class="luckysheet-formula-text-array">${arraytxt}</span>`;

          if (arraystart + arraytxt.length < str.length) {
            alltxt += `<span dir="auto" class="luckysheet-formula-text-color">${str.substr(
              arraystart + arraytxt.length,
              str.length
            )}</span>`;
          }

          function_str += alltxt;
        } else {
          function_str += `<span dir="auto" class="luckysheet-formula-text-color">${str}</span>`;
        }
      }
    }

    i += 1;
  }

  return function_str;
}

export function functionHTMLGenerate(txt: string) {
  if (txt.length === 0 || txt.substring(0, 1) !== "=") {
    return txt;
  }

  formulaCache.functionHTMLIndex = 0;

  return `<span dir="auto" class="luckysheet-formula-text-color">=</span>${functionHTML(
    txt
  )}`;
}

export function handleFormulaInput(
  ctx: Context,
  $copyTo: HTMLDivElement,
  $editor: HTMLDivElement,
  kcode: number
) {
  // if (isEditMode()) {
  //   // 此模式下禁用公式栏
  //   return;
  // }
  let value1 = $editor.innerHTML;
  const value1txt = $editor.innerText;
  let value = $editor.innerText;
  value = escapeScriptTag(value);
  if (
    value.length > 0 &&
    value.substring(0, 1) === "=" &&
    (kcode !== 229 || value.length === 1)
  ) {
    value = functionHTMLGenerate(value);
    value1 = functionHTMLGenerate(value1txt);

    if (window.getSelection) {
      // all browsers, except IE before version 9
      const currSelection = window.getSelection();
      if (!currSelection) return;
      if (currSelection.anchorNode?.nodeName.toLowerCase() === "div") {
        const editorlen = $editor.querySelectorAll("span").length;
        formulaCache.functionRangeIndex = [
          editorlen - 1,
          $editor.querySelectorAll("span").item(editorlen - 1).textContent
            ?.length,
        ];
      } else {
        formulaCache.functionRangeIndex = [
          _.indexOf(
            currSelection.anchorNode?.parentNode?.parentNode?.childNodes,
            // @ts-ignore
            currSelection.anchorNode?.parentNode
          ),
          currSelection.anchorOffset,
        ];
      }
    } else {
      // Internet Explorer before version 9
      // @ts-ignore
      const textRange = document.selection.createRange();
      formulaCache.functionRangeIndex = textRange;
    }

    $editor.innerHTML = value;
    // the cursor will be set to the beginning of input box after set innerHTML,
    // restoring it to the correct position
    functionRange($editor, value, value1);
    // TODO canceFunctionrangeSelected();

    if (kcode !== 46) {
      // delete不执行此函数
      // TODO createRangeHightlight();
    }

    $copyTo.innerHTML = value;
    // rangestart = false;
    // rangedrag_column_start = false;
    // rangedrag_row_start = false;

    rangeHightlightselected(ctx, $editor);
  } else if (value1txt.substring(0, 1) !== "=") {
    if ($copyTo.id === "luckysheet-rich-text-editor") {
      if (!$copyTo.innerHTML.startsWith("<span")) {
        $copyTo.innerHTML = value;
      }
    } else {
      $copyTo.innerHTML = value;
    }
  }
}

function isfreezonFuc(txt: string) {
  const row = txt.replace(/[^0-9]/g, "");
  const col = txt.replace(/[^A-Za-z]/g, "");
  const row$ = txt.substr(txt.indexOf(row) - 1, 1);
  const col$ = txt.substr(txt.indexOf(col) - 1, 1);
  const ret = [false, false];

  if (row$ === "$") {
    ret[0] = true;
  }
  if (col$ === "$") {
    ret[1] = true;
  }

  return ret;
}

function functionStrChange_range(
  txt: string,
  type: string,
  rc: "row" | "col",
  orient: string | null,
  stindex: number,
  step: number
) {
  const val = txt.split("!");
  let rangetxt;
  let prefix = "";

  if (val.length > 1) {
    [, rangetxt] = val;
    prefix = `${val[0]}!`;
  } else {
    [rangetxt] = val;
  }

  let r1;
  let r2;
  let c1;
  let c2;
  let $row0;
  let $row1;
  let $col0;
  let $col1;

  if (rangetxt.indexOf(":") === -1) {
    r1 = parseInt(rangetxt.replace(/[^0-9]/g, ""), 10) - 1;
    r2 = r1;
    c1 = columnCharToIndex(rangetxt.replace(/[^A-Za-z]/g, ""));
    c2 = c1;

    const freezonFuc = isfreezonFuc(rangetxt);

    $row0 = freezonFuc[0] ? "$" : "";
    $row1 = $row0;
    $col0 = freezonFuc[1] ? "$" : "";
    $col1 = $col0;
  } else {
    rangetxt = rangetxt.split(":");

    r1 = parseInt(rangetxt[0].replace(/[^0-9]/g, ""), 10) - 1;
    r2 = parseInt(rangetxt[1].replace(/[^0-9]/g, ""), 10) - 1;
    if (r1 > r2) {
      return txt;
    }

    c1 = columnCharToIndex(rangetxt[0].replace(/[^A-Za-z]/g, ""));
    c2 = columnCharToIndex(rangetxt[1].replace(/[^A-Za-z]/g, ""));
    if (c1 > c2) {
      return txt;
    }

    const freezonFuc0 = isfreezonFuc(rangetxt[0]);
    $row0 = freezonFuc0[0] ? "$" : "";
    $col0 = freezonFuc0[1] ? "$" : "";

    const freezonFuc1 = isfreezonFuc(rangetxt[1]);
    $row1 = freezonFuc1[0] ? "$" : "";
    $col1 = freezonFuc1[1] ? "$" : "";
  }

  if (type === "del") {
    if (rc === "row") {
      if (r1 >= stindex && r2 <= stindex + step - 1) {
        return error.r;
      }

      if (r1 > stindex + step - 1) {
        r1 -= step;
      } else if (r1 >= stindex) {
        r1 = stindex;
      }

      if (r2 > stindex + step - 1) {
        r2 -= step;
      } else if (r2 >= stindex) {
        r2 = stindex - 1;
      }

      if (r1 < 0) {
        r1 = 0;
      }

      if (r2 < r1) {
        r2 = r1;
      }
    } else if (rc === "col") {
      if (c1 >= stindex && c2 <= stindex + step - 1) {
        return error.r;
      }

      if (c1 > stindex + step - 1) {
        c1 -= step;
      } else if (c1 >= stindex) {
        c1 = stindex;
      }

      if (c2 > stindex + step - 1) {
        c2 -= step;
      } else if (c2 >= stindex) {
        c2 = stindex - 1;
      }

      if (c1 < 0) {
        c1 = 0;
      }

      if (c2 < c1) {
        c2 = c1;
      }
    }

    if (r1 === r2 && c1 === c2) {
      if (!Number.isNaN(r1) && !Number.isNaN(c1)) {
        return prefix + $col0 + indexToColumnChar(c1) + $row0 + (r1 + 1);
      }
      if (!Number.isNaN(r1)) {
        return prefix + $row0 + (r1 + 1);
      }
      if (!Number.isNaN(c1)) {
        return prefix + $col0 + indexToColumnChar(c1);
      }
      return txt;
    }
    if (Number.isNaN(c1) && Number.isNaN(c2)) {
      return `${prefix + $row0 + (r1 + 1)}:${$row1}${r2 + 1}`;
    }
    if (Number.isNaN(r1) && Number.isNaN(r2)) {
      return `${
        prefix + $col0 + indexToColumnChar(c1)
      }:${$col1}${indexToColumnChar(c2)}`;
    }
    return `${
      prefix + $col0 + indexToColumnChar(c1) + $row0 + (r1 + 1)
    }:${$col1}${indexToColumnChar(c2)}${$row1}${r2 + 1}`;
  }
  if (type === "add") {
    if (rc === "row") {
      if (orient === "lefttop") {
        if (r1 >= stindex) {
          r1 += step;
        }

        if (r2 >= stindex) {
          r2 += step;
        }
      } else if (orient === "rightbottom") {
        if (r1 > stindex) {
          r1 += step;
        }

        if (r2 > stindex) {
          r2 += step;
        }
      }
    } else if (rc === "col") {
      if (orient === "lefttop") {
        if (c1 >= stindex) {
          c1 += step;
        }

        if (c2 >= stindex) {
          c2 += step;
        }
      } else if (orient === "rightbottom") {
        if (c1 > stindex) {
          c1 += step;
        }

        if (c2 > stindex) {
          c2 += step;
        }
      }
    }

    if (r1 === r2 && c1 === c2) {
      if (!Number.isNaN(r1) && !Number.isNaN(c1)) {
        return prefix + $col0 + indexToColumnChar(c1) + $row0 + (r1 + 1);
      }
      if (!Number.isNaN(r1)) {
        return prefix + $row0 + (r1 + 1);
      }
      if (!Number.isNaN(c1)) {
        return prefix + $col0 + indexToColumnChar(c1);
      }
      return txt;
    }
    if (Number.isNaN(c1) && Number.isNaN(c2)) {
      return `${prefix + $row0 + (r1 + 1)}:${$row1}${r2 + 1}`;
    }
    if (Number.isNaN(r1) && Number.isNaN(r2)) {
      return `${
        prefix + $col0 + indexToColumnChar(c1)
      }:${$col1}${indexToColumnChar(c2)}`;
    }
    return `${
      prefix + $col0 + indexToColumnChar(c1) + $row0 + (r1 + 1)
    }:${$col1}${indexToColumnChar(c2)}${$row1}${r2 + 1}`;
  }
  return "";
}

export function israngeseleciton(istooltip?: boolean) {
  // istooltip疑似无用

  if (operatorjson == null) {
    const arr = operator.split("|");
    const op = {};

    for (let i = 0; i < arr.length; i += 1) {
      _.set(op, arr[i].toString(), 1);
    }

    operatorjson = op;
  }

  if (istooltip == null) {
    istooltip = false;
  }

  const currSelection = window.getSelection();
  if (currSelection == null) return false;
  let anchor = currSelection.anchorNode;
  if (!anchor?.textContent) return false;
  const { anchorOffset } = currSelection;
  const anchorElement = anchor as HTMLElement;
  const parentElement = anchor.parentNode as HTMLElement;
  if (
    anchor?.parentNode?.nodeName.toLowerCase() === "span" &&
    anchorOffset !== 0
  ) {
    let txt = _.trim(anchor.textContent);
    let lasttxt = "";

    if (txt.length === 0 && anchor.parentNode.previousSibling) {
      const ahr = anchor.parentNode.previousSibling;
      txt = _.trim(ahr.textContent || "");
      lasttxt = txt.substring(txt.length - 1, 1);
      formulaCache.rangeSetValueTo = ahr;
    } else {
      lasttxt = txt.substring(anchorOffset - 1, 1);
      formulaCache.rangeSetValueTo = anchor.parentNode;
    }

    if (
      (istooltip && (lasttxt === "(" || lasttxt === ",")) ||
      (!istooltip &&
        (lasttxt === "(" ||
          lasttxt === "," ||
          lasttxt === "=" ||
          lasttxt in operatorjson ||
          lasttxt === "&"))
    ) {
      return true;
    }
  } else if (
    anchorElement.id === "luckysheet-rich-text-editor" ||
    anchorElement.id === "luckysheet-functionbox-cell"
  ) {
    let txt = _.trim(_.last(anchorElement.querySelectorAll("span"))?.innerText);

    formulaCache.rangeSetValueTo = _.last(
      anchorElement.querySelectorAll("span")
    );

    if (txt.length === 0 && anchorElement.querySelectorAll("span").length > 1) {
      const ahr = anchorElement.querySelectorAll("span");
      txt = _.trim(ahr[ahr.length - 2].innerText);

      txt = _.trim(ahr[ahr.length - 2].innerText);
      formulaCache.rangeSetValueTo = ahr;
    }

    const lasttxt = txt.substring(txt.length - 1, 1);

    if (
      (istooltip && (lasttxt === "(" || lasttxt === ",")) ||
      (!istooltip &&
        (lasttxt === "(" ||
          lasttxt === "," ||
          lasttxt === "=" ||
          lasttxt in operatorjson ||
          lasttxt === "&"))
    ) {
      return true;
    }
  } else if (
    parentElement.id === "luckysheet-rich-text-editor" ||
    parentElement.id === "luckysheet-functionbox-cell" ||
    anchorOffset === 0
  ) {
    if (anchorOffset === 0) {
      anchor = anchor.parentNode;
    }
    if (!anchor) return false;
    if (anchor.previousSibling?.textContent == null) return false;
    if (anchor.previousSibling) {
      const txt = _.trim(anchor.previousSibling.textContent);
      const lasttxt = txt.substring(txt.length - 1, 1);

      formulaCache.rangeSetValueTo = anchor.previousSibling;

      if (
        (istooltip && (lasttxt === "(" || lasttxt === ",")) ||
        (!istooltip &&
          (lasttxt === "(" ||
            lasttxt === "," ||
            lasttxt === "=" ||
            lasttxt in operatorjson ||
            lasttxt === "&"))
      ) {
        return true;
      }
    }
  }

  return false;
}

export function functionStrChange(
  txt: string,
  type: string,
  rc: "row" | "col",
  orient: string | null,
  stindex: number,
  step: number
) {
  if (!txt) {
    return "";
  }
  if (operatorjson == null) {
    const arr = operator.split("|");
    const op: any = {};

    for (let i = 0; i < arr.length; i += 1) {
      op[arr[i].toString()] = 1;
    }

    operatorjson = op;
  }

  if (txt.substring(0, 1) === "=") {
    txt = txt.substring(1);
  }

  const funcstack = txt.split("");
  let i = 0;
  let str = "";
  let function_str = "";

  const matchConfig = {
    bracket: 0, // 括号
    comma: 0, // 逗号
    squote: 0, // 单引号
    dquote: 0, // 双引号
  };

  while (i < funcstack.length) {
    const s = funcstack[i];

    if (s === "(" && matchConfig.dquote === 0) {
      matchConfig.bracket += 1;

      if (str.length > 0) {
        function_str += `${str}(`;
      } else {
        function_str += "(";
      }

      str = "";
    } else if (s === ")" && matchConfig.dquote === 0) {
      matchConfig.bracket -= 1;
      function_str += `${functionStrChange(
        str,
        type,
        rc,
        orient,
        stindex,
        step
      )})`;
      str = "";
    } else if (s === '"' && matchConfig.squote === 0) {
      if (matchConfig.dquote > 0) {
        function_str += `${str}"`;
        matchConfig.dquote -= 1;
        str = "";
      } else {
        matchConfig.dquote += 1;
        str += '"';
      }
    } else if (s === "," && matchConfig.dquote === 0) {
      function_str += `${functionStrChange(
        str,
        type,
        rc,
        orient,
        stindex,
        step
      )},`;
      str = "";
    } else if (s === "&" && matchConfig.dquote === 0) {
      if (str.length > 0) {
        function_str += `${functionStrChange(
          str,
          type,
          rc,
          orient,
          stindex,
          step
        )}&`;
        str = "";
      } else {
        function_str += "&";
      }
    } else if (s in operatorjson && matchConfig.dquote === 0) {
      let s_next = "";

      if (i + 1 < funcstack.length) {
        s_next = funcstack[i + 1];
      }

      let p = i - 1;
      let s_pre = null;

      if (p >= 0) {
        do {
          s_pre = funcstack[(p -= 1)];
        } while (p >= 0 && s_pre === " ");
      }

      if (s + s_next in operatorjson) {
        if (str.length > 0) {
          function_str +=
            functionStrChange(str, type, rc, orient, stindex, step) +
            s +
            s_next;
          str = "";
        } else {
          function_str += s + s_next;
        }

        i += 1;
      } else if (
        !/[^0-9]/.test(s_next) &&
        s === "-" &&
        (s_pre === "(" ||
          s_pre == null ||
          s_pre === "," ||
          s_pre === " " ||
          s_pre in operatorjson)
      ) {
        str += s;
      } else {
        if (str.length > 0) {
          function_str +=
            functionStrChange(str, type, rc, orient, stindex, step) + s;
          str = "";
        } else {
          function_str += s;
        }
      }
    } else {
      str += s;
    }

    if (i === funcstack.length - 1) {
      if (iscelldata(_.trim(str))) {
        function_str += functionStrChange_range(
          _.trim(str),
          type,
          rc,
          orient,
          stindex,
          step
        );
      } else {
        function_str += _.trim(str);
      }
    }

    i += 1;
  }

  return function_str;
}
export function rangeSetValue(ctx: Context, selected: any) {
  // let range = "";
  const rf = selected.row[0];
  const cf = selected.column[0];
  if (ctx.config.merge != null && `${rf}_${cf}` in ctx.config.merge) {
    // range = getRangetxt(
    //   ctx,
    //   ctx.currentSheetIndex,
    //   {
    //     column: [cf, cf],
    //     row: [rf, rf],
    //   },
    //   formulaCache.rangetosheet
    // );
  } else {
    // range = getRangetxt(
    //   ctx,
    //   ctx.currentSheetIndex,
    //   selected,
    //   formulaCache.rangetosheet
    // );
  }

  // let $editor;

  // if (
  //   formulaCache.rangestart ||
  //   formulaCache.rangedrag_column_start ||
  //   formulaCache.rangedrag_row_start
  // )
  // {
  //   if (
  //     $("#luckysheet-search-formula-parm").is(":visible") ||
  //     $("#luckysheet-search-formula-parm-select").is(":visible")
  //   ) {
  //     // 公式参数框选取范围
  //     $editor = $("#luckysheet-rich-text-editor");
  //     $("#luckysheet-search-formula-parm-select-input").val(range);
  //     $("#luckysheet-search-formula-parm .parmBox")
  //       .eq(formulaCache.data_parm_index)
  //       .find(".txt input")
  //       .val(range);

  //     // 参数对应值显示
  //     const txtdata = luckysheet_getcelldata(range).data;
  //     if (txtdata instanceof Array) {
  //       // 参数为多个单元格选区
  //       const txtArr = [];

  //       for (let i = 0; i < txtdata.length; i += 1) {
  //         for (let j = 0; j < txtdata[i].length; j += 1) {
  //           if (txtdata[i][j] == null) {
  //             txtArr.push(null);
  //           } else {
  //             txtArr.push(txtdata[i][j].v);
  //           }
  //         }
  //       }

  //       $("#luckysheet-search-formula-parm .parmBox")
  //         .eq(formulaCache.data_parm_index)
  //         .find(".val")
  //         .text(` = {${txtArr.join(",")}}`);
  //     } else {
  //       // 参数为单个单元格选区
  //       $("#luckysheet-search-formula-parm .parmBox")
  //         .eq(formulaCache.data_parm_index)
  //         .find(".val")
  //         .text(` = {${txtdata.v}}`);
  //     }

  //     // 计算结果显示
  //     let isVal = true; // 参数不为空
  //     const parmValArr = []; // 参数值集合
  //     let lvi = -1; // 最后一个有值的参数索引
  //     $("#luckysheet-search-formula-parm .parmBox").each(function (i, e) {
  //       const parmtxt = $(e).find(".txt input").val();
  //       if (
  //         parmtxt === "" &&
  //         $(e).find(".txt input").attr("data_parm_require") === "m"
  //       ) {
  //         isVal = false;
  //       }
  //       if (parmtxt !== "") {
  //         lvi = i;
  //       }
  //     });

  // 单元格显示
  //     let functionHtmlTxt;
  //     if (lvi === -1) {
  //       functionHtmlTxt = `=${$(
  //         "#luckysheet-search-formula-parm .luckysheet-modal-dialog-title-text"
  //       ).text()}()`;
  //     } else if (lvi === 0) {
  //       functionHtmlTxt = `=${$(
  //         "#luckysheet-search-formula-parm .luckysheet-modal-dialog-title-text"
  //       ).text()}(${$("#luckysheet-search-formula-parm .parmBox")
  //         .eq(0)
  //         .find(".txt input")
  //         .val()})`;
  //     } else {
  //       for (let j = 0; j <= lvi; j += 1) {
  //         parmValArr.push(
  //           $("#luckysheet-search-formula-parm .parmBox")
  //             .eq(j)
  //             .find(".txt input")
  //             .val()
  //         );
  //       }
  //       functionHtmlTxt = `=${$(
  //         "#luckysheet-search-formula-parm .luckysheet-modal-dialog-title-text"
  //       ).text()}(${parmValArr.join(",")})`;
  //     }

  //     const function_str = functionHTMLGenerate(functionHtmlTxt);
  //     $("#luckysheet-rich-text-editor").html(function_str);
  //     $("#luckysheet-functionbox-cell").html(
  //       $("#luckysheet-rich-text-editor").html()
  //     );

  //     if (isVal) {
  //       // 公式计算
  //       const fp = _.trim(
  //         functionParserExe($("#luckysheet-rich-text-editor").text())
  //       );
  //       const result = new Function(`return ${fp}`)();
  //       $("#luckysheet-search-formula-parm .result span").text(result);
  //     }
  //   } else {
  //     const currSelection = window.getSelection();
  //     const anchorOffset = currSelection!.anchorNode;
  //     $editor = $(anchorOffset).closest("div");

  //     const $span = $editor
  //       .find(`span[rangeindex='${formulaCache.rangechangeindex}']`)
  //       .html(range);

  //     setCaretPosition($span.get(0), 0, range.length);
  //   }
  // } else {
  //   const function_str = `<span class="luckysheet-formula-functionrange-cell" rangeindex="${formulaCache.functionHTMLIndex}" dir="auto" style="color:${colors[functionHTMLIndex]};">${range}</span>`;
  //   const $t = $(function_str).insertAfter(formulaCache.rangeSetValueTo);
  //   formulaCache.rangechangeindex = formulaCache.functionHTMLIndex;
  //   $editor = $(formulaCache.rangeSetValueTo).closest("div");

  //   setCaretPosition(
  //     $editor
  //       .find(`span[rangeindex='${formulaCache.rangechangeindex}']`)
  //       .get(0),
  //     0,
  //     range.length
  //   );
  //   formulaCache.functionHTMLIndex += 1;
  // }

  // if ($editor.attr("id") === "luckysheet-rich-text-editor") {
  //   $("#luckysheet-functionbox-cell").html(
  //     $("#luckysheet-rich-text-editor").html()
  //   );
  // } else {
  //   $("#luckysheet-rich-text-editor").html(
  //     $("#luckysheet-functionbox-cell").html()
  //   );
  // }
}
function updateparam(orient: string, txt: string, step: number) {
  const val = txt.split("!");
  let rangetxt;
  let prefix = "";

  if (val.length > 1) {
    [, rangetxt] = val;
    prefix = `${val[0]}!`;
  } else {
    [rangetxt] = val;
  }

  if (rangetxt.indexOf(":") === -1) {
    let row = parseInt(rangetxt.replace(/[^0-9]/g, ""), 10);
    let col = columnCharToIndex(rangetxt.replace(/[^A-Za-z]/g, ""));
    const freezonFuc = isfreezonFuc(rangetxt);
    const $row = freezonFuc[0] ? "$" : "";
    const $col = freezonFuc[1] ? "$" : "";

    if (orient === "u" && !freezonFuc[0]) {
      row -= step;
    } else if (orient === "r" && !freezonFuc[1]) {
      col += step;
    } else if (orient === "l" && !freezonFuc[1]) {
      col -= step;
    } else if (orient === "d" && !freezonFuc[0]) {
      row += step;
    }

    if (!Number.isNaN(row) && !Number.isNaN(col)) {
      return prefix + $col + indexToColumnChar(col) + $row + row;
    }
    if (!Number.isNaN(row)) {
      return prefix + $row + row;
    }
    if (!Number.isNaN(col)) {
      return prefix + $col + indexToColumnChar(col);
    }
    return txt;
  }
  rangetxt = rangetxt.split(":");
  const row = [];
  const col = [];

  row[0] = parseInt(rangetxt[0].replace(/[^0-9]/g, ""), 10);
  row[1] = parseInt(rangetxt[1].replace(/[^0-9]/g, ""), 10);
  if (row[0] > row[1]) {
    return txt;
  }

  col[0] = columnCharToIndex(rangetxt[0].replace(/[^A-Za-z]/g, ""));
  col[1] = columnCharToIndex(rangetxt[1].replace(/[^A-Za-z]/g, ""));
  if (col[0] > col[1]) {
    return txt;
  }

  const freezonFuc0 = isfreezonFuc(rangetxt[0]);
  const freezonFuc1 = isfreezonFuc(rangetxt[1]);
  const $row0 = freezonFuc0[0] ? "$" : "";
  const $col0 = freezonFuc0[1] ? "$" : "";
  const $row1 = freezonFuc1[0] ? "$" : "";
  const $col1 = freezonFuc1[1] ? "$" : "";

  if (orient === "u") {
    if (!freezonFuc0[0]) {
      row[0] -= step;
    }

    if (!freezonFuc1[0]) {
      row[1] -= step;
    }
  } else if (orient === "r") {
    if (!freezonFuc0[1]) {
      col[0] += step;
    }

    if (!freezonFuc1[1]) {
      col[1] += step;
    }
  } else if (orient === "l") {
    if (!freezonFuc0[1]) {
      col[0] -= step;
    }

    if (!freezonFuc1[1]) {
      col[1] -= step;
    }
  } else if (orient === "d") {
    if (!freezonFuc0[0]) {
      row[0] += step;
    }

    if (!freezonFuc1[0]) {
      row[1] += step;
    }
  }

  if (row[0] < 0 || col[0] < 0) {
    return error.r;
  }

  if (Number.isNaN(col[0]) && Number.isNaN(col[1])) {
    return `${prefix + $row0 + row[0]}:${$row1}${row[1]}`;
  }
  if (Number.isNaN(row[0]) && Number.isNaN(row[1])) {
    return `${
      prefix + $col0 + indexToColumnChar(col[0])
    }:${$col1}${indexToColumnChar(col[1])}`;
  }
  return `${
    prefix + $col0 + indexToColumnChar(col[0]) + $row0 + row[0]
  }:${$col1}${indexToColumnChar(col[1])}${$row1}${row[1]}`;
}

function downparam(txt: string, step: number) {
  return updateparam("d", txt, step);
}

function upparam(txt: string, step: number) {
  return updateparam("u", txt, step);
}

function leftparam(txt: string, step: number) {
  return updateparam("l", txt, step);
}

function rightparam(txt: string, step: number) {
  return updateparam("r", txt, step);
}

export function functionCopy(
  ctx: Context,
  txt: string,
  mode: string,
  step: number
) {
  if (operatorjson == null) {
    const arr = operator.split("|");
    const op: any = {};

    for (let i = 0; i < arr.length; i += 1) {
      op[arr[i].toString()] = 1;
    }

    operatorjson = op;
  }

  if (mode == null) {
    mode = "down";
  }

  if (step == null) {
    step = 1;
  }

  if (txt.substring(0, 1) === "=") {
    txt = txt.substring(1);
  }

  const funcstack = txt.split("");
  let i = 0;
  let str = "";
  let function_str = "";

  const matchConfig = {
    bracket: 0,
    comma: 0,
    squote: 0,
    dquote: 0,
  };

  while (i < funcstack.length) {
    const s = funcstack[i];

    if (s === "(" && matchConfig.dquote === 0) {
      matchConfig.bracket += 1;

      if (str.length > 0) {
        function_str += `${str}(`;
      } else {
        function_str += "(";
      }

      str = "";
    } else if (s === ")" && matchConfig.dquote === 0) {
      matchConfig.bracket -= 1;
      function_str += `${functionCopy(ctx, str, mode, step)})`;
      str = "";
    } else if (s === '"' && matchConfig.squote === 0) {
      if (matchConfig.dquote > 0) {
        function_str += `${str}"`;
        matchConfig.dquote -= 1;
        str = "";
      } else {
        matchConfig.dquote += 1;
        str += '"';
      }
    } else if (s === "," && matchConfig.dquote === 0) {
      function_str += `${functionCopy(ctx, str, mode, step)},`;
      str = "";
    } else if (s === "&" && matchConfig.dquote === 0) {
      if (str.length > 0) {
        function_str += `${functionCopy(ctx, str, mode, step)}&`;
        str = "";
      } else {
        function_str += "&";
      }
    } else if (s in operatorjson && matchConfig.dquote === 0) {
      let s_next = "";

      if (i + 1 < funcstack.length) {
        s_next = funcstack[i + 1];
      }

      let p = i - 1;
      let s_pre = null;

      if (p >= 0) {
        do {
          s_pre = funcstack[p];
          p -= 1;
        } while (p >= 0 && s_pre === " ");
      }

      if (s + s_next in operatorjson) {
        if (str.length > 0) {
          function_str += functionCopy(ctx, str, mode, step) + s + s_next;
          str = "";
        } else {
          function_str += s + s_next;
        }

        i += 1;
      } else if (
        !/[^0-9]/.test(s_next) &&
        s === "-" &&
        (s_pre === "(" ||
          s_pre == null ||
          s_pre === "," ||
          s_pre === " " ||
          s_pre in operatorjson)
      ) {
        str += s;
      } else {
        if (str.length > 0) {
          function_str += functionCopy(ctx, str, mode, step) + s;
          str = "";
        } else {
          function_str += s;
        }
      }
    } else {
      str += s;
    }

    if (i === funcstack.length - 1) {
      if (iscelldata(_.trim(str))) {
        if (mode === "down") {
          function_str += downparam(_.trim(str), step);
        } else if (mode === "up") {
          function_str += upparam(_.trim(str), step);
        } else if (mode === "left") {
          function_str += leftparam(_.trim(str), step);
        } else if (mode === "right") {
          function_str += rightparam(_.trim(str), step);
        }
      } else {
        function_str += _.trim(str);
      }
    }

    i += 1;
  }

  return function_str;
}
