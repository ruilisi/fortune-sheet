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
  inverseRowColOptions,
  ensureSheetIndex,
  CellMatrix,
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
import _ from "lodash";
import Sheet from "../Sheet";
import WorkbookContext, { SetContextOptions } from "../../context";
import Toolbar from "../Toolbar";
import FxEditor from "../FxEditor";
import SheetTab from "../SheetTab";
import ContextMenu from "../ContextMenu";
import SVGDefines from "../SVGDefines";
import SheetTabContextMenu from "../ContextMenu/SheetTab";
import MoreItemsContaier from "../Toolbar/MoreItemsContainer";
import { generateAPIs } from "./api";
import { ModalProvider } from "../../context/modal";
import FilterMenu from "../ContextMenu/FilterMenu";
import SheetList from "../SheetList";

enablePatches();

export type WorkbookInstance = ReturnType<typeof generateAPIs>;

type AdditionalProps = {
  onChange?: (data: SheetType[]) => void;
  onOp?: (op: Op[]) => void;
};

const Workbook = React.forwardRef<WorkbookInstance, Settings & AdditionalProps>(
  ({ onChange, onOp, data: originalData, ...props }, ref) => {
    const [context, setContext] = useState(defaultContext());
    const cellInput = useRef<HTMLDivElement>(null);
    const fxInput = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const scrollbarX = useRef<HTMLDivElement>(null);
    const scrollbarY = useRef<HTMLDivElement>(null);
    const cellArea = useRef<HTMLDivElement>(null);
    const workbookContainer = useRef<HTMLDivElement>(null);
    const globalCache = useRef<GlobalCache>({ undoList: [], redoList: [] });
    const [moreToolbarItems, setMoreToolbarItems] =
      useState<React.ReactNode>(null);

    const mergedSettings = useMemo(
      () => _.assign(_.cloneDeep(defaultSettings), props) as Required<Settings>,
      // props expect data, onChage, onOp
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [..._.values(props)]
    );

    const initSheetData = useCallback(
      (
        draftCtx: Context,
        cellData: CellWithRowAndCol[],
        index: number
      ): CellMatrix | null => {
        const lastRow = _.maxBy<CellWithRowAndCol>(cellData, "r");
        const lastCol = _.maxBy(cellData, "c");
        const lastRowNum = Math.max(
          (lastRow?.r ?? 0) + 1,
          draftCtx.defaultrowNum
        );
        const lastColNum = Math.max(
          (lastCol?.c ?? 0) + 1,
          draftCtx.defaultcolumnNum
        );
        if (lastRowNum && lastColNum) {
          const expandedData: SheetType["data"] = _.times(lastRowNum, () =>
            _.times(lastColNum, () => null)
          );
          cellData?.forEach((d) => {
            // TODO setCellValue(draftCtx, d.r, d.c, expandedData, d.v);
            expandedData[d.r][d.c] = d.v;
          });
          draftCtx.luckysheetfile = produce(draftCtx.luckysheetfile, (d) => {
            d[index!].data = expandedData;
          });
          return expandedData;
        }
        return null;
      },
      []
    );

    const emitOp = useCallback(
      (
        ctx: Context,
        patches: Patch[],
        options?: SetContextOptions,
        undo: boolean = false
      ) => {
        if (onOp) {
          onOp(patchToOp(ctx, patches, options, undo));
        }
      },
      [onOp]
    );

    function reduceUndoList(ctx: Context, ctxBefore: Context) {
      const sheetsId = ctx.luckysheetfile.map((sheet) => sheet.id);
      const sheetDeletedByMe = globalCache.current.undoList
        .filter((undo) => undo.options?.deleteSheetOp)
        .map((item) => item.options?.deleteSheetOp?.id);
      globalCache.current.undoList = globalCache.current.undoList.filter(
        (undo) =>
          undo.options?.deleteSheetOp ||
          undo.options?.id === undefined ||
          _.indexOf(sheetsId, undo.options?.id) !== -1 ||
          _.indexOf(sheetDeletedByMe, undo.options?.id) !== -1
      );
      if (ctxBefore.luckysheetfile.length > ctx.luckysheetfile.length) {
        const sheetDeleted = ctxBefore.luckysheetfile
          .filter(
            (oneSheet) =>
              _.indexOf(
                ctx.luckysheetfile.map((item) => item.id),
                oneSheet.id
              ) === -1
          )
          .map((item) => getSheetIndex(ctxBefore, item.id as string));
        const deletedIndex = sheetDeleted[0];
        globalCache.current.undoList = globalCache.current.undoList.map(
          (oneStep) => {
            oneStep.patches = oneStep.patches.map((onePatch) => {
              if (
                typeof onePatch.path[1] === "number" &&
                onePatch.path[1] > (deletedIndex as number)
              ) {
                onePatch.path[1] -= 1;
              }
              return onePatch;
            });
            oneStep.inversePatches = oneStep.inversePatches.map((onePatch) => {
              if (
                typeof onePatch.path[1] === "number" &&
                onePatch.path[1] > (deletedIndex as number)
              ) {
                onePatch.path[1] -= 1;
              }
              return onePatch;
            });
            return oneStep;
          }
        );
      }
    }

    function dataToCelldata(data: CellMatrix) {
      const cellData: CellWithRowAndCol[] = [];
      for (let row = 0; row < data?.length; row += 1) {
        for (let col = 0; col < data[row]?.length; col += 1) {
          if (data[row][col] !== null) {
            cellData.push({
              r: row,
              c: col,
              v: data[row][col],
            });
          }
        }
      }
      return cellData;
    }

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
            let filteredInversePatches = filterPatch(inversePatches);
            if (filteredInversePatches.length > 0) {
              options.id = ctx_.currentSheetId;
              if (options.deleteSheetOp) {
                const target = ctx_.luckysheetfile.filter(
                  (sheet) => sheet.id === options.deleteSheetOp?.id
                );
                if (target) {
                  const index = getSheetIndex(
                    ctx_,
                    options.deleteSheetOp.id as string
                  ) as number;
                  options.deletedSheet = {
                    id: options.deleteSheetOp.id as string,
                    index: index as number,
                    value: _.cloneDeep(ctx_.luckysheetfile[index]),
                  };
                  options.deletedSheet!.value!.celldata = dataToCelldata(
                    options.deletedSheet!.value!.data as CellMatrix
                  );
                  delete options.deletedSheet!.value!.data;
                  options.deletedSheet.value!.status = 0;
                  filteredInversePatches = [
                    {
                      op: "add",
                      path: ["luckysheetfile", 0],
                      value: options.deletedSheet.value,
                    },
                  ];
                }
              } else if (options.addSheetOp) {
                options.addSheet = {};
                options.addSheet!.id =
                  result.luckysheetfile[result.luckysheetfile.length - 1].id;
              }
              globalCache.current.undoList.push({
                patches: filteredPatches,
                inversePatches: filteredInversePatches,
                options,
              });
              globalCache.current.redoList = [];
              emitOp(result, filteredPatches, options);
            }
          }
          if (
            patches?.[0]?.value?.luckysheetfile?.length <
            ctx_?.luckysheetfile?.length
          ) {
            reduceUndoList(result, ctx_);
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
          if (history.options?.deleteSheetOp) {
            history.inversePatches[0].path[1] = ctx_.luckysheetfile.length;
            const order = history.options.deletedSheet?.value?.order as number;
            const sheetsRight = ctx_.luckysheetfile.filter(
              (sheet) =>
                (sheet?.order as number) >= (order as number) &&
                sheet.id !== history?.options?.deleteSheetOp?.id
            );
            _.forEach(sheetsRight, (sheet) => {
              history.inversePatches.push({
                op: "replace",
                path: [
                  "luckysheetfile",
                  getSheetIndex(ctx_, sheet.id as string) as number,
                  "order",
                ],
                value: (sheet?.order as number) + 1,
              } as Patch);
            });
          }
          const newContext = applyPatches(ctx_, history.inversePatches);
          globalCache.current.redoList.push(history);
          const inversedOptions = inverseRowColOptions(history.options);
          if (inversedOptions?.insertRowColOp) {
            inversedOptions.restoreDeletedCells = true;
          }
          if (history.options?.addSheetOp) {
            const index = getSheetIndex(
              ctx_,
              history.options.addSheet!.id as string
            ) as number;
            inversedOptions!.addSheet = {
              id: history.options.addSheet!.id as string,
              index: index as number,
              value: _.cloneDeep(ctx_.luckysheetfile[index]),
            };
            inversedOptions!.addSheet!.value!.celldata = dataToCelldata(
              inversedOptions!.addSheet!.value?.data as CellMatrix
            );
            delete inversedOptions!.addSheet!.value!.data;
          }
          emitOp(newContext, history.inversePatches, inversedOptions, true);
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

    useEffect(() => {
      if (context.luckysheet_select_save != null) {
        mergedSettings.hooks?.afterSelectionChange?.(
          context.currentSheetId,
          context.luckysheet_select_save[0]
        );
      }
    }, [
      context.currentSheetId,
      context.luckysheet_select_save,
      mergedSettings.hooks,
    ]);

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
          canvas,
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
          draftCtx.defaultcolumnNum = mergedSettings.column;
          draftCtx.defaultrowNum = mergedSettings.row;
          draftCtx.defaultFontSize = mergedSettings.defaultFontSize;
          draftCtx.rowHeaderWidth = mergedSettings.rowHeaderWidth || 1.5;
          draftCtx.columnHeaderHeight =
            mergedSettings.columnHeaderHeight || 1.5;
          if (_.isEmpty(draftCtx.luckysheetfile)) {
            const newData = produce(originalData, (draftData) => {
              ensureSheetIndex(draftData, mergedSettings.generateSheetId);
            });
            draftCtx.luckysheetfile = newData;
            newData.forEach((newDatum) => {
              const index = getSheetIndex(draftCtx, newDatum.id!) as number;
              const sheet = draftCtx.luckysheetfile?.[index];
              const cellData = sheet.celldata;
              initSheetData(draftCtx, cellData!, index);
            });
          }
          draftCtx.lang = mergedSettings.lang;
          draftCtx.allowEdit = mergedSettings.allowEdit;
          draftCtx.hooks = mergedSettings.hooks;
          // draftCtx.fontList = mergedSettings.fontList;
          if (_.isEmpty(draftCtx.currentSheetId)) {
            initSheetIndex(draftCtx);
          }
          let sheetIdx = getSheetIndex(draftCtx, draftCtx.currentSheetId);
          if (sheetIdx == null) {
            if ((draftCtx.luckysheetfile?.length ?? 0) > 0) {
              sheetIdx = 0;
              draftCtx.currentSheetId = draftCtx.luckysheetfile[0].id!;
            }
          }
          if (sheetIdx == null) return;

          const sheet = draftCtx.luckysheetfile?.[sheetIdx];
          if (!sheet) return;

          const cellData = sheet.celldata;
          let { data } = sheet;
          // expand cell data
          if (_.isEmpty(data)) {
            const temp = initSheetData(draftCtx, cellData!, sheetIdx);
            if (!_.isNull(temp)) {
              data = temp;
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

          draftCtx.config = _.isNil(sheet.config) ? {} : sheet.config;
          draftCtx.insertedImgs = sheet.images;

          draftCtx.zoomRatio = _.isNil(sheet.zoomRatio) ? 1 : sheet.zoomRatio;

          if (!_.isNil(sheet.defaultRowHeight)) {
            draftCtx.defaultrowlen = Number(sheet.defaultRowHeight);
          } else {
            draftCtx.defaultrowlen = mergedSettings.defaultRowHeight;
          }

          if (!_.isNil(sheet.addRows)) {
            draftCtx.addDefaultRows = Number(sheet.addRows);
          } else {
            draftCtx.addDefaultRows = mergedSettings.addRows;
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
      context.currentSheetId,
      context.luckysheetfile.length,
      originalData,
      mergedSettings.defaultRowHeight,
      mergedSettings.defaultColWidth,
      mergedSettings.column,
      mergedSettings.row,
      mergedSettings.defaultFontSize,
      mergedSettings.lang,
      mergedSettings.allowEdit,
      mergedSettings.hooks,
      mergedSettings.generateSheetId,
      setContextWithProduce,
      initSheetData,
      mergedSettings.rowHeaderWidth,
      mergedSettings.columnHeaderHeight,
      mergedSettings.addRows,
    ]);

    const onKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        const { nativeEvent } = e;
        setContextWithProduce((draftCtx) => {
          handleGlobalKeyDown(
            draftCtx,
            cellInput.current!,
            fxInput.current!,
            nativeEvent,
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
        // deal with multi instance case, only the focused sheet handles the paste
        if (cellInput.current === document.activeElement) {
          setContextWithProduce((draftCtx) => {
            try {
              handlePaste(draftCtx, e);
            } catch (err: any) {
              console.error(err);
            }
          });
        }
      },
      [setContextWithProduce]
    );

    const onMoreToolbarItemsClose = useCallback(() => {
      setMoreToolbarItems(null);
    }, []);

    useEffect(() => {
      document.addEventListener("paste", onPaste);
      return () => {
        document.removeEventListener("paste", onPaste);
      };
    }, [onPaste]);

    // expose APIs
    useImperativeHandle(
      ref,
      () =>
        generateAPIs(
          context,
          setContextWithProduce,
          emitOp,
          setContext,
          globalCache.current,
          mergedSettings,
          cellInput.current,
          scrollbarX.current,
          scrollbarY.current
        ),
      [context, mergedSettings, setContextWithProduce, emitOp]
    );

    const i = getSheetIndex(context, context.currentSheetId);
    if (i == null) {
      return null;
    }
    const sheet = context.luckysheetfile?.[i];
    if (!sheet) {
      return null;
    }

    return (
      <WorkbookContext.Provider value={providerValue}>
        <ModalProvider>
          <div
            className="fortune-container"
            ref={workbookContainer}
            onKeyDown={onKeyDown}
          >
            <SVGDefines />
            <div className="fortune-workarea">
              {mergedSettings.showToolbar && (
                <Toolbar
                  moreItemsOpen={moreToolbarItems !== null}
                  setMoreItems={setMoreToolbarItems}
                />
              )}
              {mergedSettings.showFormulaBar && <FxEditor />}
            </div>
            <Sheet sheet={sheet} />
            {mergedSettings.showSheetTabs && <SheetTab />}
            <ContextMenu />
            <FilterMenu />
            <SheetTabContextMenu />
            {context.showSheetList && <SheetList />}
            {moreToolbarItems && (
              <MoreItemsContaier onClose={onMoreToolbarItemsClose}>
                {moreToolbarItems}
              </MoreItemsContaier>
            )}
            {!_.isEmpty(context.contextMenu) && (
              <div
                onMouseDown={() => {
                  setContextWithProduce((draftCtx) => {
                    draftCtx.contextMenu = undefined;
                    draftCtx.filterContextMenu = undefined;
                    draftCtx.showSheetList = undefined;
                  });
                }}
                onMouseMove={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="fortune-popover-backdrop"
              />
            )}
          </div>
        </ModalProvider>
      </WorkbookContext.Provider>
    );
  }
);

export default Workbook;
