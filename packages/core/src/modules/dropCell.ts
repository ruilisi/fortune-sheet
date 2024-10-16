import _ from "lodash";
import dayjs from "dayjs";

import { Context, getFlowdata } from "../context";
import { CellMatrix, Rect, Cell } from "../types";
import { colLocation, rowLocation } from "./location";
import { getSheetIndex, isAllowEdit } from "../utils";
import { getBorderInfoCompute } from "./border";
import { genarate, update } from "./format";
import * as formula from "./formula";
import { isRealNum } from "./validation";
import { CFSplitRange } from "./ConditionFormat";
import { normalizeSelection } from "./selection";
import { jfrefreshgrid } from "./refresh";

function toPx(v: number) {
  return `${v}px`;
}

export const dropCellCache: Record<string, any> = {
  copyRange: {}, // 复制范围
  applyRange: {}, // 应用范围
  applyType: null, // 0复制单元格，1填充序列，2仅填充格式，3不带格式填充，4以天数填充，5以工作日填充，6以月填充，7以年填充，8以中文小写数字序列填充
  direction: null, // down-往下拖拽，right-往右拖拽，up-往上拖拽，left-往左拖拽
  chnNumChar: {
    零: 0,
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  },
  chnNameValue: {
    十: { value: 10, secUnit: false },
    百: { value: 100, secUnit: false },
    千: { value: 1000, secUnit: false },
    万: { value: 10000, secUnit: true },
    亿: { value: 100000000, secUnit: true },
  },
  chnNumChar2: ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"],
  chnUnitSection: ["", "万", "亿", "万亿", "亿亿"],
  chnUnitChar: ["", "十", "百", "千"],
};

function chineseToNumber(chnStr: string) {
  let rtn = 0;
  let section = 0;
  let number = 0;
  let secUnit = false;
  const str = chnStr.split("");

  for (let i = 0; i < str.length; i += 1) {
    const num = dropCellCache.chnNumChar[str[i]];

    if (typeof num !== "undefined") {
      number = num;

      if (i === str.length - 1) {
        section += number;
      }
    } else {
      const unit = dropCellCache.chnNameValue[str[i]].value;
      secUnit = dropCellCache.chnNameValue[str[i]].secUnit;

      if (secUnit) {
        section = (section + number) * unit;
        rtn += section;
        section = 0;
      } else {
        section += number * unit;
      }

      number = 0;
    }
  }

  return rtn + section;
}

function sectionToChinese(section: number) {
  let strIns = "";
  let chnStr = "";
  let unitPos = 0;
  let zero = true;

  while (section > 0) {
    const v = section % 10;

    if (v === 0) {
      if (!zero) {
        zero = true;
        chnStr = dropCellCache.chnNumChar2[v] + chnStr;
      }
    } else {
      zero = false;
      strIns = dropCellCache.chnNumChar2[v];
      strIns += dropCellCache.chnUnitChar[unitPos];
      chnStr = strIns + chnStr;
    }

    unitPos += 1;
    section = Math.floor(section / 10);
  }

  return chnStr;
}

function numberToChinese(num: number) {
  let strIns = "";
  let chnStr = "";
  let unitPos = 0;
  let needZero = false;

  if (num === 0) {
    return dropCellCache.chnNumChar2[0];
  }
  while (num > 0) {
    const section = num % 10000;

    if (needZero) {
      chnStr = dropCellCache.chnNumChar2[0] + chnStr;
    }

    strIns = sectionToChinese(section);
    strIns +=
      section !== 0
        ? dropCellCache.chnUnitSection[unitPos]
        : dropCellCache.chnUnitSection[0];
    chnStr = strIns + chnStr;
    needZero = section < 1000 && section > 0;
    num = Math.floor(num / 10000);
    unitPos += 1;
  }

  return chnStr;
}

function isChnNumber(txt: string | number | undefined) {
  if (typeof txt === "number") {
    txt = `${txt}`;
  }
  let result = true;

  if (txt == null) {
    result = false;
  } else if (txt.length === 1) {
    if (txt === "日" || txt in dropCellCache.chnNumChar) {
      result = true;
    } else {
      result = false;
    }
  } else {
    const str = txt.split("");
    for (let i = 0; i < str.length; i += 1) {
      if (
        !(
          str[i] in dropCellCache.chnNumChar ||
          str[i] in dropCellCache.chnNameValue
        )
      ) {
        result = false;
        break;
      }
    }
  }

  return result;
}

function isExtendNumber(txt: string | number | undefined) {
  if (txt == null) return [false];
  if (typeof txt === "number") {
    txt = `${txt}`;
  }
  const reg = /0|([1-9]+[0-9]*)/g;
  const result = reg.test(txt);

  if (result) {
    const match = txt.match(reg);
    if (match) {
      const matchTxt = match[match.length - 1];
      const matchIndex = txt.lastIndexOf(matchTxt);
      const beforeTxt = txt.slice(0, matchIndex);
      const afterTxt = txt.slice(matchIndex + matchTxt.length);

      return [result, Number(matchTxt), beforeTxt, afterTxt];
    }
  }

  return [result];
}

// function isChnWeek1(txt: string | number) {
//   if (typeof txt === "number") {
//     txt = `${txt}`;
//   }
//   let result = false;
//   if (txt.length === 1 && (txt === "日" || chineseToNumber(txt) < 7)) {
//     result = true;
//   }

//   return result;
// }

function isChnWeek2(txt: string | number | undefined) {
  let result = false;
  if (typeof txt === "number") {
    txt = `${txt}`;
  }
  if (txt !== undefined && txt.length === 2) {
    if (
      txt === "周一" ||
      txt === "周二" ||
      txt === "周三" ||
      txt === "周四" ||
      txt === "周五" ||
      txt === "周六" ||
      txt === "周日"
    ) {
      result = true;
    }
  }

  return result;
}

function isChnWeek3(txt: string | number | undefined) {
  if (typeof txt === "number") {
    txt = `${txt}`;
  }
  let result = false;
  if (txt !== undefined && txt.length === 3) {
    if (
      txt === "星期一" ||
      txt === "星期二" ||
      txt === "星期三" ||
      txt === "星期四" ||
      txt === "星期五" ||
      txt === "星期六" ||
      txt === "星期日"
    ) {
      result = true;
    }
  }
  return result;
}

function isEqualDiff(arr: number[]) {
  let diff = true;
  const step = arr[1] - arr[0];

  for (let i = 1; i < arr.length; i += 1) {
    if (arr[i] - arr[i - 1] !== step) {
      diff = false;
      break;
    }
  }

  return diff;
}

function isEqualRatio(arr: number[]) {
  let ratio = true;
  const step = arr[1] / arr[0];

  for (let i = 1; i < arr.length; i += 1) {
    if (arr[i] / arr[i - 1] !== step) {
      ratio = false;
      break;
    }
  }

  return ratio;
}

function getXArr(len: number) {
  const xArr = [];

  for (let i = 1; i <= len; i += 1) {
    xArr.push(i);
  }

  return xArr;
}

function forecast(x: number, yArr: number[], xArr: number[]) {
  function getAverage(arr: number[]) {
    let sum = 0;

    for (let i = 0; i < arr.length; i += 1) {
      sum += arr[i];
    }

    return sum / arr.length;
  }

  const ax = getAverage(xArr); // x数组 平均值
  const ay = getAverage(yArr); // y数组 平均值

  let sum_d = 0;
  let sum_n = 0;
  for (let j = 0; j < xArr.length; j += 1) {
    // 分母和
    sum_d += (xArr[j] - ax) * (yArr[j] - ay);
    // 分子和
    sum_n += (xArr[j] - ax) * (xArr[j] - ax);
  }

  let b;
  if (sum_n === 0) {
    b = 1;
  } else {
    b = sum_d / sum_n;
  }

  const a = ay - b * ax;

  return Math.round((a + b * x) * 100000) / 100000;
}

function judgeDate(data: (Cell | null | undefined)[]) {
  let isSameDay = true;
  let isSameMonth = true;
  let isEqualDiffDays = true;
  let isEqualDiffMonths = true;
  let isEqualDiffYears = true;
  if (data[0] == null || data[1] == null)
    return [false, false, false, false, false];
  const sameDay = dayjs(data[0].m).date();
  const sameMonth = dayjs(data[0].m).month();
  const equalDiffDays = dayjs(data[1].m).diff(dayjs(data[0].m), "days");
  const equalDiffMonths = dayjs(data[1].m).diff(dayjs(data[0].m), "months");
  const equalDiffYears = dayjs(data[1].m).diff(dayjs(data[0].m), "years");

  for (let i = 1; i < data.length; i += 1) {
    // 日是否一样
    if (dayjs(data[i]?.m).date() !== sameDay) {
      isSameDay = false;
    }
    // 月是否一样
    if (dayjs(data[i]?.m).month() !== sameMonth) {
      isSameMonth = false;
    }
    // 日差是否是 等差数列
    if (
      dayjs(data[i]?.m).diff(dayjs(data[i - 1]?.m), "days") !== equalDiffDays
    ) {
      isEqualDiffDays = false;
    }
    // 月差是否是 等差数列
    if (
      dayjs(data[i]?.m).diff(dayjs(data[i - 1]?.m), "months") !==
      equalDiffMonths
    ) {
      isEqualDiffMonths = false;
    }
    // 年差是否是 等差数列
    if (
      dayjs(data[i]?.m).diff(dayjs(data[i - 1]?.m), "years") !== equalDiffYears
    ) {
      isEqualDiffYears = false;
    }
  }

  if (equalDiffDays === 0) {
    isEqualDiffDays = false;
  }
  if (equalDiffMonths === 0) {
    isEqualDiffMonths = false;
  }
  if (equalDiffYears === 0) {
    isEqualDiffYears = false;
  }

  return [
    isSameDay,
    isSameMonth,
    isEqualDiffDays,
    isEqualDiffMonths,
    isEqualDiffYears,
  ];
}

export function showDropCellSelection(
  { width, height, top, left }: Rect,
  container: HTMLDivElement
) {
  const selectedExtend = container.querySelector(
    ".fortune-cell-selected-extend"
  ) as HTMLDivElement;
  if (selectedExtend) {
    selectedExtend.style.left = toPx(left);
    selectedExtend.style.width = toPx(width);
    selectedExtend.style.top = toPx(top);
    selectedExtend.style.height = toPx(height);
    selectedExtend.style.display = "block";
  }
}

