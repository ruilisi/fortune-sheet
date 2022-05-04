import { contextFactory, selectionFactory } from "../factories/context";
import { handleFreeze } from "../../src/modules/toolbar";

describe("freeze", () => {
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 1], [0, 1], 1, 1),
      luckysheetfile: [{ id: "id_1" }],
    });

  test("freeze row and cancel", async () => {
    const ctx = getContext();
    handleFreeze(ctx, "freeze-row");
    expect(ctx.luckysheetfile[0].frozen.range).toEqual({
      column_focus: 1,
      row_focus: 1,
    });
    expect(ctx.luckysheetfile[0].frozen.type).toEqual("rangeRow");
    handleFreeze(ctx, "freeze-cancel");
    expect(ctx.luckysheetfile[0].frozen).toBeUndefined();
  });

  test("freeze column and cancel", async () => {
    const ctx = getContext();
    handleFreeze(ctx, "freeze-col");
    expect(ctx.luckysheetfile[0].frozen.range).toEqual({
      column_focus: 1,
      row_focus: 1,
    });
    expect(ctx.luckysheetfile[0].frozen.type).toEqual("rangeColumn");
    handleFreeze(ctx, "freeze-cancel");
    expect(ctx.luckysheetfile[0].frozen).toBeUndefined();
  });
  test("freeze both and cancel", async () => {
    const ctx = getContext();
    handleFreeze(ctx, "both");
    expect(ctx.luckysheetfile[0].frozen.range).toEqual({
      column_focus: 1,
      row_focus: 1,
    });
    expect(ctx.luckysheetfile[0].frozen.type).toEqual("both");
    handleFreeze(ctx, "freeze-cancel");
    expect(ctx.luckysheetfile[0].frozen).toBeUndefined();
  });

  test("freeze column and then freeze row", async () => {
    const ctx = getContext();
    handleFreeze(ctx, "freeze-col");
    handleFreeze(ctx, "freeze-row");
    expect(ctx.luckysheetfile[0].frozen.range).toEqual({
      column_focus: 1,
      row_focus: 1,
    });
    expect(ctx.luckysheetfile[0].frozen.type).toEqual("rangeRow");
  });

  test("freeze column and then freeze both", async () => {
    const ctx = getContext();
    handleFreeze(ctx, "freeze-col");
    handleFreeze(ctx, "both");
    expect(ctx.luckysheetfile[0].frozen.range).toEqual({
      column_focus: 1,
      row_focus: 1,
    });
    expect(ctx.luckysheetfile[0].frozen.type).toEqual("both");
  });
});
