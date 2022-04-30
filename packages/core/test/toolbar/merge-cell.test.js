import { handleMerge } from "../../src/modules/toolbar";

describe("Cells", () => {
  const context = {
    config: {},
    luckysheetfile: [
      {
        index: "0",
        data: [
          [
            {
              v: "hello",
            },
            null,
          ],
          [null, null],
        ],
      },
    ],
    currentSheetIndex: "0",
    luckysheet_select_save: [
      {
        left: 0,
        width: 73,
        top: 0,
        height: 19,
        left_move: 0,
        width_move: 147,
        top_move: 0,
        height_move: 39,
        row: [0, 1],
        column: [0, 1],
        row_focus: 0,
        column_focus: 0,
      },
    ],
  };

  it("MergeAllCell", async () => {
    handleMerge(context, "merge-all");
    expect(context.luckysheetfile[0].data[0][0].v).toEqual("hello");
    expect(context.luckysheetfile[0].data[0][1].mc.r).toEqual(0);
    expect(context.luckysheetfile[0].data[0][1].mc.c).toEqual(0);
    handleMerge(context, "merge-cancel");
    handleMerge(context, "merge-vertical");
    expect(context.luckysheetfile[0].data[0][0].v).toEqual("hello");
    expect(context.luckysheetfile[0].data[0][1].mc.rs).toEqual(2);
    handleMerge(context, "merge-cancel");
    handleMerge(context, "merge-horizontal");
    expect(context.luckysheetfile[0].data[0][0].v).toEqual("hello");
    expect(context.luckysheetfile[0].data[1][0].mc.cs).toEqual(2);
  });
});
