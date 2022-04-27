import { handleFreeze } from "../../modules/toolbar";

describe("freeze", () => {
  const getContext = () => ({
    currentSheetIndex: "index_1",
    allowEdit: true,
    luckysheet_select_save: [
      {
        row_focus: 1,
        column_focus: 1,
      },
    ],
    luckysheetfile: [{ index: "index_1" }],
  });
  test("freeze row and cancel", async () => {
    const context = getContext();
    handleFreeze(context, "freeze-row");
    expect(context.luckysheetfile[0].frozen.range).toEqual({
      column_focus: 1,
      row_focus: 1,
    });
    expect(context.luckysheetfile[0].frozen.type).toEqual("rangeRow");
    handleFreeze(context, "freeze-cancel");
    expect(context.luckysheetfile[0].frozen).toBeUndefined();
  });
  test("freeze column and cancel", async () => {
    const context = getContext();
    handleFreeze(context, "freeze-col");
    expect(context.luckysheetfile[0].frozen.range).toEqual({
      column_focus: 1,
      row_focus: 1,
    });
    expect(context.luckysheetfile[0].frozen.type).toEqual("rangeColumn");
    handleFreeze(context, "freeze-cancel");
    expect(context.luckysheetfile[0].frozen).toBeUndefined();
  });
  test("freeze both and cancel", async () => {
    const context = getContext();
    handleFreeze(context, "both");
    expect(context.luckysheetfile[0].frozen.range).toEqual({
      column_focus: 1,
      row_focus: 1,
    });
    expect(context.luckysheetfile[0].frozen.type).toEqual("both");
    handleFreeze(context, "freeze-cancel");
    expect(context.luckysheetfile[0].frozen).toBeUndefined();
  });
  test("freeze column and then freeze row", async () => {
    const context = getContext();
    handleFreeze(context, "freeze-col");
    handleFreeze(context, "freeze-row");
    expect(context.luckysheetfile[0].frozen.range).toEqual({
      column_focus: 1,
      row_focus: 1,
    });
    expect(context.luckysheetfile[0].frozen.type).toEqual("rangeRow");
  });
  test("freeze column and then freeze both", async () => {
    const context = getContext();
    handleFreeze(context, "freeze-col");
    handleFreeze(context, "both");
    expect(context.luckysheetfile[0].frozen.range).toEqual({
      column_focus: 1,
      row_focus: 1,
    });
    expect(context.luckysheetfile[0].frozen.type).toEqual("both");
  });
});