export function hideDropCellSelection(container: HTMLDivElement) {
  const selectedExtend = container.querySelector(
    ".fortune-cell-selected-extend"
  ) as HTMLDivElement;
  if (selectedExtend) {
    selectedExtend.style.display = "none";
  }
}

export function createDropCellRange(
  ctx: Context,
  e: MouseEvent,
  container: HTMLDivElement
) {
  ctx.luckysheet_cell_selected_extend = true;
  ctx.luckysheet_scroll_status = true;

  const { scrollLeft, scrollTop } = ctx;
  const rect = container.getBoundingClientRect();
  const x = e.pageX - rect.left - ctx.rowHeaderWidth + scrollLeft;
  const y = e.pageY - rect.top - ctx.columnHeaderHeight + scrollTop;

  const row_location = rowLocation(y, ctx.visibledatarow);
  const row_pre = row_location[0];
  const row = row_location[1];
  const row_index = row_location[2];
  const col_location = colLocation(x, ctx.visibledatacolumn);
  const col_pre = col_location[0];
  const col = col_location[1];
  const col_index = col_location[2];

  ctx.luckysheet_cell_selected_extend_index = [row_index, col_index];

  showDropCellSelection(
    {
      left: col_pre,
      width: col - col_pre - 1,
      top: row_pre,
      height: row - row_pre - 1,
    },
    container
  );
}

export function onDropCellSelect(
  ctx: Context,
  e: MouseEvent,
  scrollX: HTMLDivElement,
  scrollY: HTMLDivElement,
  container: HTMLDivElement
) {
  const { scrollLeft } = scrollX;
  const { scrollTop } = scrollY;
  const rect = container.getBoundingClientRect();
  const x = e.pageX - rect.left - ctx.rowHeaderWidth + scrollLeft;
  const y = e.pageY - rect.top - ctx.columnHeaderHeight + scrollTop;

  const row_location = rowLocation(y, ctx.visibledatarow);
  const row = row_location[1];
  const row_pre = row_location[0];
  const row_index = row_location[2];
  const col_location = colLocation(x, ctx.visibledatacolumn);
  const col = col_location[1];
  const col_pre = col_location[0];
  const col_index = col_location[2];

  const row_index_original = ctx.luckysheet_cell_selected_extend_index[0];
  const col_index_original = ctx.luckysheet_cell_selected_extend_index[1];

  if (!ctx.luckysheet_select_save) return;
  let row_s = ctx.luckysheet_select_save[0].row[0];
  let row_e = ctx.luckysheet_select_save[0].row[1];
  let col_s = ctx.luckysheet_select_save[0].column[0];
  let col_e = ctx.luckysheet_select_save[0].column[1];

  let top = ctx.luckysheet_select_save[0].top_move;
  let height = ctx.luckysheet_select_save[0].height_move;
  let left = ctx.luckysheet_select_save[0].left_move;
  let width = ctx.luckysheet_select_save[0].width_move;

  if (top == null || height == null || left == null || width == null) return;
  if (
    Math.abs(row_index_original - row_index) >
    Math.abs(col_index_original - col_index)
  ) {
    if (!(row_index >= row_s && row_index <= row_e)) {
      if (top >= row_pre) {
        height += top - row_pre;
        top = row_pre;
      } else {
        height = row - top - 1;
      }
    }
  } else {
    if (!(col_index >= col_s && col_index <= col_e)) {
      if (left >= col_pre) {
        width += left - col_pre;
        left = col_pre;
      } else {
        width = col - left - 1;
      }
    }
  }
  if (y < 0) {
    row_s = 0;
    [row_e] = ctx.luckysheet_select_save[0].row;
  }
  if (x < 0) {
    col_s = 0;
    [col_e] = ctx.luckysheet_select_save[0].column;
  }

  showDropCellSelection({ left, width, top, height }, container);
}

function fillCopy(data: (Cell | null | undefined)[], len: number) {
  const applyData = [];

  for (let i = 1; i <= len; i += 1) {
    const index = (i - 1) % data.length;
    const d = _.cloneDeep(data[index]);
    if (!_.isUndefined(d)) {
      applyData.push(d);
    }
  }

  return applyData;
}

function fillSeries(
  data: (Cell | null | undefined)[],
  len: number,
  direction: string
) {
  const applyData: Cell[] = [];

  const dataNumArr = [];
  for (let j = 0; j < data.length; j += 1) {
    const d = _.cloneDeep(data[j]);
    if (d != null) {
      dataNumArr.push(Number(d.v));
    }
  }

  if (
    data.length > 2 &&
    isEqualRatio(dataNumArr) &&
    data[0] != null &&
    data[1] != null
  ) {
    // 等比数列
    for (let i = 1; i <= len; i += 1) {
      const index = (i - 1) % data.length;
      const d = _.cloneDeep(data[index]);

      if (d != null) {
        let num;
        if (direction === "down" || direction === "right") {
          num =
            Number(data[data.length - 1]!.v) *
            (Number(data[1].v) / Number(data[0].v)) ** i;
        } else {
          //  direction == "up" || direction == "left"
          num =
            Number(data[0].v) / (Number(data[1].v) / Number(data[0].v)) ** i;
        }

        d.v = num;
        if (d.ct != null && d.ct.fa != null) {
          d.m = update(d.ct.fa, num);
        }
        applyData.push(d);
      }
    }
  } else {
    // 线性数列
    const xArr = getXArr(data.length);
    for (let i = 1; i <= len; i += 1) {
      const index = (i - 1) % data.length;
      const d = _.cloneDeep(data[index]);
      if (d != null) {
        let y;
        if (direction === "down" || direction === "right") {
          y = forecast(data.length + i, dataNumArr, xArr);
        } else if (direction === "up" || direction === "left") {
          y = forecast(1 - i, dataNumArr, xArr);
        }

        d.v = y;
        if (d.ct != null && d.ct.fa != null) {
          d.m = update(d.ct.fa, y);
        }
        applyData.push(d);
      }
    }
  }

  return applyData;
}

function fillExtendNumber(
  data: (Cell | null | undefined)[],
  len: number,
  step: number
) {
  const applyData = [];
  const reg = /0|([1-9]+[0-9]*)/g;

  for (let i = 1; i <= len; i += 1) {
    const index = (i - 1) % data.length;
    const d = _.cloneDeep(data[index]);
    let last = data[data.length - 1]?.m;
    if (d != null && last != null) {
      last = `${last}`;
      const match = last.match(reg) || "";
      const lastTxt = match[match.length - 1];

      const num = Math.abs(Number(lastTxt) + step * i);
      const lastIndex = last.lastIndexOf(lastTxt);
      const valueTxt =
        last.slice(0, lastIndex) +
        num.toString() +
        last.slice(lastIndex + lastTxt.length);

      d.v = valueTxt;
      d.m = valueTxt;

      applyData.push(d);
    }
  }

  return applyData;
}

function fillDays(
  data: (Cell | null | undefined)[],
  len: number,
  step: number
) {
  const applyData = [];

  for (let i = 1; i <= len; i += 1) {
    const d = _.cloneDeep(data[data.length - 1]);
    if (d != null) {
      let date = update("yyyy-MM-dd", d.v);
      date = dayjs(date)
        .add(step * i, "days")
        .format("YYYY-MM-DD");

      // TODO generate的处理是否合适
      d.v = genarate(date)?.[2];
      if (d.ct != null && d.ct.fa != null) {
        d.m = update(d.ct.fa, d.v);
      }

      applyData.push(d);
    }
  }

  return applyData;
}

function fillMonths(
  data: (Cell | null | undefined)[],
  len: number,
  step: number
) {
  const applyData = [];

  for (let i = 1; i <= len; i += 1) {
    const d = _.cloneDeep(data[data.length - 1]);
    if (d != null) {
      let date = update("yyyy-MM-dd", d.v);
      date = dayjs(date)
        .add(step * i, "months")
        .format("YYYY-MM-DD");

      d.v = genarate(date)?.[2];
      if (d.ct != null && d.ct.fa != null) {
        d.m = update(d.ct.fa, d.v);
      }

      applyData.push(d);
    }
  }

  return applyData;
}

function fillYears(
  data: (Cell | null | undefined)[],
  len: number,
  step: number
) {
  const applyData = [];

  for (let i = 1; i <= len; i += 1) {
    const d = _.cloneDeep(data[data.length - 1]);
    if (d != null) {
      let date = update("yyyy-MM-dd", d.v);
      date = dayjs(date)
        .add(step * i, "years")
        .format("YYYY-MM-DD");

      d.v = genarate(date)?.[2];
      if (d.ct != null && d.ct.fa != null) {
        d.m = update(d.ct.fa, d.v);
      }
    }

    applyData.push(d);
  }

  return applyData;
}

function fillChnWeek(
  data: (Cell | null | undefined)[],
  len: number,
  step: number
) {
  const applyData = [];

  for (let i = 1; i <= len; i += 1) {
    const index = (i - 1) % data.length;
    const d = _.cloneDeep(data[index]);

    let num;
    const m = data[data.length - 1]?.m;
    if (m != null && d != null) {
      if (m === "日") {
        num = 7 + step * i;
      } else {
        num = chineseToNumber(`${m}`) + step * i;
      }

      if (num < 0) {
        num = Math.ceil(Math.abs(num) / 7) * 7 + num;
      }

      const rsd = num % 7;
      if (rsd === 0) {
        d.m = "日";
        d.v = "日";
      } else if (rsd === 1) {
        d.m = "一";
        d.v = "一";
      } else if (rsd === 2) {
        d.m = "二";
        d.v = "二";
      } else if (rsd === 3) {
        d.m = "三";
        d.v = "三";
      } else if (rsd === 4) {
        d.m = "四";
        d.v = "四";
      } else if (rsd === 5) {
        d.m = "五";
        d.v = "五";
      } else if (rsd === 6) {
        d.m = "六";
        d.v = "六";
      }

      applyData.push(d);
    }
  }

  return applyData;
}

