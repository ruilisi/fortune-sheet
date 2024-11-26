import _ from "lodash";
import { Context, getFlowdata } from "../context";
import { CellMatrix, Sheet } from "../types";
import { getSheetIndex } from "../utils";
import { getCellValue, getRangeByTxt } from "./cell";
import { genarate } from "./format";
import { execfunction, functionCopy } from "./formula";
import { checkProtectionFormatCells } from "./protection";
import { isRealNull } from "./validation";

// 得到历史的规则
export function getHistoryRules(fileH: Sheet[]) {
  const historyRules = [];
  for (let h = 0; h < fileH.length; h += 1) {
    historyRules.push({
      sheetIndex: h,
      luckysheet_conditionformat_save: fileH[h].luckysheet_conditionformat_save,
    });
  }
  return historyRules;
}

// 得到当前的规则
export function getCurrentRules(fileC: Sheet[]) {
  const currentRules = [];
  for (let c = 0; c < fileC.length; c += 1) {
    currentRules.push({
      sheetIndex: c,
      luckysheet_conditionformat_save: fileC[c].luckysheet_conditionformat_save,
    });
  }
  return currentRules;
}

// 设置规则
export function setConditionRules(
  ctx: Context,
  protection: any,
  generalDialog: any,
  conditionformat: any,
  rules: any
) {
  if (!checkProtectionFormatCells(ctx)) {
    return;
  }

  // 条件名称
  const conditionName = rules.rulesType;

  // 条件单元格
  const conditionRange = [];

  // 条件值
  const conditionValue = [];

  if (
    conditionName === "greaterThan" ||
    conditionName === "lessThan" ||
    conditionName === "equal" ||
    conditionName === "textContains"
  ) {
    let v = rules.rulesValue;
    const rangeArr = getRangeByTxt(ctx, v);
    // 判断条件值是不是选区
    if (rangeArr.length > 1) {
      const r1 = rangeArr[0].row[0];
      const r2 = rangeArr[0].row[1];
      const c1 = rangeArr[0].column[0];
      const c2 = rangeArr[0].column[1];
      if (r1 === r2 && c1 === c2) {
        const d = getFlowdata(ctx);
        if (!d) return;
        v = getCellValue(r1, c1, d);
        conditionRange.push({
          row: rangeArr[0].row,
          column: rangeArr[0].column,
        });
        conditionValue.push(v);
      } else {
        ctx.warnDialog = conditionformat.onlySingleCell;
      }
    } else if (rangeArr.length === 0) {
      if (_.isNaN(v) || v === "") {
        ctx.warnDialog = conditionformat.conditionValueCanOnly;
        return;
      }
      conditionValue.push(v);
    }
  } else if (conditionName === "between") {
    let v1 = rules.betweenValue.value1;
    let v2 = rules.betweenValue.value2;

    // 值转为数组坐标
    const rangeArr1 = getRangeByTxt(ctx, v1);
    if (rangeArr1.length > 1) {
      ctx.warnDialog = conditionformat.onlySingleCell;
      return;
    }
    if (rangeArr1.length === 1) {
      const r1 = rangeArr1[0].row[0];
      const r2 = rangeArr1[0].row[1];
      const c1 = rangeArr1[0].column[0];
      const c2 = rangeArr1[0].column[1];
      if (r1 === r2 && c1 === c2) {
        const d = getFlowdata(ctx);
        if (!d) return;
        v1 = getCellValue(r1, c1, d);
        conditionRange.push({
          row: rangeArr1[0].row,
          column: rangeArr1[0].column,
        });
        conditionValue.push(v1);
      } else {
        ctx.warnDialog = conditionformat.onlySingleCell;
        return;
      }
    } else if (rangeArr1.length === 0) {
      if (_.isNaN(v1) || v1 === "") {
        ctx.warnDialog = conditionformat.conditionValueCanOnly;
        return;
      }
      conditionValue.push(v1);
    }
    const rangeArr2 = getRangeByTxt(ctx, v2);
    if (rangeArr2.length > 1) {
      ctx.warnDialog = conditionformat.onlySingleCell;
      return;
    }
    if (rangeArr2.length === 1) {
      const r1 = rangeArr2[0].row[0];
      const r2 = rangeArr2[0].row[1];
      const c1 = rangeArr2[0].column[0];
      const c2 = rangeArr2[0].column[1];
      if (r1 === r2 && c1 === c2) {
        const d = getFlowdata(ctx);
        if (!d) return;
        v2 = getCellValue(r1, c1, d);
        conditionRange.push({
          row: rangeArr2[0].row,
          column: rangeArr2[0].column,
        });
      } else {
        ctx.warnDialog = conditionformat.onlySingleCell;
        return;
      }
    } else if (rangeArr2.length === 0) {
      if (_.isNaN(v2) || v2 === "") {
        ctx.warnDialog = conditionformat.conditionValueCanOnly;
      } else {
        conditionValue.push(v2);
      }
    }
  } else if (conditionName === "occurrenceDate") {
    const v = rules.dateValue;
    if (!v) {
      ctx.warnDialog = conditionformat.pleaseSelectADate;
      return;
    }
    conditionValue.push(v);
  } else if (conditionName === "duplicateValue") {
    conditionValue.push(rules.repeatValue);
  } else if (
    conditionName === "top10" ||
    conditionName === "top10_percent" ||
    conditionName === "last10" ||
    conditionName === "last10_percent"
  ) {
    const v = rules.projectValue;
    if (
      parseInt(v, 10).toString() !== v ||
      parseInt(v, 10) < 1 ||
      parseInt(v, 10) > 1000
    ) {
      ctx.warnDialog = conditionformat.pleaseEnterInteger;
      return;
    }
    conditionValue.push(v);
  } else {
    conditionValue.push(conditionName);
  }
  //  else if (conditionName === "aboveAverage") {
  //   conditionValue.push("aboveAverage");
  // } else if (conditionName === "belowAverage") {
  //   conditionValue.push("belowAverage");
  // }

  // 颜色
  let textColor = null;
  if (rules.textColor.check) {
    textColor = rules.textColor.color;
  }

  let cellColor = null;
  if (rules.cellColor.check) {
    cellColor = rules.cellColor.color;
  }

  // 获得之前的规则
  // const fileH = ctx.luckysheetfile ?? [];
  // const historyRules = getHistoryRules(fileH);

  // 构造现在的规则
  const rule = {
    type: "default",
    cellrange: ctx.luckysheet_select_save ?? [],
    format: {
      textColor,
      cellColor,
    },
    conditionName,
    conditionRange,
    conditionValue,
  };
  const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
  const ruleArr =
    ctx.luckysheetfile[index].luckysheet_conditionformat_save ?? [];
  ruleArr?.push(rule);

  ctx.luckysheetfile[index].luckysheet_conditionformat_save = ruleArr;
  // const fileC = ctx.luckysheetfile ?? [];
  // const currentRules = getCurrentRules(fileC);
}

