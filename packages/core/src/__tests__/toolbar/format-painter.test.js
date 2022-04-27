import { getFlowdata } from "../../context";
import { handleFormatPainter } from "../../modules/toolbar";
import { pasteHandlerOfPaintModel } from "../../modules/selection";

describe("format painter", () => {
  const getContext = (cell) => ({
    currentSheetIndex: "index_1",
    allowEdit: true,
    config: {},
    luckysheet_select_save: [{ row: [0, 0], column: [0, 0] }],
    luckysheetfile: [
      {
        index: "index_1",
        data: [
          [cell, null],
          [null, null],
        ],
        length: 1,
      },
    ],
  });
  const new_select_save_cell = [{ row: [1, 1], column: [1, 1] }];
  const new_select_save_range = [{ row: [1, 1], column: [0, 1] }];
  test("background color", async () => {
    const expectedCell = { v: null, bg: "#f00" };
    const context = getContext(expectedCell);

    handleFormatPainter(context);
    context.luckysheet_select_save = new_select_save_cell;
    pasteHandlerOfPaintModel(context, context.luckysheet_copy_save);
    expect(getFlowdata(context)[1][1]).toEqual(expectedCell);
  });
  test("text color", async () => {
    const expectedCell = { v: null, fc: "#f00" };
    const context = getContext(expectedCell);

    handleFormatPainter(context);
    context.luckysheet_select_save = new_select_save_cell;
    pasteHandlerOfPaintModel(context, context.luckysheet_copy_save);
    expect(getFlowdata(context)[1][1]).toEqual(expectedCell);
  });
  test("font size", async () => {
    const expectedCell = { v: null, fs: 16 };
    const context = getContext(expectedCell);

    handleFormatPainter(context);
    context.luckysheet_select_save = new_select_save_cell;
    pasteHandlerOfPaintModel(context, context.luckysheet_copy_save);
    expect(getFlowdata(context)[1][1]).toEqual(expectedCell);
  });
  test("bold", async () => {
    const expectedCell = { v: null, bl: 1 };
    const context = getContext(expectedCell);

    handleFormatPainter(context);
    context.luckysheet_select_save = new_select_save_cell;
    pasteHandlerOfPaintModel(context, context.luckysheet_copy_save);
    expect(getFlowdata(context)[1][1]).toEqual(expectedCell);
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
    const context = getContext(expectedCell);

    handleFormatPainter(context);
    context.luckysheet_select_save = new_select_save_cell;
    pasteHandlerOfPaintModel(context, context.luckysheet_copy_save);
    expect(getFlowdata(context)[1][1]).toEqual(expectedCell);
  });
  test("background color in multiple cells", async () => {
    const expectedCell = { v: null, bg: "#f00" };
    const context = getContext(expectedCell);

    handleFormatPainter(context);
    context.luckysheet_select_save = new_select_save_range;
    pasteHandlerOfPaintModel(context, context.luckysheet_copy_save);
    expect(getFlowdata(context)[1][0]).toEqual(expectedCell);
    expect(getFlowdata(context)[1][1]).toEqual(expectedCell);
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
    const context = getContext(expectedCell);

    handleFormatPainter(context);
    context.luckysheet_select_save = new_select_save_range;
    pasteHandlerOfPaintModel(context, context.luckysheet_copy_save);
    expect(getFlowdata(context)[1][0]).toEqual(expectedCell);
    expect(getFlowdata(context)[1][1]).toEqual(expectedCell);
  });
});
