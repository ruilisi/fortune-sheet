import _ from "lodash";
// @ts-ignore
import { Parser, ERROR_REF } from "@fortune-sheet/formula-parser";
import type {
  Cell,
  CellMatrix,
  FormulaDependency,
  FormulaDependenciesMap,
  FormulaCell,
  FormulaCellInfoMap,
  History,
  Rect,
  Selection,
} from "../types";
import { Context, getFlowdata } from "../context";
import {
  columnCharToIndex,
  escapeScriptTag,
  getSheetIndex,
  indexToColumnChar,
  getSheetIdByName,
  escapeHTMLTag,
} from "../utils";
import { getRangetxt, mergeMoveMain, setCellValue } from "./cell";
import { error } from "./validation";
import { moveToEnd } from "./cursor";
import { locale } from "../locale";
import { colors } from "./color";
import { colLocation, mousePosition, rowLocation } from "./location";
import { cancelFunctionrangeSelected, seletedHighlistByindex } from ".";
import {
  arrayMatch,
  executeAffectedFormulas,
  setFormulaCellInfo,
  getFormulaRunList,
} from "./formulaHelper";

let functionHTMLIndex = 0;
let rangeIndexes: number[] = [];
const operatorPriority: any = {
  "^": 0,
  "%": 1,
  "*": 1,
  "/": 1,
  "+": 2,
  "-": 2,
};
const operatorArr = "==|!=|<>|<=|>=|=|+|-|>|<|/|*|%|&|^".split("|");
const operatorjson: Record<string, number> = {};
for (let i = 0; i < operatorArr.length; i += 1) {
  operatorjson[operatorArr[i].toString()] = 1;
}
const simpleSheetName = "[A-Za-z0-9_\u00C0-\u02AF]+";
const quotedSheetName = "'(?:(?!').|'')*'";
const sheetNameRegexp = `(${simpleSheetName}|${quotedSheetName})!`;
const rowColumnRegexp = `[$]?[A-Za-z]+[$]?[0-9]+`;
const rowColumnWithSheetName = `(?:${sheetNameRegexp})?(${rowColumnRegexp})`;
const LABEL_EXTRACT_REGEXP = new RegExp(
  `^${rowColumnWithSheetName}(?:[:]${rowColumnWithSheetName})?$`
);

// FormulaCache is defined as class to avoid being frozen by immer
export class FormulaCache {
  parser: any;

  func_selectedrange?: Selection;

  data_parm_index: number;

  cellTextToIndexList: any;

  rangechangeindex?: number;

  selectingRangeIndex: number;

  rangeResizeObj?: any;

  rangeResize?: any;

  rangeResizeIndex?: number;

  rangeResizexy?: any;

  rangeResizeWinH?: any;

  rangeResizeWinW?: any;

  rangeResizeTo?: any;

  rangeSetValueTo?: any;

  rangeIndex?: number;

  rangestart?: boolean;

  rangetosheet?: string;

  rangedrag_column_start?: boolean;

  rangedrag_row_start?: boolean;

  functionRangeIndex?: number[];

  functionlistMap: any;

  execFunctionExist?: any[];

  execFunctionGlobalData: any;

  // useful in cut-paste operation where several cells may be affected but the formulas remains the same
  formulaDependenciesMap: FormulaDependenciesMap;

  formulaCellInfoMap: FormulaCellInfoMap | null;

  constructor() {
    const that = this;
    this.data_parm_index = 0;
    this.selectingRangeIndex = -1;
    this.functionlistMap = {};
    this.execFunctionGlobalData = {};
    this.formulaDependenciesMap = {};
    this.formulaCellInfoMap = null;
    this.cellTextToIndexList = {};
    this.parser = new Parser();
    this.parser.on(
      "callCellValue",
      (cellCoord: any, options: any, done: any) => {
        const context = that.parser.context as Context;
        const id =
          cellCoord.sheetName == null
            ? options.sheetId
            : getSheetIdByName(context, cellCoord.sheetName);
        if (id == null) throw Error(ERROR_REF);
        const flowdata = getFlowdata(context, id);
        const cell =
          context?.formulaCache.execFunctionGlobalData?.[
            `${cellCoord.row.index}_${cellCoord.column.index}_${id}`
          ] || flowdata?.[cellCoord.row.index]?.[cellCoord.column.index];
        const v = that.tryGetCellAsNumber(cell);
        done(v);
      }
    );

    this.parser.on(
      "callRangeValue",
      (startCellCoord: any, endCellCoord: any, options: any, done: any) => {
        const context = that.parser.context as Context;
        const id =
          startCellCoord.sheetName == null
            ? options.sheetId
            : getSheetIdByName(context, startCellCoord.sheetName);
        if (id == null) throw Error(ERROR_REF);
        const flowdata = getFlowdata(context, id);
        const fragment = [];
        let startRow = startCellCoord.row.index;
        let endRow = endCellCoord.row.index;
        let startCol = startCellCoord.column.index;
        let endCol = endCellCoord.column.index;
        const emptyRow = startRow === -1 || endRow === -1;
        const emptyCol = startCol === -1 || endCol === -1;
        if (emptyRow) {
          startRow = 0;
          endRow = flowdata?.length ?? 0;
        }
        if (emptyCol) {
          startCol = 0;
          endCol = flowdata?.[0].length ?? 0;
        }
        if (emptyRow && emptyCol) throw Error(ERROR_REF);

        for (let row = startRow; row <= endRow; row += 1) {
          const colFragment = [];

          for (let col = startCol; col <= endCol; col += 1) {
            const cell =
              context?.formulaCache.execFunctionGlobalData?.[
                `${row}_${col}_${id}`
              ] || flowdata?.[row]?.[col];
            const v = that.tryGetCellAsNumber(cell);
            colFragment.push(v);
          }
          fragment.push(colFragment);
        }

        if (fragment) {
          done(fragment);
        }
      }
    );
  }