export function getColorGradation(
  color1: string,
  color2: string,
  value1: number,
  value2: number,
  value: number
) {
  const rgb1 = color1.split(",");
  const r1 = parseInt(rgb1[0].split("(")[1], 10);
  const g1 = parseInt(rgb1[1], 10);
  const b1 = parseInt(rgb1[2].split(")")[0], 10);

  const rgb2 = color2.split(",");
  const r2 = parseInt(rgb2[0].split("(")[1], 10);
  const g2 = parseInt(rgb2[1], 10);
  const b2 = parseInt(rgb2[2].split(")")[0], 10);

  const v12 = value1 - value2;
  const v10 = value1 - value;

  const r = Math.round(r1 - ((r1 - r2) / v12) * v10);
  const g = Math.round(g1 - ((g1 - g2) / v12) * v10);
  const b = Math.round(b1 - ((b1 - b2) / v12) * v10);

  return `rgb(${r}, ${g}, ${b})`;
}

export function compute(ctx: Context, ruleArr: any, d: CellMatrix) {
  if (_.isNil(ruleArr)) {
    ruleArr = [];
  }
  // 条件计算存储
  const computeMap: any = {};

  if (ruleArr.length > 0) {
    for (let i = 0; i < ruleArr.length; i += 1) {
      const { type, cellrange, format } = ruleArr[i];
      // 数据条
      if (type === "dataBar") {
        let max = null;
        let min = null;
        for (let s = 0; s < cellrange.length; s += 1) {
          for (let r = cellrange[s].row[0]; r <= cellrange[s].row[1]; r += 1) {
            for (
              let c = cellrange[s].column[0];
              c <= cellrange[s].column[1];
              c += 1
            ) {
              if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                continue;
              }
              const cell = d[r][c];
              if (
                !_.isNil(cell) &&
                !_.isNil(cell.ct) &&
                cell.ct.t === "n" &&
                _.isNil(cell.v)
              ) {
                if (_.isNil(max) || parseInt(`${cell.v}`, 10) > max) {
                  max = parseInt(`${cell.v}`, 10);
                }

                if (_.isNil(min) || parseInt(`${cell.v}`, 10) < min) {
                  min = parseInt(`${cell.v}`, 10);
                }
              }
            }
          }
        }
        if (!_.isNil(max) && !_.isNil(min)) {
          if (min < 0) {
            // 选区范围内有负数
            const plusLen = Math.round((max / (max - min)) * 10) / 10; // 正数所占比
            const minusLen =
              Math.round((Math.abs(min) / (max - min)) * 10) / 10; // 负数所占比

            for (let s = 0; s < cellrange.length; s += 1) {
              for (
                let r = cellrange[s].row[0];
                r <= cellrange[s].row[1];
                r += 1
              ) {
                for (
                  let c = cellrange[s].column[0];
                  c <= cellrange[s].column[1];
                  c += 1
                ) {
                  if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                    continue;
                  }

                  const cell = d[r][c];

                  if (
                    !_.isNil(cell) &&
                    !_.isNil(cell.ct) &&
                    cell.ct.t === "n" &&
                    !_.isNil(cell.v)
                  ) {
                    if (parseInt(`${cell.v}`, 10) < 0) {
                      // 负数
                      const valueLen =
                        Math.round(
                          (Math.abs(parseInt(`${cell.v}`, 10)) /
                            Math.abs(min)) *
                            100
                        ) / 100;

                      if (`${r}_${c}` in computeMap) {
                        computeMap[`${r}_${c}`].dataBar = {
                          valueType: "minus",
                          minusLen,
                          valueLen,
                          format,
                        };
                      } else {
                        computeMap[`${r}_${c}`] = {
                          dataBar: {
                            valueType: "minus",
                            minusLen,
                            valueLen,
                            format,
                          },
                        };
                      }
                    }

                    if (parseInt(`${cell.v}`, 10) > 0) {
                      // 正数
                      const valueLen =
                        Math.round((parseInt(`${cell.v}`, 10) / max) * 100) /
                        100;

                      if (`${r}_${c}` in computeMap) {
                        computeMap[`${r}_${c}`].dataBar = {
                          valueType: "plus",
                          plusLen,
                          minusLen,
                          valueLen,
                          format,
                        };
                      } else {
                        computeMap[`${r}_${c}`] = {
                          dataBar: {
                            valueType: "plus",
                            plusLen,
                            minusLen,
                            valueLen,
                            format,
                          },
                        };
                      }
                    }
                  }
                }
              }
            }
          } else {
            const plusLen = 1;

            for (let s = 0; s < cellrange.length; s += 1) {
              for (
                let r = cellrange[s].row[0];
                r <= cellrange[s].row[1];
                r += 1
              ) {
                for (
                  let c = cellrange[s].column[0];
                  c <= cellrange[s].column[1];
                  c += 1
                ) {
                  if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                    continue;
                  }

                  const cell = d[r][c];

                  if (
                    !_.isNil(cell) &&
                    !_.isNil(cell.ct) &&
                    cell.ct.t === "n" &&
                    !_.isNil(cell.v)
                  ) {
                    let valueLen;
                    if (max === 0) {
                      valueLen = 1;
                    } else {
                      valueLen =
                        Math.round((parseInt(`${cell.v}`, 10) / max) * 100) /
                        100;
                    }

                    if (`${r}_${c}` in computeMap) {
                      computeMap[`${r}_${c}`].dataBar = {
                        valueType: "plus",
                        plusLen,
                        valueLen,
                        format,
                      };
                    } else {
                      computeMap[`${r}_${c}`] = {
                        dataBar: {
                          valueType: "plus",
                          plusLen,
                          valueLen,
                          format,
                        },
                      };
                    }
                  }
                }
              }
            }
          }
        }
      } else if (type === "colorGradation") {
        // 色阶
        let max = null;
        let min = null;
        let sum = 0;
        let count = 0;
        for (let s = 0; s < cellrange.length; s += 1) {
          for (let r = cellrange[s].row[0]; r <= cellrange[s].row[1]; r += 1) {
            for (
              let c = cellrange[s].column[0];
              c <= cellrange[s].column[1];
              c += 1
            ) {
              if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                continue;
              }

              const cell = d[r][c];

              if (
                !_.isNil(cell) &&
                !_.isNil(cell.ct) &&
                cell.ct.t === "n" &&
                !_.isNil(cell.v)
              ) {
                count += 1;
                sum += parseInt(`${cell.v}`, 10);

                if (_.isNil(max) || parseInt(`${cell.v}`, 10) > max) {
                  max = parseInt(`${cell.v}`, 10);
                }

                if (_.isNil(min) || parseInt(`${cell.v}`, 10) < min) {
                  min = parseInt(`${cell.v}`, 10);
                }
              }
            }
          }
        }
        if (!_.isNil(max) && !_.isNil(min)) {
          if (format.length === 3) {
            // 三色色阶
            const avg = Math.floor(sum / count);

            for (let s = 0; s < cellrange.length; s += 1) {
              for (
                let r = cellrange[s].row[0];
                r <= cellrange[s].row[1];
                r += 1
              ) {
                for (
                  let c = cellrange[s].column[0];
                  c <= cellrange[s].column[1];
                  c += 1
                ) {
                  if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                    continue;
                  }

                  const cell = d[r][c];

                  if (
                    !_.isNil(cell) &&
                    !_.isNil(cell.ct) &&
                    cell.ct.t === "n" &&
                    !_.isNil(cell.v)
                  ) {
                    if (parseInt(`${cell.v}`, 10) === min) {
                      if (`${r}_${c}` in computeMap) {
                        computeMap[`${r}_${c}`].cellColor = format.cellColor;
                      } else {
                        computeMap[`${r}_${c}`] = {
                          cellColor: format.cellColor,
                        };
                      }
                    } else if (
                      parseInt(`${cell.v}`, 10) > min &&
                      parseInt(`${cell.v}`, 10) < avg
                    ) {
                      if (`${r}_${c}` in computeMap) {
                        computeMap[`${r}_${c}`].cellColor = getColorGradation(
                          format.cellColor,
                          format.textColor,
                          min,
                          avg,
                          parseInt(`${cell.v}`, 10)
                        );
                      } else {
                        computeMap[`${r}_${c}`] = {
                          cellColor: getColorGradation(
                            format[2],
                            format[1],
                            min,
                            avg,
                            parseInt(`${cell.v}`, 10)
                          ),
                        };
                      }
                    } else if (parseInt(`${cell.v}`, 10) === avg) {
                      if (`${r}_${c}` in computeMap) {
                        computeMap[`${r}_${c}`].cellColor = format.cellColor;
                      } else {
                        computeMap[`${r}_${c}`] = { cellColor: format[1] };
                      }
                    } else if (
                      parseInt(`${cell.v}`, 10) > avg &&
                      parseInt(`${cell.v}`, 10) < max
                    ) {
                      if (`${r}_${c}` in computeMap) {
                        computeMap[`${r}_${c}`].cellColor = getColorGradation(
                          format[1],
                          format[0],
                          avg,
                          max,
                          parseInt(`${cell.v}`, 10)
                        );
                      } else {
                        computeMap[`${r}_${c}`] = {
                          cellColor: getColorGradation(
                            format[1],
                            format[0],
                            avg,
                            max,
                            parseInt(`${cell.v}`, 10)
                          ),
                        };
                      }
                    } else if (parseInt(`${cell.v}`, 10) === max) {
                      if (`${r}_${c}` in computeMap) {
                        computeMap[`${r}_${c}`].cellColor = format.cellColor;
                      } else {
                        computeMap[`${r}_${c}`] = { cellColor: format[0] };
                      }
                    }
                  }
                }
              }
            }
          } else if (format.length === 2) {
            // 两色色阶
            for (let s = 0; s < cellrange.length; s += 1) {
              for (
                let r = cellrange[s].row[0];
                r <= cellrange[s].row[1];
                r += 1
              ) {
                for (
                  let c = cellrange[s].column[0];
                  c <= cellrange[s].column[1];
                  c += 1
                ) {
                  if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                    continue;
                  }

                  const cell = d[r][c];

                  if (
                    !_.isNil(cell) &&
                    !_.isNil(cell.ct) &&
                    cell.ct.t === "n" &&
                    !_.isNil(cell.v)
                  ) {
                    if (parseInt(`${cell.v}`, 10) === min) {
                      if (`${r}_${c}` in computeMap) {
                        computeMap[`${r}_${c}`].cellColor = format.cellColor;
                      } else {
                        computeMap[`${r}_${c}`] = { cellColor: format[1] };
                      }
                    } else if (
                      parseInt(`${cell.v}`, 10) > min &&
                      parseInt(`${cell.v}`, 10) < max
                    ) {
                      if (`${r}_${c}` in computeMap) {
                        computeMap[`${r}_${c}`].cellColor = getColorGradation(
                          format[1],
                          format[0],
                          min,
                          max,
                          parseInt(`${cell.v}`, 10)
                        );
                      } else {
                        computeMap[`${r}_${c}`] = {
                          cellColor: getColorGradation(
                            format[1],
                            format[0],
                            min,
                            max,
                            parseInt(`${cell.v}`, 10)
                          ),
                        };
                      }
                    } else if (parseInt(`${cell.v}`, 10) === max) {
                      if (`${r}_${c}` in computeMap) {
                        computeMap[`${r}_${c}`].cellColor = format.textColor;
                      } else {
                        computeMap[`${r}_${c}`] = { cellColor: format[0] };
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else if (type === "icons") {
        // 图标集
      } else {
        // 其他
        // 获取变量值
        const { conditionName } = ruleArr[i];
        const conditionValue0 = ruleArr[i].conditionValue[0];
        const conditionValue1 = ruleArr[i].conditionValue[1];
        const { textColor, cellColor } = format;
        for (let s = 0; s < cellrange.length; s += 1) {
          // 条件类型判断
          if (
            conditionName === "greaterThan" ||
            conditionName === "lessThan" ||
            conditionName === "equal" ||
            conditionName === "textContains"
          ) {
            // 循环应用范围计算
            for (
              let r = cellrange[s].row[0];
              r <= cellrange[s].row[1];
              r += 1
            ) {
              for (
                let c = cellrange[s].column[0];
                c <= cellrange[s].column[1];
                c += 1
              ) {
                if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                  continue;
                }
                // 单元格值
                const cell = d[r][c];
                if (_.isNil(cell) || _.isNil(cell.v) || isRealNull(cell.v)) {
                  continue;
                }
                // 符合条件
                if (
                  conditionName === "greaterThan" &&
                  cell.v > conditionValue0
                ) {
                  if (`${r}_${c}` in computeMap) {
                    computeMap[`${r}_${c}`].textColor = textColor;
                    computeMap[`${r}_${c}`].cellColor = cellColor;
                  } else {
                    computeMap[`${r}_${c}`] = { textColor, cellColor };
                  }
                } else if (
                  conditionName === "lessThan" &&
                  cell.v < conditionValue0
                ) {
                  if (`${r}_${c}` in computeMap) {
                    computeMap[`${r}_${c}`].textColor = textColor;
                    computeMap[`${r}_${c}`].cellColor = cellColor;
                  } else {
                    computeMap[`${r}_${c}`] = {
                      textColor,
                      cellColor,
                    };
                  }
                } else if (
                  conditionName === "equal" &&
                  cell.v.toString() === conditionValue0
                ) {
                  if (`${r}_${c}` in computeMap) {
                    computeMap[`${r}_${c}`].textColor = textColor;
                    computeMap[`${r}_${c}`].cellColor = cellColor;
                  } else {
                    computeMap[`${r}_${c}`] = {
                      textColor,
                      cellColor,
                    };
                  }
                } else if (
                  conditionName === "textContains" &&
                  cell.v.toString().indexOf(conditionValue0) !== -1
                ) {
                  if (`${r}_${c}` in computeMap) {
                    computeMap[`${r}_${c}`].textColor = textColor;
                    computeMap[`${r}_${c}`].cellColor = cellColor;
                  } else {
                    computeMap[`${r}_${c}`] = {
                      textColor,
                      cellColor,
                    };
                  }
                }
              }
            }
          } else if (conditionName === "between") {
            // 比较两个值的大小
            let vBig = 0;
            let vSmall = 0;
            if (conditionValue0 > conditionValue1) {
              vBig = conditionValue0;
              vSmall = conditionValue1;
            } else {
              vBig = conditionValue1;
              vSmall = conditionValue0;
            }
            // 循环应用范围计算
            for (
              let r = cellrange[s].row[0];
              r <= cellrange[s].row[1];
              r += 1
            ) {
              for (
                let c = cellrange[s].column[0];
                c <= cellrange[s].column[1];
                c += 1
              ) {
                if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                  continue;
                }
                // 单元格值
                const cell = d[r][c];
                if (_.isNil(cell) || _.isNil(cell.v) || isRealNull(cell.v)) {
                  continue;
                }
                // 符合条件
                if (
                  typeof cell.v === "number" &&
                  cell.v >= vSmall &&
                  cell.v <= vBig
                ) {
                  if (`${r}_${c}` in computeMap) {
                    computeMap[`${r}_${c}`].textColor = textColor;
                    computeMap[`${r}_${c}`].cellColor = cellColor;
                  } else {
                    computeMap[`${r}_${c}`] = {
                      textColor,
                      cellColor,
                    };
                  }
                }
              }
            }
          } else if (conditionName === "occurrenceDate") {
            let dBig;
            let dSmall;
            if (conditionValue0.toString().indexOf("-") === -1) {
              dBig = genarate(conditionValue0)![2].toString();
              dSmall = genarate(conditionValue0)![2].toString();
            } else {
              const str = conditionValue0.toString().split("-");
              dBig = genarate(str[1].trim())![2].toString();
              dSmall = genarate(str[0].trim()![2].toString());
            }
            // 循环应用范围计算
            for (
              let r = cellrange[s].row[0];
              r <= cellrange[s].row[1];
              r += 1
            ) {
              for (
                let c = cellrange[s].column[0];
                c <= cellrange[s].column[1];
                c += 1
              ) {
                if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                  continue;
                }
                // 单元格值类型为日期类型
                if (
                  !_.isNil(d[r][c]) &&
                  !_.isNil(d[r][c]!.ct) &&
                  d[r][c]!.ct!.t === "d"
                ) {
                  // 单元格值
                  const cellVal = getCellValue(r, c, d);
                  // 符合条件
                  if (cellVal >= dSmall && cellVal <= dBig) {
                    if (`${r}_${c}` in computeMap) {
                      computeMap[`${r}_${c}`].textColor = textColor;
                      computeMap[`${r}_${c}`].cellColor = cellColor;
                    } else {
                      computeMap[`${r}_${c}`] = {
                        textColor,
                        cellColor,
                      };
                    }
                  }
                }
              }
            }
          } else if (conditionName === "duplicateValue") {
            // 应用范围单元格处理
            const dmap: any = {};
            for (
              let r = cellrange[s].row[0];
              r <= cellrange[s].row[1];
              r += 1
            ) {
              for (
                let c = cellrange[s].column[0];
                c <= cellrange[s].column[1];
                c += 1
              ) {
                const item = getCellValue(r, c, d);
                if (!(item in dmap)) {
                  dmap[item] = [];
                }
                dmap[item].push({ r, c });
              }
            }
            // 循环应用范围计算
            if (conditionValue0 === "0") {
              // 重复值
              _.forEach(dmap, (x) => {
                if (x.length > 1) {
                  for (let j = 0; j < x.length; j += 1) {
                    if (`${x[j].r}_${x[j].c}` in computeMap) {
                      computeMap[`${x[j].r}_${x[j].c}`].textColor = textColor;
                      computeMap[`${x[j].r}_${x[j].c}`].cellColor = cellColor;
                    } else {
                      computeMap[`${x[j].r}_${x[j].c}`] = {
                        textColor,
                        cellColor,
                      };
                    }
                  }
                }
              });
            } else if (conditionValue0 === "1") {
              // 唯一值
              _.forEach(dmap, (x) => {
                if (x.length === 1) {
                  if (`${x[0].r}_${x[0].c}` in computeMap) {
                    computeMap[`${x[0].r}_${x[0].c}`].textColor = textColor;
                    computeMap[`${x[0].r}_${x[0].c}`].cellColor = cellColor;
                  } else {
                    computeMap[`${x[0].r}_${x[0].c}`] = {
                      textColor,
                      cellColor,
                    };
                  }
                }
              });
            }
          } else if (
            conditionName === "top10" ||
            conditionName === "top10_percent" ||
            conditionName === "last10" ||
            conditionName === "last10_percent" ||
            conditionName === "aboveAverage" ||
            conditionName === "belowAverage"
          ) {
            // 应用范围单元格值(数值型)
            const dArr = [];
            for (
              let r = cellrange[s].row[0];
              r <= cellrange[s].row[1];
              r += 1
            ) {
              for (
                let c = cellrange[s].column[0];
                c <= cellrange[s].column[1];
                c += 1
              ) {
                if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                  continue;
                }

                // 单元格值类型为数字类型
                if (
                  !_.isNil(d[r][c]) &&
                  !_.isNil(d[r][c]!.ct) &&
                  d[r][c]!.ct!.t === "n"
                ) {
                  dArr.push(getCellValue(r, c, d));
                }
              }
            }
            // 数组处理
            if (
              conditionName === "top10" ||
              conditionName === "top10_percent" ||
              conditionName === "last10" ||
              conditionName === "last10_percent"
            ) {
              // 从大到小排序
              for (let j = 0; j < dArr.length; j += 1) {
                for (let k = 0; k < dArr.length - 1 - j; k += 1) {
                  if (dArr[k] < dArr[k + 1]) {
                    const temp: any = dArr[k];
                    dArr[k] = dArr[k + 1];
                    dArr[k + 1] = temp;
                  }
                }
              }
              // 取条件值数组

              let cArr;
              if (conditionName === "top10") {
                cArr = dArr.slice(0, conditionValue0); // 前10项数组
              } else if (conditionName === "top10_percent") {
                cArr = dArr.slice(
                  0,
                  Math.floor((conditionValue0 * dArr.length) / 100)
                ); // 前10%数组
              } else if (conditionName === "last10") {
                cArr = dArr.slice(dArr.length - conditionValue0, dArr.length); // 最后10项数组
              } else if (conditionName === "last10_percent") {
                cArr = dArr.slice(
                  dArr.length -
                    Math.floor((conditionValue0 * dArr.length) / 100),
                  dArr.length
                ); // 最后10%数组
              }
              // 循环应用范围计算
              for (
                let r = cellrange[s].row[0];
                r <= cellrange[s].row[1];
                r += 1
              ) {
                for (
                  let c = cellrange[s].column[0];
                  c <= cellrange[s].column[1];
                  c += 1
                ) {
                  if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                    continue;
                  }

                  // 单元格值
                  const cellVal = getCellValue(r, c, d);
                  // 符合条件
                  if (!_.isNil(cArr) && cArr.indexOf(cellVal) !== -1) {
                    if (`${r}_${c}` in computeMap) {
                      computeMap[`${r}_${c}`].textColor = textColor;
                      computeMap[`${r}_${c}`].cellColor = cellColor;
                    } else {
                      computeMap[`${r}_${c}`] = {
                        textColor,
                        cellColor,
                      };
                    }
                  }
                }
              }
            } else if (
              conditionName === "aboveAverage" ||
              conditionName === "belowAverage"
            ) {
              // 计算数组平均值
              let sum = 0;
              for (let j = 0; j < dArr.length; j += 1) {
                sum += dArr[j];
              }
              const averageNum = sum / dArr.length;
              // 循环应用范围计算
              if (conditionName === "aboveAverage") {
                // 高于平均值
                for (
                  let r = cellrange[s].row[0];
                  r <= cellrange[s].row[1];
                  r += 1
                ) {
                  for (
                    let c = cellrange[s].column[0];
                    c <= cellrange[s].column[1];
                    c += 1
                  ) {
                    if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                      continue;
                    }

                    // 单元格值
                    const cellVal = getCellValue(r, c, d);
                    // 符合条件
                    if (cellVal > averageNum) {
                      if (`${r}_${c}` in computeMap) {
                        computeMap[`${r}_${c}`].textColor = textColor;
                        computeMap[`${r}_${c}`].cellColor = cellColor;
                      } else {
                        computeMap[`${r}_${c}`] = {
                          textColor,
                          cellColor,
                        };
                      }
                    }
                  }
                }
              } else if (conditionName === "belowAverage") {
                // 低于平均值
                for (
                  let r = cellrange[s].row[0];
                  r <= cellrange[s].row[1];
                  r += 1
                ) {
                  for (
                    let c = cellrange[s].column[0];
                    c <= cellrange[s].column[1];
                    c += 1
                  ) {
                    if (_.isNil(d[r]) || _.isNil(d[r][c])) {
                      continue;
                    }

                    // 单元格值
                    const cellVal = getCellValue(r, c, d);
                    // 符合条件
                    if (cellVal < averageNum) {
                      if (`${r}_${c}` in computeMap) {
                        computeMap[`${r}_${c}`].textColor = textColor;
                        computeMap[`${r}_${c}`].cellColor = cellColor;
                      } else {
                        computeMap[`${r}_${c}`] = {
                          textColor,
                          cellColor,
                        };
                      }
                    }
                  }
                }
              }
            }
          } else if (conditionName === "formula") {
            const str = cellrange[s].row[0];
            const edr = cellrange[s].row[1];
            const stc = cellrange[s].column[0];
            const edc = cellrange[s].column[1];

            let formulaTxt = conditionValue0;
            if (conditionValue0.toString().slice(0, 1) !== "=") {
              formulaTxt = `=${conditionValue0}`;
            }
            for (let r = str; r <= edr; r += 1) {
              for (let c = stc; c <= edc; c += 1) {
                let func = formulaTxt;
                const offsetRow = r - str;
                const offsetCol = c - stc;

                if (offsetRow > 0) {
                  func = `=${functionCopy(ctx, func, "down", offsetRow)}`;
                }

                if (offsetCol > 0) {
                  func = `=${functionCopy(ctx, func, "right", offsetCol)}`;
                }

                const funcV = execfunction(ctx, func, r, c);
                let v = funcV[1];

                if (typeof v !== "boolean") {
                  v = !!Number(v);
                }

                if (!v) {
                  continue;
                }

                if (`${r}_${c}` in computeMap) {
                  computeMap[`${r}_${c}`].textColor = textColor;
                  computeMap[`${r}_${c}`].cellColor = cellColor;
                } else {
                  computeMap[`${r}_${c}`] = {
                    textColor,
                    cellColor,
                  };
                }
              }
            }
          }
        }
      }
    }
  }
  return computeMap;
}

