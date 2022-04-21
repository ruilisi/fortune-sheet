import {
  defaultContext,
  defaultSettings,
  Settings,
  Context,
  initSheetIndex,
  CellWithRowAndCol,
  GlobalCache,
  Sheet as SheetType,
  handleGlobalKeyDown,
  getSheetIndex,
  handlePaste,
  filterPatch,
  patchToOp,
  Op,
  opToPatch,
  inverseRowColOptions,
  insertRowCol,
  deleteRowCol,
  addSheet,
  deleteSheet,
  ensureSheetIndex,
} from "@fortune-sheet/core";
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  useImperativeHandle,
} from "react";
import "./index.css";
import produce, {
  applyPatches,
  enablePatches,
  Patch,
  produceWithPatches,
} from "immer";
import _, { assign } from "lodash";
import Sheet from "../Sheet";
import WorkbookContext, { SetContextOptions } from "../../context";
import Toolbar from "../Toolbar";
import FxEditor from "../FxEditor";
import SheetTab from "../SheetTab";
import ContextMenu from "../ContextMenu";
import SVGDefines from "../SVGDefines";
import SheetTabContextMenu from "../ContextMenu/SheetTab";

enablePatches();

export type WorkbookInstance = {
  applyOp: (ops: Op[]) => void;
};

type AdditionalProps = {
  onChange?: (data: SheetType[]) => void;
  onOp?: (op: Op[]) => void;
};

