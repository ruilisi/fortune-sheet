import { getFlowdata } from "../../context";
import {
  handleCurrencyFormat,
  handleNumberDecrease,
  handleNumberIncrease,
  handlePercentageFormat,
} from "../../modules/toolbar";

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
  test("currency", async () => {
    handleCurrencyFormat(context, cellInput);
    const flowdata = getFlowdata(context);
    expect(flowdata[1][1].m).toBe("¥ 5.00");
  });
  test("percentage", async () => {
    handlePercentageFormat(context, cellInput);
    const flowdata = getFlowdata(context);
    expect(flowdata[1][1].m).toBe("500.00%");
  });
  test("number decrease", async () => {
    handleNumberDecrease(context, cellInput);
    const flowdata = getFlowdata(context);
    expect(flowdata[1][1].m).toBe("500.0%");
  });
  test("number increase", async () => {
    handleNumberIncrease(context, cellInput);
    const flowdata = getFlowdata(context);
    expect(flowdata[1][1].m).toBe("500.00%");
  });
});
