import _ from "lodash";
// @ts-ignore
import { Parser } from "hot-formula-parser";
import { Context, getFlowdata } from "../context";
import { columnCharToIndex, getSheetIndex } from "../utils";
import { getcellFormula, setCellValue } from "./cell";
import { error, valueIsError } from "./validation";

export const formulaCache = {
  func_selectedrange: {},
};

let execFunctionGlobalData: any = {};
let execFunctionExist: any = null;
let formulaContainSheetList: any = {};
const formulaContainCellList: any = {};
let groupValuesRefreshData: any[] = [];
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
const functionHTMLIndex = 0;
const functionRangeIndex: number | null = null;

let currentContext: Context | undefined;

const parser = new Parser();

parser.on("callCellValue", (cellCoord: any, done: any) => {
  const flowdata = getFlowdata(currentContext);
  const index = currentContext?.currentSheetIndex;
  const cell =
    execFunctionGlobalData[
      `${cellCoord.row.index}_${cellCoord.column.index}_${index}`
    ] || flowdata?.[cellCoord.row.index]?.[cellCoord.column.index];
  const v = cell?.ct?.t === "n" ? Number(cell?.v) : cell?.v;
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
          execFunctionGlobalData[`${row}_${col}_${index}`] ||
          flowdata?.[row]?.[col];
        const v = cell?.ct?.t === "n" ? Number(cell?.v) : cell?.v;
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

function getcellrange(
  ctx: Context,
  txt: string,
  formulaIndex?: number | string
) {
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
      sheettxt.substr(0, 1) === "'" &&
      sheettxt.substr(sheettxt.length - 1, 1) === "'"
    ) {
      sheettxt = sheettxt.substring(1, sheettxt.length - 1);
    }
    for (const i in luckysheetfile) {
      if (sheettxt === luckysheetfile[i].name) {
        sheetIndex = luckysheetfile[i].index;
        sheetdata = luckysheetfile[i].data;
        break;
      }
    }
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
  r: number,
  c: number,
  index: string,
  dynamicArray_compute?: any
) {
  if (!_.isNil(r) && _.isNil(c)) {
    const range = getcellrange(ctx, _.trim(str), index);
    if (_.isNil(range)) {
      return;
    }
    const { row } = range;
    const col = range.column;
    const { sheetIndex } = range;

    if (
      `${r}_${c}` in dynamicArray_compute &&
      (index === sheetIndex || index === null)
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
        (index === sheetIndex || index === null)
      ) {
        isFunctionRangeSave ||= true;
      } else {
        isFunctionRangeSave ||= false;
      }
    }
  } else {
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
  r: number,
  c: number,
  index: string,
  dynamicArray_compute?: any,
  cellRangeFunction?: any
) {
  if (
    function_str.substr(0, 30) === "luckysheet_getSpecialReference" ||
    function_str.substr(0, 20) === "luckysheet_function."
  ) {
    if (function_str.substr(0, 20) === "luckysheet_function.") {
      let funcName = function_str.split(".")[1];
      if (funcName !== null) {
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

      if (str instanceof Object && str.startCell !== null) {
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
  r: number,
  c: number,
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

  if (txt.substr(0, 1) === "=") {
    txt = txt.substr(1);
  }

  const funcstack = txt.split("");
  let i = 0;
  let str = "";
  let function_str = "";
  const ispassby = true;

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
      const bt = bracket.pop();

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

            while (cal1.length > 0 && stackCeilPri !== null) {
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
      } else if (str_nb.substr(0, 1) === ":") {
        str_nb = str_nb.substr(1);
        if (iscelldata(str_nb)) {
          endstr = `luckysheet_getSpecialReference(false,${function_str},'${str_nb}')`;
        }
      } else {
        str = _.trim(str);

        const regx = /{.*?}/;
        if (
          regx.test(str) &&
          str.substr(0, 1) !== '"' &&
          str.substr(str.length - 1, 1) !== '"'
        ) {
          const arraytxt = regx.exec(str)?.[0];
          const arraystart = str.search(regx);
          const alltxt = "";

          if (arraystart > 0) {
            endstr += str.substr(0, arraystart);
          }

          endstr += `luckysheet_getarraydata('${arraytxt}')`;

          if (arraystart + arraytxt.length < str.length) {
            endstr += str.substr(arraystart + arraytxt.length, str.length);
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

  const { luckysheetfile } = ctx;
  const file = luckysheetfile[getSheetIndex(ctx, index)!];

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

  ctx.luckysheetfile = luckysheetfile;
}

function checkBracketNum(fp: string) {
  const bra_l = fp.match(/\(/g);
  const bra_r = fp.match(/\)/g);
  const bra_tl_txt = fp.match(/(['"])(?:(?!\1).)*?\1/g);
  const bra_tr_txt = fp.match(/(['"])(?:(?!\1).)*?\1/g);

  let bra_l_len = 0;
  let bra_r_len = 0;
  if (bra_l !== null) {
    bra_l_len += bra_l.length;
  }
  if (bra_r !== null) {
    bra_r_len += bra_r.length;
  }

  let bra_tl_len = 0;
  let bra_tr_len = 0;
  if (bra_tl_txt !== null) {
    for (let i = 0; i < bra_tl_txt.length; i += 1) {
      const bra_tl = bra_tl_txt[i].match(/\(/g);
      if (bra_tl !== null) {
        bra_tl_len += bra_tl.length;
      }
    }
  }

  if (bra_tr_txt !== null) {
    for (let i = 0; i < bra_tr_txt.length; i += 1) {
      const bra_tr = bra_tr_txt[i].match(/\)/g);
      if (bra_tr !== null) {
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
  if (operatorjson === null) {
    const arr = operator.split("|");
    const op: any = {};

    for (let i = 0; i < arr.length; i += 1) {
      op[arr[i].toString()] = 1;
    }

    operatorjson = op;
  }

  if (txt === null) {
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

            while (cal1.length > 0 && stackCeilPri !== null) {
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
            stackCeilPri = stackCeilPri === null ? 1000 : stackCeilPri;

            let sPri = op[s];
            sPri = sPri === null ? 1000 : sPri;

            while (cal1.length > 0 && sPri >= stackCeilPri) {
              cal2.unshift(cal1.shift());

              stackCeilPri = op[cal1[0]];
              stackCeilPri = stackCeilPri === null ? 1000 : stackCeilPri;
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
          str.substr(0, 1) !== '"' &&
          str.substr(str.length - 1, 1) !== '"'
        ) {
          const arraytxt = regx.exec(str)[0];
          const arraystart = str.search(regx);
          const alltxt = "";

          if (arraystart > 0) {
            endstr += str.substr(0, arraystart);
          }

          endstr += `luckysheet_getarraydata('${arraytxt}')`;

          if (arraystart + arraytxt.length < str.length) {
            endstr += str.substr(arraystart + arraytxt.length, str.length);
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
  // if (func === null || func.length==0) {
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
  const file = luckysheetfile[getSheetIndex(ctx, index)];

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

export function groupValuesRefresh(ctx: Context) {
  const { luckysheetfile } = ctx;
  if (groupValuesRefreshData.length > 0) {
    for (let i = 0; i < groupValuesRefreshData.length; i += 1) {
      const item = groupValuesRefreshData[i];

      // if(item.i != Store.currentSheetIndex){
      //     continue;
      // }

      const file = luckysheetfile[getSheetIndex(ctx, item.index)];
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
    groupValuesRefreshData = [];
  }
}

export function hasGroupValuesRefreshData() {
  return groupValuesRefreshData.length > 0;
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

  if (_.isNil(execFunctionGlobalData)) {
    execFunctionGlobalData = {};
  }
  // let luckysheetfile = getluckysheetfile();
  // let dynamicArray_compute = luckysheetfile[getSheetIndex(ctx.currentSheetIndex)_.isNil(]["dynamicArray_compute"]) ? {} : luckysheetfile[getSheetIndex(ctx.currentSheetIndex)]["dynamicArray_compute"];

  if (_.isNil(index)) {
    index = ctx.currentSheetIndex;
  }

  if (!_.isNil(value)) {
    // 此处setcellvalue 中this.execFunctionGroupData会保存想要更新的值，本函数结尾不要设为null,以备后续函数使用
    // setcellvalue(origin_r, origin_c, _this.execFunctionGroupData, value);
    const cellCache = [[{ v: null }]];
    setCellValue(ctx, 0, 0, cellCache, value);
    [[execFunctionGlobalData[`${origin_r}_${origin_c}_${index}`]]] = cellCache;
  }

  // { "r": r, "c": c, "index": index, "func": func}
  const calcChains = getAllFunctionGroup(ctx);
  const formulaObjects: any = {};

  const sheets = ctx.luckysheetfile;
  const sheetData: any = {};
  for (let i = 0; i < sheets.length; i += 1) {
    const sheet = sheets[i];
    sheetData[sheet.index] = sheet.data;
  }

  // 把修改涉及的单元格存储为对象
  const updateValueOjects: any = {};
  const updateValueArray: any = [];
  if (_.isNil(execFunctionExist)) {
    const key = `r${origin_r}c${origin_c}i${index}`;
    updateValueOjects[key] = 1;
  } else {
    for (let x = 0; x < execFunctionExist.length; x += 1) {
      const cell = execFunctionExist[x];
      const key = `r${cell.r}c${cell.c}i${cell.i}`;
      updateValueOjects[key] = 1;
    }
  }

  const arrayMatchCache: any = {};
  const arrayMatch = (
    formulaArray: any,
    formulaObjects: any,
    updateValueOjects: any,
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
              (formulaObjects && key in formulaObjects) ||
              (updateValueOjects && key in updateValueOjects)
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

        if (formulaObjects || updateValueOjects) {
          arrayMatchCache[cacheKey] = functionArr;
        }
      }
    }
  };

  const existsChildFormulaMatch = {};
  let ii = 0;

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
        calc_funcStr.substr(0, 2) === '="' &&
        calc_funcStr.substr(calc_funcStr.length - 1, 1) === '"'
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
      for (let i = 0; i < calc_funcStr_length; i += 1) {
        const char = calc_funcStr.charAt(i);
        if (char === "'" && dquote === -1) {
          // 如果是单引号开始
          if (squote === -1) {
            if (point !== i) {
              formulaTextArray.push(
                ...calc_funcStr
                  .substring(point, i)
                  .split(/==|!=|<>|<=|>=|[,()=+-\/*%&\^><]/)
              );
            }
            squote = i;
            point = i;
          } // 单引号结束
          else {
            // if (squote === i - 1)//配对的单引号后第一个字符不能是单引号
            // {
            //    ;//到此处说明公式错误
            // }
            // 如果是''代表着输出'
            if (
              i < calc_funcStr_length - 1 &&
              calc_funcStr.charAt(i + 1) === "'"
            ) {
              i += 1;
            } else {
              // 如果下一个字符不是'代表单引号结束
              // if (calc_funcStr.charAt(i - 1) === "'") {//配对的单引号后最后一个字符不能是单引号
              //    ;//到此处说明公式错误
              point = i + 1;
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
            if (point !== i) {
              formulaTextArray.push(
                ...calc_funcStr
                  .substring(point, i)
                  .split(/==|!=|<>|<=|>=|[,()=+-\/*%&\^><]/)
              );
            }
            dquote = i;
            point = i;
          } else {
            // 如果是""代表着输出"
            if (
              i < calc_funcStr_length - 1 &&
              calc_funcStr.charAt(i + 1) === '"'
            ) {
              i += 1;
            } else {
              // 双引号结束
              point = i + 1;
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
            .split(/==|!=|<>|<=|>=|[,()=+-\/*%&\^><]/)
        );
      }
      // 拼接所有配对单引号及之后一个单元格内容，例如["'1-2'","!A1"]拼接为["'1-2'!A1"]
      for (let i = sq_end_array.length - 1; i >= 0; i -= 1) {
        if (sq_end_array[i] !== formulaTextArray.length - 1) {
          formulaTextArray[sq_end_array[i]] +=
            formulaTextArray[sq_end_array[i] + 1];
          formulaTextArray.splice(sq_end_array[i] + 1, 1);
        }
      }
      // 至此=SUM('1-2'!A1:A2&"'1-2'!A2")由原来的["","SUM","'1","2'!A1:A2","",""'1","2'!A2""]更正为["","SUM","","'1-2'!A1:A2","","",""'1-2'!A2""]

      for (let i = 0; i < formulaTextArray.length; i += 1) {
        const t = formulaTextArray[i];
        if (t.length <= 1) {
          continue;
        }

        if (
          t.substr(0, 1) === '"' &&
          t.substr(t.length - 1, 1) === '"' &&
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

    ii += 1;

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

    window.luckysheet_getcelldata_cache = null;
    const { calc_funcStr } = formulaCell;

    const v = execfunction(
      ctx,
      calc_funcStr,
      formulaCell.r,
      formulaCell.c,
      formulaCell.index
    );

    groupValuesRefreshData.push({
      r: formulaCell.r,
      c: formulaCell.c,
      v: v[1],
      f: v[2],
      spe: v[3],
      index: formulaCell.index,
    });

    // _this.execFunctionGroupData[u.r][u.c] = value;
    execFunctionGlobalData[
      `${formulaCell.r}_${formulaCell.c}_${formulaCell.index}`
    ] = {
      v: v[1],
      f: v[2],
    };
  }
  // console.log(formulaRunList);
  // console.timeEnd("4");

  execFunctionExist = null;
}