const Workbook = React.forwardRef<WorkbookInstance, Settings & AdditionalProps>(
  ({ onChange, onOp, ...props }, ref) => {
    const [context, setContext] = useState(defaultContext());
    const cellInput = useRef<HTMLDivElement>(null);
    const fxInput = useRef<HTMLDivElement>(null);
    const scrollbarX = useRef<HTMLDivElement>(null);
    const scrollbarY = useRef<HTMLDivElement>(null);
    const cellArea = useRef<HTMLDivElement>(null);
    const workbookContainer = useRef<HTMLDivElement>(null);
    const globalCache = useRef<GlobalCache>({ undoList: [], redoList: [] });

    const mergedSettings = useMemo(
      () => assign(_.cloneDeep(defaultSettings), props) as Required<Settings>,
      [props]
    );

    const applyOp = useCallback((ops: Op[]) => {
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
    }, []);

    const emitOp = useCallback(
      (ctx: Context, patches: Patch[], options?: SetContextOptions) => {
        if (onOp) {
          onOp(patchToOp(ctx, patches, options));
        }
      },
      [onOp]
    );

    useImperativeHandle(ref, () => ({ applyOp }));

    const setContextWithProduce = useCallback(
      (recipe: (ctx: Context) => void, options: SetContextOptions = {}) => {
        setContext((ctx_) => {
          const [result, patches, inversePatches] = produceWithPatches(
            ctx_,
            recipe
          );
          if (patches.length > 0 && !options.noHistory) {
            if (options.logPatch) {
              // eslint-disable-next-line no-console
              console.info("patch", patches);
            }
            const filteredPatches = filterPatch(patches);
            const filteredInversePatches = filterPatch(inversePatches);
            if (filteredInversePatches.length > 0) {
              if (!options.addSheetOp && !options.deleteSheetOp) {
                // add and delete sheet does not support undo/redo
                globalCache.current.undoList.push({
                  patches: filteredPatches,
                  inversePatches: filteredInversePatches,
                  options,
                });
                globalCache.current.redoList = [];
              }
              emitOp(result, filteredPatches, options);
            }
          }
          return result;
        });
      },
      [emitOp]
    );

    const handleUndo = useCallback(() => {
      const history = globalCache.current.undoList.pop();
      if (history) {
        setContext((ctx_) => {
          const newContext = applyPatches(ctx_, history.inversePatches);
          globalCache.current.redoList.push(history);
          const inversedOptions = inverseRowColOptions(history.options);
          if (inversedOptions?.insertRowColOp) {
            inversedOptions.restoreDeletedCells = true;
          }
          emitOp(newContext, history.inversePatches, inversedOptions);
          return newContext;
        });
      }
    }, [emitOp]);

    const handleRedo = useCallback(() => {
      const history = globalCache.current.redoList.pop();
      if (history) {
        setContext((ctx_) => {
          const newContext = applyPatches(ctx_, history.patches);
          globalCache.current.undoList.push(history);
          emitOp(newContext, history.patches, history.options);
          return newContext;
        });
      }
    }, [emitOp]);

    const providerValue = useMemo(
      () => ({
        context,
        setContext: setContextWithProduce,
        settings: mergedSettings,
        handleUndo,
        handleRedo,
        refs: {
          globalCache: globalCache.current,
          cellInput,
          fxInput,
          scrollbarX,
          scrollbarY,
          cellArea,
          workbookContainer,
        },
      }),
      [context, handleRedo, handleUndo, mergedSettings, setContextWithProduce]
    );

    useEffect(() => {
      if (!_.isEmpty(context.luckysheetfile)) {
        onChange?.(context.luckysheetfile);
      }
    }, [context.luckysheetfile, onChange]);

    useEffect(() => {
      setContextWithProduce(
        (draftCtx) => {
          if (_.isEmpty(draftCtx.luckysheetfile)) {
            const newData = produce(mergedSettings.data, (draftData) => {
              ensureSheetIndex(draftData);
            });
            draftCtx.luckysheetfile = newData;
          }
          draftCtx.defaultcolumnNum = mergedSettings.column;
          draftCtx.defaultrowNum = mergedSettings.row;
          draftCtx.defaultFontSize = mergedSettings.defaultFontSize;
          draftCtx.fullscreenmode = mergedSettings.fullscreenmode;
          draftCtx.lang = mergedSettings.lang;
          draftCtx.allowEdit = mergedSettings.allowEdit;
          draftCtx.limitSheetNameLength = mergedSettings.limitSheetNameLength;
          draftCtx.defaultSheetNameMaxLength =
            mergedSettings.defaultSheetNameMaxLength;
          // draftCtx.fontList = mergedSettings.fontList;
          if (_.isEmpty(draftCtx.currentSheetIndex)) {
            initSheetIndex(draftCtx);
          }
          let sheetIdx = getSheetIndex(draftCtx, draftCtx.currentSheetIndex);
          if (sheetIdx == null) {
            if ((draftCtx.luckysheetfile?.length ?? 0) > 0) {
              sheetIdx = 0;
              draftCtx.currentSheetIndex = draftCtx.luckysheetfile[0].index!;
            }
          }
          if (sheetIdx == null) return;

          const sheet = draftCtx.luckysheetfile?.[sheetIdx];
          if (!sheet) return;

          const cellData = sheet.celldata;
          let { data } = sheet;
          // expand cell data
          if (_.isEmpty(data)) {
            const lastRow = _.maxBy<CellWithRowAndCol>(cellData, "r");
            const lastCol = _.maxBy(cellData, "c");
            const lastRowNum = Math.max(
              lastRow?.r ?? 0,
              draftCtx.defaultrowNum
            );
            const lastColNum = Math.max(
              lastCol?.c ?? 0,
              draftCtx.defaultcolumnNum
            );
            if (lastRowNum && lastColNum) {
              const expandedData: SheetType["data"] = _.times(
                lastRowNum + 1,
                () => _.times(lastColNum + 1, () => null)
              );
              cellData?.forEach((d) => {
                // TODO setCellValue(draftCtx, d.r, d.c, expandedData, d.v);
                expandedData[d.r][d.c] = d.v;
              });
              draftCtx.luckysheetfile = produce(
                draftCtx.luckysheetfile,
                (d) => {
                  d[sheetIdx!].data = expandedData;
                }
              );
              data = expandedData;
            }
          }

          if (
            _.isEmpty(draftCtx.luckysheet_select_save) &&
            !_.isEmpty(sheet.luckysheet_select_save)
          ) {
            draftCtx.luckysheet_select_save = sheet.luckysheet_select_save;
          }
          if (draftCtx.luckysheet_select_save?.length === 0) {
            if (
              data?.[0]?.[0]?.mc &&
              !_.isNil(data?.[0]?.[0]?.mc?.rs) &&
              !_.isNil(data?.[0]?.[0]?.mc?.cs)
            ) {
              draftCtx.luckysheet_select_save = [
                {
                  row: [0, data[0][0].mc.rs - 1],
                  column: [0, data[0][0].mc.cs - 1],
                },
              ];
            } else {
              draftCtx.luckysheet_select_save = [
                {
                  row: [0, 0],
                  column: [0, 0],
                },
              ];
            }
          }

          draftCtx.luckysheet_selection_range = _.isNil(
            sheet.luckysheet_selection_range
          )
            ? []
            : sheet.luckysheet_selection_range;
          draftCtx.config = _.isNil(sheet.config) ? {} : sheet.config;

          draftCtx.zoomRatio = _.isNil(sheet.zoomRatio) ? 1 : sheet.zoomRatio;

          if (!_.isNil(sheet.defaultRowHeight)) {
            draftCtx.defaultrowlen = Number(sheet.defaultRowHeight);
          } else {
            draftCtx.defaultrowlen = mergedSettings.defaultRowHeight;
          }

          if (!_.isNil(sheet.defaultColWidth)) {
            draftCtx.defaultcollen = Number(sheet.defaultColWidth);
          } else {
            draftCtx.defaultcollen = mergedSettings.defaultColWidth;
          }

          if (!_.isNil(sheet.showGridLines)) {
            const { showGridLines } = sheet;
            if (showGridLines === 0 || showGridLines === false) {
              draftCtx.showGridLines = false;
            } else {
              draftCtx.showGridLines = true;
            }
          } else {
            draftCtx.showGridLines = true;
          }
          if (_.isNil(mergedSettings.lang)) {
            const lang =
              (navigator.languages && navigator.languages[0]) || // 兼容chromium内核浏览器
              navigator.language || // 兼容剩余浏览器
              // @ts-ignore
              navigator.userLanguage; // 兼容IE浏览器
            draftCtx.lang = lang;
          }
        },
        { noHistory: true }
      );
    }, [
      context.currentSheetIndex,
      context.luckysheetfile.length,
      mergedSettings.data,
      mergedSettings.defaultRowHeight,
      mergedSettings.defaultColWidth,
      mergedSettings.column,
      mergedSettings.row,
      mergedSettings.defaultFontSize,
      mergedSettings.fullscreenmode,
      mergedSettings.lang,
      mergedSettings.allowEdit,
      mergedSettings.limitSheetNameLength,
      mergedSettings.defaultSheetNameMaxLength,
      setContextWithProduce,
    ]);

    const onKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        setContextWithProduce((draftCtx) => {
          handleGlobalKeyDown(
            draftCtx,
            cellInput.current!,
            fxInput.current!,
            e.nativeEvent,
            globalCache.current!,
            handleUndo,
            handleRedo
          );
        });
      },
      [handleRedo, handleUndo, setContextWithProduce]
    );

    const onPaste = useCallback(
      (e: ClipboardEvent) => {
        setContextWithProduce((draftCtx) => {
          handlePaste(draftCtx, e);
        });
      },
      [setContextWithProduce]
    );

    useEffect(() => {
      document.addEventListener("paste", onPaste);
      return () => {
        document.removeEventListener("paste", onPaste);
      };
    }, [onPaste]);

    const i = getSheetIndex(context, context.currentSheetIndex);
    if (i == null) {
      return null;
    }
    const sheet = context.luckysheetfile?.[i];
    if (!sheet) {
      return null;
    }

    return (
      <WorkbookContext.Provider value={providerValue}>
        <div
          className="fortune-container"
          ref={workbookContainer}
          onKeyDown={onKeyDown}
        >
          <SVGDefines />
          <div className="fortune-workarea">
            <Toolbar />
            <FxEditor />
          </div>
          <Sheet sheet={sheet} />
          <SheetTab />
          <ContextMenu />
          <SheetTabContextMenu />
          {!_.isEmpty(context.contextMenu) && (
            <div
              onMouseDown={() => {
                setContextWithProduce((draftCtx) => {
                  draftCtx.contextMenu = undefined;
                });
              }}
              onMouseMove={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="fortune-popover-backdrop"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 1003, // should below .fortune-context-menu
                height: "100%",
                width: "100%",
              }}
            />
          )}
        </div>
      </WorkbookContext.Provider>
    );
  }
);

export default Workbook;
