import numeral from "numeral";
import _ from "lodash";
import { execfunction, functionCopy, update } from ".";
import {
  Cell,
  CellMatrix,
  Context,
  diff,
  getFlowdata,
  isdatetime,
  isRealNull,
  isRealNum,
} from "..";
import { jfrefreshgrid } from "./refresh";

export function orderbydata(
  isAsc: boolean,
  index: number,
  data: (Cell | null)[][]
) {
  if (isAsc == null) {
    isAsc = true;
  }
  const a = (x: any, y: any) => {
    let x1 = x[index];
    let y1 = y[index];
    if (x[index] != null) {
      x1 = x[index].v;
    }
    if (y[index] != null) {
      y1 = y[index].v;
    }
    if (isRealNull(x1)) {
      return isAsc ? 1 : -1;
    }

    if (isRealNull(y1)) {
      return isAsc ? -1 : 1;
    }
    if (isdatetime(x1) && isdatetime(y1)) {
      return diff(x1, y1);
    }
    if (isRealNum(x1) && isRealNum(y1)) {
      const y1Value = numeral(y1).value();
      const x1Value = numeral(x1).value();
      if (y1Value == null || x1Value == null) return null;
      return x1Value - y1Value;
    }
    if (!isRealNum(x1) && !isRealNum(y1)) {
      return x1.localeCompare(y1, "zh");
    }
    if (!isRealNum(x1)) {
      return 1;
    }
    if (!isRealNum(y1)) {
      return -1;
    }
    return 0;
  };
  const d = (x: any, y: any) => a(y, x);
  const sortedData = _.clone(data);
  sortedData.sort(isAsc ? a : d);

  // calc row offsets
  const rowOffsets = sortedData.map((r, i) => {
    const origIndex = _.findIndex(data, (origR) => origR === r);
    return i - origIndex;
  });

  return { sortedData, rowOffsets };
}

export function sortDataRange(
  ctx: Context,
  sheetData: CellMatrix,
  dataRange: CellMatrix,
  index: number,
  isAsc: boolean,
  str: number,
  edr: number,
  stc: number,
  edc: number
) {
  const { sortedData, rowOffsets } = orderbydata(isAsc, index, dataRange);

  for (let r = str; r <= edr; r += 1) {
    for (let c = stc; c <= edc; c += 1) {
      const cell = sortedData[r - str][c - stc];
      if (cell?.f) {
        const moveOffset = rowOffsets[r - str];
        let func = cell?.f!;
        if (moveOffset > 0) {
          func = `=${functionCopy(ctx, func, "down", moveOffset)}`;
        } else if (moveOffset < 0) {
          func = `=${functionCopy(ctx, func, "up", -moveOffset)}`;
        }
        const funcV = execfunction(ctx, func, r, c, undefined, true);
        [, cell!.v, cell!.f] = funcV;
        cell.m = update(cell.ct?.fa || "General", cell.v);
      }
      sheetData[r][c] = cell;
    }
  }

  // let allParam = {};
  // if (ctx.config.rowlen != null) {
  //   let cfg = _.assign({}, ctx.config);
  //   cfg = rowlenByRange(d, str, edr, cfg);

  //   allParam = {
  //     cfg,
  //     RowlChange: true,
  //   };
  // }
  jfrefreshgrid(ctx, sheetData, [{ row: [str, edr], column: [stc, edc] }]);
}

export function sortSelection(
  ctx: Context,
  isAsc: boolean,
  colIndex: number = 0
) {
  // if (!checkProtectionAuthorityNormal(ctx.currentSheetIndex, "sort")) {
  //   return;
  // }
  if (ctx.allowEdit === false) return;
  if (ctx.luckysheet_select_save == null) return;
  if (ctx.luckysheet_select_save.length > 1) {
    // if (isEditMode()) {
    //   alert("不能对多重选择区域执行此操作，请选择单个区域，然后再试");
    // } else {
    //   tooltip.info(
    //     "不能对多重选择区域执行此操作，请选择单个区域，然后再试",
    //     ""
    //   );
    // }

    return;
  }

  if (isAsc == null) {
    isAsc = true;
  }
  // const d = editor.deepCopyFlowData(Store.flowdata);
  const flowdata = getFlowdata(ctx);
  const d = flowdata;
  if (d == null) return;

  const r1 = ctx.luckysheet_select_save[0].row[0];
  const r2 = ctx.luckysheet_select_save[0].row[1];
  const c1 = ctx.luckysheet_select_save[0].column[0];
  const c2 = ctx.luckysheet_select_save[0].column[1];

  let str: number | null = null;
  let edr;

  for (let r = r1; r <= r2; r += 1) {
    if (d[r] != null && d[r][c1] != null) {
      const cell = d[r][c1];
      if (cell == null) return; //
      if (cell.mc != null || isRealNull(cell.v)) {
        continue;
      }
      if (str == null && /[\u4e00-\u9fa5]+/g.test(`${cell.v}`)) {
        str = r + 1;
        edr = r + 1;
        continue;
      }

      if (str == null) {
        str = r;
      }

      edr = r;
    }
  }

  if (str == null || str > r2) {
    return;
  }

  let hasMc = false; // 排序选区是否有合并单元格
  const data: CellMatrix = [];
  if (edr == null) return;
  for (let r = str; r <= edr; r += 1) {
    const data_row = [];
    for (let c = c1; c <= c2; c += 1) {
      if (d[r][c] != null && d[r][c]?.mc != null) {
        hasMc = true;
        break;
      }

      data_row.push(d[r][c]);
    }

    data.push(data_row);
  }

  if (hasMc) {
    // if (isEditMode()) {
    //   alert("选区有合并单元格，无法执行此操作！");
    // } else {
    //   tooltip.info("选区有合并单元格，无法执行此操作！", "");
    // }

    return;
  }

  sortDataRange(ctx, d, data, colIndex, isAsc, str, edr, c1, c2);
}
