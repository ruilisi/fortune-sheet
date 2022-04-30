import {
  handleCurrencyFormat,
  handleNumberDecrease,
  handleNumberIncrease,
  handlePercentageFormat,
} from "../../src/modules/toolbar";
import { contextFactory, selectionFactory } from "../factories/context";
import { getFlowdata } from "../../src/context";

describe("number format", () => {
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([1, 1], [1, 1], 1, 1),
      luckysheetfile: [
        {
          index: "index_1",
          data: [
            [null, null],
            [null, { m: "5", v: "5" }],
          ],
        },
      ],
    });
  const cellInput = document.createElement("div");
  const ctx = getContext();

  test("currency", async () => {
    handleCurrencyFormat(ctx, cellInput);
    const flowdata = getFlowdata(ctx);
    expect(flowdata[1][1].m).toBe("¥ 5.00");
  });

  test("percentage", async () => {
    handlePercentageFormat(ctx, cellInput);
    const flowdata = getFlowdata(ctx);
    expect(flowdata[1][1].m).toBe("500.00%");
  });

  test("number decrease", async () => {
    handleNumberDecrease(ctx, cellInput);
    const flowdata = getFlowdata(ctx);
    expect(flowdata[1][1].m).toBe("500.0%");
  });

  test("number increase", async () => {
    handleNumberIncrease(ctx, cellInput);
    const flowdata = getFlowdata(ctx);
    expect(flowdata[1][1].m).toBe("500.00%");
  });
});
