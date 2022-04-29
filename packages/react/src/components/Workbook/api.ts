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
} from "@fortune-sheet/core";
import produce, { applyPatches } from "immer";
import { SetContextOptions } from "../../context";

export function generateAPIs(
  context: Context,
  setContext: (
    recipe: (ctx: Context) => void,
    options?: SetContextOptions
  ) => void,
  cellInput: HTMLDivElement | null
) {
  return {
    applyOp: (ops: Op[]) => {
      setContext((ctx_) => {
        const [patches, specialOps] = opToPatch(ctx_, ops);
        if (specialOps.length > 0) {
          const [specialOp] = specialOps;
          if (specialOp.op === "insertRowCol") {
            ctx_ = produce(ctx_, (draftCtx) => {
              insertRowCol(draftCtx, specialOp.value);
            });
          } else if (specialOp.op === "deleteRowCol") {
            ctx_ = produce(ctx_, (draftCtx) => {
              deleteRowCol(draftCtx, specialOp.value);
            });
          } else if (specialOp.op === "addSheet") {
            ctx_ = produce(ctx_, (draftCtx) => {
              addSheet(draftCtx);
            });
          } else if (specialOp.op === "deleteSheet") {
            ctx_ = produce(ctx_, (draftCtx) => {
              deleteSheet(draftCtx, specialOp.value.index);
            });
          }
        }
        const newContext = applyPatches(ctx_, patches);
        return newContext;
      });
    },

    getCellValue: (
      row: number,
      column: number,
      options: { type?: keyof Cell; order?: number } = {}
    ) => api.getCellValue(context, row, column, options),

    setCellValue: (
      row: number,
      column: number,
      value: any,
      options: { type?: keyof Cell; order?: number } = {}
    ) =>
      setContext((draftCtx) =>
        api.setCellValue(draftCtx, row, column, value, cellInput!, options)
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
  };
}