  tryGetCellAsNumber(cell: Cell) {
    if (cell?.ct?.t === "n") {
      const n = Number(cell?.v);
      return Number.isNaN(n) ? cell.v : n;
    }
    return cell?.v;
  }

  updateFormulaCache(ctx: Context, history: History, data?: CellMatrix) {
    function requestUpdate(value: any) {
      if (value instanceof Object) {
        if (value.r !== undefined && value.r !== undefined) {
          setFormulaCellInfo(
            ctx,
            { r: value.r, c: value.c, id: ctx.currentSheetId },
            data
          );
        }
      }
    }
    history.patches.forEach((patch) => {
      if (Array.isArray(patch.value)) {
        patch.value.forEach((value) => {
          requestUpdate(value);
        });
      } else {
        requestUpdate(patch.value);
      }
    });
  }
}

function parseElement(eleString: string) {
  return new DOMParser().parseFromString(eleString, "text/html").body
    .childNodes[0];
}

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

function addToCellIndexList(ctx: Context, txt: string, infoObj: any) {
  if (_.isNil(txt) || txt.length === 0 || _.isNil(infoObj)) {
    return;
  }
  if (_.isNil(ctx.formulaCache.cellTextToIndexList)) {
    ctx.formulaCache.cellTextToIndexList = {};
  }

  if (txt.indexOf("!") > -1) {
    txt = txt.replace(/\\'/g, "'").replace(/''/g, "'");
    ctx.formulaCache.cellTextToIndexList[txt] = infoObj;
  } else {
    ctx.formulaCache.cellTextToIndexList[`${txt}_${infoObj.sheetId}`] = infoObj;
  }
}

export function getcellrange(
  ctx: Context,
  txt: string,
  formulaId?: string,
  data?: CellMatrix
): FormulaDependency | null {
  if (_.isNil(txt) || txt.length === 0) {
    return null;
  }
  const flowdata = data || getFlowdata(ctx, formulaId);

  let sheettxt = "";
  let rangetxt = "";
  let sheetId;
  let sheetdata = null;

  const { luckysheetfile } = ctx;

  if (txt.indexOf("!") > -1) {
    if (txt in ctx.formulaCache.cellTextToIndexList) {
      return ctx.formulaCache.cellTextToIndexList[txt];
    }

    const matchRes = txt.match(LABEL_EXTRACT_REGEXP);
    if (matchRes == null) {
      return null;
    }
    const [, sheettxt1, starttxt1, sheettxt2, starttxt2] = matchRes;
    if (sheettxt2 != null && sheettxt1 !== sheettxt2) {
      return null;
    }
    rangetxt = starttxt2 ? `${starttxt1}:${starttxt2}` : starttxt1;
    sheettxt = sheettxt1
      .replace(/^'|'$/g, "")
      .replace(/\\'/g, "'")
      .replace(/''/g, "'");

    _.forEach(luckysheetfile, (f) => {
      if (sheettxt === f.name) {
        sheetId = f.id;
        sheetdata = f.data;
        return false;
      }
      return true;
    });
  } else {
    let i = formulaId;
    if (_.isNil(i)) {
      i = ctx.currentSheetId;
    }
    if (`${txt}_${i}` in ctx.formulaCache.cellTextToIndexList) {
      return ctx.formulaCache.cellTextToIndexList[`${txt}_${i}`];
    }
    const index = getSheetIndex(ctx, i);
    if (_.isNil(index)) {
      return null;
    }
    sheettxt = luckysheetfile[index].name;
    sheetId = luckysheetfile[index].id;
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
      const item: FormulaDependency = {
        row: [row, row],
        column: [col, col],
        sheetId,
      };
      addToCellIndexList(ctx, txt, item);
      return item;
    }
    return null;
  }
  const rangetxtArr = rangetxt.split(":");
  const row: [number, number] = [-1, -1];
  const col: [number, number] = [-1, -1];
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

  const item: FormulaDependency = {
    row,
    column: col,
    sheetId,
  };
  addToCellIndexList(ctx, txt, item);
  return item;
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
  id: string,
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
      ctx.calculateSheetId = id;
      const str = function_str
        .split(",")
        [function_str.split(",").length - 1].split("'")[1]
        .split("'")[0];

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

export function isFunctionRange(
  ctx: Context,
  txt: string,
  r: number | null,
  c: number | null,
  id: string,
  dynamicArray_compute: any,
  cellRangeFunction: any
) {
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
  // let dynamicArray_compute = luckysheetfile[getSheetIndex(Store.currentSheetId)_.isNil(]["dynamicArray_compute"]) ? {} : luckysheetfile[getSheetIndex(Store.currentSheetId)]["dynamicArray_compute"];

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
          id,
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
          id,
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
                id,
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
                id,
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
  checkSpecialFunctionRange(
    ctx,
    function_str,
    r,
    c,
    id,
    dynamicArray_compute,
    cellRangeFunction
  );
  return function_str;
}

export function getAllFunctionGroup(ctx: Context) {
  const { luckysheetfile } = ctx;
  let ret: FormulaCell[] = [];
  for (let i = 0; i < luckysheetfile.length; i += 1) {
    const file = luckysheetfile[i];
    let { calcChain } = file;

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
        id: d.id,
      });
    }
  }

  return ret;
}

