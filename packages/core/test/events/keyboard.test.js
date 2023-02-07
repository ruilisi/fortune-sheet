import { contextFactory, selectionFactory } from "../factories/context";
import {
  handleArrowKey,
  handleGlobalEnter,
  handleGlobalKeyDown,
  handleWithCtrlOrMetaKey,
} from "../../src/events/keyboard";
import { getFlowdata } from "../../src/context";
import { groupValuesRefresh } from "../../src";

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
    ctx.luckysheetCellUpdate = [];
    let cache;

    handleWithCtrlOrMetaKey(
      ctx,
      cache,
      keypressWithCtrlPressed("b"),
      cellInput,
      fxInput,
      () => {},
      () => {}
    );
    expect(getFlowdata(ctx)[0][0]).toEqual({ bl: 1, v: "abc" });
  });

  test("handle with ctrl+z", async () => {
    const cellInput = document.createElement("div");
    const fxInput = document.createElement("div");
    const ctx = getContext();
    const undo = jest.fn();
    let cache;
    // const redo = jest.fn();
    handleWithCtrlOrMetaKey(
      ctx,
      cache,
      keypressWithCtrlPressed("z"),
      cellInput,
      fxInput,
      undo
      // redo
    );
    expect(undo).toHaveBeenCalled();
    // handleWithCtrlOrMetaKey(
    //   ctx,
    //   keypressWithCtrlPressed("shift+z"),
    //   cellInput,
    //   fxInput,
    //   undo
    // redo
    // );
    // expect(redo).toHaveBeenCalled();
  });

  test("handle with ctrl+a", async () => {
    const cellInput = document.createElement("div");
    const fxInput = document.createElement("div");
    const ctx = getContext();
    let cache;
    handleWithCtrlOrMetaKey(
      ctx,
      cache,
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

  test("handle formula", async () => {
    const ctx = getContext();
    const keyboardEvent = new KeyboardEvent("Enter", { key: "Enter" });
    [
      {
        f1: "SUM",
        f2: "SUM",
        newCell: "120",
        v1: 330,
        v2: 660,
        v3: 240,
        v4: 480,
      },
      {
        f1: "AVERAGE",
        f2: "AVERAGE",
        newCell: "120",
        v1: 165,
        v2: 165,
        v3: 120,
        v4: 120,
      },
      {
        f1: "MAX",
        f2: "MAX",
        newCell: "120",
        v1: 210,
        v2: 210,
        v3: 120,
        v4: 120,
      },
      {
        f1: "MIN",
        f2: "MIN",
        newCell: "120",
        v1: 120,
        v2: 120,
        v3: 120,
        v4: 120,
      },
      { f1: "COUNT", f2: "COUNT", newCell: "", v1: 2, v2: 3, v3: 1, v4: 2 },
      {
        f1: "SUM",
        f2: "MAX",
        newCell: "120",
        v1: 330,
        v2: 330,
        v3: 240,
        v4: 240,
      },
    ].forEach((item) => {
      ctx.luckysheetfile = [
        {
          id: "id_1",
          data: [[{ v: 120 }, { v: 210 }, null]],
        },
      ];
      const cellInput = document.createElement("div");
      cellInput.innerText = `=${item.f1}(A1:B1)`;
      ctx.luckysheetCellUpdate = [0, 2];
      handleGlobalEnter(ctx, cellInput, keyboardEvent);
      expect(getFlowdata(ctx)[0][2].v).toBe(item.v1);
      cellInput.innerText = `=${item.f2}(A1:C1)`;
      ctx.luckysheetCellUpdate = [0, 3];
      handleGlobalEnter(ctx, cellInput, keyboardEvent);
      expect(getFlowdata(ctx)[0][3].v).toBe(item.v2);

      cellInput.innerText = item.newCell;
      ctx.luckysheetCellUpdate = [0, 1];
      handleGlobalEnter(ctx, cellInput, keyboardEvent);
      groupValuesRefresh(ctx);
      expect(getFlowdata(ctx)[0][2].v).toBe(item.v3);
      expect(getFlowdata(ctx)[0][3].v).toBe(item.v4);
    });
  });
});
