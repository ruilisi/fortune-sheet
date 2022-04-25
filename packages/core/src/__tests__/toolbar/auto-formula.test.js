import { getFlowdata } from "../../context";
import { autoSelectionFormula } from "../../modules/toolbar";

function expectValuesInPositions(flowdata, expectValues, expectPositions) {
  if (expectPositions.length !== expectValues.length) {
    console.error(
      "The number of expectPositions does not equal to the number of expectValues"
    );
    return;
  }
  for (let i = 0; i < expectPositions.length; i += 1) {
    const x = expectPositions[i][0];
    const y = expectPositions[i][1];
    expect(flowdata[x][y].v).toBe(expectValues[i]);
  }
}
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
          [{ v: "30", ct: { t: "n" } }, { v: "40", ct: { t: "n" } }, null],
          [{ v: "30", ct: { t: "n" } }, { v: "50", ct: { t: "n" } }, null],
          [null, null, null],
        ],
        length: 1,
      },
    ],
  });
  const expectPositions = [
    [0, 2],
    [1, 2],
    [2, 0],
    [2, 1],
  ];

  test("sum", async () => {
    const cellInput = document.createElement("div");
    const context = getContext();
    autoSelectionFormula(context, cellInput, "SUM");
    expectValuesInPositions(
      getFlowdata(context),
      [70, 80, 60, 90],
      expectPositions
    );
  });
  test("min", async () => {
    const cellInput = document.createElement("div");
    const context = getContext();
    autoSelectionFormula(context, cellInput, "MIN");
    expectValuesInPositions(
      getFlowdata(context),
      [30, 30, 30, 40],
      expectPositions
    );
  });
  test("max", async () => {
    const cellInput = document.createElement("div");
    const context = getContext();
    autoSelectionFormula(context, cellInput, "max");
    expectValuesInPositions(
      getFlowdata(context),
      [40, 50, 30, 50],
      expectPositions
    );
  });
  test("average", async () => {
    const cellInput = document.createElement("div");
    const context = getContext();
    autoSelectionFormula(context, cellInput, "AVERAGE");
    expectValuesInPositions(
      getFlowdata(context),
      [35, 40, 30, 45],
      expectPositions
    );
  });
  test("count", async () => {
    const cellInput = document.createElement("div");
    const context = getContext();
    autoSelectionFormula(context, cellInput, "COUNT");
    expectValuesInPositions(
      getFlowdata(context),
      [2, 2, 2, 2],
      expectPositions
    );
  });
});
