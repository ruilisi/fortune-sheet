import _ from "lodash";
import { locale } from "../locale";
import { Context, getFlowdata } from "../context";
import { Cell } from "../types";
import { getSheetIndex, rgbToHex } from "../utils";
import { update } from "./format";
import { normalizeSelection } from "./selection";
import { isRealNull } from "./validation";
import { normalizedAttr } from "./cell";
import { orderbydata } from "./sort";

// 筛选配置状态
export function labelFilterOptionState(
  ctx: Context,
  optionstate: boolean,
  rowhidden: Record<string, number>,
  caljs: any,
  str: number,
  edr: number,
  cindex: number,
  stc: number,
  edc: number,
  saveData: boolean
) {
  const param = {
    caljs,
    rowhidden,
    optionstate,
    str,
    edr,
    cindex,
    stc,
    edc,
  };

  if (optionstate) {
    ctx.filter[cindex - stc] = param;
    // 条件格式参数
    if (caljs != null) {
    }
  } else {
    delete ctx.filter[cindex - stc];
  }

  if (saveData) {
    const sheetIndex = getSheetIndex(ctx, ctx.currentSheetId);
    if (sheetIndex == null) return;
    const file = ctx.luckysheetfile[sheetIndex];

    if (file.filter == null) {
      file.filter = {};
    }

    if (optionstate) {
      file.filter[cindex - stc] = param;
    } else {
      delete file.filter[cindex - stc];
    }

    // server.saveParam("all", Store.currentSheetIndex, file.filter, {
    //   k: "filter",
    // });
  }
}

// 筛选排序
export function orderbydatafiler(
  ctx: Context,
  str: number,
  stc: number,
  edr: number,
  edc: number,
  curr: number,
  asc: boolean
) {
  const d = getFlowdata(ctx);
  if (d == null) {
    return null;
  }
  str += 1;

  let hasMc = false; // 排序选区是否有合并单元格
  let data = [];

  for (let r = str; r <= edr; r += 1) {
    const data_row = [];

    for (let c = stc; c <= edc; c += 1) {
      if (d[r][c] != null && d[r][c]?.mc != null) {
        hasMc = true;
        break;
      }

      data_row.push(d[r][c]);
    }

    data.push(data_row);
  }

  if (hasMc) {
    const { filter } = locale(ctx);

    // if (isEditMode()) {
    //   alert(locale_filter.mergeError);
    // } else {
    return filter.mergeError;
    // }
  }

  data = orderbydata(asc, curr - stc, data);

  for (let r = str; r <= edr; r += 1) {
    for (let c = stc; c <= edc; c += 1) {
      d[r][c] = data[r - str][c - stc];
    }
  }
  return null;

  // let allParam = {};
  // if (ctx.config.rowlen != null) {
  //   let cfg = _.assign({}, ctx.config);
  //   cfg = rowlenByRange(d, str, edr, cfg);

  //   allParam = {
  //     cfg,
  //     RowlChange: true,
  //   };
  // }

  // jfrefreshgrid(d, [{ row: [str, edr], column: [stc, edc] }], allParam);
}

// 创建筛选配置
export function createFilterOptions(
  ctx: Context,
  luckysheet_filter_save:
    | {
        row: number[];
        column: number[];
      }
    | undefined,
  filterObj?: any,
  saveData?: boolean
) {
  // $(`#luckysheet-filter-selected-sheet${ctx.currentSheetIndex}`).remove();
  // $(`#luckysheet-filter-options-sheet${ctx.currentSheetIndex}`).remove();

  const sheetIndex = getSheetIndex(ctx, ctx.currentSheetId);
  if (sheetIndex == null) return;
  if (luckysheet_filter_save == null || _.size(luckysheet_filter_save) === 0) {
    delete ctx.filterOptions;
    return;
  }

  const r1 = luckysheet_filter_save.row[0];
  const r2 = luckysheet_filter_save.row[1];
  const c1 = luckysheet_filter_save.column[0];
  const c2 = luckysheet_filter_save.column[1];

  const row = ctx.visibledatarow[r2];
  const row_pre = r1 - 1 === -1 ? 0 : ctx.visibledatarow[r1 - 1];
  const col = ctx.visibledatacolumn[c2];
  const col_pre = c1 - 1 === -1 ? 0 : ctx.visibledatacolumn[c1 - 1];

  const options = {
    startRow: r1,
    endRow: r2,
    startCol: c1,
    endCol: c2,
    left: col_pre,
    top: row_pre,
    width: col - col_pre - 1,
    height: row - row_pre - 1,
    items: [] as { col: number; left: number; top: number }[],
  };

  for (let c = c1; c <= c2; c += 1) {
    if (filterObj == null || filterObj?.[c - c1] == null) {
    } else {
    }
    options.items.push({
      col: c,
      left: ctx.visibledatacolumn[c] - 20,
      top: row_pre,
    });
  }

  if (saveData) {
    const file = ctx.luckysheetfile[sheetIndex];
    file.filter_select = luckysheet_filter_save;
  }
  _.set(ctx, ["filterOptions", ctx.currentSheetId], options);
}