export function getComputeMap(ctx: Context) {
  const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
  const ruleArr = ctx.luckysheetfile[index].luckysheet_conditionformat_save;
  const { data } = ctx.luckysheetfile[index];
  if (_.isNil(data)) return null;
  const computeMap = compute(ctx, ruleArr, data);
  return computeMap;
}

export function checkCF(r: number, c: number, computeMap: any) {
  if (!_.isNil(computeMap) && `${r}_${c}` in computeMap) {
    return computeMap[`${r}_${c}`];
  }
  return null;
}

export function updateItem(ctx: Context, type: string) {
  if (!checkProtectionFormatCells(ctx)) {
    return;
  }
  const index = getSheetIndex(ctx, ctx.currentSheetId) as number;

  // 保存之前的规则
  // const fileH = ctx.luckysheetfile ?? [];
  // const historyRules = getHistoryRules(fileH);

  // 保存当前的规则
  let ruleArr = [];
  if (type === "delSheet") {
    ruleArr = [];
  } else {
    const rule = {
      type,
      cellrange: ctx.luckysheet_select_save ?? [],
      format: {
        textColor: ctx.conditionRules.textColor,
        cellColor: ctx.conditionRules.cellColor,
      },
    };
    ruleArr = ctx.luckysheetfile[index].luckysheet_conditionformat_save ?? [];
    ruleArr.push(rule);
  }
  ctx.luckysheetfile[index].luckysheet_conditionformat_save = ruleArr;
}