function fillChnWeek2(
  data: (Cell | null | undefined)[],
  len: number,
  step: number
) {
  const applyData = [];

  for (let i = 1; i <= len; i += 1) {
    const index = (i - 1) % data.length;
    const d = _.cloneDeep(data[index]);

    let num;
    const m = data[data.length - 1]?.m;
    if (m != null && d != null) {
      if (m === "周日") {
        num = 7 + step * i;
      } else {
        const last = `${m}`;
        const txt = last.slice(last.length - 1, 1);
        num = chineseToNumber(txt) + step * i;
      }

      if (num < 0) {
        num = Math.ceil(Math.abs(num) / 7) * 7 + num;
      }

      const rsd = num % 7;
      if (rsd === 0) {
        d.m = "周日";
        d.v = "周日";
      } else if (rsd === 1) {
        d.m = "周一";
        d.v = "周一";
      } else if (rsd === 2) {
        d.m = "周二";
        d.v = "周二";
      } else if (rsd === 3) {
        d.m = "周三";
        d.v = "周三";
      } else if (rsd === 4) {
        d.m = "周四";
        d.v = "周四";
      } else if (rsd === 5) {
        d.m = "周五";
        d.v = "周五";
      } else if (rsd === 6) {
        d.m = "周六";
        d.v = "周六";
      }
    }

    applyData.push(d);
  }

  return applyData;
}

function fillChnWeek3(
  data: (Cell | null | undefined)[],
  len: number,
  step: number
) {
  const applyData = [];

  for (let i = 1; i <= len; i += 1) {
    const index = (i - 1) % data.length;
    const d = _.cloneDeep(data[index]);

    let num;
    const m = data[data.length - 1]?.m;
    if (m != null && d != null) {
      if (m === "星期日") {
        num = 7 + step * i;
      } else {
        const last = `${m}`;
        const txt = last.slice(last.length - 1, 1);
        num = chineseToNumber(txt) + step * i;
      }

      if (num < 0) {
        num = Math.ceil(Math.abs(num) / 7) * 7 + num;
      }

      const rsd = num % 7;
      if (rsd === 0) {
        d.m = "星期日";
        d.v = "星期日";
      } else if (rsd === 1) {
        d.m = "星期一";
        d.v = "星期一";
      } else if (rsd === 2) {
        d.m = "星期二";
        d.v = "星期二";
      } else if (rsd === 3) {
        d.m = "星期三";
        d.v = "星期三";
      } else if (rsd === 4) {
        d.m = "星期四";
        d.v = "星期四";
      } else if (rsd === 5) {
        d.m = "星期五";
        d.v = "星期五";
      } else if (rsd === 6) {
        d.m = "星期六";
        d.v = "星期六";
      }
    }

    applyData.push(d);
  }

  return applyData;
}

function fillChnNumber(
  data: (Cell | null | undefined)[],
  len: number,
  step: number
) {
  const applyData = [];

  for (let i = 1; i <= len; i += 1) {
    const index = (i - 1) % data.length;
    const d = _.cloneDeep(data[index]);

    const m = data[data.length - 1]?.m;
    if (m != null && d != null) {
      const num = chineseToNumber(`${m}`) + step * i;
      let txt;
      if (num <= 0) {
        txt = "零";
      } else {
        txt = numberToChinese(num);
      }

      d.v = txt;
      d.m = txt.toString();
      applyData.push(d);
    }
  }

  return applyData;
}

export function getTypeItemHide(ctx: Context) {
  const { copyRange } = dropCellCache;
  const str_r = copyRange.row[0];
  const end_r = copyRange.row[1];
  const str_c = copyRange.column[0];
  const end_c = copyRange.column[1];

  let hasNumber = false;
  let hasExtendNumber = false;
  let hasDate = false;
  let hasChn = false;
  let hasChnWeek1 = false;
  let hasChnWeek2 = false;
  let hasChnWeek3 = false;

  const flowdata = getFlowdata(ctx);
  if (flowdata == null) return [];

  for (let r = str_r; r <= end_r; r += 1) {
    for (let c = str_c; c <= end_c; c += 1) {
      if (flowdata[r][c]) {
        const cell = flowdata[r][c];

        if (cell !== null && cell.v != null && cell.f == null) {
          if (cell.ct != null && cell.ct.t === "n") {
            hasNumber = true;
          } else if (cell.ct != null && cell.ct.t === "d") {
            hasDate = true;
          } else if (isExtendNumber(cell.m)[0]) {
            hasExtendNumber = true;
          } else if (isChnNumber(cell.m) && cell.m !== "日") {
            hasChn = true;
          } else if (cell.m != null && cell.m === "日") {
            hasChnWeek1 = true;
          } else if (isChnWeek2(cell.m)) {
            hasChnWeek2 = true;
          } else if (isChnWeek3(cell.m)) {
            hasChnWeek3 = true;
          }
        }
      }
    }
  }

  return [
    hasNumber,
    hasExtendNumber,
    hasDate,
    hasChn,
    hasChnWeek1,
    hasChnWeek2,
    hasChnWeek3,
  ];
}

function getLenS(indexArr: number[], rsd: number) {
  let s = 0;

  for (let j = 0; j < indexArr.length; j += 1) {
    if (indexArr[j] <= rsd) {
      s += 1;
    } else {
      break;
    }
  }

  return s;
}

function getDataIndex(csLen: number, asLen: number, indexArr: number[]) {
  const obj: Record<string, number> = {};

  const num = Math.floor(asLen / csLen);
  const rsd = asLen % csLen;

  let sum = 0;
  if (num > 0) {
    for (let i = 1; i <= num; i += 1) {
      for (let j = 0; j < indexArr.length; j += 1) {
        obj[indexArr[j] + (i - 1) * csLen] = sum;
        sum += 1;
      }
    }
    for (let a = 0; a < indexArr.length; a += 1) {
      if (indexArr[a] <= rsd) {
        obj[indexArr[a] + csLen * num] = sum;
        sum += 1;
      } else {
        break;
      }
    }
  } else {
    for (let a = 0; a < indexArr.length; a += 1) {
      if (indexArr[a] <= rsd) {
        obj[indexArr[a]] = sum;
        sum += 1;
      } else {
        break;
      }
    }
  }

  return obj;
}

