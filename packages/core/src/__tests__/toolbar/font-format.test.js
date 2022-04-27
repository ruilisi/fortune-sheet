import { getFlowdata } from "../..";
import {
  handleBold,
  handleItalic,
  handleStrikeThrough,
  handleUnderline,
} from "../../modules/toolbar";

describe("font style", () => {
  const getContext = () => ({
    currentSheetIndex: "index_1",
    allowEdit: true,
    config: {},
    luckysheet_select_save: [
      {
        row: [0, 0],
        column: [0, 0],
      },
    ],
    luckysheetfile: [
      {
        index: "index_1",
        data: [[{ v: "abc" }]],
        length: 1,
      },
    ],
  });

  test("bold and cancel bold", async () => {
    const cellInput = document.createElement("div");
    const context = getContext();
    handleBold(context, cellInput);
    expect(getFlowdata(context)[0][0]).toEqual({ bl: 1, v: "abc" });
    handleBold(context, cellInput);
    expect(getFlowdata(context)[0][0]).toEqual({ bl: 0, v: "abc" });
  });
  test("italic and cancel italic", async () => {
    const cellInput = document.createElement("div");
    const context = getContext();
    handleItalic(context, cellInput);
    expect(getFlowdata(context)[0][0]).toEqual({ it: 1, v: "abc" });
    handleItalic(context, cellInput);
    expect(getFlowdata(context)[0][0]).toEqual({ it: 0, v: "abc" });
  });
  test("strikethrough and cancel strikethrough", async () => {
    const cellInput = document.createElement("div");
    const context = getContext();
    handleStrikeThrough(context, cellInput);
    expect(getFlowdata(context)[0][0]).toEqual({ cl: 1, v: "abc" });
    handleStrikeThrough(context, cellInput);
    expect(getFlowdata(context)[0][0]).toEqual({ cl: 0, v: "abc" });
  });
  test("underline and cancel underline", async () => {
    const cellInput = document.createElement("div");
    const context = getContext();
    handleUnderline(context, cellInput);
    expect(getFlowdata(context)[0][0]).toEqual({ un: 1, v: "abc" });
    handleUnderline(context, cellInput);
    expect(getFlowdata(context)[0][0]).toEqual({ un: 0, v: "abc" });
  });
  test("bold and undeline", async () => {
    const cellInput = document.createElement("div");
    const context = getContext();
    handleBold(context, cellInput);
    handleUnderline(context, cellInput);
    expect(getFlowdata(context)[0][0]).toEqual({ un: 1, bl: 1, v: "abc" });
  });
});
