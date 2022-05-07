import _ from "lodash";
import { contextFactory, selectionFactory } from "../factories/context";
import { mergeCells, cancelMerge } from "../../src/api/merge";

describe("merge", () => {
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 1], [0, 1], 0, 0),
    });

  test("mergeCells and cancelMerge", async () => {
    const testMergeCellsAll = (r0, c0, r1, c1, mergeMode) => {
      const ranges = [{ row: [r0, r1], column: [c0, c1] }];
      const ctx = getContext();
      const expectedValue = (r, c, Mode) => {
        switch (Mode) {
          case "merge-all":
            return {
              r: r0,
              c: c0,
              rs: r === r0 && c === c0 ? r1 - r0 + 1 : undefined,
              cs: r === r0 && c === c0 ? c1 - c0 + 1 : undefined,
            };
          case "merge-horizontal":
            return {
              r,
              c: c0,
              rs: c === c0 ? 1 : undefined,
              cs: c === c0 ? c1 - c0 + 1 : undefined,
            };
          case "merge-vertical":
            return {
              r: r0,
              c,
              rs: r === r0 ? r1 - r0 + 1 : undefined,
              cs: r === r0 ? 1 : undefined,
            };
          default:
            return {};
        }
      };
      mergeCells(ctx, ranges, mergeMode);
      _.range(r0, r1 + 1).forEach((r) => {
        _.range(c0, c1 + 1).forEach((c) => {
          expect(ctx.luckysheetfile[0].data[r][c].mc).toEqual(
            expectedValue(r, c, mergeMode)
          );
        });
      });
      cancelMerge(ctx, ranges);
      _.range(r0, r1 + 1).forEach((r) => {
        _.range(c0, c1 + 1).forEach((c) => {
          expect(ctx.luckysheetfile[0].data[r][c].mc).toEqual(undefined);
        });
      });
    };
    const testRangeList = [
      [0, 0, 1, 1, "merge-all"],
      [0, 0, 1, 1, "merge-vertical"],
      [0, 0, 1, 1, "merge-horizontal"],
      [0, 0, 3, 1, "merge-all"],
      [0, 0, 3, 1, "merge-vertical"],
      [0, 0, 3, 3, "merge-horizontal"],
      [2, 1, 3, 1, "merge-all"],
      [2, 1, 3, 1, "merge-vertical"],
      [2, 1, 3, 1, "merge-horizontal"],
      [1, 2, 3, 3, "merge-all"],
      [1, 2, 3, 3, "merge-vertical"],
      [1, 2, 3, 3, "merge-horizontal"],
    ];
    testRangeList.forEach((k) =>
      testMergeCellsAll(k[0], k[1], k[2], k[3], k[4])
    );
  });
});