export function clearFilter(ctx: Context) {
  const sheetIndex = getSheetIndex(ctx, ctx.currentSheetId);
  const hiddenRows = _.reduce(
    ctx.filter,
    (pre, curr) => _.assign(pre, curr?.rowhidden || {}),
    {}
  );
  ctx.config.rowhidden = _.omit(ctx.config.rowhidden, _.keys(hiddenRows));
  ctx.luckysheet_filter_save = undefined;
  ctx.filterOptions = undefined;
  ctx.filterContextMenu = undefined;
  ctx.filter = {};
  if (sheetIndex != null) {
    ctx.luckysheetfile[sheetIndex].filter = undefined;
    ctx.luckysheetfile[sheetIndex].filter_select = undefined;
    ctx.luckysheetfile[sheetIndex].config = _.assign({}, ctx.config);
  }
}

export function createFilter(ctx: Context) {
  // if (!checkProtectionAuthorityNormal(ctx.currentSheetIndex, "filter")) {
  //   return;
  // }

  if (_.size(ctx.luckysheet_select_save) > 1) {
    // const locale_splitText = locale().splitText;

    // if (isEditMode()) {
    //   alert(locale_splitText.tipNoMulti);
    // } else {
    //   tooltip.info(locale_splitText.tipNoMulti, "");
    // }

    return;
  }
  if (_.size(ctx.luckysheet_filter_save) > 0) {
    clearFilter(ctx);
    return;
  }

  const sheetIndex = getSheetIndex(ctx, ctx.currentSheetId);
  if (sheetIndex == null || ctx.luckysheetfile[sheetIndex].isPivotTable) {
    return;
  }

  // $(
  //   `#luckysheet-filter-selected-sheet${sheetId}, #luckysheet-filter-options-sheet${ctx.currentSheetId}`
  // ).remove();

  const last = ctx.luckysheet_select_save?.[0];
  const flowdata = getFlowdata(ctx);
  let filterSave;
  if (last == null || flowdata == null) return;
  if (last.row[0] === last.row[1] && last.column[0] === last.column[1]) {
    let st_c;
    let ed_c;
    const curR = last.row[1];

    for (let c = 0; c < flowdata[curR].length; c += 1) {
      const cell = flowdata[curR][c];

      if (cell != null && !isRealNull(cell.v)) {
        if (st_c == null) {
          st_c = c;
        }
      } else if (st_c != null) {
        ed_c = c - 1;
        break;
      }
    }

    if (ed_c == null) {
      ed_c = flowdata[curR].length - 1;
    }

    filterSave = normalizeSelection(ctx, [
      { row: [curR, curR], column: [st_c || 0, ed_c] }, // st_c default 0 ?
    ]);
    ctx.luckysheet_select_save = filterSave;

    ctx.luckysheet_shiftpositon = _.assign({}, last);
    // luckysheetMoveEndCell("down", "range");
  } else if (last.row[1] - last.row[0] < 2) {
    ctx.luckysheet_shiftpositon = _.assign({}, last);
    // luckysheetMoveEndCell("down", "range");
  }

  ctx.luckysheet_filter_save = _.assign(
    {},
    filterSave?.[0] || ctx.luckysheet_select_save?.[0]
  );

  createFilterOptions(ctx, ctx.luckysheet_filter_save, {}, true);

  // server.saveParam("all", ctx.currentSheetIndex, ctx.luckysheet_filter_save, {
  //   k: "filter_select",
  // });

  // if (ctx.filterchage) {
  //   ctx.jfredo.push({
  //     type: "filtershow",
  //     data: [],
  //     curdata: [],
  //     sheetIndex: ctx.currentSheetIndex,
  //     filter_save: ctx.luckysheet_filter_save,
  //   });
  // }
}

export type FilterDate = {
  key: string;
  type: string;
  value: string;
  text: string;
  rows: number[];
  dateValues: string[];
  children: FilterDate[];
};

export type FilterValue = {
  key: string;
  value: any;
  mask: any;
  text: string;
  rows: number[];
};