function getDataByType(
  data: (Cell | null | undefined)[],
  len: number,
  direction: string,
  type: string,
  dataType?: string
) {
  data = _.cloneDeep(data);
  let applyData: (Cell | null | undefined)[] = [];

  if (type === "0" || data.length === 1) {
    // 复制单元格
    if (direction === "up" || direction === "left") {
      data.reverse();
    }

    applyData = fillCopy(data, len);
  } else if (type === "1") {
    // 填充序列
    if (dataType === "number") {
      // 数据类型是 数字
      applyData = fillSeries(data, len, direction);
    } else if (dataType === "extendNumber") {
      // 扩展数字
      const dataNumArr = [];

      for (let i = 0; i < data.length; i += 1) {
        const txt = data[i]?.m;
        const _isExtendNumber = isExtendNumber(txt);
        if (_isExtendNumber[0]) {
          dataNumArr.push(_isExtendNumber[1] as number);
        }
      }

      if (direction === "up" || direction === "left") {
        data.reverse();
        dataNumArr.reverse();
      }

      if (isEqualDiff(dataNumArr)) {
        // 等差数列，以等差为step
        const step = dataNumArr[1] - dataNumArr[0];
        applyData = fillExtendNumber(data, len, step);
      } else {
        // 不是等差数列，复制数据
        applyData = fillCopy(data, len);
      }
    } else if (dataType === "date") {
      // 数据类型是 日期
      if (direction === "up" || direction === "left") {
        data.reverse();
      }

      const _judgeDate = judgeDate(data);
      if (_judgeDate[0] && _judgeDate[3]) {
        // 日一样，月差为等差数列，以月差为step
        const step = dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "months");
        applyData = fillMonths(data, len, step);
      } else if (!_judgeDate[0] && _judgeDate[2]) {
        // 日不一样，日差为等差数列，以日差为step
        const step = dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "days");
        applyData = fillDays(data, len, step);
      } else {
        // 其它，复制数据
        applyData = fillCopy(data, len);
      }
    } else if (dataType === "chnNumber" && data[0]?.m != null) {
      // 数据类型是 中文小写数字

      let hasweek = false;
      for (let i = 0; i < data.length; i += 1) {
        if (data[i]?.m === "日") {
          hasweek = true;
          break;
        }
      }

      const dataNumArr = [];
      let weekIndex = 0;
      for (let i = 0; i < data.length; i += 1) {
        let m = data[i]?.m;
        if (m != null) {
          m = `${m}`;
          if (m === "日") {
            if (i === 0) {
              dataNumArr.push(0);
            } else {
              weekIndex += 1;
              dataNumArr.push(weekIndex * 7);
            }
          } else if (
            hasweek &&
            chineseToNumber(m) > 0 &&
            chineseToNumber(m) < 7
          ) {
            dataNumArr.push(chineseToNumber(m) + weekIndex * 7);
          } else {
            dataNumArr.push(chineseToNumber(m));
          }
        }
      }

      if (direction === "up" || direction === "left") {
        data.reverse();
        dataNumArr.reverse();
      }

      if (isEqualDiff(dataNumArr)) {
        if (
          hasweek ||
          (dataNumArr[dataNumArr.length - 1] < 6 && dataNumArr[0] > 0) ||
          (dataNumArr[0] < 6 && dataNumArr[dataNumArr.length - 1] > 0)
        ) {
          // 以周一~周日序列填充
          const step = dataNumArr[1] - dataNumArr[0];
          applyData = fillChnWeek(data, len, step);
        } else {
          // 以中文小写数字序列填充
          const step = dataNumArr[1] - dataNumArr[0];
          applyData = fillChnNumber(data, len, step);
        }
      } else {
        // 不是等差数列，复制数据
        applyData = fillCopy(data, len);
      }
    } else if (dataType === "chnWeek2") {
      // 周一~周日
      const dataNumArr = [];
      let weekIndex = 0;

      for (let i = 0; i < data.length; i += 1) {
        let m = data[i]?.m;
        if (m != null) {
          m = `${m}`;
          const lastTxt = m.slice(m.length - 1, 1);
          if (m === "周日") {
            if (i === 0) {
              dataNumArr.push(0);
            } else {
              weekIndex += 1;
              dataNumArr.push(weekIndex * 7);
            }
          } else {
            dataNumArr.push(chineseToNumber(lastTxt) + weekIndex * 7);
          }
        }
      }

      if (direction === "up" || direction === "left") {
        data.reverse();
        dataNumArr.reverse();
      }

      if (isEqualDiff(dataNumArr)) {
        // 等差数列，以等差为step
        const step = dataNumArr[1] - dataNumArr[0];
        applyData = fillChnWeek2(data, len, step);
      } else {
        // 不是等差数列，复制数据
        applyData = fillCopy(data, len);
      }
    } else if (dataType === "chnWeek3") {
      // 星期一~星期日
      const dataNumArr = [];
      let weekIndex = 0;

      for (let i = 0; i < data.length; i += 1) {
        let m = data[i]?.m;
        if (m != null) {
          m = `${m}`;
          const lastTxt = m.slice(m.length - 1, 1);
          if (m === "星期日") {
            if (i === 0) {
              dataNumArr.push(0);
            } else {
              weekIndex += 1;
              dataNumArr.push(weekIndex * 7);
            }
          } else {
            dataNumArr.push(chineseToNumber(lastTxt) + weekIndex * 7);
          }
        }
      }

      if (direction === "up" || direction === "left") {
        data.reverse();
        dataNumArr.reverse();
      }

      if (isEqualDiff(dataNumArr)) {
        // 等差数列，以等差为step
        const step = dataNumArr[1] - dataNumArr[0];
        applyData = fillChnWeek3(data, len, step);
      } else {
        // 不是等差数列，复制数据
        applyData = fillCopy(data, len);
      }
    } else {
      // 数据类型是 其它
      if (direction === "up" || direction === "left") {
        data.reverse();
      }

      applyData = fillCopy(data, len);
    }
    // } else if (type === "2") {
    //   // 仅填充格式
    //   if (direction === "up" || direction === "left") {
    //     data.reverse();
    //   }

    //   applyData = fillOnlyFormat(data, len);
    // } else if (type === "3") {
    //   // 不带格式填充
    //   const dataArr = getDataByType(data, len, direction, "1", dataType);
    //   applyData = fillWithoutFormat(dataArr);
  } else if (type === "4") {
    // 以天数填充
    if (data.length === 2) {
      // 以日差为step
      if (direction === "up" || direction === "left") {
        data.reverse();
      }

      const step = dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "days");
      applyData = fillDays(data, len, step);
    } else {
      if (direction === "up" || direction === "left") {
        data.reverse();
      }

      const _judgeDate = judgeDate(data);
      if (_judgeDate[0] && _judgeDate[3]) {
        // 日一样，且月差为等差数列，以月差为step
        const step = dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "months");
        applyData = fillMonths(data, len, step);
      } else if (!_judgeDate[0] && _judgeDate[2]) {
        // 日不一样，且日差为等差数列，以日差为step
        const step = dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "days");
        applyData = fillDays(data, len, step);
      } else {
        // 日差不是等差数列，复制数据
        applyData = fillCopy(data, len);
      }
    }
  } else if (type === "5") {
    // 以工作日填充
    if (data.length === 2) {
      if (
        dayjs(data[1]?.m).date() === dayjs(data[0]?.m).date() &&
        dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "months") !== 0
      ) {
        // 日一样，且月差大于一月，以月差为step（若那天为休息日，则向前取最近的工作日）
        if (direction === "up" || direction === "left") {
          data.reverse();
        }

        const step = dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "months");

        for (let i = 1; i <= len; i += 1) {
          const index = (i - 1) % data.length;
          const d = _.cloneDeep(data[index]);
          const last = data[data.length - 1]?.m;
          if (d != null && last != null) {
            const day = dayjs(last)
              .add(step * i, "months")
              .day();
            let date;
            if (day === 0) {
              date = dayjs(last)
                .add(step * i, "months")
                .subtract(2, "days")
                .format("YYYY-MM-DD");
            } else if (day === 6) {
              date = dayjs(last)
                .add(step * i, "months")
                .subtract(1, "days")
                .format("YYYY-MM-DD");
            } else {
              date = dayjs(last)
                .add(step * i, "months")
                .format("YYYY-MM-DD");
            }

            d.m = date;
            d.v = genarate(date)?.[2];
            applyData.push(d);
          }
        }
      } else {
        // 日不一样
        if (Math.abs(dayjs(data[1]?.m).diff(dayjs(data[0]?.m))) > 7) {
          // 若日差大于7天，以一月为step（若那天是休息日，则向前取最近的工作日）
          let step_month;
          if (direction === "down" || direction === "right") {
            step_month = 1;
          } else {
            step_month = -1;
            data.reverse();
          }

          let step: number; // 以数组第一个为对比
          for (let i = 1; i <= len; i += 1) {
            const index = (i - 1) % data.length;
            const d = _.cloneDeep(data[index]);
            if (d != null) {
              const num = Math.ceil(i / data.length);
              if (index === 0) {
                step = dayjs(d.m)
                  .add(step_month * num, "months")
                  .diff(dayjs(d.m), "days");
              }

              const day = dayjs(d.m).add(step!, "days").day();
              let date;
              if (day === 0) {
                date = dayjs(d.m)
                  .add(step!, "days")
                  .subtract(2, "days")
                  .format("YYYY-MM-DD");
              } else if (day === 6) {
                date = dayjs(d.m)
                  .add(step!, "days")
                  .subtract(1, "days")
                  .format("YYYY-MM-DD");
              } else {
                date = dayjs(d.m).add(step!, "days").format("YYYY-MM-DD");
              }

              d.m = date;
              d.v = genarate(date)?.[2];
              applyData.push(d);
            }
          }
        } else {
          // 若日差小于等于7天，以7天为step（若那天是休息日，则向前取最近的工作日）
          let step_day;
          if (direction === "down" || direction === "right") {
            step_day = 7;
          } else {
            step_day = -7;
            data.reverse();
          }

          let step: number; // 以数组第一个为对比
          for (let i = 1; i <= len; i += 1) {
            const index = (i - 1) % data.length;
            const d = _.cloneDeep(data[index]);
            if (d != null) {
              const num = Math.ceil(i / data.length);
              if (index === 0) {
                step = dayjs(d.m)
                  .add(step_day * num, "days")
                  .diff(dayjs(d.m), "days");
              }

              const day = dayjs(d.m).add(step!, "days").day();
              let date;
              if (day === 0) {
                date = dayjs(d.m)
                  .add(step!, "days")
                  .subtract(2, "days")
                  .format("YYYY-MM-DD");
              } else if (day === 6) {
                date = dayjs(d.m)
                  .add(step!, "days")
                  .subtract(1, "days")
                  .format("YYYY-MM-DD");
              } else {
                date = dayjs(d.m).add(step!, "days").format("YYYY-MM-DD");
              }

              d.m = date;
              d.v = genarate(date)?.[2];
              applyData.push(d);
            }
          }
        }
      }
    } else {
      const _judgeDate = judgeDate(data);
      if (_judgeDate[0] && _judgeDate[3]) {
        // 日一样，且月差为等差数列，以月差为step（若那天为休息日，则向前取最近的工作日）
        if (direction === "up" || direction === "left") {
          data.reverse();
        }

        const step = dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "months");

        for (let i = 1; i <= len; i += 1) {
          const index = (i - 1) % data.length;
          const d = _.cloneDeep(data[index]);
          const last = data[data.length - 1]?.m;
          if (d != null) {
            const day = dayjs(last)
              .add(step * i, "months")
              .day();
            let date;
            if (day === 0) {
              date = dayjs(last)
                .add(step * i, "months")
                .subtract(2, "days")
                .format("YYYY-MM-DD");
            } else if (day === 6) {
              date = dayjs(last)
                .add(step * i, "months")
                .subtract(1, "days")
                .format("YYYY-MM-DD");
            } else {
              date = dayjs(last)
                .add(step * i, "months")
                .format("YYYY-MM-DD");
            }

            d.m = date;
            d.v = genarate(date)?.[2];
            applyData.push(d);
          }
        }
      } else if (!_judgeDate[0] && _judgeDate[2]) {
        // 日不一样，且日差为等差数列
        if (Math.abs(dayjs(data[1]?.m).diff(dayjs(data[0]?.m))) > 7) {
          // 若日差大于7天，以一月为step（若那天是休息日，则向前取最近的工作日）
          let step_month;
          if (direction === "down" || direction === "right") {
            step_month = 1;
          } else {
            step_month = -1;
            data.reverse();
          }

          let step: number; // 以数组第一个为对比
          for (let i = 1; i <= len; i += 1) {
            const index = (i - 1) % data.length;
            const d = _.cloneDeep(data[index]);
            if (d != null) {
              const num = Math.ceil(i / data.length);
              if (index === 0) {
                step = dayjs(d.m)
                  .add(step_month * num, "months")
                  .diff(dayjs(d.m), "days");
              }

              const day = dayjs(d.m).add(step!, "days").day();
              let date;
              if (day === 0) {
                date = dayjs(d.m)
                  .add(step!, "days")
                  .subtract(2, "days")
                  .format("YYYY-MM-DD");
              } else if (day === 6) {
                date = dayjs(d.m)
                  .add(step!, "days")
                  .subtract(1, "days")
                  .format("YYYY-MM-DD");
              } else {
                date = dayjs(d.m).add(step!, "days").format("YYYY-MM-DD");
              }

              d.m = date;
              d.v = genarate(date)?.[2];
              applyData.push(d);
            }
          }
        } else {
          // 若日差小于等于7天，以7天为step（若那天是休息日，则向前取最近的工作日）
          let step_day;
          if (direction === "down" || direction === "right") {
            step_day = 7;
          } else {
            step_day = -7;
            data.reverse();
          }

          let step: number; // 以数组第一个为对比
          for (let i = 1; i <= len; i += 1) {
            const index = (i - 1) % data.length;
            const d = _.cloneDeep(data[index]);
            if (d != null) {
              const num = Math.ceil(i / data.length);
              if (index === 0) {
                step = dayjs(d.m)
                  .add(step_day * num, "days")
                  .diff(dayjs(d.m), "days");
              }

              const day = dayjs(d.m).add(step!, "days").day();
              let date;
              if (day === 0) {
                date = dayjs(d.m)
                  .add(step!, "days")
                  .subtract(2, "days")
                  .format("YYYY-MM-DD");
              } else if (day === 6) {
                date = dayjs(d.m)
                  .add(step!, "days")
                  .subtract(1, "days")
                  .format("YYYY-MM-DD");
              } else {
                date = dayjs(d.m).add(step!, "days").format("YYYY-MM-DD");
              }

              d.m = date;
              d.v = genarate(date)?.[2];
              applyData.push(d);
            }
          }
        }
      } else {
        // 日差不是等差数列，复制数据
        if (direction === "up" || direction === "left") {
          data.reverse();
        }

        applyData = fillCopy(data, len);
      }
    }
  } else if (type === "6") {
    // 以月填充
    if (data.length === 2) {
      if (
        dayjs(data[1]?.m).date() === dayjs(data[0]?.m).date() &&
        dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "months") !== 0
      ) {
        // 日一样，且月差大于一月，以月差为step
        if (direction === "up" || direction === "left") {
          data.reverse();
        }

        const step = dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "months");
        applyData = fillMonths(data, len, step);
      } else {
        // 以一月为step
        let step_month;
        if (direction === "down" || direction === "right") {
          step_month = 1;
        } else {
          step_month = -1;
          data.reverse();
        }

        let step: number; // 以数组第一个为对比
        for (let i = 1; i <= len; i += 1) {
          const index = (i - 1) % data.length;
          const d = _.cloneDeep(data[index]);
          if (d != null) {
            const num = Math.ceil(i / data.length);
            if (index === 0) {
              step = dayjs(d.m)
                .add(step_month * num, "months")
                .diff(dayjs(d.m), "days");
            }

            const date = dayjs(d.m).add(step!, "days").format("YYYY-MM-DD");
            d.m = date;
            d.v = genarate(date)?.[2];
            applyData.push(d);
          }
        }
      }
    } else {
      const _judgeDate = judgeDate(data);
      if (_judgeDate[0] && _judgeDate[3]) {
        // 日一样，且月差为等差数列，以月差为step
        if (direction === "up" || direction === "left") {
          data.reverse();
        }

        const step = dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "months");
        applyData = fillMonths(data, len, step);
      } else if (!_judgeDate[0] && _judgeDate[2]) {
        // 日不一样，且日差为等差数列，以一月为step
        let step_month;
        if (direction === "down" || direction === "right") {
          step_month = 1;
        } else {
          step_month = -1;
          data.reverse();
        }

        let step: number; // 以数组第一个为对比
        for (let i = 1; i <= len; i += 1) {
          const index = (i - 1) % data.length;
          const d = _.cloneDeep(data[index]);
          if (d != null) {
            const num = Math.ceil(i / data.length);
            if (index === 0) {
              step = dayjs(d.m)
                .add(step_month * num, "months")
                .diff(dayjs(d.m), "days");
            }

            const date = dayjs(d.m).add(step!, "days").format("YYYY-MM-DD");
            d.m = date;
            d.v = genarate(date)?.[2];
            applyData.push(d);
          }
        }
      } else {
        // 日差不是等差数列，复制数据
        if (direction === "up" || direction === "left") {
          data.reverse();
        }

        applyData = fillCopy(data, len);
      }
    }
  } else if (type === "7") {
    // 以年填充
    if (data.length === 2) {
      if (
        dayjs(data[1]?.m).date() === dayjs(data[0]?.m).date() &&
        dayjs(data[1]?.m).month() === dayjs(data[0]?.m).month() &&
        dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "years") !== 0
      ) {
        // 日月一样，且年差大于一年，以年差为step
        if (direction === "up" || direction === "left") {
          data.reverse();
        }

        const step = dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "years");
        applyData = fillYears(data, len, step);
      } else {
        // 以一年为step
        let step_year;
        if (direction === "down" || direction === "right") {
          step_year = 1;
        } else {
          step_year = -1;
          data.reverse();
        }

        let step: number; // 以数组第一个为对比
        for (let i = 1; i <= len; i += 1) {
          const index = (i - 1) % data.length;
          const d = _.cloneDeep(data[index]);
          if (d != null) {
            const num = Math.ceil(i / data.length);
            if (index === 0) {
              step = dayjs(d.m)
                .add(step_year * num, "years")
                .diff(dayjs(d.m), "days");
            }

            const date = dayjs(d.m).add(step!, "days").format("YYYY-MM-DD");
            d.m = date;
            d.v = genarate(date)?.[2];
            applyData.push(d);
          }
        }
      }
    } else {
      const _judgeDate = judgeDate(data);
      if (_judgeDate[0] && _judgeDate[1] && _judgeDate[4]) {
        // 日月一样，且年差为等差数列，以年差为step
        if (direction === "up" || direction === "left") {
          data.reverse();
        }

        const step = dayjs(data[1]?.m).diff(dayjs(data[0]?.m), "years");
        applyData = fillYears(data, len, step);
      } else if ((_judgeDate[0] && _judgeDate[3]) || _judgeDate[2]) {
        // 日一样且月差为等差数列，或天差为等差数列，以一年为step
        let step_year;
        if (direction === "down" || direction === "right") {
          step_year = 1;
        } else {
          step_year = -1;
          data.reverse();
        }

        let step: number; // 以数组第一个为对比
        for (let i = 1; i <= len; i += 1) {
          const index = (i - 1) % data.length;
          const d = _.cloneDeep(data[index]);
          const num = Math.ceil(i / data.length);
          if (d != null) {
            if (index === 0) {
              step = dayjs(d.m)
                .add(step_year * num, "years")
                .diff(dayjs(d.m), "days");
            }

            const date = dayjs(d.m).add(step!, "days").format("YYYY-MM-DD");
            d.m = date;
            d.v = genarate(date)?.[2];
            applyData.push(d);
          }
        }
      } else {
        // 日差不是等差数列，复制数据
        if (direction === "up" || direction === "left") {
          data.reverse();
        }

        applyData = fillCopy(data, len);
      }
    }
  } else if (type === "8") {
    // 以中文小写数字序列填充
    const dataNumArr = [];
    for (let i = 0; i < data.length; i += 1) {
      let m = data[i]?.m;
      if (m != null) {
        m = `${m}`;
        dataNumArr.push(chineseToNumber(m));
      }
    }

    if (direction === "up" || direction === "left") {
      data.reverse();
      dataNumArr.reverse();
    }

    if (isEqualDiff(dataNumArr)) {
      const step = dataNumArr[1] - dataNumArr[0];
      applyData = fillChnNumber(data, len, step);
    } else {
      // 不是等差数列，复制数据
      applyData = fillCopy(data, len);
    }
  }

  return applyData;
}

