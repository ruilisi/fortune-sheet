import { contextFactory, selectionFactory } from "../factories/context";
import { getFlowdata } from "../../src/context";
import {
  handleBold,
  handleItalic,
  handleStrikeThrough,
  handleUnderline,
} from "../../src/modules/toolbar";

describe("font style", () => {
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
      luckysheetCellUpdate: [],
      luckysheetfile: [
        {
          id: "id_1",
          data: [[{ v: "abc" }]],
        },
      ],
    });

  test("bold and cancel bold", async () => {
    const cellInput = document.createElement("div");
    const ctx = getContext();
    handleBold(ctx, cellInput);
    expect(getFlowdata(ctx)[0][0]).toEqual({ bl: 1, v: "abc" });
    handleBold(ctx, cellInput);
    expect(getFlowdata(ctx)[0][0]).toEqual({ bl: 0, v: "abc" });
  });

  test("italic and cancel italic", async () => {
    const cellInput = document.createElement("div");
    const ctx = getContext();
    handleItalic(ctx, cellInput);
    expect(getFlowdata(ctx)[0][0]).toEqual({ it: 1, v: "abc" });
    handleItalic(ctx, cellInput);
    expect(getFlowdata(ctx)[0][0]).toEqual({ it: 0, v: "abc" });
  });

  test("strikethrough and cancel strikethrough", async () => {
    const cellInput = document.createElement("div");
    const ctx = getContext();
    handleStrikeThrough(ctx, cellInput);
    expect(getFlowdata(ctx)[0][0]).toEqual({ cl: 1, v: "abc" });
    handleStrikeThrough(ctx, cellInput);
    expect(getFlowdata(ctx)[0][0]).toEqual({ cl: 0, v: "abc" });
  });

  test("underline and cancel underline", async () => {
    const cellInput = document.createElement("div");
    const ctx = getContext();
    handleUnderline(ctx, cellInput);
    expect(getFlowdata(ctx)[0][0]).toEqual({ un: 1, v: "abc" });
    handleUnderline(ctx, cellInput);
    expect(getFlowdata(ctx)[0][0]).toEqual({ un: 0, v: "abc" });
  });

  test("bold and undeline", async () => {
    const cellInput = document.createElement("div");
    const ctx = getContext();
    handleBold(ctx, cellInput);
    handleUnderline(ctx, cellInput);
    expect(getFlowdata(ctx)[0][0]).toEqual({ un: 1, bl: 1, v: "abc" });
  });
});
