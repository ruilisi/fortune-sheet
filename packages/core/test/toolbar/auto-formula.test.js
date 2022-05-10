/* eslint-disable jest/expect-expect */
import { contextFactory, selectionFactory } from "../factories/context";
import { getFlowdata } from "../../src/context";
import { autoSelectionFormula } from "../../src/modules/toolbar";

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
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 1], [0, 1], 0, 0),
      luckysheetfile: [
        {
          id: "id_1",
          data: [
            [{ v: "30", ct: { t: "n" } }, { v: "40", ct: { t: "n" } }, null],
            [{ v: "30", ct: { t: "n" } }, { v: "50", ct: { t: "n" } }, null],
            [null, null, null],
          ],
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
    const ctx = getContext();
    autoSelectionFormula(ctx, cellInput, "SUM");
    expectValuesInPositions(
      getFlowdata(ctx),
      [70, 80, 60, 90],
      expectPositions
    );
  });

  test("min", async () => {
    const cellInput = document.createElement("div");
    const ctx = getContext();
    autoSelectionFormula(ctx, cellInput, "MIN");
    expectValuesInPositions(
      getFlowdata(ctx),
      [30, 30, 30, 40],
      expectPositions
    );
  });

  test("max", async () => {
    const cellInput = document.createElement("div");
    const ctx = getContext();
    autoSelectionFormula(ctx, cellInput, "max");
    expectValuesInPositions(
      getFlowdata(ctx),
      [40, 50, 30, 50],
      expectPositions
    );
  });

  test("average", async () => {
    const cellInput = document.createElement("div");
    const ctx = getContext();
    autoSelectionFormula(ctx, cellInput, "AVERAGE");
    expectValuesInPositions(
      getFlowdata(ctx),
      [35, 40, 30, 45],
      expectPositions
    );
  });

  test("count", async () => {
    const cellInput = document.createElement("div");
    const ctx = getContext();
    autoSelectionFormula(ctx, cellInput, "COUNT");
    expectValuesInPositions(getFlowdata(ctx), [2, 2, 2, 2], expectPositions);
  });
});