export function delFunctionGroup(
  ctx: Context,
  r: number,
  c: number,
  id?: string
) {
  if (_.isNil(id)) {
    id = ctx.currentSheetId;
  }

  const file = ctx.luckysheetfile[getSheetIndex(ctx, id)!];

  const { calcChain } = file;
  if (!_.isNil(calcChain)) {
    let modified = false;
    const calcChainClone = calcChain.slice();
    for (let i = 0; i < calcChainClone.length; i += 1) {
      const calc = calcChainClone[i];
      if (calc.r === r && calc.c === c && calc.id === id) {
        calcChainClone.splice(i, 1);
        modified = true;
        // server.saveParam("fc", index, calc, {
        //   op: "del",
        //   pos: i,
        // });
        break;
      }
    }
    if (modified) {
      file.calcChain = calcChainClone;
    }
  }

  const { dynamicArray } = file;
  if (!_.isNil(dynamicArray)) {
    let modified = false;
    const dynamicArrayClone = dynamicArray.slice();
    for (let i = 0; i < dynamicArrayClone.length; i += 1) {
      const calc = dynamicArrayClone[i];
      if (
        calc.r === r &&
        calc.c === c &&
        (_.isNil(calc.id) || calc.id === id)
      ) {
        dynamicArrayClone.splice(i, 1);
        modified = true;
        // server.saveParam("ac", index, null, {
        //   op: "del",
        //   pos: i,
        // });
        break;
      }
    }
    if (modified) {
      file.dynamicArray = dynamicArrayClone;
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

export function insertUpdateFunctionGroup(
  ctx: Context,
  r: number,
  c: number,
  id?: string,
  calcChainSet?: Set<string>
) {
  if (_.isNil(id)) {
    id = ctx.currentSheetId;
  }

  // let func = getcellFormula(ctx, r, c, id);
  // if (_.isNil(func) || func.length==0) {
  //     this.delFunctionGroup(r, c, index);
  //     return;
  // }

  const { luckysheetfile } = ctx;
  const idx = getSheetIndex(ctx, id);
  if (_.isNil(idx)) {
    return;
  }
  const file = luckysheetfile[idx];

  let { calcChain } = file;
  if (_.isNil(calcChain)) {
    calcChain = [];
  }

  if (calcChainSet) {
    if (calcChainSet.has(`${r}_${c}_${id}`)) return;
  } else {
    for (let i = 0; i < calcChain.length; i += 1) {
      const calc = calcChain[i];
      if (calc.r === r && calc.c === c && calc.id === id) {
        // server.saveParam("fc", index, calc, {
        //   op: "update",
        //   pos: i,
        // });
        return;
      }
    }
  }

  const cc = {
    r,
    c,
    id,
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
  id?: string,
  calcChainSet?: Set<string>,
  isrefresh?: boolean,
  notInsertFunc?: boolean
) {
  if (txt.indexOf(error.r) > -1) {
    return [false, error.r, txt];
  }

  if (!checkBracketNum(txt)) {
    txt += ")";
  }

  if (_.isNil(id)) {
    id = ctx.currentSheetId;
  }

  ctx.calculateSheetId = id;

  ctx.formulaCache.parser.context = ctx;
  const parsedResponse = ctx.formulaCache.parser.parse(txt.substring(1), {
    sheetId: id || ctx.currentSheetId,
  });

  const { error: formulaError } = parsedResponse;
  let { result } = parsedResponse;

  // https://stackoverflow.com/a/643827/8200626
  // https://github.com/ruilisi/fortune-sheet/issues/551
  if (
    Object.prototype.toString.call(result) === "[object Date]" &&
    !_.isNil(result)
  ) {
    result = result.toString();
  }

  if (!_.isNil(r) && !_.isNil(c)) {
    if (isrefresh) {
      // eslint-disable-next-line no-use-before-define
      execFunctionGroup(
        ctx,
        r,
        c,
        _.isNil(formulaError) ? result : formulaError,
        id
      );
    }

    if (!notInsertFunc) {
      insertUpdateFunctionGroup(ctx, r, c, id, calcChainSet);
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
  let { id } = dynamicArrayItem;
  if (_.isNil(id)) {
    id = ctx.currentSheetId;
  }

  const { luckysheetfile } = ctx;
  const idx = getSheetIndex(ctx, id);
  if (idx == null) return [];

  const file = luckysheetfile[idx];

  let { dynamicArray } = file;
  if (_.isNil(dynamicArray)) {
    dynamicArray = [];
  }

  for (let i = 0; i < dynamicArray.length; i += 1) {
    const calc = dynamicArray[i];
    if (calc.r === r && calc.c === c && calc.id === id) {
      calc.data = dynamicArrayItem.data;
      calc.f = dynamicArrayItem.f;
      return dynamicArray;
    }
  }

  dynamicArray.push(dynamicArrayItem);
  return dynamicArray;
}

export function groupValuesRefresh(ctx: Context) {
  const { luckysheetfile } = ctx;
  if (ctx.groupValuesRefreshData.length > 0) {
    for (let i = 0; i < ctx.groupValuesRefreshData.length; i += 1) {
      const item = ctx.groupValuesRefreshData[i];

      // if(item.i !== ctx.currentSheetId){
      //     continue;
      // }

      const idx = getSheetIndex(ctx, item.id);
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
      // server.saveParam("v", item.id, data[item.r][item.c], {
      //     "r": item.r,
      //     "c": item.c
      // });
    }

    // editor.webWorkerFlowDataCache(Store.flowdata); // worker存数据
    ctx.groupValuesRefreshData = [];
  }
}

export function setFormulaCellInfoMap(
  ctx: Context,
  calcChains?: any[],
  data?: CellMatrix
) {
  if (_.isNil(calcChains)) return;
  for (let i = 0; i < calcChains.length; i += 1) {
    const formulaCell = calcChains[i];
    setFormulaCellInfo(ctx, formulaCell, data);
  }
}

export function execFunctionGroup(
  ctx: Context,
  origin_r: number,
  origin_c: number,
  value: any,
  id?: string,
  data?: any,
  isForce = false
) {
  // 0. null checks
  if (_.isNil(data)) {
    data = getFlowdata(ctx);
  }

  if (_.isNil(ctx.formulaCache.execFunctionGlobalData)) {
    ctx.formulaCache.execFunctionGlobalData = {};
  }
  if (_.isNil(id)) {
    id = ctx.currentSheetId;
  }

  if (!_.isNil(value)) {
    const cellCache: Cell[][] = [[{ v: undefined }]];
    setCellValue(ctx, 0, 0, cellCache, value);
    [
      [
        ctx.formulaCache.execFunctionGlobalData[
          `${origin_r}_${origin_c}_${id}`
        ],
      ],
    ] = cellCache;
  }

  // 1. get list of all functions in the sheet
  const calcChains: FormulaCell[] = getAllFunctionGroup(ctx);

  // 2. Store the cells involved in the modification
  const updateValueObjects: any = {};
  if (_.isNil(ctx.formulaCache.execFunctionExist)) {
    const key = `r${origin_r}c${origin_c}i${id}`;
    updateValueObjects[key] = 1;
  } else {
    for (let x = 0; x < ctx.formulaCache.execFunctionExist.length; x += 1) {
      const cell = ctx.formulaCache.execFunctionExist[x] as any;
      const key = `r${cell.r}c${cell.c}i${cell.i}`;
      updateValueObjects[key] = 1;
    }
  }

  // 3. formulaCellInfoMap: a cache of ALL formulas vs their ranges
  if (
    !ctx.formulaCache.formulaCellInfoMap ||
    _.isEmpty(ctx.formulaCache.formulaCellInfoMap)
  ) {
    ctx.formulaCache.formulaCellInfoMap = {};
    setFormulaCellInfoMap(ctx, calcChains, data);
  }
  const { formulaCellInfoMap } = ctx.formulaCache;

  // 4. Form a graph structure of references between formulas
  // basically fills parents in formulaCellInfoMap[i]
  const updateValueArray: any = [];
  const arrayMatchCache: Record<
    string,
    { key: string; r: number; c: number; sheetId: string }[]
  > = {};
  Object.keys(formulaCellInfoMap).forEach((key) => {
    const formulaObject = formulaCellInfoMap[key];
    arrayMatch(
      arrayMatchCache,
      formulaObject.formulaDependency,
      formulaCellInfoMap,
      updateValueObjects,
      (childKey: string) => {
        if (childKey in formulaCellInfoMap) {
          const childFormulaObject = formulaCellInfoMap[childKey];
          // formulaObject.chidren[childKey] = 1; not needed
          childFormulaObject.parents[key] = 1;
        }
        if (!isForce && childKey in updateValueObjects) {
          updateValueArray.push(formulaObject);
        }
      }
    );

    if (isForce) {
      updateValueArray.push(formulaObject);
    }
  });

  // 5. Get list of affected formulas using the graph structure by depth-first traversal
  const formulaRunList = getFormulaRunList(
    updateValueArray,
    formulaCellInfoMap
  );

  // 6. execute relevant formulas
  executeAffectedFormulas(ctx, formulaRunList, calcChains);

  ctx.formulaCache.execFunctionExist = undefined;
}

function findrangeindex(ctx: Context, v: string, vp: string) {
  const re = /<span.*?>/g;
  const v_a = v.replace(re, "").split("</span>");
  const vp_a = vp.replace(re, "").split("</span>");
  v_a.pop();
  if (vp_a[vp_a.length - 1] === "") vp_a.pop();

  let pfri = ctx.formulaCache.functionRangeIndex;
  if (pfri == null) return [];

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
        vp_a[i + 1] != null &&
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
      } else if (
        !_.isNil(p) &&
        !_.startsWith(p[0], "=") &&
        _.startsWith(n, "=")
      ) {
        return [vlen - 1, v_a[vlen - 1].length];
      } else {
        pfri[0] = pfri[0] + vlen - vplen - 1;
        pfri[1] = v_a[(i || 1) - 1].length;
      }

      return pfri;
    } else if (p.length < n.length) {
      return pfri;
    }

    return pfri;
  }

  return null;
}

export function createFormulaRangeSelect(
  ctx: Context,
  select: { rangeIndex: number } & Rect
) {
  ctx.formulaRangeSelect = select;
}

export function createRangeHightlight(
  ctx: Context,
  inputInnerHtmlStr: string,
  ignoreRangeIndex = -1
) {
  const $span = parseElement(`<div>${inputInnerHtmlStr}</div>`) as HTMLElement;
  const formulaRanges: {
    rangeIndex: number;
    left: number;
    top: number;
    width: number;
    height: number;
    backgroundColor: string;
  }[] = [];
  $span
    .querySelectorAll("span.fortune-formula-functionrange-cell")
    .forEach((ele) => {
      const rangeIndex = parseInt(ele.getAttribute("rangeindex") || "0", 10);
      if (rangeIndex === ignoreRangeIndex) return;
      const cellrange = getcellrange(ctx, ele.textContent || "");
      if (
        rangeIndex === ctx.formulaCache.selectingRangeIndex ||
        cellrange == null
      )
        return;
      if (
        cellrange.sheetId === ctx.currentSheetId ||
        (!cellrange.sheetId &&
          ctx.formulaCache.rangetosheet === ctx.currentSheetId)
      ) {
        const rect = seletedHighlistByindex(
          ctx,
          cellrange.row[0],
          cellrange.row[1],
          cellrange.column[0],
          cellrange.column[1]
        );
        if (rect) {
          formulaRanges.push({
            rangeIndex,
            ...rect,
            backgroundColor: colors[rangeIndex],
          });
        }
      }
    });
  ctx.formulaRangeHighlight = formulaRanges;
}

export function setCaretPosition(
  ctx: Context,
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
    console.error(err);
    moveToEnd(ctx.formulaCache.rangeResizeTo[0]);
  }
}

function functionRange(
  ctx: Context,
  obj: HTMLDivElement,
  v: string,
  vp: string
) {
  if (window.getSelection) {
    // ie11 10 9 ff safari
    const currSelection = window.getSelection();
    if (!currSelection) return;
    const fri = findrangeindex(ctx, v, vp);

    if (_.isNil(fri)) {
      currSelection.selectAllChildren(obj);
      currSelection.collapseToEnd();
    } else {
      setCaretPosition(ctx, obj.querySelectorAll("span")[fri[0]], 0, fri[1]);
    }
    // @ts-ignore
  } else if (document.selection) {
    // ie10 9 8 7 6 5
    // @ts-ignore
    ctx.formulaCache.functionRangeIndex.moveToElementText(obj); // range定位到obj
    // @ts-ignore
    ctx.formulaCache.functionRangeIndex.collapse(false); // 光标移至最后
    // @ts-ignore
    ctx.formulaCache.functionRangeIndex.select();
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
    } else if (_.startsWith(n, searchtxt)) {
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

export function getrangeseleciton() {
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
  //     functionlistPosition[functionlist[i].n] = i;
  //   }
  // }
  if (_.isEmpty(ctx.formulaCache.functionlistMap)) {
    for (let i = 0; i < functionlist.length; i += 1) {
      ctx.formulaCache.functionlistMap[functionlist[i].n] = functionlist[i];
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
          ctx.formulaCache.functionlistMap
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
  //   "#fortune-formula-functionrange .fortune-formula-functionrange-highlight .fortune-selection-copy-hc"
  // ).css("opacity", "0.03");
  // $("#luckysheet-formula-search-c, #luckysheet-formula-help-c").hide();

  // if (
  //   $(currSelection).closest(".fortune-formula-functionrange-cell").length ==
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
  //   ".fortune-formula-functionrange-cell"
  // );
  // const rangeindex = $anchorOffset.attr("rangeindex");
  // const rangeid = `fortune-formula-functionrange-highlight-${rangeindex}`;

  // $(`#${rangeid}`).find(".fortune-selection-copy-hc").css({
  //   opacity: "0.13",
  // });
}

function functionHTML(txt: string) {
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
    // 修正例如输入公式='1-2'!A1时，只有2'!A1是fortune-formula-functionrange-cell色，'1-是黑色的问题。
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
          s_pre = funcstack[p];
          p -= 1;
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
        const rangeIndex =
          rangeIndexes.length > functionHTMLIndex
            ? rangeIndexes[functionHTMLIndex]
            : functionHTMLIndex;
        function_str += `<span class="fortune-formula-functionrange-cell" rangeindex="${rangeIndex}" dir="auto" style="color:${colors[rangeIndex]};">${str}</span>`;
        functionHTMLIndex += 1;
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

  functionHTMLIndex = 0;

  return `<span dir="auto" class="luckysheet-formula-text-color">=</span>${functionHTML(
    txt
  )}`;
}

function getRangeIndexes($editor: HTMLDivElement) {
  const res: number[] = [];
  $editor
    .querySelectorAll("span.fortune-formula-functionrange-cell")
    .forEach((ele) => {
      const indexStr = ele.getAttribute("rangeindex");
      if (indexStr) {
        const rangeIndex = parseInt(indexStr, 10);
        res.push(rangeIndex);
      }
    });
  return res;
}

export function handleFormulaInput(
  ctx: Context,
  $copyTo: HTMLDivElement | null | undefined,
  $editor: HTMLDivElement,
  kcode: number,
  preText?: string,
  refreshRangeSelect = true
) {
  // if (isEditMode()) {
  //   // 此模式下禁用公式栏
  //   return;
  // }
  let value1: string;
  const value1txt = preText ?? $editor.innerText;
  let value = $editor.innerText;
  value = escapeScriptTag(value);
  if (
    value.length > 0 &&
    value.substring(0, 1) === "=" &&
    (kcode !== 229 || value.length === 1)
  ) {
    if (!refreshRangeSelect) rangeIndexes = getRangeIndexes($editor);
    value = functionHTMLGenerate(value);
    if (!refreshRangeSelect && functionHTMLIndex < rangeIndexes.length)
      refreshRangeSelect = true;
    value1 = functionHTMLGenerate(value1txt);

    rangeIndexes = [];

    if (window.getSelection) {
      // all browsers, except IE before version 9
      const currSelection = window.getSelection();
      if (!currSelection) return;
      if (currSelection.anchorNode?.nodeName.toLowerCase() === "div") {
        const editorlen = $editor.querySelectorAll("span").length;
        if (editorlen > 0)
          ctx.formulaCache.functionRangeIndex = [
            editorlen - 1,
            $editor.querySelectorAll("span").item(editorlen - 1).textContent
              ?.length!,
          ];
      } else {
        ctx.formulaCache.functionRangeIndex = [
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
      ctx.formulaCache.functionRangeIndex = textRange;
    }

    $editor.innerHTML = value;
    if ($copyTo) $copyTo.innerHTML = value;

    // the cursor will be set to the beginning of input box after set innerHTML,
    // restoring it to the correct position
    functionRange(ctx, $editor, value, value1);

    if (refreshRangeSelect) {
      cancelFunctionrangeSelected(ctx);

      if (kcode !== 46) {
        // delete不执行此函数
        createRangeHightlight(ctx, value);
      }

      ctx.formulaCache.rangestart = false;
      ctx.formulaCache.rangedrag_column_start = false;
      ctx.formulaCache.rangedrag_row_start = false;

      rangeHightlightselected(ctx, $editor);
    }
  } else if (_.startsWith(value1txt, "=") && !_.startsWith(value, "=")) {
    if ($copyTo) $copyTo.innerHTML = value;
    $editor.innerHTML = escapeHTMLTag(value);
  } else if (!_.startsWith(value1txt, "=")) {
    if (!$copyTo) return;
    if ($copyTo.id === "luckysheet-rich-text-editor") {
      if (!_.startsWith($copyTo.innerHTML, "<span")) {
        $copyTo.innerHTML = escapeHTMLTag(value);
      }
    } else {
      $copyTo.innerHTML = escapeHTMLTag(value);
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

export function israngeseleciton(ctx: Context, istooltip?: boolean) {
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
      ctx.formulaCache.rangeSetValueTo = anchor.parentNode;
    } else {
      lasttxt = txt.substring(anchorOffset - 1, 1);
      ctx.formulaCache.rangeSetValueTo = anchor.parentNode;
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

    ctx.formulaCache.rangeSetValueTo = _.last(
      anchorElement.querySelectorAll("span")
    );

    if (txt.length === 0 && anchorElement.querySelectorAll("span").length > 1) {
      const ahr = anchorElement.querySelectorAll("span");
      txt = _.trim(ahr[ahr.length - 2].innerText);

      txt = _.trim(ahr[ahr.length - 2].innerText);
      ctx.formulaCache.rangeSetValueTo = ahr;
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

      ctx.formulaCache.rangeSetValueTo = anchor.previousSibling;

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

export function rangeSetValue(
  ctx: Context,
  cellInput: HTMLDivElement,
  selected: any,
  fxInput?: HTMLDivElement | null
) {
  let $editor = cellInput;
  let $copyTo = fxInput;
  if (document.activeElement?.id === "luckysheet-functionbox-cell") {
    $editor = fxInput!;
    $copyTo = cellInput;
  }
  let range = "";
  const rf = selected.row[0];
  const cf = selected.column[0];
  if (ctx.config.merge != null && `${rf}_${cf}` in ctx.config.merge) {
    range = getRangetxt(
      ctx,
      ctx.currentSheetId,
      {
        column: [cf, cf],
        row: [rf, rf],
      },
      ctx.formulaCache.rangetosheet
    );
  } else {
    range = getRangetxt(
      ctx,
      ctx.currentSheetId,
      selected,
      ctx.formulaCache.rangetosheet
    );
  }
  // let $editor;

  if (
    !israngeseleciton(ctx) &&
    (ctx.formulaCache.rangestart ||
      ctx.formulaCache.rangedrag_column_start ||
      ctx.formulaCache.rangedrag_row_start)
  ) {
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
    // const currSelection = window.getSelection();
    // const anchorOffset = currSelection!.anchorNode;
    // $editor = $(anchorOffset).closest("div");

    // const $span = $editor
    //   .find(`span[rangeindex='${formulaCache.rangechangeindex}']`)
    //   .html(range);
    const span = $editor.querySelector(
      `span[rangeindex='${ctx.formulaCache.rangechangeindex}']`
    ) as HTMLSpanElement;
    if (span) {
      span.innerHTML = range;
      setCaretPosition(ctx, span, 0, range.length);
    }
    //   }
  } else {
    const function_str = `<span class="fortune-formula-functionrange-cell" rangeindex="${functionHTMLIndex}" dir="auto" style="color:${colors[functionHTMLIndex]};">${range}</span>`;
    const newEle = parseElement(function_str);
    const refEle = ctx.formulaCache.rangeSetValueTo;
    if (refEle && refEle.parentNode) {
      const leftPar = document.getElementsByClassName(
        "luckysheet-formula-text-lpar"
      )?.[0];

      // handle case when user autocompletes the formula
      if (
        leftPar?.parentElement?.classList.contains(
          "luckysheet-formula-text-color"
        )
      ) {
        document
          .getElementsByClassName("luckysheet-formula-text-lpar")?.[0]
          .parentNode?.appendChild(newEle);
      } else {
        refEle.parentNode.insertBefore(newEle, refEle.nextSibling);
      }
    } else {
      $editor.appendChild(newEle);
    }
    ctx.formulaCache.rangechangeindex = functionHTMLIndex;
    const span = $editor.querySelector(
      `span[rangeindex='${ctx.formulaCache.rangechangeindex}']`
    ) as HTMLSpanElement;

    setCaretPosition(ctx, span, 0, range.length);
    functionHTMLIndex += 1;
  }

  if ($copyTo) $copyTo.innerHTML = $editor.innerHTML;
}

export function onFormulaRangeDragEnd(ctx: Context) {
  if (ctx.formulaCache.func_selectedrange) {
    const {
      left_move: left,
      top_move: top,
      width_move: width,
      height_move: height,
    } = ctx.formulaCache.func_selectedrange;
    if (
      left != null &&
      top != null &&
      width != null &&
      height != null &&
      (ctx.formulaCache.rangestart ||
        ctx.formulaCache.rangedrag_column_start ||
        ctx.formulaCache.rangedrag_row_start)
    )
      ctx.formulaRangeSelect = {
        rangeIndex: ctx.formulaCache.rangeIndex || 0,
        left,
        top,
        width,
        height,
      };
  }
  ctx.formulaCache.selectingRangeIndex = -1;
}

function setRangeSelect(
  container: HTMLDivElement,
  left: number,
  top: number,
  height: number,
  width: number
) {
  const rangeElement = container.querySelector(
    ".fortune-formula-functionrange-select"
  ) as HTMLDivElement;
  if (rangeElement == null) return;
  rangeElement.style.left = `${left}px`;
  rangeElement.style.top = `${top}px`;
  rangeElement.style.height = `${height}px`;
  rangeElement.style.width = `${width}px`;
}

export function rangeDrag(
  ctx: Context,
  e: MouseEvent,
  cellInput: HTMLDivElement,
  scrollLeft: number,
  scrollTop: number,
  container: HTMLDivElement,
  fxInput?: HTMLDivElement | null
) {
  const { func_selectedrange } = ctx.formulaCache;
  if (
    !func_selectedrange ||
    func_selectedrange.left == null ||
    func_selectedrange.height == null ||
    func_selectedrange.top == null ||
    func_selectedrange.width == null
  )
    return;
  const rect = container.getBoundingClientRect();
  const x = e.pageX - rect.left - ctx.rowHeaderWidth + scrollLeft;
  const y = e.pageY - rect.top - ctx.columnHeaderHeight + scrollTop;

  const [row_pre, row, row_index] = rowLocation(y, ctx.visibledatarow);

  const [col_pre, col, col_index] = colLocation(x, ctx.visibledatacolumn);

  let top = 0;
  let height = 0;
  let rowseleted = [];

  if (func_selectedrange.top > row_pre) {
    top = row_pre;
    height = func_selectedrange.top + func_selectedrange.height - row_pre;
    rowseleted = [row_index, func_selectedrange.row[1]];
  } else if (func_selectedrange.top === row_pre) {
    top = row_pre;
    height = func_selectedrange.top + func_selectedrange.height - row_pre;
    rowseleted = [row_index, func_selectedrange.row[0]];
  } else {
    top = func_selectedrange.top;
    height = row - func_selectedrange.top - 1;
    rowseleted = [func_selectedrange.row[0], row_index];
  }

  let left = 0;
  let width = 0;
  let columnseleted = [];

  if (func_selectedrange.left > col_pre) {
    left = col_pre;
    width = func_selectedrange.left + func_selectedrange.width - col_pre;
    columnseleted = [col_index, func_selectedrange.column[1]];
  } else if (func_selectedrange.left === col_pre) {
    left = col_pre;
    width = func_selectedrange.left + func_selectedrange.width - col_pre;
    columnseleted = [col_index, func_selectedrange.column[0]];
  } else {
    left = func_selectedrange.left;
    width = col - func_selectedrange.left - 1;
    columnseleted = [func_selectedrange.column[0], col_index];
  }

  // rowseleted[0] = luckysheetFreezen.changeFreezenIndex(rowseleted[0], "h");
  // rowseleted[1] = luckysheetFreezen.changeFreezenIndex(rowseleted[1], "h");
  // columnseleted[0] = luckysheetFreezen.changeFreezenIndex(
  //   columnseleted[0],
  //   "v"
  // );
  // columnseleted[1] = luckysheetFreezen.changeFreezenIndex(
  //   columnseleted[1],
  //   "v"
  // );

  const changeparam = mergeMoveMain(
    ctx,
    columnseleted,
    rowseleted,
    func_selectedrange,
    top,
    height,
    left,
    width
  );
  if (changeparam != null) {
    // @ts-ignore
    [columnseleted, rowseleted, top, height, left, width] = changeparam;
  }

  func_selectedrange.row = rowseleted;
  func_selectedrange.column = columnseleted;

  func_selectedrange.left_move = left;
  func_selectedrange.width_move = width;
  func_selectedrange.top_move = top;
  func_selectedrange.height_move = height;

  // luckysheet_count_show(left, top, width, height, rowseleted, columnseleted);

  // if ($("#luckysheet-ifFormulaGenerator-multiRange-dialog").is(":visible")) {
  //   // if公式生成器 选择范围
  //   const range = getRangetxt(
  //     ctx,
  //     ctx.currentSheetId,
  //     { row: rowseleted, column: columnseleted },
  //     ctx.currentSheetId
  //   );
  //   $("#luckysheet-ifFormulaGenerator-multiRange-dialog input").val(range);
  // } else {
  rangeSetValue(
    ctx,
    cellInput,
    {
      row: rowseleted,
      column: columnseleted,
    },
    fxInput
  );

  setRangeSelect(container, left, top, height, width);
  // }

  // luckysheetFreezen.scrollFreezen(rowseleted, columnseleted);
  e.preventDefault();
}

export function rangeDragColumn(
  ctx: Context,
  e: MouseEvent,
  cellInput: HTMLDivElement,
  scrollLeft: number,
  scrollTop: number,
  container: HTMLDivElement,
  fxInput?: HTMLDivElement | null
) {
  const { func_selectedrange } = ctx.formulaCache;
  if (
    !func_selectedrange ||
    func_selectedrange.left == null ||
    func_selectedrange.height == null ||
    func_selectedrange.top == null ||
    func_selectedrange.width == null
  )
    return;
  const mouse = mousePosition(e.pageX, e.pageY, ctx);
  const x = mouse[0] + scrollLeft;

  const { visibledatarow } = ctx;
  const row_index = visibledatarow.length - 1;
  const row = visibledatarow[row_index];
  const row_pre = 0;

  const [col_pre, col, col_index] = colLocation(x, ctx.visibledatacolumn);

  let left = 0;
  let width = 0;
  let columnseleted = [];

  if (func_selectedrange.left > col_pre) {
    left = col_pre;
    width = func_selectedrange.left + func_selectedrange.width - col_pre;
    columnseleted = [col_index, func_selectedrange.column[1]];
  } else if (func_selectedrange.left === col_pre) {
    left = col_pre;
    width = func_selectedrange.left + func_selectedrange.width - col_pre;
    columnseleted = [col_index, func_selectedrange.column[0]];
  } else {
    left = func_selectedrange.left;
    width = col - func_selectedrange.left - 1;
    columnseleted = [func_selectedrange.column[0], col_index];
  }

  // // rowseleted[0] = luckysheetFreezen.changeFreezenIndex(rowseleted[0], "h");
  // // rowseleted[1] = luckysheetFreezen.changeFreezenIndex(rowseleted[1], "h");
  // columnseleted[0] = luckysheetFreezen.changeFreezenIndex(
  //   columnseleted[0],
  //   "v"
  // );
  // columnseleted[1] = luckysheetFreezen.changeFreezenIndex(
  //   columnseleted[1],
  //   "v"
  // );

  const changeparam = mergeMoveMain(
    ctx,
    columnseleted,
    [0, row_index],
    func_selectedrange,
    row_pre,
    row - row_pre - 1,
    left,
    width
  );
  if (changeparam != null) {
    // @ts-ignore
    [columnseleted, , , , left, width] = changeparam;
    // rowseleted= changeparam[1];
    // top = changeparam[2];
    // height = changeparam[3];
    // left = changeparam[4];
    // width = changeparam[5];
  }

  func_selectedrange.column = columnseleted;
  func_selectedrange.left_move = left;
  func_selectedrange.width_move = width;

  // luckysheet_count_show(
  //   left,
  //   row_pre,
  //   width,
  //   row - row_pre - 1,
  //   [0, row_index],
  //   columnseleted
  // );

  rangeSetValue(
    ctx,
    cellInput,
    {
      row: [null, null],
      column: columnseleted,
    },
    fxInput
  );

  setRangeSelect(container, left, row_pre, row - row_pre - 1, width);

  // luckysheetFreezen.scrollFreezen([0, row_index], columnseleted);
}

export function rangeDragRow(
  ctx: Context,
  e: MouseEvent,
  cellInput: HTMLDivElement,
  scrollLeft: number,
  scrollTop: number,
  container: HTMLDivElement,
  fxInput?: HTMLDivElement | null
) {
  const { func_selectedrange } = ctx.formulaCache;
  if (
    !func_selectedrange ||
    func_selectedrange.left == null ||
    func_selectedrange.height == null ||
    func_selectedrange.top == null ||
    func_selectedrange.width == null
  )
    return;

  const mouse = mousePosition(e.pageX, e.pageY, ctx);
  const y = mouse[1] + scrollTop;

  const [row_pre, row, row_index] = rowLocation(y, ctx.visibledatarow);

  const { visibledatacolumn } = ctx;
  const col_index = visibledatacolumn.length - 1;
  const col = visibledatacolumn[col_index];
  const col_pre = 0;

  let top = 0;
  let height = 0;
  let rowseleted = [];

  if (func_selectedrange.top > row_pre) {
    top = row_pre;
    height = func_selectedrange.top + func_selectedrange.height - row_pre;
    rowseleted = [row_index, func_selectedrange.row[1]];
  } else if (func_selectedrange.top === row_pre) {
    top = row_pre;
    height = func_selectedrange.top + func_selectedrange.height - row_pre;
    rowseleted = [row_index, func_selectedrange.row[0]];
  } else {
    top = func_selectedrange.top;
    height = row - func_selectedrange.top - 1;
    rowseleted = [func_selectedrange.row[0], row_index];
  }

  // rowseleted[0] = luckysheetFreezen.changeFreezenIndex(rowseleted[0], "h");
  // rowseleted[1] = luckysheetFreezen.changeFreezenIndex(rowseleted[1], "h");
  // // columnseleted[0] = luckysheetFreezen.changeFreezenIndex(columnseleted[0], "v");
  // // columnseleted[1] = luckysheetFreezen.changeFreezenIndex(columnseleted[1], "v");

  const changeparam = mergeMoveMain(
    ctx,
    [0, col_index],
    rowseleted,
    func_selectedrange,
    top,
    height,
    col_pre,
    col - col_pre - 1
  );
  if (changeparam != null) {
    // @ts-ignore
    [, rowseleted, top, height] = changeparam;
  }

  func_selectedrange.row = rowseleted;
  func_selectedrange.top_move = top;
  func_selectedrange.height_move = height;

  // luckysheet_count_show(col_pre, top, col - col_pre - 1, height, rowseleted, [
  //   0,
  //   col_index,
  // ]);

  rangeSetValue(
    ctx,
    cellInput,
    {
      row: rowseleted,
      column: [null, null],
    },
    fxInput
  );
  setRangeSelect(container, col_pre, top, height, col - col_pre - 1);

  // luckysheetFreezen.scrollFreezen(rowseleted, [0, col_index]);
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