function getFilterHiddenRows(ctx: Context, col: number, startCol: number) {
  const otherHiddenRows = _.reduce(
    ctx.filter,
    (pre, curr) =>
      _.assign(pre, (curr?.cindex !== col && curr?.rowhidden) || {}),
    {}
  );
  const hiddenRows = ctx.filter[col - startCol]?.rowhidden || {};
  return { otherHiddenRows, hiddenRows };
}

export function getFilterColumnValues(
  ctx: Context,
  col: number,
  startRow: number,
  endRow: number,
  startCol: number
) {
  const { otherHiddenRows, hiddenRows } = getFilterHiddenRows(
    ctx,
    col,
    startCol
  );
  const visibleRows: number[] = [];
  const flattenValues: string[] = [];
  // 日期值
  const dates: FilterDate[] = [];
  let datesUncheck: string[] = [];
  const dateRowMap: Record<string, number[]> = {};

  // 除日期以外的值
  const valuesMap: Map<string, FilterValue[]> = new Map();
  let valuesUncheck: string[] = [];
  const valueRowMap: Record<string, number[]> = {};

  const flowdata = getFlowdata(ctx);
  if (flowdata == null)
    return {
      dates,
      datesUncheck,
      dateRowMap,
      values: [],
      valuesUncheck,
      valueRowMap,
      visibleRows,
      flattenValues,
    };

  let cell: Cell | null;
  const { filter } = locale(ctx);
  for (let r = startRow + 1; r <= endRow; r += 1) {
    if (r in otherHiddenRows) {
      continue;
    }
    visibleRows.push(r);

    cell = flowdata[r][col];

    if (
      cell != null &&
      !isRealNull(cell.v) &&
      cell.ct != null &&
      cell.ct.t === "d"
    ) {
      // 单元格是日期
      const dateStr: string = update("YYYY-MM-DD", cell.v);

      const y = dateStr.split("-")[0];
      const m = dateStr.split("-")[1];
      const d = dateStr.split("-")[2];

      let yearValue = _.find(dates, (v) => v.value === y);
      if (yearValue == null) {
        yearValue = {
          key: y,
          type: "year",
          value: y,
          text: y + filter.filiterYearText,
          children: [],
          rows: [],
          dateValues: [],
        };
        dates.push(yearValue);
        flattenValues.push(dateStr);
      }

      let monthValue = _.find(yearValue.children, (v) => v.value === m);
      if (monthValue == null) {
        monthValue = {
          key: `${y}-${m}`,
          type: "month",
          value: m,
          text: m + filter.filiterMonthText,
          children: [],
          rows: [],
          dateValues: [],
        };
        yearValue.children.push(monthValue);
      }

      let dayValue = _.find(monthValue.children, (v) => v.value === d);
      if (dayValue == null) {
        dayValue = {
          key: dateStr,
          type: "day",
          value: d,
          text: d,
          children: [],
          rows: [],
          dateValues: [],
        };
        monthValue.children.push(dayValue);
      }

      yearValue.rows.push(r);
      yearValue.dateValues.push(dateStr);
      monthValue.rows.push(r);
      monthValue.dateValues.push(dateStr);
      dayValue.rows.push(r);
      dayValue.dateValues.push(dateStr);
      dateRowMap[dateStr] = (dateRowMap[dateStr] || []).concat(r);

      if (r in hiddenRows) {
        datesUncheck = _.union(datesUncheck, [dateStr]);
      }
    } else {
      let v;
      let m: string | number | null | undefined;
      if (cell == null || isRealNull(cell.v)) {
        v = null;
        m = null;
      } else {
        v = cell.v;
        m = cell.m;
      }

      const data = valuesMap.get(`${v}`);
      const text = m == null ? filter.valueBlank : `${m}`;
      const key = `${v}#$$$#${m}`;
      if (data != null) {
        let maskValue = _.find(data, (value) => value.mask === m);
        if (maskValue == null) {
          maskValue = {
            key,
            value: v,
            text,
            mask: m,
            rows: [],
          };
          data.push(maskValue);
          flattenValues.push(text);
        }
        maskValue.rows.push(r);
      } else {
        valuesMap.set(`${v}`, [{ key, value: v, text, mask: m, rows: [r] }]);
        flattenValues.push(text);
      }

      if (r in hiddenRows) {
        valuesUncheck = _.union(valuesUncheck, [key]);
      }
      valueRowMap[key] = (valueRowMap[key] || []).concat(r);
    }
  }
  return {
    dates,
    datesUncheck,
    dateRowMap,
    values: _.flatten(Array.from(valuesMap.values())),
    valuesUncheck,
    valueRowMap,
    visibleRows,
    flattenValues,
  };
}

