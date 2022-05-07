import { contextFactory, selectionFactory } from "../factories/context";
import {
  getCellValue,
  setCellValue,
  clearCell,
  setCellFormat,
} from "../../src/api/cell";

describe("cell", () => {
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
      luckysheetfile: [
        {
          id: "id_1",
          data: [
            [null, null],
            [
              { m: "5", v: "5", f: "=SUM(A1:B1)", spl: "##" },
              { m: "5", v: "5", it: 1, fc: "#ff0" },
            ],
          ],
        },
        {
          id: "id_2",
          data: [
            [null, null],
            [null, { m: "4", v: "4", bl: 0, bg: "#ff0" }],
          ],
        },
      ],
    });

  test("getCellValue", async () => {
    const ctx = getContext();
    [
      { v: "5" },
      { t: "v", v: "5" },
      { id: "id_2", v: "4" },
      { id: "id_2", t: "v", v: "4" },
      { id: "id_1", t: "it", v: 1 },
      { id: "id_1", t: "fc", v: "#ff0" },
      { id: "id_2", t: "bl", v: 0 },
      { id: "id_2", t: "bg", v: "#ff0" },
    ].forEach((k) => {
      expect(getCellValue(ctx, 1, 1, { id: k.id, type: k.t })).toBe(k.v);
    });
  });

  test("setCellValue", async () => {
    const ctx = getContext();
    const cellInput = document.createElement("div");
    [
      { v: 6, rs: 6, id: "id_1" },
      { v: 66, rs: 66, id: "id_2" },
    ].forEach((item) => {
      setCellValue(ctx, 1, 1, item.v, cellInput, { id: item.id });
      expect(getCellValue(ctx, 1, 1, { id: item.id, type: "v" })).toBe(item.rs);
    });
  });

  test("clearCell", async () => {
    const ctx = getContext();
    clearCell(ctx, 1, 0, { id: "id_1" });
    expect(ctx.luckysheetfile[0].data[1][0]).toEqual({});
  });

  test("setCellFormat", async () => {
    const ctx = getContext();
    setCellFormat(ctx, 0, 0, "bl", 1, { id: "id_1" });
    setCellFormat(ctx, 0, 0, "bg", "#ff0", { id: "id_1" });
    setCellFormat(ctx, 0, 0, "ct", { fa: "General", t: "n" }, { id: "id_1" });
    expect(ctx.luckysheetfile[0].data[0][0]).toEqual({
      bg: "#ff0",
      bl: 1,
      ct: { fa: "General", t: "n" },
    });
  });
});
