import { contextFactory } from "../factories/context";
import { getSheet } from "../../src/api/common";

describe("common", () => {
  const expectedSheet = {
    id: "id_2",
    data: [[{ v: "rose" }]],
    celldat: [
      {
        c: 0,
        r: 0,
        v: {
          v: "rose",
        },
      },
    ],
  };
  const getContext = () =>
    contextFactory({
      luckysheetfile: [
        {
          id: "id_1",
          data: [[]],
        },
        expectedSheet,
      ],
    });

  test("getSheet", async () => {
    const ctx = getContext();
    expect(getSheet(ctx, { id: "id_2" })).toEqual(expectedSheet);
  });
});
