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
  locale,
  setCaretPosition,
  CellMatrix,
  CellWithRowAndCol,
} from "@fileverse-dev/fortune-core";
import { applyPatches } from "immer";
import _ from "lodash";
import { SetContextOptions } from "../../context";

export function generateAPIs(
  context: Context,
  setContext: (
    recipe: (ctx: Context) => void,
    options?: SetContextOptions
  ) => void,
  handleUndo: () => void,
  handleRedo: () => void,
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
              try {
                insertRowCol(ctx_, specialOp.value, false);
              } catch (e: any) {
                console.error(e);
              }
            } else if (specialOp.op === "deleteRowCol") {
              deleteRowCol(ctx_, specialOp.value);
            } else if (specialOp.op === "addSheet") {
              const name = patches.filter(
                (path) => path.path[0] === "name"
              )?.[0]?.value;
              if (specialOp.value?.id) {
                addSheet(
                  ctx_,
                  settings,
                  specialOp.value.id,
                  false,
                  name,
                  specialOp.value
                );
              }
              // 添加addSheet完后，给sheet初始化data
              const fileIndex = getSheetIndex(
                ctx_,
                specialOp.value.id
              ) as number;
              api.initSheetData(ctx_, fileIndex, specialOp.value);
            } else if (specialOp.op === "deleteSheet") {
              deleteSheet(ctx_, specialOp.value.id);
              patches.length = 0;
            }
          }
          if (ops[0]?.path?.[0] === "filter_select")
            ctx_.luckysheet_filter_save = ops[0].value;
          else if (ops[0]?.path?.[0] === "hide") {
            //  hide sheet
            if (ctx_.currentSheetId === ops[0].id) {
              const shownSheets = ctx_.luckysheetfile.filter(
                (sheet) =>
                  (_.isUndefined(sheet.hide) || sheet?.hide !== 1) &&
                  sheet.id !== ops[0].id
              );
              ctx_.currentSheetId = _.sortBy(
                shownSheets,
                (sheet) => sheet.order
              )[0].id as string;
            }
          }
          createFilterOptions(ctx_, ctx_.luckysheet_filter_save, ops[0]?.id);
          if (patches.length === 0) return;
          try {
            applyPatches(ctx_, patches);
          } catch (e) {
            console.error(e);
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

    onboardingActiveCell: (functionName : string)=>{
        const { functionlist } = locale(context);
        const last =
              context.luckysheet_select_save?.[
                context.luckysheet_select_save.length - 1
              ];
            let row_index = last?.row_focus;
            let col_index = last?.column_focus;
            if (!last) {
              row_index = 0;
              col_index = 0;
            } else {
              if (row_index == null) {
                [row_index] = last.row;
              }
              if (col_index == null) {
                [col_index] = last.column;
              }
            }
            const formulaTxt = `<span>=</span><span>${functionName}</span><span>(</span>`;
            setContext((ctx) => {
              if (cellInput != null) {
                ctx.luckysheetCellUpdate = [row_index, col_index];
                cellInput.innerHTML = formulaTxt;
                const spans = cellInput.childNodes;
                if (!_.isEmpty(spans)) {
                  setCaretPosition(
                    ctx,
                    spans[spans.length - 1] as HTMLSpanElement,
                    0,
                    1
                  );
                }
                ctx.functionHint = functionName;
                ctx.functionCandidates = [];
                if (_.isEmpty(ctx.formulaCache.functionlistMap)) {
                  for (let i = 0; i < functionlist.length; i += 1) {
                    ctx.formulaCache.functionlistMap[functionlist[i].n] =
                      functionlist[i];
                  }
                }
              }
            });
    },

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

    hideRowOrColumn: (rowOrColInfo: string[], type: "row" | "column") =>
      setContext((draftCtx) =>
        api.hideRowOrColumn(draftCtx, rowOrColInfo, type)
      ),

    showRowOrColumn: (rowOrColInfo: string[], type: "row" | "column") =>
      setContext((draftCtx) =>
        api.showRowOrColumn(draftCtx, rowOrColInfo, type)
      ),

    setRowHeight: (
      rowInfo: Record<string, number>,
      options: api.CommonOptions = {},
      custom: boolean = false
    ) =>
      setContext((draftCtx) =>
        api.setRowHeight(draftCtx, rowInfo, options, custom)
      ),

    setColumnWidth: (
      columnInfo: Record<string, number>,
      options: api.CommonOptions = {},
      custom: boolean = false
    ) =>
      setContext((draftCtx) =>
        api.setColumnWidth(draftCtx, columnInfo, options, custom)
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

    updateSheet: (data: Sheet[]) =>
      setContext((draftCtx) => api.updateSheet(draftCtx, data)),

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

    handleUndo,
    handleRedo,

    calculateFormula: () => {
      setContext((draftCtx) => {
        _.forEach(draftCtx.luckysheetfile, (sheet_obj) => {
          api.calculateSheetFromula(draftCtx, sheet_obj.id as string);
        });
      });
    },

    dataToCelldata: (data: CellMatrix | undefined) => {
      return api.dataToCelldata(data);
    },

    celldataToData: (
      celldata: CellWithRowAndCol[],
      rowCount?: number,
      colCount?: number
    ) => {
      return api.celldataToData(celldata, rowCount, colCount);
    },
  };
}