export type FilterColor = {
  color: string;
  checked: boolean;
  rows: number[];
};

export function getFilterColumnColors(
  ctx: Context,
  col: number,
  startRow: number,
  endRow: number
) {
  // 遍历筛选列颜色
  const bgMap: Map<string, FilterColor> = new Map(); // 单元格颜色
  const fcMap: Map<string, FilterColor> = new Map(); // 字体颜色

  // const af_compute = alternateformat.getComputeMap();
  // const cf_compute = conditionformat.getComputeMap();
  const flowdata = getFlowdata(ctx);
  if (flowdata == null) return { bgColors: [], fcColors: [] };

  for (let r = startRow + 1; r <= endRow; r += 1) {
    const cell = flowdata[r][col];

    // 单元格颜色
    let bg = normalizedAttr(flowdata, r, col, "bg");

    if (bg == null) {
      bg = "#ffffff";
    }

    // const checksAF = alternateformat.checksAF(r, col, af_compute);
    const checksAF: any = [];
    if (checksAF.length > 1) {
      // 若单元格有交替颜色
      [, bg] = checksAF;
    }

    // const checksCF = conditionformat.checksCF(r, col, cf_compute);
    const checksCF: any = {};
    if (checksCF != null && checksCF.cellColor != null) {
      // 若单元格有条件格式
      bg = checksCF.cellColor;
    }

    if (bg.indexOf("rgb") > -1) {
      bg = rgbToHex(bg);
    }

    if (bg.length === 4) {
      bg =
        bg.substr(0, 1) +
        bg.substr(1, 1).repeat(2) +
        bg.substr(2, 1).repeat(2) +
        bg.substr(3, 1).repeat(2);
    }

    // 字体颜色
    let fc = normalizedAttr(flowdata, r, col, "fc");

    if (checksAF.length > 0) {
      // 若单元格有交替颜色
      [fc] = checksAF;
    }

    if (checksCF != null && checksCF.textColor != null) {
      // 若单元格有条件格式
      fc = checksCF.textColor;
    }

    if (fc != null) {
      if (fc.indexOf("rgb") > -1) {
        fc = rgbToHex(fc);
      }

      if (fc.length === 4) {
        fc =
          fc.substr(0, 1) +
          fc.substr(1, 1).repeat(2) +
          fc.substr(2, 1).repeat(2) +
          fc.substr(3, 1).repeat(2);
      }
    }

    const isRowHidden = r in (ctx.config?.rowhidden || {});
    const bgData = bgMap.get(bg);
    if (bgData != null) {
      bgData.rows.push(r);
      if (isRowHidden) bgData.checked = false;
    } else {
      bgMap.set(bg, { color: bg, checked: !isRowHidden, rows: [r] });
    }
    if (fc != null) {
      const fcData = fcMap.get(fc);
      if (fcData != null) {
        fcData.rows.push(r);
        if (isRowHidden) fcData.checked = false;
      } else if (cell != null && !isRealNull(cell.v)) {
        fcMap.set(fc, { color: fc, checked: !isRowHidden, rows: [r] });
      }
    }
  }
  return {
    bgColors: _.flatten(Array.from(bgMap.values())),
    fcColors: _.flatten(Array.from(fcMap.values())),
  };
}

export function saveFilter(
  ctx: Context,
  optionState: boolean,
  hiddenRows: Record<string, number>,
  caljs: any,
  st_r: number,
  ed_r: number,
  cindex: number,
  st_c: number,
  ed_c: number
) {
  const { otherHiddenRows } = getFilterHiddenRows(ctx, cindex, st_c);
  const rowHiddenAll = _.assign(otherHiddenRows, hiddenRows);

  labelFilterOptionState(
    ctx,
    optionState,
    hiddenRows,
    caljs,
    st_r,
    ed_r,
    cindex,
    st_c,
    ed_c,
    true
  );

  const cfg = _.assign({}, ctx.config);
  cfg.rowhidden = rowHiddenAll;

  // config
  ctx.config = cfg;
  const sheetIndex = getSheetIndex(ctx, ctx.currentSheetId);
  if (sheetIndex == null) {
    return;
  }
  ctx.luckysheetfile[sheetIndex].config = cfg;

  // server.saveParam("cg", Store.currentSheetIndex, cfg.rowhidden, {
  //   k: "rowhidden",
  // });
}
