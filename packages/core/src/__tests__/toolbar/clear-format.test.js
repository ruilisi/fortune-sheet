import {
  context,
  luckysheetSlectSave,
} from "../../../../../tests/mockData/context";
import { getFlowdata } from "../../context";
import { handleClearFormat } from "../../modules/toolbar";

describe("clear format", () => {
  const getContext = () =>
    context({
      luckysheet_select_save: luckysheetSlectSave([0, 0], [0, 0], 0, 0),
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
        },
      ],
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
});