function getCopyData(
  d: CellMatrix,
  r1: number,
  r2: number,
  c1: number,
  c2: number,
  direction: string
) {
  const copyData = [];

  let a1;
  let a2;
  let b1;
  let b2;
  if (direction === "down" || direction === "up") {
    a1 = c1;
    a2 = c2;
    b1 = r1;
    b2 = r2;
  } else {
    a1 = r1;
    a2 = r2;
    b1 = c1;
    b2 = c2;
  }

  for (let a = a1; a <= a2; a += 1) {
    const obj: Record<
      string,
      { data: (Cell | null | undefined)[]; index: number[] }[]
    > = {};

    let arrData = [];
    let arrIndex = [];
    let text = "";
    let extendNumberBeforeStr = null;
    let extendNumberAfterStr = null;
    let isSameStr = true;

    for (let b: number = b1; b <= b2; b += 1) {
      // 单元格
      let data;
      if (direction === "down" || direction === "up") {
        data = d[b][a];
      } else if (direction === "right" || direction === "left") {
        data = d[a][b];
      }

      // 单元格值类型
      let str;
      if (data?.v != null && data.f == null) {
        if (!!data.ct && data.ct.t === "n") {
          str = "number";
          extendNumberBeforeStr = null;
          extendNumberAfterStr = null;
        } else if (!!data.ct && data.ct.t === "d") {
          str = "date";
          extendNumberBeforeStr = null;
          extendNumberAfterStr = null;
        } else if (isExtendNumber(data.m)[0]) {
          str = "extendNumber";

          const _isExtendNumber = isExtendNumber(data.m);

          if (extendNumberBeforeStr == null || extendNumberAfterStr == null) {
            isSameStr = true;
            [, , extendNumberBeforeStr, extendNumberAfterStr] = _isExtendNumber;
          } else {
            if (
              _isExtendNumber[2] !== extendNumberBeforeStr ||
              _isExtendNumber[3] !== extendNumberAfterStr
            ) {
              isSameStr = false;
              [, , extendNumberBeforeStr, extendNumberAfterStr] =
                _isExtendNumber;
            } else {
              isSameStr = true;
            }
          }
        } else if (isChnNumber(data.m)) {
          str = "chnNumber";
          extendNumberBeforeStr = null;
          extendNumberAfterStr = null;
        } else if (isChnWeek2(data.m)) {
          str = "chnWeek2";
          extendNumberBeforeStr = null;
          extendNumberAfterStr = null;
        } else if (isChnWeek3(data.m)) {
          str = "chnWeek3";
          extendNumberBeforeStr = null;
          extendNumberAfterStr = null;
        } else {
          str = "other";
          extendNumberBeforeStr = null;
          extendNumberAfterStr = null;
        }
      } else {
        str = "other";
        extendNumberBeforeStr = null;
        extendNumberAfterStr = null;
      }

      if (str === "extendNumber") {
        if (b === b1) {
          if (b1 === b2) {
            text = str;
            arrData.push(data);
            arrIndex.push(b - b1 + 1);

            obj[text] = [];
            obj[text].push({ data: arrData, index: arrIndex });
          } else {
            text = str;
            arrData.push(data);
            arrIndex.push(b - b1 + 1);
          }
        } else if (b === b2) {
          if (text === str && isSameStr) {
            arrData.push(data);
            arrIndex.push(b - b1 + 1);

            if (text in obj) {
              obj[text].push({ data: arrData, index: arrIndex });
            } else {
              obj[text] = [];
              obj[text].push({ data: arrData, index: arrIndex });
            }
          } else {
            if (text in obj) {
              obj[text].push({ data: arrData, index: arrIndex });
            } else {
              obj[text] = [];
              obj[text].push({ data: arrData, index: arrIndex });
            }

            text = str;
            arrData = [];
            arrData.push(data);
            arrIndex = [];
            arrIndex.push(b - b1 + 1);

            if (text in obj) {
              obj[text].push({ data: arrData, index: arrIndex });
            } else {
              obj[text] = [];
              obj[text].push({ data: arrData, index: arrIndex });
            }
          }
        } else {
          if (text === str && isSameStr) {
            arrData.push(data);
            arrIndex.push(b - b1 + 1);
          } else {
            if (text in obj) {
              obj[text].push({ data: arrData, index: arrIndex });
            } else {
              obj[text] = [];
              obj[text].push({ data: arrData, index: arrIndex });
            }

            text = str;
            arrData = [];
            arrData.push(data);
            arrIndex = [];
            arrIndex.push(b - b1 + 1);
          }
        }
      } else {
        if (b === b1) {
          if (b1 === b2) {
            text = str;
            arrData.push(data);
            arrIndex.push(b - b1 + 1);

            obj[text] = [];
            obj[text].push({ data: arrData, index: arrIndex });
          } else {
            text = str;
            arrData.push(data);
            arrIndex.push(b - b1 + 1);
          }
        } else if (b === b2) {
          if (text === str) {
            arrData.push(data);
            arrIndex.push(b - b1 + 1);

            if (text in obj) {
              obj[text].push({ data: arrData, index: arrIndex });
            } else {
              obj[text] = [];
              obj[text].push({ data: arrData, index: arrIndex });
            }
          } else {
            if (text in obj) {
              obj[text].push({ data: arrData, index: arrIndex });
            } else {
              obj[text] = [];
              obj[text].push({ data: arrData, index: arrIndex });
            }

            text = str;
            arrData = [];
            arrData.push(data);
            arrIndex = [];
            arrIndex.push(b - b1 + 1);

            if (text in obj) {
              obj[text].push({ data: arrData, index: arrIndex });
            } else {
              obj[text] = [];
              obj[text].push({ data: arrData, index: arrIndex });
            }
          }
        } else {
          if (text === str) {
            arrData.push(data);
            arrIndex.push(b - b1 + 1);
          } else {
            if (text in obj) {
              obj[text].push({ data: arrData, index: arrIndex });
            } else {
              obj[text] = [];
              obj[text].push({ data: arrData, index: arrIndex });
            }

            text = str;
            arrData = [];
            arrData.push(data);
            arrIndex = [];
            arrIndex.push(b - b1 + 1);
          }
        }
      }
    }

    copyData.push(obj);
  }

  return copyData;
}

