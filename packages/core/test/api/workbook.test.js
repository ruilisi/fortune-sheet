import { contextFactory, selectionFactory } from "../factories/context";
import {
  addSheet,
  deleteSheet,
  activateSheet,
  setSheetName,
  setSheetOrder,
  scroll,
} from "../../src/api/workbook";

describe("workbook", () => {
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
    });

  test("addSheet", () => {
    const ctx = getContext();
    const settings = { allowEdit: true, row: 60, column: 84 };
    settings.generateSheetId = () => "id_3";
    addSheet(ctx, settings);
    expect(ctx.luckysheetfile.length).toBe(3);
    expect(ctx.luckysheetfile[2].id).toBe("id_3");
  });

  test("deleteSheet", () => {
    const ctx = getContext();
    deleteSheet(ctx);
    expect(ctx.luckysheetfile.length).toBe(1);
    deleteSheet(ctx, { id: "id_2" });
    expect(ctx.luckysheetfile.length).toBe(0);
  });

  test("activateSheet", () => {
    const ctx = getContext();
    activateSheet(ctx);
    expect(ctx.currentSheetId).toBe("id_1");
    activateSheet(ctx, { id: "id_2" });
    expect(ctx.currentSheetId).toBe("id_2");
  });

  test("setSheetName", () => {
    const ctx = getContext();
    setSheetName(ctx, "winner");
    expect(ctx.luckysheetfile[0].name).toBe("winner");
    setSheetName(ctx, "winner", { id: "id_2" });
    expect(ctx.luckysheetfile[1].name).toBe("winner");
  });

  test("setSheetOrder", () => {
    const ctx = getContext();
    setSheetOrder(ctx, { id_1: 2, id_2: 1 });
    expect(ctx.luckysheetfile[0].order).toBe(1);
    expect(ctx.luckysheetfile[1].order).toBe(0);
    setSheetOrder(ctx, { id_1: 1, id_2: 2 });
    expect(ctx.luckysheetfile[0].order).toBe(0);
    expect(ctx.luckysheetfile[1].order).toBe(1);
  });

  test("scroll", () => {
    const ctx = getContext();
    const scrollbarX = document.createElement("div");
    scrollbarX.scrollLeft = 0;
    const scrollbarY = document.createElement("div");
    scrollbarX.scrollTop = 0;
    scroll(ctx, scrollbarX, scrollbarY, { targetRow: 2 });
    expect(scrollbarY.scrollTop).toBe(40);
    scroll(ctx, scrollbarX, scrollbarY, { targetColumn: 2 });
    expect(scrollbarX.scrollLeft).toBe(148);
    scroll(ctx, scrollbarX, scrollbarY, { scrollTop: 100 });
    expect(scrollbarY.scrollTop).toBe(100);
    scroll(ctx, scrollbarX, scrollbarY, { scrollLeft: 99 });
    expect(scrollbarX.scrollLeft).toBe(99);
  });
});
