import _ from "lodash";
import { Context } from "../context";
import { deleteRowCol, insertRowCol } from "../modules";
import { CommonOptions, getSheet } from "./common";
import { INVALID_PARAMS } from "./errors";

export function freeze(
  ctx: Context,
  type: "row" | "column" | "both",
  range: { row: number; column: number },
  options: CommonOptions = {}
) {
  const sheet = getSheet(ctx, options);

  const typeMap = {
    row: "rangeRow",
    column: "rangeColumn",
    both: "rangeBoth",
  };
  const innerType = typeMap[type];

  sheet.frozen = {
    // @ts-ignore
    type: innerType,
    range: {
      column_focus: range.column,
      row_focus: range.row,
    },
  };
}

export function insertRowOrColumn(
  ctx: Context,
  type: "row" | "column",
  index: number,
  count: number,
  direction: "lefttop" | "rightbottom",
  options: CommonOptions = {}
) {
  if (
    !["row", "column"].includes(type) ||
    !_.isNumber(index) ||
    !_.isNumber(count) ||
    !["lefttop", "rightbottom"].includes(direction)
  ) {
    throw INVALID_PARAMS;
  }

  const sheet = getSheet(ctx, options);

  insertRowCol(ctx, {
    type,
    index,
    count,
    direction,
    id: sheet.id!,
  });
}

export function deleteRowOrColumn(
  ctx: Context,
  type: "row" | "column",
  start: number,
  end: number,
  options: CommonOptions = {}
) {
  if (
    !["row", "column"].includes(type) ||
    !_.isNumber(start) ||
    !_.isNumber(end)
  ) {
    throw INVALID_PARAMS;
  }

  const sheet = getSheet(ctx, options);

  deleteRowCol(ctx, { type, start, end, id: sheet.id! });
}

export function setRowHeight(
  ctx: Context,
  rowInfo: Record<string, number>,
  options: CommonOptions = {}
) {
  if (!_.isPlainObject(rowInfo)) {
    throw INVALID_PARAMS;
  }

  const sheet = getSheet(ctx, options);

  const cfg = sheet.config || {};
  if (cfg.rowlen == null) {
    cfg.rowlen = {};
  }

  _.forEach(rowInfo, (len, r) => {
    if (Number(r) >= 0) {
      if (Number(len) >= 0) {
        cfg.rowlen![Number(r)] = Number(len);
      }
    }
  });

  sheet.config = cfg;

  if (ctx.currentSheetId === sheet.id) {
    ctx.config = cfg;
  }

  // server.saveParam("cg", file.id, cfg.rowlen, { k: "rowlen" });
}

export function setColumnWidth(
  ctx: Context,
  columnInfo: Record<string, number>,
  options: CommonOptions = {}
) {
  if (!_.isPlainObject(columnInfo)) {
    throw INVALID_PARAMS;
  }

  const sheet = getSheet(ctx, options);

  const cfg = sheet.config || {};
  if (cfg.columnlen == null) {
    cfg.columnlen = {};
  }

  _.forEach(columnInfo, (len, c) => {
    if (Number(c) >= 0) {
      if (Number(len) >= 0) {
        cfg.columnlen![Number(c)] = Number(len);
      }
    }
  });

  sheet.config = cfg;

  if (ctx.currentSheetId === sheet.id) {
    ctx.config = cfg;
  }

  // server.saveParam("cg", file.id, cfg.columnlen, { k: "columnlen" });
}

export function getRowHeight(
  ctx: Context,
  rows: number[],
  options: CommonOptions = {}
) {
  if (!_.isArray(rows) || rows.length === 0) {
    throw INVALID_PARAMS;
  }

  const sheet = getSheet(ctx, options);

  const cfg = sheet.config || {};
  const rowlen = cfg.rowlen || {};

  const rowlenObj: Record<number, number> = {};

  rows.forEach((item) => {
    if (Number(item) >= 0) {
      const size = rowlen[Number(item)] || ctx.defaultrowlen;
      rowlenObj[Number(item)] = size;
    }
  });

  return rowlenObj;
}

export function getColumnWidth(
  ctx: Context,
  columns: number[],
  options: CommonOptions = {}
) {
  if (!_.isArray(columns) || columns.length === 0) {
    throw INVALID_PARAMS;
  }

  const sheet = getSheet(ctx, options);

  const cfg = sheet.config || {};
  const columnlen = cfg.columnlen || {};

  const columnlenObj: Record<number, number> = {};

  columns.forEach((item) => {
    if (Number(item) >= 0) {
      const size = columnlen[Number(item)] || ctx.defaultcollen;
      columnlenObj[Number(item)] = size;
    }
  });

  return columnlenObj;
}
