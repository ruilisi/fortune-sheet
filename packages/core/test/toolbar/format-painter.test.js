import { getFlowdata } from "../../src/context";
import { handleFormatPainter } from "../../src/modules/toolbar";
import { pasteHandlerOfPaintModel } from "../../src/modules/selection";
import { contextFactory, selectionFactory } from "../factories/context";

describe("format painter", () => {
  const getContext = (cell) =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
      luckysheetfile: [
        {
          id: "id_1",
          data: [
            [cell, null],
            [null, null],
          ],
        },
      ],
    });
  const new_select_save_cell = [{ row: [1, 1], column: [1, 1] }];
  const new_select_save_range = [{ row: [1, 1], column: [0, 1] }];

  test("background color", async () => {
    const expectedCell = { v: null, bg: "#f00" };
    const ctx = getContext(expectedCell);

    handleFormatPainter(ctx);
    ctx.luckysheet_select_save = new_select_save_cell;
    pasteHandlerOfPaintModel(ctx, ctx.luckysheet_copy_save);
    expect(getFlowdata(ctx)[1][1]).toEqual(expectedCell);
  });

  test("text color", async () => {
    const expectedCell = { v: null, fc: "#f00" };
    const ctx = getContext(expectedCell);

    handleFormatPainter(ctx);
    ctx.luckysheet_select_save = new_select_save_cell;
    pasteHandlerOfPaintModel(ctx, ctx.luckysheet_copy_save);
    expect(getFlowdata(ctx)[1][1]).toEqual(expectedCell);
  });

  test("font size", async () => {
    const expectedCell = { v: null, fs: 16 };
    const ctx = getContext(expectedCell);

    handleFormatPainter(ctx);
    ctx.luckysheet_select_save = new_select_save_cell;
    pasteHandlerOfPaintModel(ctx, ctx.luckysheet_copy_save);
    expect(getFlowdata(ctx)[1][1]).toEqual(expectedCell);
  });

  test("bold", async () => {
    const expectedCell = { v: null, bl: 1 };
    const ctx = getContext(expectedCell);

    handleFormatPainter(ctx);
    ctx.luckysheet_select_save = new_select_save_cell;
    pasteHandlerOfPaintModel(ctx, ctx.luckysheet_copy_save);
    expect(getFlowdata(ctx)[1][1]).toEqual(expectedCell);
  });

  test("background,text color,font size and italic", async () => {
    const expectedCell = {
      fs: 18,
      bl: 0,
      it: 1,
      fc: "#ff0",
      bg: "#0ff",
      v: null,
    };
    const ctx = getContext(expectedCell);

    handleFormatPainter(ctx);
    ctx.luckysheet_select_save = new_select_save_cell;
    pasteHandlerOfPaintModel(ctx, ctx.luckysheet_copy_save);
    expect(getFlowdata(ctx)[1][1]).toEqual(expectedCell);
  });

  test("background color in multiple cells", async () => {
    const expectedCell = { v: null, bg: "#f00" };
    const ctx = getContext(expectedCell);

    handleFormatPainter(ctx);
    ctx.luckysheet_select_save = new_select_save_range;
    pasteHandlerOfPaintModel(ctx, ctx.luckysheet_copy_save);
    expect(getFlowdata(ctx)[1][0]).toEqual(expectedCell);
    expect(getFlowdata(ctx)[1][1]).toEqual(expectedCell);
  });

  test("background,text color,font size and italic in multiple cells", async () => {
    const expectedCell = {
      fs: 18,
      bl: 0,
      it: 1,
      fc: "#ff0",
      bg: "#0ff",
      v: null,
    };
    const ctx = getContext(expectedCell);

    handleFormatPainter(ctx);
    ctx.luckysheet_select_save = new_select_save_range;
    pasteHandlerOfPaintModel(ctx, ctx.luckysheet_copy_save);
    expect(getFlowdata(ctx)[1][0]).toEqual(expectedCell);
    expect(getFlowdata(ctx)[1][1]).toEqual(expectedCell);
  });

  test("first line", async () => {
    const expectedCell = { v: null, bg: "#f00" };
    const ctx = getContext(expectedCell);

    handleFormatPainter(ctx);
    ctx.luckysheet_select_save = [{ row: [0, 0], column: [1, 1] }];
    pasteHandlerOfPaintModel(ctx, ctx.luckysheet_copy_save);
    expect(getFlowdata(ctx)[0][1]).toEqual(expectedCell);
  });
});
