import { getFlowdata } from "../../context";
import { handleClearFormat } from "../../modules/toolbar";

describe("clear format", () => {
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
        length: 1,
      },
    ],
  });

  test("clear format", async () => {
    const context = getContext();
    handleClearFormat(context);
    const expectedCell = {
      v: "1",
      m: "1",
      ct: {
        fa: "General",
        t: "n",
      },
    };
    expect(getFlowdata(context)[0][0]).toEqual(expectedCell);
  });
});
