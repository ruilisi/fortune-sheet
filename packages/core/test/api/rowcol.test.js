import _ from "lodash";
import { contextFactory, selectionFactory } from "../factories/context";
import {
  freeze,
  insertRowOrColumn,
  deleteRowOrColumn,
  setRowHeight,
  setColumnWidth,
  getRowHeight,
  getColumnWidth,
} from "../../src/api/rowcol";

describe("rowcol", () => {
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
    });

  test("freeze", () => {
    [
      { t: "both", rs: "rangeBoth" },
      { t: "row", rs: "rangeRow" },
      { t: "column", rs: "rangeColumn" },
    ].forEach((item) => {
      const ctx = getContext();
      freeze(ctx, item.t, { row: 2, column: 2 }, { id: "id_2" });
      expect(ctx.luckysheetfile[1].frozen.range).toEqual({
        column_focus: 2,
        row_focus: 2,
      });
      expect(ctx.luckysheetfile[1].frozen.type).toBe(item.rs);
    });
  });

  test("insertRowOrColumn", () => {
    [
      { t: "row", i: 1, c: 1, d: "lefttop" },
      { t: "row", i: 1, c: 2, d: "lefttop" },
      { t: "row", i: 2, c: 3, d: "rightbottom" },
      { t: "row", i: 3, c: 3, d: "rightbottom" },
      { t: "column", i: 1, c: 1, d: "lefttop" },
      { t: "column", i: 2, c: 3, d: "rightbottom" },
    ].forEach((k) => {
      const ctx = getContext();
      ctx.defaultCell = { v: "inserted" };
      insertRowOrColumn(ctx, k.t, k.i, k.c, k.d, { id: "id_1" });
      for (let i = 0; i < k.c; i += 1) {
        for (let j = 0; j < 4; j += 1) {
          let l = 0;
          if (k.d === "rightbottom") {
            l += 1;
          }
          let receivedValue;
          if (k.t === "row") {
            receivedValue = ctx.luckysheetfile[0].data[k.i + i + l][j];
          } else {
            receivedValue = ctx.luckysheetfile[0].data[j][k.i + i + l];
          }
          expect(receivedValue).toEqual({ v: "inserted" });
        }
      }
    });
  });

  test("deleteRowOrColumn", () => {
    const ctx = getContext();
    const rawDataFirst = () => [
      [{ v: 66 }, { v: 12 }, { v: 18 }, { v: 92 }, { v: 45 }],
      [{ v: 67 }, { v: 13 }, { v: 19 }, { v: 2 }, { v: 45 }],
      [{ v: 68 }, { v: 14 }, { v: 11 }, { v: 9 }, { v: 45 }],
      [{ v: 69 }, { v: 15 }, { v: 12 }, { v: 1 }, { v: 45 }],
      [{ v: 69 }, { v: 15 }, { v: 12 }, { v: 1 }, { v: 45 }],
    ];
    const rawDataSecond = () => [
      [{ v: 66 }, { v: 12 }],
      [{ v: 67 }, { v: 13 }],
      [{ v: 68 }, { v: 14 }],
      [{ v: 69 }, { v: 15 }],
    ];
    [
      { type: "row", start: 0, end: 0, rawData: rawDataFirst },
      { type: "row", start: 1, end: 2, rawData: rawDataFirst },
      { type: "row", start: 0, end: 3, rawData: rawDataFirst },
      { type: "column", start: 1, end: 3, rawData: rawDataFirst },
      { type: "column", start: 1, end: 1, rawData: rawDataFirst },
      { type: "row", start: 1, end: 3, rawData: rawDataSecond },
      { type: "column", start: 1, end: 1, rawData: rawDataSecond },
    ].forEach((k) => {
      ctx.luckysheetfile[0].data = k.rawData();
      deleteRowOrColumn(ctx, k.type, k.start, k.end);
      _.range(0, k.rawData().length).forEach((i) => {
        _.range(0, k.rawData()[0].length).forEach((j) => {
          let expectedValue;
          if (k.type === "row") {
            expectedValue = () => {
              if (i < k.start) return k.rawData()[i][j];
              if (i >= k.start && i <= k.start + k.rawData().length - 2 - k.end)
                return k.rawData()[i + k.end - k.start + 1][j];
              return null;
            };
          } else {
            expectedValue = () => {
              if (j < k.start) return k.rawData()[i][j];
              if (
                j >= k.start &&
                j <= k.start + k.rawData()[0].length - 2 - k.end
              )
                return k.rawData()[i][j + k.end - k.start + 1];
              return null;
            };
          }
          expect(ctx.luckysheetfile[0].data[i][j]).toEqual(expectedValue());
        });
      });
    });
  });

  test("setRowHeight", () => {
    const ctx = getContext();
    setRowHeight(ctx, { 2: 50 });
    setRowHeight(ctx, { 3: 100 }, { id: "id_1" });
    expect(ctx.config.rowlen).toEqual({ 3: 100, 2: 50 });
  });

  test("setColumnWidth", () => {
    const ctx = getContext();
    setColumnWidth(ctx, { 2: 50 });
    setColumnWidth(ctx, { 3: 100 }, { id: "id_1" });
    expect(ctx.config.columnlen).toEqual({ 3: 100, 2: 50 });
  });

  test("getRowHeight", () => {
    const ctx = getContext();
    setRowHeight(ctx, { 2: 50 });
    setRowHeight(ctx, { 3: 99 });
    setRowHeight(ctx, { 2: 100 }, { id: "id_2" });
    setRowHeight(ctx, { 3: 100 }, { id: "id_2" });
    expect(getRowHeight(ctx, [2, 3])).toEqual({ 3: 99, 2: 50 });
    expect(getRowHeight(ctx, [2, 3], { id: "id_2" })).toEqual({
      3: 100,
      2: 100,
    });
  });

  test("getColumnWidth", () => {
    const ctx = getContext();
    setColumnWidth(ctx, { 2: 50 });
    setColumnWidth(ctx, { 3: 99 });
    setColumnWidth(ctx, { 2: 100 }, { id: "id_2" });
    setColumnWidth(ctx, { 3: 100 }, { id: "id_2" });
    expect(getColumnWidth(ctx, [2, 3])).toEqual({ 3: 99, 2: 50 });
    expect(getColumnWidth(ctx, [2, 3], { id: "id_2" })).toEqual({
      3: 100,
      2: 100,
    });
  });
});