function getApplyData(
  copyD: Record<
    string,
    {
      data: (Cell | null | undefined)[];
      index: number[];
    }[]
  >,
  csLen: number,
  asLen: number
) {
  const applyData = [];

  const { direction } = dropCellCache;
  const type = dropCellCache.applyType;

  const num = Math.floor(asLen / csLen);
  const rsd = asLen % csLen;

  // 纯数字类型
  const copyD_number = copyD.number;
  const applyD_number = [];
  if (copyD_number) {
    for (let i = 0; i < copyD_number.length; i += 1) {
      const s = getLenS(copyD_number[i].index, rsd);
      const len = copyD_number[i].index.length * num + s;

      let arrData;
      if (type === "1" || type === "3") {
        arrData = getDataByType(
          copyD_number[i].data,
          len,
          direction,
          type,
          "number"
        );
      } else if (type === "2") {
        arrData = getDataByType(copyD_number[i].data, len, direction, type);
      } else {
        arrData = getDataByType(copyD_number[i].data, len, direction, "0");
      }

      const arrIndex = getDataIndex(csLen, asLen, copyD_number[i].index);
      applyD_number.push({ data: arrData, index: arrIndex });
    }
  }

  // 扩展数字型（即一串字符最后面的是数字）
  const copyD_extendNumber = copyD.extendNumber;
  const applyD_extendNumber = [];
  if (copyD_extendNumber) {
    for (let i = 0; i < copyD_extendNumber.length; i += 1) {
      const s = getLenS(copyD_extendNumber[i].index, rsd);
      const len = copyD_extendNumber[i].index.length * num + s;

      let arrData;
      if (type === "1" || type === "3") {
        arrData = getDataByType(
          copyD_extendNumber[i].data,
          len,
          direction,
          type,
          "extendNumber"
        );
      } else if (type === "2") {
        arrData = getDataByType(
          copyD_extendNumber[i].data,
          len,
          direction,
          type
        );
      } else {
        arrData = getDataByType(
          copyD_extendNumber[i].data,
          len,
          direction,
          "0"
        );
      }

      const arrIndex = getDataIndex(csLen, asLen, copyD_extendNumber[i].index);
      applyD_extendNumber.push({ data: arrData, index: arrIndex });
    }
  }

  // 日期类型
  const copyD_date = copyD.date;
  const applyD_date = [];
  if (copyD_date) {
    for (let i = 0; i < copyD_date.length; i += 1) {
      const s = getLenS(copyD_date[i].index, rsd);
      const len = copyD_date[i].index.length * num + s;

      let arrData;
      if (type === "1" || type === "3") {
        arrData = getDataByType(
          copyD_date[i].data,
          len,
          direction,
          type,
          "date"
        );
      } else if (type === "8") {
        arrData = getDataByType(copyD_date[i].data, len, direction, "0");
      } else {
        arrData = getDataByType(copyD_date[i].data, len, direction, type);
      }

      const arrIndex = getDataIndex(csLen, asLen, copyD_date[i].index);
      applyD_date.push({ data: arrData, index: arrIndex });
    }
  }

  // 中文小写数字 或 一~日
  const copyD_chnNumber = copyD.chnNumber;
  const applyD_chnNumber = [];
  if (copyD_chnNumber) {
    for (let i = 0; i < copyD_chnNumber.length; i += 1) {
      const s = getLenS(copyD_chnNumber[i].index, rsd);
      const len = copyD_chnNumber[i].index.length * num + s;

      let arrData;
      if (type === "1" || type === "3") {
        arrData = getDataByType(
          copyD_chnNumber[i].data,
          len,
          direction,
          type,
          "chnNumber"
        );
      } else if (type === "2" || type === "8") {
        arrData = getDataByType(copyD_chnNumber[i].data, len, direction, type);
      } else {
        arrData = getDataByType(copyD_chnNumber[i].data, len, direction, "0");
      }

      const arrIndex = getDataIndex(csLen, asLen, copyD_chnNumber[i].index);
      applyD_chnNumber.push({ data: arrData, index: arrIndex });
    }
  }

  // 周一~周日
  const copyD_chnWeek2 = copyD.chnWeek2;
  const applyD_chnWeek2 = [];
  if (copyD_chnWeek2) {
    for (let i = 0; i < copyD_chnWeek2.length; i += 1) {
      const s = getLenS(copyD_chnWeek2[i].index, rsd);
      const len = copyD_chnWeek2[i].index.length * num + s;

      let arrData;
      if (type === "1" || type === "3") {
        arrData = getDataByType(
          copyD_chnWeek2[i].data,
          len,
          direction,
          type,
          "chnWeek2"
        );
      } else if (type === "2") {
        arrData = getDataByType(copyD_chnWeek2[i].data, len, direction, type);
      } else {
        arrData = getDataByType(copyD_chnWeek2[i].data, len, direction, "0");
      }

      const arrIndex = getDataIndex(csLen, asLen, copyD_chnWeek2[i].index);
      applyD_chnWeek2.push({ data: arrData, index: arrIndex });
    }
  }

  // 星期一~星期日
  const copyD_chnWeek3 = copyD.chnWeek3;
  const applyD_chnWeek3 = [];
  if (copyD_chnWeek3) {
    for (let i = 0; i < copyD_chnWeek3.length; i += 1) {
      const s = getLenS(copyD_chnWeek3[i].index, rsd);
      const len = copyD_chnWeek3[i].index.length * num + s;

      let arrData;
      if (type === "1" || type === "3") {
        arrData = getDataByType(
          copyD_chnWeek3[i].data,
          len,
          direction,
          type,
          "chnWeek3"
        );
      } else if (type === "2") {
        arrData = getDataByType(copyD_chnWeek3[i].data, len, direction, type);
      } else {
        arrData = getDataByType(copyD_chnWeek3[i].data, len, direction, "0");
      }

      const arrIndex = getDataIndex(csLen, asLen, copyD_chnWeek3[i].index);
      applyD_chnWeek3.push({ data: arrData, index: arrIndex });
    }
  }

  // 其它
  const copyD_other = copyD.other;
  const applyD_other = [];
  if (copyD_other) {
    for (let i = 0; i < copyD_other.length; i += 1) {
      const s = getLenS(copyD_other[i].index, rsd);
      const len = copyD_other[i].index.length * num + s;

      let arrData;
      if (type === "2" || type === "3") {
        arrData = getDataByType(copyD_other[i].data, len, direction, type);
      } else {
        arrData = getDataByType(copyD_other[i].data, len, direction, "0");
      }

      const arrIndex = getDataIndex(csLen, asLen, copyD_other[i].index);
      applyD_other.push({ data: arrData, index: arrIndex });
    }
  }

  for (let x = 1; x <= asLen; x += 1) {
    if (applyD_number.length > 0) {
      for (let y = 0; y < applyD_number.length; y += 1) {
        if (x in applyD_number[y].index) {
          applyData.push(applyD_number[y].data[applyD_number[y].index[x]]);
        }
      }
    }

    if (applyD_extendNumber.length > 0) {
      for (let y = 0; y < applyD_extendNumber.length; y += 1) {
        if (x in applyD_extendNumber[y].index) {
          applyData.push(
            applyD_extendNumber[y].data[applyD_extendNumber[y].index[x]]
          );
        }
      }
    }

    if (applyD_date.length > 0) {
      for (let y = 0; y < applyD_date.length; y += 1) {
        if (x in applyD_date[y].index) {
          applyData.push(applyD_date[y].data[applyD_date[y].index[x]]);
        }
      }
    }

    if (applyD_chnNumber.length > 0) {
      for (let y = 0; y < applyD_chnNumber.length; y += 1) {
        if (x in applyD_chnNumber[y].index) {
          applyData.push(
            applyD_chnNumber[y].data[applyD_chnNumber[y].index[x]]
          );
        }
      }
    }

    if (applyD_chnWeek2.length > 0) {
      for (let y = 0; y < applyD_chnWeek2.length; y += 1) {
        if (x in applyD_chnWeek2[y].index) {
          applyData.push(applyD_chnWeek2[y].data[applyD_chnWeek2[y].index[x]]);
        }
      }
    }

    if (applyD_chnWeek3.length > 0) {
      for (let y = 0; y < applyD_chnWeek3.length; y += 1) {
        if (x in applyD_chnWeek3[y].index) {
          applyData.push(applyD_chnWeek3[y].data[applyD_chnWeek3[y].index[x]]);
        }
      }
    }

    if (applyD_other.length > 0) {
      for (let y = 0; y < applyD_other.length; y += 1) {
        if (x in applyD_other[y].index) {
          applyData.push(applyD_other[y].data[applyD_other[y].index[x]]);
        }
      }
    }
  }

  return applyData;
}

