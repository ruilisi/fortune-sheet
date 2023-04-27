import {
  addSheet,
  changeSheet,
  deleteSheet,
  defaultSettings,
  editSheetName,
  selectionCache,
} from "../../src";
import { contextFactory, selectionFactory } from "../factories/context";
import { handlePaste } from "../../src/events/paste";

describe("sheet related hooks", () => {
  const getContext = (p) =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
      ...p,
    });
  document.execCommand = jest.fn();

  test("beforePaste", async () => {
    const ctx = getContext();
    ctx.luckysheet_copy_save = { copyRange: [] };
    const parameters = new Array(0);
    const beforePasteFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { beforePaste: beforePasteFn };
    const newEvent = new Event("paste");
    const clipboardData = {};
    clipboardData.getData = jest.fn().mockImplementation(() => "abcd");
    clipboardData.files = [];
    newEvent.clipboardData = clipboardData;
    selectionCache.isPasteAction = true;

    handlePaste(ctx, newEvent);
    expect(parameters[0]).toEqual([
      { column: [0, 0], column_focus: 0, row: [0, 0], row_focus: 0 },
    ]);
    expect(parameters[1]).toEqual("abcd");
    expect(ctx.luckysheetfile[0].data[0][0].v).toBe("abcd");

    const ctxFirst = getContext();
    ctxFirst.hooks = { beforePaste: () => false };
    selectionCache.isPasteAction = true;
    handlePaste(ctxFirst, newEvent);
    expect(ctxFirst.luckysheetfile[0].data[0][0]).toBeNull();

    ctxFirst.hooks = { beforePaste: () => true };
    selectionCache.isPasteAction = true;
    handlePaste(ctxFirst, newEvent);
    expect(ctxFirst.luckysheetfile[0].data[0][0].v).toBe("abcd");
  });

  test("beforeAddSheet", async () => {
    const parameters = new Array(0);
    const beforeAddSheetFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    const ctx = getContext({ hooks: { beforeAddSheet: beforeAddSheetFn } });
    addSheet(ctx, defaultSettings);
    expect(ctx.luckysheetfile.length).toBe(3);
    expect(parameters[0]).toEqual({
      column: undefined,
      config: {},
      id: ctx.luckysheetfile[2].id,
      isPivotTable: false,
      name: "Sheet3",
      order: 2,
      pivotTable: null,
      row: undefined,
      status: 0,
      zoomRatio: 1,
    });

    const ctxFirst = getContext({
      hooks: { beforeAddSheet: () => false },
    });
    addSheet(ctxFirst, defaultSettings);
    expect(ctxFirst.luckysheetfile.length).toBe(2);
    ctxFirst.hooks = { beforeAddSheet: () => true };
    addSheet(ctxFirst, defaultSettings);
    expect(ctxFirst.luckysheetfile.length).toBe(3);
  });

  test("afterAddSheet", async () => {
    const parameters = new Array(0);
    const afterAddSheetFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    const ctx = getContext({ hooks: { afterAddSheet: afterAddSheetFn } });
    jest.useFakeTimers();
    addSheet(ctx, defaultSettings);
    jest.runAllTimers();
    expect(ctx.luckysheetfile.length).toBe(3);
    expect(parameters[0]).toEqual({
      column: undefined,
      config: {},
      id: ctx.luckysheetfile[2].id,
      isPivotTable: false,
      name: "Sheet3",
      order: 2,
      pivotTable: null,
      row: undefined,
      status: 0,
      zoomRatio: 1,
    });
  });

  test("beforeActivateSheet", async () => {
    const parameters = new Array(0);
    const beforeActivateSheetFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    const ctx = getContext({
      hooks: { beforeActivateSheet: beforeActivateSheetFn },
    });
    changeSheet(ctx, "id_2");
    expect(ctx.currentSheetId).toBe("id_2");
    expect(parameters[0]).toBe("id_2");
    ctx.hooks = { beforeActivateSheet: () => true };
    changeSheet(ctx, "id_1");
    expect(ctx.currentSheetId).toBe("id_1");
    ctx.hooks = { beforeActivateSheet: () => false };
    changeSheet(ctx, "id_2");
    expect(ctx.currentSheetId).toBe("id_1");
  });

  test("afterActivateSheet", async () => {
    const parameters = new Array(0);
    const afterActivateSheetFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    const ctx = getContext({
      hooks: { afterActivateSheet: afterActivateSheetFn },
    });
    jest.useFakeTimers();
    changeSheet(ctx, "id_2");
    jest.runAllTimers();
    expect(ctx.currentSheetId).toBe("id_2");
    expect(parameters[0]).toBe("id_2");
  });

  test("beforeDeleteSheet", async () => {
    const parameters = new Array(0);
    const beforeDeleteSheetFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    const ctx = getContext({
      hooks: { beforeDeleteSheet: beforeDeleteSheetFn },
    });
    deleteSheet(ctx, "id_1");
    expect(ctx.luckysheetfile.length).toBe(1);
    expect(parameters[0]).toBe("id_1");
    ctx.hooks = { beforeDeleteSheet: () => false };
    deleteSheet(ctx, "id_2");
    expect(ctx.luckysheetfile.length).toBe(1);
    ctx.hooks = { beforeDeleteSheet: () => true };
    deleteSheet(ctx, "id_2");
    expect(ctx.luckysheetfile.length).toBe(0);
  });

  test("afterDeleteSheet", async () => {
    const parameters = new Array(0);
    const afterDeleteSheetFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    const ctx = getContext({
      hooks: { afterDeleteSheet: afterDeleteSheetFn },
    });
    jest.useFakeTimers();
    deleteSheet(ctx, "id_2");
    jest.runAllTimers();
    expect(ctx.luckysheetfile.length).toBe(1);
    expect(parameters[0]).toBe("id_2");
  });

  test("beforeUpdateSheetName", async () => {
    const parameters = new Array(0);
    const beforeUpdateSheetNameFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    const ctx = getContext({
      hooks: { beforeUpdateSheetName: beforeUpdateSheetNameFn },
    });
    const editable = document.createElement("span");
    editable.innerText = "newSheet";
    editSheetName(ctx, editable);
    expect(ctx.luckysheetfile[0].name).toBe("newSheet");
    expect(parameters[0]).toBe("id_1");
    expect(parameters[1]).toBe("");
    expect(parameters[2]).toBe("newSheet");
    ctx.luckysheetfile[0].name = "oldname";
    ctx.hooks = { beforeUpdateSheetName: () => false };
    editSheetName(ctx, editable);
    expect(ctx.luckysheetfile[0].name).toBe("oldname");
    ctx.hooks = { beforeUpdateSheetName: () => true };
    editSheetName(ctx, editable);
    expect(ctx.luckysheetfile[0].name).toBe("newSheet");
  });

  test("afterUpdateSheetName", async () => {
    const parameters = new Array(0);
    const afterUpdateSheetNameFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    const ctx = getContext({
      hooks: { afterUpdateSheetName: afterUpdateSheetNameFn },
    });
    const editable = document.createElement("span");
    editable.innerText = "newSheet";
    jest.useFakeTimers();
    editSheetName(ctx, editable);
    jest.runAllTimers();
    expect(ctx.luckysheetfile[0].name).toBe("newSheet");
    expect(parameters[0]).toBe("id_1");
    expect(parameters[1]).toBe("");
    expect(parameters[2]).toBe("newSheet");
  });
});
