import { contextFactory, selectionFactory } from "../factories/context";
import { handleCopy } from "../../src/events/copy";
import clipboard from "../../src/modules/clipboard";

describe("copy", () => {
  const contents = new Array(10);
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [2, 3], 2, 3),
      luckysheetPaintModelOn: false,
    });
  document.execCommand = jest.fn();

  test("handleCopy", async () => {
    const expected_copy_save = {
      HasMC: false,
      RowlChange: false,
      copyRange: [{ column: [2, 3], row: [0, 0] }],
      dataSheetId: "id_1",
    };
    const ctx = getContext();
    ctx.luckysheetfile[0].data = [
      [{ v: "qwerhj" }, { v: "qwerhj" }, { v: "qwerhj" }, { v: "qwerhj" }],
      [{ v: "qwerhj" }, { v: "qwerhj" }, { v: "qwerhj" }, { v: "qwerhj" }],
      [{ v: "qwerhj" }, { v: "qwerhj" }, { v: "qwerhj" }, { v: "qwerhj" }],
    ];

    handleCopy(ctx);
    expect(document.execCommand).toHaveBeenCalledWith("selectAll");
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(ctx.iscopyself).toBe(true);
    expect(ctx.luckysheet_copy_save).toEqual(expected_copy_save);
    expect(ctx.luckysheet_paste_iscut).toBe(false);
    expect(ctx.luckysheet_selection_range).toEqual([
      { row: [0, 0], column: [2, 3] },
    ]);
    // when paintmode is on:
    ctx.luckysheetPaintModelOn = true;
    handleCopy(ctx);
    expect(ctx.luckysheetPaintModelOn).toBe(false);
    // check whether the content of the clipboard is right
    clipboard.writeHtml = jest.fn().mockImplementation((p) => {
      contents.push(p);
    });
    handleCopy(ctx);
    expect(contents[contents.length - 1].match(/qwerhj/g).length).toBe(2);
  });
});
