import { contextFactory, selectionFactory } from "../factories/context";
import {
  getSelection,
  setSelection,
  setCellValuesByRange,
  setCellFormatByRange,
  getFlattenRange,
  getCellsByFlattenRange,
  getSelectionCoordinates,
  getCellsByRange,
  getHtmlByRange,
} from "../../src/api/range";

describe("range", () => {
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
    });

  test("getSelection", async () => {
    const ctx = getContext();
    ctx.luckysheet_select_save = [
      {
        row: [0, 0],
        column: [0, 1],
        row_focus: 0,
        column_focus: 0,
      },
      {
        row: [2, 3],
        column: [2, 3],
        row_focus: 2,
        column_focus: 2,
      },
    ];
    expect(getSelection(ctx)).toEqual([
      { row: [0, 0], column: [0, 1] },
      { row: [2, 3], column: [2, 3] },
    ]);
  });

  test("getFlattenRange", async () => {
    const ctx = getContext();
    const result = getFlattenRange(ctx, [
      { row: [0, 0], column: [0, 1] },
      { row: [2, 3], column: [2, 3] },
    ]);
    expect(result.length).toBe(6);
  });

  test("getCellsByFlattenRange", async () => {
    const ctx = getContext();
    ctx.luckysheetfile[0].data = [
      [{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }],
      [{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }],
      [{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }],
      [{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }],
    ];
    const range = getFlattenRange(ctx, [
      { row: [0, 0], column: [0, 1] },
      { row: [2, 3], column: [2, 3] },
    ]);
    const result = getCellsByFlattenRange(ctx, range);
    expect(result).toEqual([
      { v: 1 },
      { v: 2 },
      { v: 3 },
      { v: 4 },
      { v: 3 },
      { v: 4 },
    ]);
  });

  test("getSelectionCoordinates", async () => {
    const ctx = getContext();
    ctx.luckysheet_select_save = [
      { row: [0, 0], column: [0, 1] },
      { row: [2, 3], column: [2, 3] },
    ];
    const result = getSelectionCoordinates(ctx);
    expect(result).toEqual(["A1:B1", "C3:D4"]);
  });

  test("getCellsByRange", async () => {
    const ctx = getContext();
    ctx.luckysheetfile[0].data[0][0] = { v: 66 };
    expect(getCellsByRange(ctx)).toEqual([[{ v: 66 }]]);
  });

  test("getHtmlByRange", async () => {
    const ctx = getContext();
    expect(getHtmlByRange(ctx)).toBe(
      '<table data-type="fortune-copy-action-table"></table>'
    );
  });

  test("setSelection", async () => {
    const ctx = getContext();
    setSelection(ctx, [
      { row: [0, 0], column: [0, 1] },
      { row: [2, 3], column: [2, 3] },
    ]);
    expect(ctx.luckysheet_select_save[0]).toMatchObject({
      row: [0, 0],
      column: [0, 1],
    });
    expect(ctx.luckysheet_select_save[1]).toMatchObject({
      row: [2, 3],
      column: [2, 3],
    });
  });

  test("setCellValuesByRange", async () => {
    const ctx = getContext();
    const expectedData = [
      [2, 3],
      [5, 7],
    ];
    setCellValuesByRange(
      ctx,
      expectedData,
      { row: [1, 2], column: [1, 2] },
      null,
      { id: "id_2" }
    );
    expect(ctx.luckysheetfile[1].data[2][2].v).toBe(7);
    expect(ctx.luckysheetfile[1].data[1][2].v).toBe(3);
  });

  test("setCellFormatByRange", async () => {
    const ctx = getContext();
    setCellFormatByRange(
      ctx,
      "bg",
      "#f00",
      { row: [1, 2], column: [1, 2] },
      { id: "id_2" }
    );
    expect(ctx.luckysheetfile[1].data[2][2]).toEqual({ bg: "#f00" });
    expect(ctx.luckysheetfile[1].data[2][1]).toEqual({ bg: "#f00" });
  });
});
