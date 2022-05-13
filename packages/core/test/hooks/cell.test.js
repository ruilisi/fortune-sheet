import { updateCell } from "../../src";
import { Canvas } from "../../src/canvas";
import { contextFactory, selectionFactory } from "../factories/context";
import { handleCellAreaMouseDown } from "../../src/events/mouse";

describe("cell related hooks", () => {
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
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
  const cellRenderParams = [
    0,
    0,
    -1,
    -0,
    20,
    74,
    {},
    {},
    46,
    20,
    {},
    {},
    0,
    6,
    0,
    0,
    0.5,
  ];

  test("beforeUpdateCell", async () => {
    const ctx = getContext();
    const parameters = new Array(0);
    const beforeUpdateCellFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { beforeUpdateCell: beforeUpdateCellFn };
    updateCell(ctx, 0, 1, null, 12);
    expect(parameters[0]).toBe(0);
    expect(parameters[1]).toBe(1);
    expect(parameters[2]).toBe(12);
    expect(ctx.luckysheetfile[0].data[0][1].v).toBe(12);
    ctx.hooks = { beforeUpdateCell: () => false };
    updateCell(ctx, 0, 1, null, 39);
    expect(ctx.luckysheetfile[0].data[0][1].v).toBe(12);
    ctx.hooks = { beforeUpdateCell: () => true };
    updateCell(ctx, 0, 1, null, 39);
    expect(ctx.luckysheetfile[0].data[0][1].v).toBe(39);
    ctx.hooks = {};
    updateCell(ctx, 0, 1, null, 37);
    expect(ctx.luckysheetfile[0].data[0][1].v).toBe(37);
  });

  test("afterUpdateCell", async () => {
    const ctx = getContext();
    const parameters = new Array(0);
    const afterUpdateCellFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { afterUpdateCell: afterUpdateCellFn };
    jest.useFakeTimers();
    updateCell(ctx, 0, 1, null, 12);
    jest.runAllTimers();
    expect(parameters[0]).toEqual(0);
    expect(parameters[1]).toEqual(1);
    expect(parameters[2]).toEqual({ v: "40", ct: { t: "n" } });
    expect(parameters[3]).toEqual({
      ct: { fa: "General", t: "n" },
      m: "12",
      v: 12,
    });
  });

  test("beforeRenderRowHeaderCell", async () => {
    const ctx = getContext();
    const canvasElement = document.createElement("canvas");
    const canvas = new Canvas(canvasElement, ctx);
    const parameters = new Array(0);
    const beforeRenderRowHeaderCellFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { beforeRenderRowHeaderCell: beforeRenderRowHeaderCellFn };
    canvas.drawRowHeader(0, 0, 20);
    expect(parameters[0]).toBe("1");
    expect(parameters[1]).toBe(0);
    expect(parameters[2]).toBe(17);
    expect(parameters[3]).toBeNaN();
    expect(parameters[4]).toBe(22);
    expect(parameters[5]).toEqual(canvas.canvasElement.getContext("2d"));
  });

  test("afterRenderRowHeaderCell", async () => {
    const ctx = getContext();
    const canvasElement = document.createElement("canvas");
    const canvas = new Canvas(canvasElement, ctx);
    const parameters = new Array(0);
    const afterRenderRowHeaderCellFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { afterRenderRowHeaderCell: afterRenderRowHeaderCellFn };
    canvas.drawRowHeader(0, 0, 20);
    expect(parameters[0]).toBe("1");
    expect(parameters[1]).toBe(0);
    expect(parameters[2]).toBe(17);
    expect(parameters[3]).toBeNaN();
    expect(parameters[4]).toBe(22);
    expect(parameters[5]).toEqual(canvas.canvasElement.getContext("2d"));
  });

  test("beforeRenderColumnHeaderCell", async () => {
    const ctx = getContext();
    const canvasElement = document.createElement("canvas");
    const canvas = new Canvas(canvasElement, ctx);
    const parameters = new Array(0);
    const beforeRenderColumnHeaderCellFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = {
      beforeRenderColumnHeaderCell: beforeRenderColumnHeaderCellFn,
    };
    canvas.drawColumnHeader(0, 0, 74);
    expect(parameters[0]).toBe("A");
    expect(parameters[1]).toBe(0);
    expect(parameters[2]).toBe(73);
    expect(parameters[3]).toBe(74);
    expect(parameters[4]).toBeNaN();
    expect(parameters[5]).toEqual(canvas.canvasElement.getContext("2d"));
  });

  test("afterRenderColumnHeaderCell", async () => {
    const ctx = getContext();
    const canvasElement = document.createElement("canvas");
    const canvas = new Canvas(canvasElement, ctx);
    const parameters = new Array(0);
    const afterRenderColumnHeaderCellFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = {
      afterRenderColumnHeaderCell: afterRenderColumnHeaderCellFn,
    };
    canvas.drawColumnHeader(0, 0, 74);
    expect(parameters[0]).toBe("A");
    expect(parameters[1]).toBe(0);
    expect(parameters[2]).toBe(73);
    expect(parameters[3]).toBe(74);
    expect(parameters[4]).toBeNaN();
    expect(parameters[5]).toEqual(canvas.canvasElement.getContext("2d"));
  });

  test("beforeRenderCellArea", async () => {
    const ctx = getContext();
    const canvasElement = document.createElement("canvas");
    const canvas = new Canvas(canvasElement, ctx);
    const parameters = new Array(0);
    const beforeRenderCellAreaFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { beforeRenderCellArea: beforeRenderCellAreaFn };
    canvas.sheetCtx.luckysheetTableContentHW = [500, 470];
    canvas.drawMain({
      scrollWidth: 0,
      scrollHeight: 0,
      clear: true,
    });
    expect(parameters[0]).toEqual(getContext().luckysheetfile[0].data);
    expect(parameters[1]).toBe(canvas.canvasElement.getContext("2d"));
  });

  test("beforeRenderCell", async () => {
    const ctx = getContext();
    const canvasElement = document.createElement("canvas");
    const canvas = new Canvas(canvasElement, ctx);
    const parameters = new Array(0);
    const beforeRenderCellFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { beforeRenderCell: beforeRenderCellFn };
    canvas.sheetCtx.luckysheetTableContentHW = [500, 470];
    cellRenderParams.splice(6, 0, canvas.canvasElement.getContext("2d"));
    canvas.nullCellRender(...cellRenderParams);
    expect(parameters[0]).toEqual(getContext().luckysheetfile[0].data[0][0]);
    expect(parameters[1]).toEqual({
      column: 0,
      endX: 119,
      endY: 39,
      row: 0,
      startX: 45,
      startY: 19,
    });
    expect(parameters[2]).toEqual(canvas.canvasElement.getContext("2d"));
    cellRenderParams.splice(6, 0, 30);
    canvas.cellRender(...cellRenderParams);
    expect(parameters[3]).toEqual(getContext().luckysheetfile[0].data[0][0]);
    expect(parameters[4]).toEqual({
      column: 0,
      endX: 119,
      endY: 39,
      row: 0,
      startX: 45,
      startY: 19,
    });
    expect(parameters[5]).toEqual(canvas.canvasElement.getContext("2d"));
    cellRenderParams.splice(6, 2);
  });

  test("afterRenderCell", async () => {
    const ctx = getContext();
    const canvasElement = document.createElement("canvas");
    const canvas = new Canvas(canvasElement, ctx);
    const parameters = new Array(0);
    const afterRenderCellFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { afterRenderCell: afterRenderCellFn };
    canvas.sheetCtx.luckysheetTableContentHW = [500, 470];
    cellRenderParams.splice(6, 0, canvas.canvasElement.getContext("2d"));
    canvas.nullCellRender(...cellRenderParams);
    expect(parameters[0]).toEqual(getContext().luckysheetfile[0].data[0][0]);
    expect(parameters[1]).toEqual({
      column: 0,
      endX: 119,
      endY: 39,
      row: 0,
      startX: 45,
      startY: 19,
    });
    expect(parameters[2]).toEqual(canvas.canvasElement.getContext("2d"));
    cellRenderParams.splice(6, 0, 30);
    canvas.cellRender(...cellRenderParams);
    expect(parameters[3]).toEqual(getContext().luckysheetfile[0].data[0][0]);
    expect(parameters[4]).toEqual({
      column: 0,
      endX: 119,
      endY: 39,
      row: 0,
      startX: 45,
      startY: 19,
    });
    expect(parameters[5]).toEqual(canvas.canvasElement.getContext("2d"));
    cellRenderParams.splice(6, 2);
  });

  test("beforeCellMouseDown", async () => {
    const ctx = getContext();
    const parameters = new Array(0);
    const beforeCellMouseDownFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { beforeCellMouseDown: beforeCellMouseDownFn };
    const cache = { editingCommentBoxEle: { dataset: { r: 0, c: 0 } } };
    const container = document.createElement("div");
    const cellInput = document.createElement("div");
    const fxInput = document.createElement("div");
    const mouseEvent = new MouseEvent("click", { button: 0 });
    container.getBoundingClientRect = () => ({
      width: 1000,
      height: 400,
      left: 0,
      top: 0,
    });
    mouseEvent.pageX = 100;
    mouseEvent.pageY = 30;
    handleCellAreaMouseDown(
      ctx,
      cache,
      mouseEvent,
      cellInput,
      container,
      fxInput
    );
    expect(parameters[0]).toEqual({ ct: { t: "n" }, v: "50" });
    expect(parameters[1]).toEqual({
      column: 1,
      endColumn: 148,
      endRow: 40,
      row: 1,
      startColumn: 74,
      startRow: 20,
    });
  });

  test("afterCellMouseDown", async () => {
    const ctx = getContext();
    const parameters = new Array(0);
    const afterCellMouseDownFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { afterCellMouseDown: afterCellMouseDownFn };
    const cache = { editingCommentBoxEle: { dataset: { r: 0, c: 0 } } };
    const container = document.createElement("div");
    const cellInput = document.createElement("div");
    const fxInput = document.createElement("div");
    const mouseEvent = new MouseEvent("click", { button: 0 });
    container.getBoundingClientRect = () => ({
      width: 1000,
      height: 400,
      left: 0,
      top: 0,
    });
    mouseEvent.pageX = 100;
    mouseEvent.pageY = 30;
    jest.useFakeTimers();
    handleCellAreaMouseDown(
      ctx,
      cache,
      mouseEvent,
      cellInput,
      container,
      fxInput
    );
    jest.runAllTimers();
    expect(parameters[0]).toEqual({ ct: { t: "n" }, v: "50" });
    expect(parameters[1]).toEqual({
      column: 1,
      endColumn: 148,
      endRow: 40,
      row: 1,
      startColumn: 74,
      startRow: 20,
    });
  });
});