export function CFSplitRange(
  range1: any,
  range2: any,
  range3: any,
  type: string
) {
  let range: any = [];

  const offset_r = range3.row[0] - range2.row[0];
  const offset_c = range3.column[0] - range2.column[0];

  const r1 = range1.row[0];
  const r2 = range1.row[1];
  const c1 = range1.column[0];
  const c2 = range1.column[1];

  if (
    r1 >= range2.row[0] &&
    r2 <= range2.row[1] &&
    c1 >= range2.column[0] &&
    c2 <= range2.column[1]
  ) {
    // 选区 包含 条件格式应用范围 全部

    if (type === "allPart") {
      // 所有部分
      range = [
        {
          row: [r1 + offset_r, r2 + offset_r],
          column: [c1 + offset_c, c2 + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [r1 + offset_r, r2 + offset_r],
          column: [c1 + offset_c, c2 + offset_c],
        },
      ];
    }
  } else if (
    r1 >= range2.row[0] &&
    r1 <= range2.row[1] &&
    c1 >= range2.column[0] &&
    c2 <= range2.column[1]
  ) {
    // 选区 行贯穿 条件格式应用范围 上部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
        {
          row: [r1 + offset_r, range2.row[1] + offset_r],
          column: [c1 + offset_c, c2 + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [{ row: [range2.row[1] + 1, r2], column: [c1, c2] }];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [r1 + offset_r, range2.row[1] + offset_r],
          column: [c1 + offset_c, c2 + offset_c],
        },
      ];
    }
  } else if (
    r2 >= range2.row[0] &&
    r2 <= range2.row[1] &&
    c1 >= range2.column[0] &&
    c2 <= range2.column[1]
  ) {
    // 选区 行贯穿 条件格式应用范围 下部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        {
          row: [range2.row[0] + offset_r, r2 + offset_r],
          column: [c1 + offset_c, c2 + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [{ row: [r1, range2.row[0] - 1], column: [c1, c2] }];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [range2.row[0] + offset_r, r2 + offset_r],
          column: [c1 + offset_c, c2 + offset_c],
        },
      ];
    }
  } else if (
    r1 < range2.row[0] &&
    r2 > range2.row[1] &&
    c1 >= range2.column[0] &&
    c2 <= range2.column[1]
  ) {
    // 选区 行贯穿 条件格式应用范围 中间部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
        {
          row: [range2.row[0] + offset_r, range2.row[1] + offset_r],
          column: [c1 + offset_c, c2 + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
      ];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [range2.row[0] + offset_r, range2.row[1] + offset_r],
          column: [c1 + offset_c, c2 + offset_c],
        },
      ];
    }
  } else if (
    c1 >= range2.column[0] &&
    c1 <= range2.column[1] &&
    r1 >= range2.row[0] &&
    r2 <= range2.row[1]
  ) {
    // 选区 列贯穿 条件格式应用范围 左部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, r2], column: [range2.column[1] + 1, c2] },
        {
          row: [r1 + offset_r, r2 + offset_r],
          column: [c1 + offset_c, range2.column[1] + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [{ row: [r1, r2], column: [range2.column[1] + 1, c2] }];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [r1 + offset_r, r2 + offset_r],
          column: [c1 + offset_c, range2.column[1] + offset_c],
        },
      ];
    }
  } else if (
    c2 >= range2.column[0] &&
    c2 <= range2.column[1] &&
    r1 >= range2.row[0] &&
    r2 <= range2.row[1]
  ) {
    // 选区 列贯穿 条件格式应用范围 右部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, r2], column: [c1, range2.column[0] - 1] },
        {
          row: [r1 + offset_r, r2 + offset_r],
          column: [range2.column[0] + offset_c, c2 + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [{ row: [r1, r2], column: [c1, range2.column[0] - 1] }];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [r1 + offset_r, r2 + offset_r],
          column: [range2.column[0] + offset_c, c2 + offset_c],
        },
      ];
    }
  } else if (
    c1 < range2.column[0] &&
    c2 > range2.column[1] &&
    r1 >= range2.row[0] &&
    r2 <= range2.row[1]
  ) {
    // 选区 列贯穿 条件格式应用范围 中间部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, r2], column: [c1, range2.column[0] - 1] },
        { row: [r1, r2], column: [range2.column[1] + 1, c2] },
        {
          row: [r1 + offset_r, r2 + offset_r],
          column: [range2.column[0] + offset_c, range2.column[1] + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [
        { row: [r1, r2], column: [c1, range2.column[0] - 1] },
        { row: [r1, r2], column: [range2.column[1] + 1, c2] },
      ];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [r1 + offset_r, r2 + offset_r],
          column: [range2.column[0] + offset_c, range2.column[1] + offset_c],
        },
      ];
    }
  } else if (
    r1 >= range2.row[0] &&
    r1 <= range2.row[1] &&
    c1 >= range2.column[0] &&
    c1 <= range2.column[1]
  ) {
    // 选区 包含 条件格式应用范围 左上角部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, range2.row[1]], column: [range2.column[1] + 1, c2] },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
        {
          row: [r1 + offset_r, range2.row[1] + offset_r],
          column: [c1 + offset_c, range2.column[1] + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [
        { row: [r1, range2.row[1]], column: [range2.column[1] + 1, c2] },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
      ];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [r1 + offset_r, range2.row[1] + offset_r],
          column: [c1 + offset_c, range2.column[1] + offset_c],
        },
      ];
    }
  } else if (
    r1 >= range2.row[0] &&
    r1 <= range2.row[1] &&
    c2 >= range2.column[0] &&
    c2 <= range2.column[1]
  ) {
    // 选区 包含 条件格式应用范围 右上角部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, range2.row[1]], column: [c1, range2.column[0] - 1] },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
        {
          row: [r1 + offset_r, range2.row[1] + offset_r],
          column: [range2.column[0] + offset_c, c2 + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [
        { row: [r1, range2.row[1]], column: [c1, range2.column[0] - 1] },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
      ];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [r1 + offset_r, range2.row[1] + offset_r],
          column: [range2.column[0] + offset_c, c2 + offset_c],
        },
      ];
    }
  } else if (
    r2 >= range2.row[0] &&
    r2 <= range2.row[1] &&
    c1 >= range2.column[0] &&
    c1 <= range2.column[1]
  ) {
    // 选区 包含 条件格式应用范围 左下角部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        { row: [range2.row[0], r2], column: [range2.column[1] + 1, c2] },
        {
          row: [range2.row[0] + offset_r, r2 + offset_r],
          column: [c1 + offset_c, range2.column[1] + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        { row: [range2.row[0], r2], column: [range2.column[1] + 1, c2] },
      ];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [range2.row[0] + offset_r, r2 + offset_r],
          column: [c1 + offset_c, range2.column[1] + offset_c],
        },
      ];
    }
  } else if (
    r2 >= range2.row[0] &&
    r2 <= range2.row[1] &&
    c2 >= range2.column[0] &&
    c2 <= range2.column[1]
  ) {
    // 选区 包含 条件格式应用范围 右下角部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        { row: [range2.row[0], r2], column: [c1, range2.column[0] - 1] },
        {
          row: [range2.row[0] + offset_r, r2 + offset_r],
          column: [range2.column[0] + offset_c, c2 + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        { row: [range2.row[0], r2], column: [c1, range2.column[0] - 1] },
      ];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [range2.row[0] + offset_r, r2 + offset_r],
          column: [range2.column[0] + offset_c, c2 + offset_c],
        },
      ];
    }
  } else if (
    r1 < range2.row[0] &&
    r2 > range2.row[1] &&
    c1 >= range2.column[0] &&
    c1 <= range2.column[1]
  ) {
    // 选区 包含 条件格式应用范围 左中间部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        {
          row: [range2.row[0], range2.row[1]],
          column: [range2.column[1] + 1, c2],
        },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
        {
          row: [range2.row[0] + offset_r, range2.row[1] + offset_r],
          column: [c1 + offset_c, range2.column[1] + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        {
          row: [range2.row[0], range2.row[1]],
          column: [range2.column[1] + 1, c2],
        },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
      ];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [range2.row[0] + offset_r, range2.row[1] + offset_r],
          column: [c1 + offset_c, range2.column[1] + offset_c],
        },
      ];
    }
  } else if (
    r1 < range2.row[0] &&
    r2 > range2.row[1] &&
    c2 >= range2.column[0] &&
    c2 <= range2.column[1]
  ) {
    // 选区 包含 条件格式应用范围 右中间部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        {
          row: [range2.row[0], range2.row[1]],
          column: [c1, range2.column[0] - 1],
        },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
        {
          row: [range2.row[0] + offset_r, range2.row[1] + offset_r],
          column: [range2.column[0] + offset_c, c2 + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        {
          row: [range2.row[0], range2.row[1]],
          column: [c1, range2.column[0] - 1],
        },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
      ];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [range2.row[0] + offset_r, range2.row[1] + offset_r],
          column: [range2.column[0] + offset_c, c2 + offset_c],
        },
      ];
    }
  } else if (
    c1 < range2.column[0] &&
    c2 > range2.column[1] &&
    r1 >= range2.row[0] &&
    r1 <= range2.row[1]
  ) {
    // 选区 包含 条件格式应用范围 上中间部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, range2.row[1]], column: [c1, range2.column[0] - 1] },
        { row: [r1, range2.row[1]], column: [range2.column[1] + 1, c2] },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
        {
          row: [r1 + offset_r, range2.row[1] + offset_r],
          column: [range2.column[0] + offset_c, range2.column[1] + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [
        { row: [r1, range2.row[1]], column: [c1, range2.column[0] - 1] },
        { row: [r1, range2.row[1]], column: [range2.column[1] + 1, c2] },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
      ];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [r1 + offset_r, range2.row[1] + offset_r],
          column: [range2.column[0] + offset_c, range2.column[1] + offset_c],
        },
      ];
    }
  } else if (
    c1 < range2.column[0] &&
    c2 > range2.column[1] &&
    r2 >= range2.row[0] &&
    r2 <= range2.row[1]
  ) {
    // 选区 包含 条件格式应用范围 下中间部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        { row: [range2.row[0], r2], column: [c1, range2.column[0] - 1] },
        { row: [range2.row[0], r2], column: [range2.column[1] + 1, c2] },
        {
          row: [range2.row[0] + offset_r, r2 + offset_r],
          column: [range2.column[0] + offset_c, range2.column[1] + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        { row: [range2.row[0], r2], column: [c1, range2.column[0] - 1] },
        { row: [range2.row[0], r2], column: [range2.column[1] + 1, c2] },
      ];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [range2.row[0] + offset_r, r2 + offset_r],
          column: [range2.column[0] + offset_c, range2.column[1] + offset_c],
        },
      ];
    }
  } else if (
    r1 < range2.row[0] &&
    r2 > range2.row[1] &&
    c1 < range2.column[0] &&
    c2 > range2.column[1]
  ) {
    // 选区 包含 条件格式应用范围 正中间部分

    if (type === "allPart") {
      // 所有部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        {
          row: [range2.row[0], range2.row[1]],
          column: [c1, range2.column[0] - 1],
        },
        {
          row: [range2.row[0], range2.row[1]],
          column: [range2.column[1] + 1, c2],
        },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
        {
          row: [range2.row[0] + offset_r, range2.row[1] + offset_r],
          column: [range2.column[0] + offset_c, range2.column[1] + offset_c],
        },
      ];
    } else if (type === "restPart") {
      // 剩余部分
      range = [
        { row: [r1, range2.row[0] - 1], column: [c1, c2] },
        {
          row: [range2.row[0], range2.row[1]],
          column: [c1, range2.column[0] - 1],
        },
        {
          row: [range2.row[0], range2.row[1]],
          column: [range2.column[1] + 1, c2],
        },
        { row: [range2.row[1] + 1, r2], column: [c1, c2] },
      ];
    } else if (type === "operatePart") {
      // 操作部分
      range = [
        {
          row: [range2.row[0] + offset_r, range2.row[1] + offset_r],
          column: [range2.column[0] + offset_c, range2.column[1] + offset_c],
        },
      ];
    }
  } else {
    // 选区 在 条件格式应用范围 之外

    if (type === "allPart") {
      // 所有部分
      range = [{ row: [r1, r2], column: [c1, c2] }];
    } else if (type === "restPart") {
      // 剩余部分
      range = [{ row: [r1, r2], column: [c1, c2] }];
    } else if (type === "operatePart") {
      // 操作部分
      range = [];
    }
  }

  return range;
}
