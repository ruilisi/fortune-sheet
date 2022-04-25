import { getFlowdata } from "../../context";
import { autoSelectionFormula } from "../../modules/toolbar";

describe("auto formula", () => {
  const getContext = () => ({
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
  });

  test("sum", async () => {
    const cellInput = document.createElement("div");
    const context = getContext();
    autoSelectionFormula(context, cellInput, "SUM");
    const flowdata = getFlowdata(context);
    expect(flowdata[0][2].v).toBe(70);
    expect(flowdata[1][2].v).toBe(80);
    expect(flowdata[2][0].v).toBe(60);
    expect(flowdata[2][1].v).toBe(90);
  });
});
