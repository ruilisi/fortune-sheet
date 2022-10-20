import {
  addSheet,
  api,
  Cell,
  Context,
  deleteRowCol,
  deleteSheet,
  insertRowCol,
  Op,
  opToPatch,
  Range,
  Selection,
  Presence,
  Settings,
  SingleRange,
  createFilterOptions,
  getSheetIndex,
  Sheet,
  GlobalCache,
  inverseRowColOptions,
  PatchOptions,
} from "@fortune-sheet/core";
import produce, { applyPatches, Patch } from "immer";
import _ from "lodash";
import { SetContextOptions } from "../../context";

export function generateAPIs(
  context: Context,
  setContext: (
    recipe: (ctx: Context) => void,
    options?: SetContextOptions
  ) => void,
  emitOp: (
    ctx: Context,
    patches: Patch[],
    patchOptions: PatchOptions | undefined
  ) => void,
  setContextWithoutProduce: (ctx: Context) => void,
  globalCache: GlobalCache,
  settings: Required<Settings>,
  cellInput: HTMLDivElement | null,
  scrollbarX: HTMLDivElement | null,
  scrollbarY: HTMLDivElement | null
) {
  return {
    applyOp: (ops: Op[]) => {
      setContext(
        (ctx_) => {
          const [patches, specialOps] = opToPatch(ctx_, ops);
          if (specialOps.length > 0) {
            const [specialOp] = specialOps;
            if (specialOp.op === "insertRowCol") {
              ctx_ = produce(ctx_, (draftCtx) => {
                try {
                  insertRowCol(draftCtx, specialOp.value);
                } catch (e: any) {
                  console.error(e);
                }
              });
            } else if (specialOp.op === "deleteRowCol") {
              ctx_ = produce(ctx_, (draftCtx) => {
                deleteRowCol(draftCtx, specialOp.value);
              });
            } else if (specialOp.op === "addSheet") {
              ctx_ = produce(ctx_, (draftCtx) => {
                if (specialOp.value?.id) {
                  addSheet(draftCtx, settings, specialOp.value.id);
                }
              });
              // 添加addSheet完后，给sheet初始化data
              const fileIndex = getSheetIndex(
                ctx_,
                specialOp.value.id
              ) as number;
              const { data } = ctx_.luckysheetfile[fileIndex];
              if (_.isUndefined(data)) {
                const expandeData: Sheet["data"] = _.times(
                  ctx_.defaultrowNum + 1,
                  () => _.times(ctx_.defaultcolumnNum + 1, () => null)
                );
                ctx_.luckysheetfile[fileIndex].data = expandeData;
              }
            } else if (specialOp.op === "deleteSheet") {
              ctx_ = produce(ctx_, (draftCtx) => {
                deleteSheet(draftCtx, specialOp.value.id);
              });
            }
          }
          if (ops[0]?.path?.[0] === "filter_select")
            ctx_.luckysheet_filter_save = ops[0].value;
          createFilterOptions(ctx_, ctx_.luckysheet_filter_save);
          if (patches.length === 0) return ctx_;
          try {
            const newContext = applyPatches(ctx_, patches);
            const index = getSheetIndex(newContext, newContext.currentSheetId)!;
            const newConfig = newContext.luckysheetfile?.[index].config;
            if (newConfig) {
              newContext.config = newConfig;
            }
            return newContext;
          } catch (e) {
            console.error(e);
            return ctx_;
          }
        },
        { noHistory: true }
      );
    },

    getCellValue: (
      row: number,
      column: number,
      options: api.CommonOptions & { type?: keyof Cell } = {}
    ) => api.getCellValue(context, row, column, options),

    setCellValue: (
      row: number,
      column: number,
      value: any,
      options: api.CommonOptions & { type?: keyof Cell } = {}
    ) =>
      setContext((draftCtx) =>
        api.setCellValue(draftCtx, row, column, value, cellInput, options)
      ),

    clearCell: (row: number, column: number, options: api.CommonOptions = {}) =>
      setContext((draftCtx) => api.clearCell(draftCtx, row, column, options)),

    setCellFormat: (
      row: number,
      column: number,
      attr: keyof Cell,
      value: any,
      options: api.CommonOptions = {}
    ) =>
      setContext((draftCtx) =>
        api.setCellFormat(draftCtx, row, column, attr, value, options)
      ),

    autoFillCell: (
      copyRange: SingleRange,
      applyRange: SingleRange,
      direction: "up" | "down" | "left" | "right"
    ) =>
      setContext((draftCtx) =>
        api.autoFillCell(draftCtx, copyRange, applyRange, direction)
      ),

    freeze: (
      type: "row" | "column" | "both",
      range: { row: number; column: number },
      options: api.CommonOptions = {}
    ) => setContext((draftCtx) => api.freeze(draftCtx, type, range, options)),

    insertRowOrColumn: (
      type: "row" | "column",
      index: number,
      count: number,
      direction: "lefttop" | "rightbottom" = "rightbottom",
      options: api.CommonOptions = {}
    ) =>
      setContext((draftCtx) =>
        api.insertRowOrColumn(draftCtx, type, index, count, direction, options)
      ),

    deleteRowOrColumn: (
      type: "row" | "column",
      start: number,
      end: number,
      options: api.CommonOptions = {}
    ) =>
      setContext((draftCtx) =>
        api.deleteRowOrColumn(draftCtx, type, start, end, options)
      ),

    setRowHeight: (
      rowInfo: Record<string, number>,
      options: api.CommonOptions = {}
    ) => setContext((draftCtx) => api.setRowHeight(draftCtx, rowInfo, options)),

    setColumnWidth: (
      columnInfo: Record<string, number>,
      options: api.CommonOptions = {}
    ) =>
      setContext((draftCtx) =>
        api.setColumnWidth(draftCtx, columnInfo, options)
      ),

    getRowHeight: (rows: number[], options: api.CommonOptions = {}) =>
      api.getRowHeight(context, rows, options),

    getColumnWidth: (columns: number[], options: api.CommonOptions = {}) =>
      api.getColumnWidth(context, columns, options),

    getSelection: () => api.getSelection(context),

    getFlattenRange: (range: Range) => api.getFlattenRange(context, range),

    getCellsByFlattenRange: (range?: { r: number; c: number }[]) =>
      api.getCellsByFlattenRange(context, range),

    getSelectionCoordinates: () => api.getSelectionCoordinates(context),

    getCellsByRange: (range: Selection, options: api.CommonOptions = {}) =>
      api.getCellsByRange(context, range, options),

    getHtmlByRange: (range: Range, options: api.CommonOptions = {}) =>
      api.getHtmlByRange(context, range, options),

    setSelection: (range: Range, options: api.CommonOptions = {}) =>
      setContext((draftCtx) => api.setSelection(draftCtx, range, options)),

    setCellValuesByRange: (
      data: any[][],
      range: SingleRange,
      options: api.CommonOptions = {}
    ) =>
      setContext((draftCtx) =>
        api.setCellValuesByRange(draftCtx, data, range, cellInput, options)
      ),

    setCellFormatByRange: (
      attr: keyof Cell,
      value: any,
      range: Range | SingleRange,
      options: api.CommonOptions = {}
    ) =>
      setContext((draftCtx) =>
        api.setCellFormatByRange(draftCtx, attr, value, range, options)
      ),

    mergeCells: (
      ranges: Range,
      type: string,
      options: api.CommonOptions = {}
    ) =>
      setContext((draftCtx) => api.mergeCells(draftCtx, ranges, type, options)),

    cancelMerge: (ranges: Range, options: api.CommonOptions = {}) =>
      setContext((draftCtx) => api.cancelMerge(draftCtx, ranges, options)),

    getAllSheets: () => api.getAllSheets(context),

    getSheet: (options: api.CommonOptions = {}) =>
      api.getSheetWithLatestCelldata(context, options),

    addSheet: () => setContext((draftCtx) => api.addSheet(draftCtx, settings)),

    deleteSheet: (options: api.CommonOptions = {}) =>
      setContext((draftCtx) => api.deleteSheet(draftCtx, options)),

    activateSheet: (options: api.CommonOptions = {}) =>
      setContext((draftCtx) => api.activateSheet(draftCtx, options)),

    setSheetName: (name: string, options: api.CommonOptions = {}) =>
      setContext((draftCtx) => api.setSheetName(draftCtx, name, options)),

    setSheetOrder: (orderList: Record<string, number>) =>
      setContext((draftCtx) => api.setSheetOrder(draftCtx, orderList)),

    scroll: (options: {
      scrollLeft?: number;
      scrollTop?: number;
      targetRow?: number;
      targetColumn?: number;
    }) => api.scroll(context, scrollbarX, scrollbarY, options),

    addPresences: (newPresences: Presence[]) => {
      setContext((draftCtx) => {
        draftCtx.presences = _.differenceBy(
          draftCtx.presences || [],
          newPresences,
          (v) => (v.userId == null ? v.username : v.userId)
        ).concat(newPresences);
      });
    },

    removePresences: (
      arr: {
        username: string;
        userId?: string;
      }[]
    ) => {
      setContext((draftCtx) => {
        if (draftCtx.presences != null) {
          draftCtx.presences = _.differenceBy(draftCtx.presences, arr, (v) =>
            v.userId == null ? v.username : v.userId
          );
        }
      });
    },

    handleUndo: () => {
      const history = globalCache.undoList.pop();
      if (history) {
        // @ts-ignore
        setContextWithoutProduce((draftCtx: Context) => {
          const newContext = applyPatches(
            draftCtx as Context,
            history.inversePatches
          );
          const inversedOptions = inverseRowColOptions(history.options);
          if (inversedOptions?.insertRowColOp) {
            inversedOptions.restoreDeletedCells = true;
          }
          emitOp(newContext, history.inversePatches, inversedOptions);
          return newContext;
        });
      }
    },

    handleRedo: () => {
      const history = globalCache.redoList.pop();
      if (history) {
        // @ts-ignore
        setContextWithoutProduce((draftCtx) => {
          const newContext = applyPatches(draftCtx, history.patches);
          globalCache.undoList.push(history);
          emitOp(newContext, history.patches, history.options);
          return newContext;
        });
      }
    },
  };
}