export function updateDropCell(ctx: Context) {
  // if (
  //   !checkProtectionLockedRangeList([_this.applyRange], ctx.currentSheetId)
  // ) {
  //   return;
  // }

  const d = getFlowdata(ctx);
  const allowEdit = isAllowEdit(ctx);
  if (allowEdit === false || d == null) {
    return;
  }

  const index = getSheetIndex(ctx, ctx.currentSheetId);
  if (index == null) return;
  const file = ctx.luckysheetfile[index];
  const hiddenRows = new Set(Object.keys(file.config?.rowhidden || {}));
  const hiddenCols = new Set(Object.keys(file.config?.colhidden || {}));

  const cfg = _.cloneDeep(ctx.config);
  if (cfg.borderInfo == null) {
    cfg.borderInfo = [];
  }
  const borderInfoCompute = getBorderInfoCompute(ctx, ctx.currentSheetId);
  const dataVerification = _.cloneDeep(file.dataVerification);

  const { direction } = dropCellCache;
  // const type = dropCellCache.applyType;

  // 复制范围
  const { copyRange } = dropCellCache;
  const copy_str_r = copyRange.row[0];
  const copy_end_r = copyRange.row[1];
  const copy_str_c = copyRange.column[0];
  const copy_end_c = copyRange.column[1];
  const copyData = getCopyData(
    d,
    copy_str_r,
    copy_end_r,
    copy_str_c,
    copy_end_c,
    direction
  );

  let csLen;
  if (direction === "down" || direction === "up") {
    csLen = copy_end_r - copy_str_r + 1;
  } else {
    // direction === "right" || direction === "left"
    csLen = copy_end_c - copy_str_c + 1;
  }

  // 应用范围
  const { applyRange } = dropCellCache;
  const apply_str_r = applyRange.row[0];
  const apply_end_r = applyRange.row[1];
  const apply_str_c = applyRange.column[0];
  const apply_end_c = applyRange.column[1];

  if (direction === "down" || direction === "up") {
    const asLen = apply_end_r - apply_str_r + 1;

    for (let i = apply_str_c; i <= apply_end_c; i += 1) {
      if (hiddenCols.has(`${i}`)) continue;
      const copyD = copyData[i - apply_str_c];

      const applyData = getApplyData(copyD, csLen, asLen);

      if (direction === "down") {
        for (let j = apply_str_r; j <= apply_end_r; j += 1) {
          if (hiddenRows.has(`${j}`)) continue;
          const cell = applyData[j - apply_str_r];

          if (cell?.f != null) {
            const f = `=${formula.functionCopy(
              ctx,
              cell.f,
              "down",
              j - apply_str_r + 1
            )}`;
            const v = formula.execfunction(ctx, f, j, i);

            formula.execFunctionGroup(ctx, j, i, v[1], undefined, d);

            [, cell.v, cell.f] = v;

            if (cell.spl != null) {
              cell.spl = v[3].data;
            } else if (cell.v != null) {
              if (
                isRealNum(cell.v) &&
                !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(
                  `${cell.v}`
                )
              ) {
                if (cell.v === Infinity || cell.v === -Infinity) {
                  cell.m = cell.v.toString();
                } else {
                  if (cell.v.toString().indexOf("e") > -1) {
                    let len = cell.v
                      .toString()
                      .split(".")[1]
                      .split("e")[0].length;
                    if (len > 5) {
                      len = 5;
                    }

                    cell.m = (cell.v as number).toExponential(len).toString();
                  } else {
                    let mask;
                    if (cell.ct?.fa === "##0.00") {
                      /* 如果是数字类型 */
                      mask = genarate(
                        `${
                          Math.round((cell.v as number) * 1000000000) /
                          1000000000
                        }.00`
                      );
                      cell.m = mask![0].toString();
                    } else {
                      mask = genarate(
                        Math.round((cell.v as number) * 1000000000) / 1000000000
                      );
                      cell.m = mask![0].toString();
                    }
                  }
                }

                cell.ct = cell.ct || { fa: "General", t: "n" };
              } else {
                const mask = genarate(cell.v);
                cell.m = mask![0].toString();
                [, cell.ct] = mask!;
              }
            }
          }

          d[j][i] = cell || null;

          // 边框
          const bd_r = copy_str_r + ((j - apply_str_r) % csLen);
          const bd_c = i;

          if (borderInfoCompute[`${bd_r}_${bd_c}`]) {
            const bd_obj = {
              rangeType: "cell",
              value: {
                row_index: j,
                col_index: i,
                l: borderInfoCompute[`${bd_r}_${bd_c}`].l,
                r: borderInfoCompute[`${bd_r}_${bd_c}`].r,
                t: borderInfoCompute[`${bd_r}_${bd_c}`].t,
                b: borderInfoCompute[`${bd_r}_${bd_c}`].b,
              },
            };

            cfg.borderInfo.push(bd_obj);
          } else if (borderInfoCompute[`${j}_${i}`]) {
            const bd_obj = {
              rangeType: "cell",
              value: {
                row_index: j,
                col_index: i,
                l: null,
                r: null,
                t: null,
                b: null,
              },
            };

            cfg.borderInfo.push(bd_obj);
          }

          // 数据验证
          // Bug
          if (dataVerification != null && dataVerification[`${bd_r}_${bd_c}`]) {
            dataVerification[`${j}_${i}`] = dataVerification[`${bd_r}_${bd_c}`];
          }
        }
      }
      if (direction === "up") {
        for (let j = apply_end_r; j >= apply_str_r; j -= 1) {
          if (hiddenRows.has(`${j}`)) continue;
          const cell = applyData[apply_end_r - j];

          if (cell?.f != null) {
            const f = `=${formula.functionCopy(
              ctx,
              cell.f,
              "up",
              apply_end_r - j + 1
            )}`;
            const v = formula.execfunction(ctx, f, j, i);

            formula.execFunctionGroup(ctx, j, i, v[1], undefined, d);

            [, cell.v, cell.f] = v;

            if (cell.spl != null) {
              cell.spl = v[3].data;
            } else if (cell.v != null) {
              if (
                isRealNum(cell.v) &&
                !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(
                  `${cell.v}`
                )
              ) {
                if (cell.v === Infinity || cell.v === -Infinity) {
                  cell.m = cell.v.toString();
                } else {
                  if (cell.v.toString().indexOf("e") > -1) {
                    let len = cell.v
                      .toString()
                      .split(".")[1]
                      .split("e")[0].length;
                    if (len > 5) {
                      len = 5;
                    }

                    cell.m = (cell.v as number).toExponential(len).toString();
                  } else {
                    const mask = genarate(
                      Math.round((cell.v as number) * 1000000000) / 1000000000
                    );
                    cell.m = mask![0].toString();
                  }
                }

                cell.ct = { fa: "General", t: "n" };
              } else {
                const mask = genarate(cell.v);
                cell.m = mask![0].toString();
                [, cell.ct] = mask!;
              }
            }
          }

          d[j][i] = cell || null;

          // 边框
          const bd_r = copy_end_r - ((apply_end_r - j) % csLen);
          const bd_c = i;

          if (borderInfoCompute[`${bd_r}_${bd_c}`]) {
            const bd_obj = {
              rangeType: "cell",
              value: {
                row_index: j,
                col_index: i,
                l: borderInfoCompute[`${bd_r}_${bd_c}`].l,
                r: borderInfoCompute[`${bd_r}_${bd_c}`].r,
                t: borderInfoCompute[`${bd_r}_${bd_c}`].t,
                b: borderInfoCompute[`${bd_r}_${bd_c}`].b,
              },
            };

            cfg.borderInfo.push(bd_obj);
          } else if (borderInfoCompute[`${j}_${i}`]) {
            const bd_obj = {
              rangeType: "cell",
              value: {
                row_index: j,
                col_index: i,
                l: null,
                r: null,
                t: null,
                b: null,
              },
            };

            cfg.borderInfo.push(bd_obj);
          }

          // 数据验证
          if (dataVerification != null && dataVerification[`${bd_r}_${bd_c}`]) {
            dataVerification[`${j}_${i}`] = dataVerification[`${bd_r}_${bd_c}`];
          }
        }
      }
    }
  } else if (direction === "right" || direction === "left") {
    const asLen = apply_end_c - apply_str_c + 1;

    for (let i = apply_str_r; i <= apply_end_r; i += 1) {
      if (hiddenRows.has(`${i}`)) continue;
      const copyD = copyData[i - apply_str_r];

      const applyData = getApplyData(copyD, csLen, asLen);

      if (direction === "right") {
        for (let j = apply_str_c; j <= apply_end_c; j += 1) {
          if (hiddenCols.has(`${j}`)) continue;
          const cell = applyData[j - apply_str_c];

          if (cell?.f != null) {
            const f = `=${formula.functionCopy(
              ctx,
              cell.f,
              "right",
              j - apply_str_c + 1
            )}`;
            const v = formula.execfunction(ctx, f, i, j);

            formula.execFunctionGroup(ctx, j, i, v[1], undefined, d);

            [, cell.v, cell.f] = v;

            if (cell.spl != null) {
              cell.spl = v[3].data;
            } else if (cell.v != null) {
              if (
                isRealNum(cell.v) &&
                !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(
                  `${cell.v}`
                )
              ) {
                if (cell.v === Infinity || cell.v === -Infinity) {
                  cell.m = cell.v.toString();
                } else {
                  if (cell.v.toString().indexOf("e") > -1) {
                    let len = cell.v
                      .toString()
                      .split(".")[1]
                      .split("e")[0].length;
                    if (len > 5) {
                      len = 5;
                    }

                    cell.m = (cell.v as number).toExponential(len).toString();
                  } else {
                    const mask = genarate(
                      Math.round((cell.v as number) * 1000000000) / 1000000000
                    );
                    cell.m = mask![0].toString();
                  }
                }

                cell.ct = { fa: "General", t: "n" };
              } else {
                const mask = genarate(cell.v);
                cell.m = mask![0].toString();
                [, cell.ct] = mask!;
              }
            }
          }

          d[i][j] = cell || null;

          // 边框
          const bd_r = i;
          const bd_c = copy_str_c + ((j - apply_str_c) % csLen);

          if (borderInfoCompute[`${bd_r}_${bd_c}`]) {
            const bd_obj = {
              rangeType: "cell",
              value: {
                row_index: i,
                col_index: j,
                l: borderInfoCompute[`${bd_r}_${bd_c}`].l,
                r: borderInfoCompute[`${bd_r}_${bd_c}`].r,
                t: borderInfoCompute[`${bd_r}_${bd_c}`].t,
                b: borderInfoCompute[`${bd_r}_${bd_c}`].b,
              },
            };

            cfg.borderInfo.push(bd_obj);
          } else if (borderInfoCompute[`${i}_${j}`]) {
            const bd_obj = {
              rangeType: "cell",
              value: {
                row_index: i,
                col_index: j,
                l: null,
                r: null,
                t: null,
                b: null,
              },
            };

            cfg.borderInfo.push(bd_obj);
          }

          // 数据验证
          if (dataVerification != null && dataVerification[`${bd_r}_${bd_c}`]) {
            dataVerification[`${i}_${j}`] = dataVerification[`${bd_r}_${bd_c}`];
          }
        }
      }
      if (direction === "left") {
        for (let j = apply_end_c; j >= apply_str_c; j -= 1) {
          if (hiddenCols.has(`${j}`)) continue;
          const cell = applyData[apply_end_c - j];

          if (cell?.f != null) {
            const f = `=${formula.functionCopy(
              ctx,
              cell.f,
              "left",
              apply_end_c - j + 1
            )}`;
            const v = formula.execfunction(ctx, f, i, j);

            formula.execFunctionGroup(ctx, j, i, v[1], undefined, d);

            [, cell.v, cell.f] = v;

            if (cell.spl != null) {
              cell.spl = v[3].data;
            } else if (cell.v != null) {
              if (
                isRealNum(cell.v) &&
                !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(
                  `${cell.v}`
                )
              ) {
                if (cell.v === Infinity || cell.v === -Infinity) {
                  cell.m = cell.v.toString();
                } else {
                  if (cell.v.toString().indexOf("e") > -1) {
                    let len = cell.v
                      .toString()
                      .split(".")[1]
                      .split("e")[0].length;
                    if (len > 5) {
                      len = 5;
                    }

                    cell.m = (cell.v as number).toExponential(len).toString();
                  } else {
                    const mask = genarate(
                      Math.round((cell.v as number) * 1000000000) / 1000000000
                    );
                    cell.m = mask![0].toString();
                  }
                }

                cell.ct = { fa: "General", t: "n" };
              } else {
                const mask = genarate(cell.v);
                cell.m = mask![0].toString();
                [, cell.ct] = mask!;
              }
            }
          }

          d[i][j] = cell || null;

          // 边框
          const bd_r = i;
          const bd_c = copy_end_c - ((apply_end_c - j) % csLen);

          if (borderInfoCompute[`${bd_r}_${bd_c}`]) {
            const bd_obj = {
              rangeType: "cell",
              value: {
                row_index: i,
                col_index: j,
                l: borderInfoCompute[`${bd_r}_${bd_c}`].l,
                r: borderInfoCompute[`${bd_r}_${bd_c}`].r,
                t: borderInfoCompute[`${bd_r}_${bd_c}`].t,
                b: borderInfoCompute[`${bd_r}_${bd_c}`].b,
              },
            };

            cfg.borderInfo.push(bd_obj);
          } else if (borderInfoCompute[`${i}_${j}`]) {
            const bd_obj = {
              rangeType: "cell",
              value: {
                row_index: i,
                col_index: j,
                l: null,
                r: null,
                t: null,
                b: null,
              },
            };

            cfg.borderInfo.push(bd_obj);
          }

          // 数据验证
          if (dataVerification != null && dataVerification[`${bd_r}_${bd_c}`]) {
            dataVerification[`${i}_${j}`] = dataVerification[`${bd_r}_${bd_c}`];
          }
        }
      }
    }
  }

  // 条件格式
  const cdformat = file.luckysheet_conditionformat_save;
  if (cdformat != null && cdformat.length > 0) {
    for (let i = 0; i < cdformat.length; i += 1) {
      const cdformat_cellrange = cdformat[i].cellrange;

      let emptyRange: any = [];

      for (let j = 0; j < cdformat_cellrange.length; j += 1) {
        const range = CFSplitRange(
          cdformat_cellrange[j],
          { row: copyRange.row, column: copyRange.column },
          { row: applyRange.row, column: applyRange.column },
          "operatePart"
        );
        if (range.length > 0) {
          emptyRange = emptyRange.concat(range);
        }
      }

      if (emptyRange.length > 0) {
        cdformat[i].cellrange.push(applyRange);
      }
    }
  }

  // 刷新一次表格
  // const allParam = {
  //   cfg,
  //   cdformat,
  //   dataVerification,
  // };
  jfrefreshgrid(ctx, d, ctx.luckysheet_select_save);

  // selectHightlightShow();
}

