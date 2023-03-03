import { contextFactory, selectionFactory } from "../factories/context";
import { getFlowdata } from "../../src/context";
import { handleClearFormat } from "../../src/modules/toolbar";

describe("clear format", () => {
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
      luckysheetfile: [
        {
          id: "id_1",
          data: [
            [
              {
                v: "1",
                bl: 1,
                ct: {
                  fa: "General",
                  t: "n",
                },
                m: "1",
                it: 1,
                un: 1,
                fc: "#ff0",
                bg: "#f00",
                ht: "0",
                vt: "0",
              },
            ],
          ],
          config: {
            borderInfo: [
              {
                rangeType: "range",
                borderType: "border-all",
                style: "3",
                color: "#0000ff",
                range: [
                  {
                    row: [0, 3],
                    column: [0, 2],
                  },
                ],
              },
              {
                rangeType: "range",
                borderType: "border-inside",
                style: "3",
                color: "#0000ff",
                range: [
                  {
                    row: [7, 8],
                    column: [8, 9],
                  },
                ],
              },
            ],
          },
        },
      ],
      config: {
        borderInfo: [
          {
            rangeType: "range",
            borderType: "border-all",
            style: "3",
            color: "#0000ff",
            range: [
              {
                row: [0, 3],
                column: [0, 2],
              },
            ],
          },
          {
            rangeType: "range",
            borderType: "border-inside",
            style: "3",
            color: "#0000ff",
            range: [
              {
                row: [7, 8],
                column: [8, 9],
              },
            ],
          },
        ],
      },
    });

  test("clear format", async () => {
    const ctx = getContext();
    handleClearFormat(ctx);
    const expectedCell = {
      v: "1",
      m: "1",
      ct: {
        fa: "General",
        t: "n",
      },
    };
    expect(getFlowdata(ctx)[0][0]).toEqual(expectedCell);
  });

  test("clear border info", async () => {
    const ctx = getContext();
    ctx.luckysheet_select_save = selectionFactory([0, 0], [0, 0], 0, 0);
    const expectedBorderInfo = [
      {
        rangeType: "range",
        borderType: "border-all",
        style: "3",
        color: "#0000ff",
        range: [
          {
            row: [0, 0],
            column: [1, 2],
          },
          {
            row: [1, 3],
            column: [0, 2],
          },
        ],
      },
      {
        rangeType: "range",
        borderType: "border-inside",
        style: "3",
        color: "#0000ff",
        range: [
          {
            row: [7, 8],
            column: [8, 9],
          },
        ],
      },
    ];
    handleClearFormat(ctx);
    expect(ctx.luckysheetfile[0].config.borderInfo).toEqual(expectedBorderInfo);
  });
});
