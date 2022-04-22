import { getFlowdata } from "../context";
import {
  autoSelectionFormula,
  handleCurrencyFormat,
  handleNumberDecrease,
  handleNumberIncrease,
  handlePercentageFormat,
} from "./toolbar";

describe("number format", () => {
  const context = {
    currentSheetIndex: "index_1",
    allowEdit: true,
    config: {},
    luckysheet_select_save: [
      {
        row: [1, 1],
        column: [1, 1],
        row_focus: 1,
        column_focus: 1,
      },
    ],
    luckysheetfile: [
      {
        index: "index_1",
        data: [
          [null, null],
          [null, { m: "5", v: "5" }],
        ],
        length: 1,
      },
    ],
  };
  const cellInput = document.createElement("div");
  test("for currency format", async () => {
    handleCurrencyFormat(context, cellInput);
    const flowdata = getFlowdata(context);
    expect(flowdata[1][1].m).toBe("¥ 5.00");
  });
  test("for percentage format", async () => {
    handlePercentageFormat(context, cellInput);
    const flowdata = getFlowdata(context);
    expect(flowdata[1][1].m).toBe("500.00%");
  });
  test("for numberdecrease format", async () => {
    handleNumberDecrease(context, cellInput);
    const flowdata = getFlowdata(context);
    expect(flowdata[1][1].m).toBe("500.0%");
  });
  test("for numberincrease format", async () => {
    handleNumberIncrease(context, cellInput);
    const flowdata = getFlowdata(context);
    expect(flowdata[1][1].m).toBe("500.00%");
  });
});

describe("test for auto selection formula", () => {
  const context = {
    currentSheetIndex: "index_1",
    allowEdit: true,
    config: {},
    luckysheet_select_save: [
      {
        row: [0, 1],
        column: [0, 1],
      },
    ],
    luckysheetfile: [
      {
        index: "index_1",
        data: [
          [{ v: "30" }, { v: "40" }, null],
          [{ v: "30" }, { v: "50" }, null],
          [null, null, null],
        ],
        length: 1,
      },
    ],
  };
  const cellInput = document.createElement("div");
  test("for sum", async () => {
    autoSelectionFormula(context, cellInput, "SUM");
    const flowdata = getFlowdata(context);
    expect(flowdata[0][2].v).toBe(70);
    expect(flowdata[1][2].v).toBe(80);
    expect(flowdata[2][0].v).toBe(60);
    expect(flowdata[2][1].v).toBe(90);
  });
});
