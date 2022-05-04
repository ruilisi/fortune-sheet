import { contextFactory, selectionFactory } from "../factories/context";
import {
  handleArrowKey,
  handleGlobalEnter,
  handleGlobalKeyDown,
  handleWithCtrlOrMetaKey,
} from "../../src/events/keyboard";
import { getFlowdata } from "../../src/context";

describe("keyboard", () => {
  const keypressWithCtrlPressed = (key) => {
    return new KeyboardEvent("ctrl+[key]", { key, ctrlKey: true });
  };
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
      luckysheetfile: [
        {
          id: "id_1",
          data: [
            [{ v: "abc" }, { v: "abc" }],
            [{ v: "abc" }, { v: "abc" }],
          ],
        },
      ],
    });
  const cellData = {
    m: "30",
    v: "30",
    f: "=SUM(A1:B1)",
    ct: { fa: "General", t: "inlineStr" },
  };

  test("handle global enter", async () => {
    const cellInput = document.createElement("div");
    cellInput.innerText = "Hello world";
    const ctx = getContext();
    const keyboardEvent = new KeyboardEvent("Enter", { key: "Enter" });
    handleGlobalEnter(ctx, cellInput, keyboardEvent);
    expect(getFlowdata(ctx)[0][0].v).toBe("Hello world");
  });

  test("handle with ctrl+b", async () => {
    const cellInput = document.createElement("div");
    const fxInput = document.createElement("div");
    const ctx = getContext();
    handleWithCtrlOrMetaKey(
      ctx,
      keypressWithCtrlPressed("b"),
      cellInput,
      fxInput,
      () => {},
      () => {}
    );
    expect(getFlowdata(ctx)[0][0]).toEqual({ bl: 1, v: "abc" });
  });

  test("handle with ctrl+z and ctrl+y", async () => {
    const cellInput = document.createElement("div");
    const fxInput = document.createElement("div");
    const ctx = getContext();
    const undo = jest.fn();
    const redo = jest.fn();
    handleWithCtrlOrMetaKey(
      ctx,
      keypressWithCtrlPressed("z"),
      cellInput,
      fxInput,
      undo,
      redo
    );
    expect(undo).toHaveBeenCalled();
    handleWithCtrlOrMetaKey(
      ctx,
      keypressWithCtrlPressed("y"),
      cellInput,
      fxInput,
      undo,
      redo
    );
    expect(redo).toHaveBeenCalled();
  });

  test("handle with ctrl+a", async () => {
    const cellInput = document.createElement("div");
    const fxInput = document.createElement("div");
    const ctx = getContext();
    handleWithCtrlOrMetaKey(
      ctx,
      keypressWithCtrlPressed("a"),
      cellInput,
      fxInput,
      () => {},
      () => {}
    );
    expect(ctx.luckysheet_select_save[0].row_select).toBe(true);
    expect(ctx.luckysheet_select_save[0].column_select).toBe(true);
    expect(ctx.luckysheet_select_save[0].row).toEqual([0, 1]);
    expect(ctx.luckysheet_select_save[0].column).toEqual([0, 1]);
  });

  test("handle delete cell", async () => {
    const cellInput = document.createElement("div");
    const fxInput = document.createElement("div");
    const ctx = getContext();

    ctx.luckysheetCellUpdate = [];
    let cache;
    ["Delete", "Backspace"].forEach((k) => {
      ctx.luckysheetfile[0].data[0][0] = cellData;
      const keyboardEvent = new KeyboardEvent(k, { key: k });
      handleGlobalKeyDown(
        ctx,
        cellInput,
        fxInput,
        keyboardEvent,
        cache,
        () => {},
        () => {}
      );
      expect(getFlowdata(ctx)[0][0]).toEqual({});
    });
  });

  test("handle delete multiple cells", async () => {
    const cellInput = document.createElement("div");
    const fxInput = document.createElement("div");
    const ctx = getContext();
    ctx.luckysheetCellUpdate = [];
    let cache;
    ctx.luckysheetfile[0].data[0][0] = cellData;
    ctx.luckysheetfile[0].data[0][1] = cellData;
    ctx.luckysheet_select_save = selectionFactory([0, 1], [0, 1], 0, 1);
    const keyboardEvent = new KeyboardEvent("Delete", { key: "Delete" });
    handleGlobalKeyDown(
      ctx,
      cellInput,
      fxInput,
      keyboardEvent,
      cache,
      () => {},
      () => {}
    );
    expect(getFlowdata(ctx)[0][0]).toEqual({});
    expect(getFlowdata(ctx)[0][1]).toEqual({});
  });

  test("handle arrow", async () => {
    const ctx = getContext();
    ctx.luckysheetCellUpdate = [];
    [
      { k: "ArrowDown", r: 1, c: 0 },
      { k: "ArrowRight", r: 1, c: 1 },
      { k: "ArrowUp", r: 0, c: 1 },
      { k: "ArrowLeft", r: 0, c: 0 },
    ].forEach((item) => {
      const keyboardEvent = new KeyboardEvent(item.k, { key: item.k });
      handleArrowKey(ctx, keyboardEvent);
      expect(ctx.luckysheet_select_save[0].row_focus).toBe(item.r);
      expect(ctx.luckysheet_select_save[0].column_focus).toBe(item.c);
    });
  });
});
