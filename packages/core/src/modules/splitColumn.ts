import _ from "lodash";
import { Context, getFlowdata } from "../context";
import { getCellValue, setCellValue } from "./cell";

// 生成二维数组
export function getNullData(rlen: number, clen: number) {
  const arr = [];
  for (let r = 0; r < rlen; r += 1) {
    const rowArr = [];

    for (let c = 0; c < clen; c += 1) {
      rowArr.push("");
    }
    arr.push(rowArr);
  }
  return arr;
}

// 批量更新数据到表格
export function updateMoreCell(
  r: number,
  c: number,
  dataMatrix: string[][],
  ctx: Context
) {
  const flowdata = getFlowdata(ctx);
  dataMatrix.forEach((datas, i) => {
    datas.forEach((data, j) => {
      const v = dataMatrix[i][j];
      setCellValue(ctx, r + i, c + j, flowdata, v);
    });
  });
  // jfrefreshgrid(d, range);
  // selectHightlightShow();
}

// 处理分隔符
export function getRegStr(regStr: string, splitSymbols: any) {
  regStr = "";
  let mark = 0;
  for (let i = 0; i < splitSymbols.length; i += 1) {
    const split = splitSymbols[i];
    const inputNode = split.childNodes[0];
    if (inputNode.checked) {
      const { id } = inputNode;
      if (id === "Tab") {
        // Tab键
        regStr += "\\t";
        mark += 1;
      } else if (id === "semicolon") {
        // 分号
        if (mark > 0) {
          regStr += "|";
        }
        regStr += ";";
        mark = 1;
      } else if (id === "comma") {
        // 逗号
        if (mark > 0) {
          regStr += "|";
        }
        regStr += ",";
        mark += 1;
      } else if (id === "space") {
        // 空格
        if (mark > 0) {
          regStr += "|";
        }

        regStr += "\\s";
        mark += 1;
      } else if (id === "splitsimple") {
        // 连续分隔符号视为单个处理
        regStr = `[${regStr}]+`;
      } else if (id === "other") {
        // 其他
        const txt = split.childNodes[2].value;
        if (txt !== "") {
          if (mark > 0) {
            regStr += "|";
          }
          regStr += txt;
        }
      }
    }
  }
  return regStr;
}

// 获得分割数据
export function getDataArr(regStr: string, ctx: Context) {
  let arr = [];
  const r1 = ctx.luckysheet_select_save![0].row[0];
  const r2 = ctx.luckysheet_select_save![0].row[1];
  const c = ctx.luckysheet_select_save![0].column[0];
  const data = getFlowdata(ctx);
  if (!_.isNull(regStr) && regStr !== "") {
    const reg = new RegExp(regStr, "g");
    const dataArr = [];
    for (let r = r1; r <= r2; r += 1) {
      let rowArr = [];
      const cell = data![r][c];
      let value;
      if (!_.isNull(cell) && !_.isNull(cell.m)) {
        value = cell.m;
      } else {
        value = getCellValue(r, c, data!);
      }
      if (_.isNull(value) || _.isUndefined(value)) {
        value = "";
      }
      rowArr = value.toString().split(reg);
      dataArr.push(rowArr);
    }
    const rlen = dataArr.length;
    let clen = 0;
    for (let i = 0; i < rlen; i += 1) {
      if (dataArr[i].length > clen) {
        clen = dataArr[i].length;
      }
    }
    arr = getNullData(rlen, clen);
    for (let i = 0; i < arr.length; i += 1) {
      for (let j = 0; j < arr[0].length; j += 1) {
        if (dataArr[i][j] != null) {
          arr[i][j] = dataArr[i][j];
        }
      }
    }
  } else {
    for (let r = r1; r <= r2; r += 1) {
      const rowArr = [];
      const cell = data![r][c];
      let value;
      if (!_.isNull(cell) && !_.isNull(cell.m)) {
        value = cell.m;
      } else {
        value = getCellValue(r, c, data!);
      }

      if (_.isNull(value)) {
        value = "";
      }

      rowArr.push(value);

      arr.push(rowArr);
    }
  }
  return arr;
}