export function onDropCellSelectEnd(
  ctx: Context,
  e: MouseEvent,
  container: HTMLDivElement
) {
  ctx.luckysheet_cell_selected_extend = false;
  hideDropCellSelection(container);

  // if (
  //   !checkProtectionLockedRangeList(
  //     ctx.luckysheet_select_save,
  //     ctx.currentSheetId
  //   )
  // ) {
  //   return;
  // }

  const { scrollLeft, scrollTop } = ctx;
  const rect = container.getBoundingClientRect();
  const x = e.pageX - rect.left - ctx.rowHeaderWidth + scrollLeft;
  const y = e.pageY - rect.top - ctx.columnHeaderHeight + scrollTop;

  const row_location = rowLocation(y, ctx.visibledatarow);
  // const row = row_location[1];
  const row_pre = row_location[0];
  const row_index = row_location[2];
  const col_location = colLocation(x, ctx.visibledatacolumn);
  // const col = col_location[1];
  const col_pre = col_location[0];
  const col_index = col_location[2];

  const row_index_original = ctx.luckysheet_cell_selected_extend_index[0];
  const col_index_original = ctx.luckysheet_cell_selected_extend_index[1];

  const last =
    ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
  if (
    last &&
    last.top != null &&
    last.left != null &&
    last.height != null &&
    last.width != null &&
    last.row_focus != null &&
    last.column_focus != null
  ) {
    let row_s = last.row[0];
    let row_e = last.row[1];
    let col_s = last.column[0];
    let col_e = last.column[1];

    // 复制范围
    dropCellCache.copyRange = _.cloneDeep(_.pick(last, ["row", "column"]));
    // applyType
    const typeItemHide = getTypeItemHide(ctx);

    if (
      !typeItemHide[0] &&
      !typeItemHide[1] &&
      !typeItemHide[2] &&
      !typeItemHide[3] &&
      !typeItemHide[4] &&
      !typeItemHide[5] &&
      !typeItemHide[6]
    ) {
      dropCellCache.applyType = "0";
    } else {
      dropCellCache.applyType = "1";
    }

    if (ctx.luckysheet_select_save == null) return;
    const { top_move, left_move } = ctx.luckysheet_select_save[0];
    if (
      Math.abs(row_index_original - row_index) >
      Math.abs(col_index_original - col_index)
    ) {
      if (!(row_index >= row_s && row_index <= row_e)) {
        if (top_move != null && top_move >= row_pre) {
          // 当往上拖拽时
          dropCellCache.applyRange = {
            row: [row_index, last.row[0] - 1],
            column: last.column,
          };
          dropCellCache.direction = "up";

          row_s -= last.row[0] - row_index;

          // 是否有数据透视表范围
          // if (pivotTable.isPivotRange(row_s, col_e)) {
          //   tooltip.info(locale_drag.affectPivot, "");
          //   return;
          // }
        } else {
          // 当往下拖拽时
          dropCellCache.applyRange = {
            row: [last.row[1] + 1, row_index],
            column: last.column,
          };
          dropCellCache.direction = "down";

          row_e += row_index - last.row[1];

          // 是否有数据透视表范围
          // if (pivotTable.isPivotRange(row_e, col_e)) {
          //   tooltip.info(locale_drag.affectPivot, "");
          //   return;
          // }
        }
      } else {
        return;
      }
    } else {
      if (!(col_index >= col_s && col_index <= col_e)) {
        if (left_move != null && left_move >= col_pre) {
          // 当往左拖拽时
          dropCellCache.applyRange = {
            row: last.row,
            column: [col_index, last.column[0] - 1],
          };
          dropCellCache.direction = "left";

          col_s -= last.column[0] - col_index;

          // 是否有数据透视表范围
          // if (pivotTable.isPivotRange(row_e, col_s)) {
          //   tooltip.info(locale_drag.affectPivot, "");
          //   return;
          // }
        } else {
          // 当往右拖拽时
          dropCellCache.applyRange = {
            row: last.row,
            column: [last.column[1] + 1, col_index],
          };
          dropCellCache.direction = "right";

          col_e += col_index - last.column[1];

          // 是否有数据透视表范围
          // if (pivotTable.isPivotRange(row_e, col_e)) {
          //   tooltip.info(locale_drag.affectPivot, "");
          //   return;
          // }
        }
      } else {
        return;
      }
    }

    if (y < 0) {
      row_s = 0;
      [row_e] = last.row;
    }

    if (x < 0) {
      col_s = 0;
      [col_e] = last.column;
    }

    const flowdata = getFlowdata(ctx);
    if (flowdata == null) return;

    if (ctx.config.merge != null) {
      let HasMC = false;

      for (let r = last.row[0]; r <= last.row[1]; r += 1) {
        for (let c = last.column[0]; c <= last.column[1]; c += 1) {
          const cell = flowdata[r]?.[c];

          if (cell != null && cell.mc != null) {
            HasMC = true;
            break;
          }
        }
      }

      if (HasMC) {
        // if (isEditMode()) {
        //   alert(locale_drag.noMerge);
        // } else {
        //   tooltip.info(locale_drag.noMerge, "");
        // }

        return;
      }

      for (let r = row_s; r <= row_e; r += 1) {
        for (let c = col_s; c <= col_e; c += 1) {
          const cell = flowdata[r]?.[c];

          if (cell != null && cell.mc != null) {
            HasMC = true;
            break;
          }
        }
      }

      if (HasMC) {
        // if (isEditMode()) {
        //   alert(locale_drag.noMerge);
        // } else {
        //   tooltip.info(locale_drag.noMerge, "");
        // }

        return;
      }
    }

    last.row = [row_s, row_e];
    last.column = [col_s, col_e];

    ctx.luckysheet_select_save = normalizeSelection(ctx, [
      {
        row: [row_s, row_e],
        column: [col_s, col_e],
      },
    ]);

    try {
      updateDropCell(ctx);
    } catch (err) {
      console.error(err);
    }
    // createIcon();

    const selectedMoveEle = container.querySelector(
      ".fortune-cell-selected-move"
    );
    if (selectedMoveEle) {
      (selectedMoveEle as HTMLDivElement).style.display = "none";
    }

    // clearTimeout(ctx.countfuncTimeout);
    // ctx.countfuncTimeout = setTimeout(() => {
    // countfunc();
    // }, 500);
  }
}
