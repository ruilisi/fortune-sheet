import { contextFactory, selectionFactory } from "../factories/context";
import {
  handleRowHeaderMouseDown,
  handleColumnHeaderMouseDown,
  handleCellAreaMouseDown,
  handleCellAreaDoubleClick,
} from "../../src/events/mouse";

describe("keyboard", () => {
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
    });
  const cache = { editingCommentBoxEle: { dataset: { r: 0, c: 0 } } };
  const container = document.createElement("div");
  const cellInput = document.createElement("div");
  const fxInput = document.createElement("div");

  test("row header mouse down", async () => {
    const ctx = getContext();
    const mouseEvent = new MouseEvent("click", { button: 0 });
    mouseEvent.pageY = 99;
    handleRowHeaderMouseDown(
      ctx,
      cache,
      mouseEvent,
      container,
      cellInput,
      fxInput
    );
    expect(ctx.luckysheet_select_save[0].row_focus).toBe(4);
  });

  test("column header mouse down", async () => {
    const ctx = getContext();
    const mouseEvent = new MouseEvent("click", { button: 0 });
    mouseEvent.pageX = 369;
    handleColumnHeaderMouseDown(
      ctx,
      cache,
      mouseEvent,
      container,
      cellInput,
      fxInput
    );
    expect(ctx.luckysheet_select_save[0].column_focus).toBe(4);
  });

  test("cell mouse down", async () => {
    const ctx = getContext();
    const mouseEvent = new MouseEvent("click", { button: 0 });
    container.getBoundingClientRect = () => ({
      width: 1000,
      height: 400,
      left: 0,
      top: 0,
    });
    mouseEvent.pageX = 369;
    mouseEvent.pageY = 79;
    handleCellAreaMouseDown(
      ctx,
      cache,
      mouseEvent,
      cellInput,
      container,
      fxInput
    );
    expect(ctx.luckysheet_select_save[0].row_focus).toBe(3);
    expect(ctx.luckysheet_select_save[0].column_focus).toBe(4);
  });

  test("cell double click", async () => {
    const settings = { allowEdit: true };
    const ctx = getContext();
    const mouseEvent = new MouseEvent("dblclick", { button: 0 });
    mouseEvent.pageX = 369;
    mouseEvent.pageY = 79;
    ctx.luckysheet_select_save = selectionFactory([0, 4], [0, 4], 3, 4);
    handleCellAreaDoubleClick(ctx, cache, settings, mouseEvent, container);
    expect(ctx.luckysheetCellUpdate).toEqual([3, 4]);
  });
});
