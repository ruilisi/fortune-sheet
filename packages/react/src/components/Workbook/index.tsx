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
  insertRowCol,
  locale,
  calcSelectionInfo,
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
import SVGIcon from "../SVGIcon";

enablePatches();

export type WorkbookInstance = ReturnType<typeof generateAPIs>;

type AdditionalProps = {
  onChange?: (data: SheetType[]) => void;
  onOp?: (op: Op[]) => void;
};

const Workbook = React.forwardRef<WorkbookInstance, Settings & AdditionalProps>(
  ({ onChange, onOp, data: originalData, ...props }, ref) => {
    const [context, setContext] = useState(defaultContext());
    const { formula } = locale(context);
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

    const [calInfo, setCalInfo] = useState<{
      numberC: number;
      count: number;
      sum: number;
      max: number;
      min: number;
      average: string;
    }>({
      numberC: 0,
      count: 0,
      sum: 0,
      max: 0,
      min: 0,
      average: "",
    });

    const cursorRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const isDragRef = useRef(false);
    const shortcutRef = useRef<HTMLDivElement>(null);

    const mergedSettings = useMemo(
      () => _.assign(_.cloneDeep(defaultSettings), props) as Required<Settings>,
      // props expect data, onChage, onOp
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [..._.values(props)]
    );

    // 计算选区的信息
    useEffect(() => {
      const selection = context.luckysheet_select_save;
      if (selection) {
        const re = calcSelectionInfo(context);
        setCalInfo(re);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context.luckysheet_select_save]);

    const initSheetData = useCallback(
      (
        draftCtx: Context,
        newData: SheetType,
        index: number
      ): CellMatrix | null => {
        const { celldata, row, column } = newData;
        const lastRow = _.maxBy<CellWithRowAndCol>(celldata, "r");
        const lastCol = _.maxBy(celldata, "c");
        let lastRowNum = (lastRow?.r ?? 0) + 1;
        let lastColNum = (lastCol?.c ?? 0) + 1;
        if (row != null && column != null && row > 0 && column > 0) {
          lastRowNum = Math.max(lastRowNum, row);
          lastColNum = Math.max(lastColNum, column);
        } else {
          lastRowNum = Math.max(lastRowNum, draftCtx.defaultrowNum);
          lastColNum = Math.max(lastColNum, draftCtx.defaultcolumnNum);
        }
        if (lastRowNum && lastColNum) {
          const expandedData: SheetType["data"] = _.times(lastRowNum, () =>
            _.times(lastColNum, () => null)
          );
          celldata?.forEach((d) => {
            // TODO setCellValue(draftCtx, d.r, d.c, expandedData, d.v);
            expandedData[d.r][d.c] = d.v;
          });
          draftCtx.luckysheetfile = produce(draftCtx.luckysheetfile, (d) => {
            d[index!].data = expandedData;
            delete d[index!].celldata;
            return d;
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
          } else {
            if (patches?.[0]?.value?.length < ctx_?.luckysheetfile?.length) {
              reduceUndoList(result, ctx_);
            }
          }
          return result;
        });
      },
      [emitOp]
    );

    // 更改页面缩放
    const changeZoom = useCallback(
      (operate: string) => {
        setContextWithProduce(
          (ctx: Context) => {
            const index = getSheetIndex(ctx, ctx.currentSheetId) as number;

            if (!ctx.luckysheetfile[index].zoomRatio) {
              ctx.luckysheetfile[index].zoomRatio = 1;
            }

            if (
              operate === "zoomIn" &&
              ctx.luckysheetfile[index].zoomRatio! < 4
            ) {
              ctx.luckysheetfile[index].zoomRatio! = parseFloat(
                (ctx.luckysheetfile[index].zoomRatio! + 0.1).toFixed(1)
              );
            }
            if (
              operate === "zoomOut" &&
              ctx.luckysheetfile[index].zoomRatio! > 0.1
            ) {
              ctx.luckysheetfile[index].zoomRatio! = parseFloat(
                (ctx.luckysheetfile[index].zoomRatio! - 0.1).toFixed(1)
              );
            }

            if (ctx.luckysheetfile[index].zoomRatio! > 1) {
              cursorRef.current!.style.left = `${(
                46 +
                (5 / 3) * (ctx.luckysheetfile[index].zoomRatio! - 1) * 10
              ).toFixed(1)}px`;
            } else {
              cursorRef.current!.style.left = `${(
                46 -
                (50 / 9) * (1 - ctx.luckysheetfile[index].zoomRatio!) * 10
              ).toFixed(1)}px`;
            }

            return ctx;
          },
          { noHistory: true }
        );
      },
      [setContextWithProduce]
    );

    // 点击缩放条缩放
    const tapToZoom = useCallback(
      (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        setContextWithProduce(
          (ctx: Context) => {
            const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
            const sliderRect = sliderRef.current!.getBoundingClientRect();
            const left = e.pageX - sliderRect.left;

            cursorRef.current!.style.left = `${left}px`;
            if (left > 46 && left <= 96) {
              ctx.luckysheetfile[index].zoomRatio! = (left - 46) * 0.06 + 1;
            } else {
              ctx.luckysheetfile[index].zoomRatio! =
                1 - (46 - left) * 0.1 * 0.18;
            }
            ctx.zoomRatio = ctx.luckysheetfile[index].zoomRatio!;
          },
          { noHistory: true }
        );
      },
      [setContextWithProduce]
    );

    // 滑动小球缩放
    const dragToScale = useCallback(
      (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        setContextWithProduce(
          (ctx: Context) => {
            if (isDragRef.current) {
              const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
              const sliderRect = sliderRef.current!.getBoundingClientRect();
              const left = e.pageX - sliderRect.left - 4;
              // 防止小球滑出缩放条
              if (left <= 96 && left >= -4) {
                cursorRef.current!.style.left = `${left}px`;
                if (left > 46 && left <= 96) {
                  ctx.luckysheetfile[index].zoomRatio! = (left - 46) * 0.06 + 1;
                } else {
                  ctx.luckysheetfile[index].zoomRatio! =
                    1 - (46 - left) * 0.1 * 0.18;
                }
              }
              ctx.zoomRatio = ctx.luckysheetfile[index].zoomRatio!;
            }
          },
          { noHistory: true }
        );
      },
      [setContextWithProduce]
    );

    const handleMouseDown = useCallback(() => {
      isDragRef.current = true;
    }, []);

    const handleMouseUp = useCallback(() => {
      isDragRef.current = false;
    }, []);

    const handleMouseLeave = useCallback(() => {
      isDragRef.current = false;
    }, []);

    const showShortcut = useCallback(() => {
      shortcutRef.current!.style.display = "block";
    }, []);

    // 缩放快捷栏
    const shortcutZoom = useCallback(
      (ratioInfo: string) => {
        setContextWithProduce(
          (ctx: Context) => {
            const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
            // 更改信息显示
            const ratio = parseInt(ratioInfo.replace(/%/g, ""), 10);

            // 更改缩放倍率
            ctx.luckysheetfile[index].zoomRatio = ratio / 100;

            // 更改小球位置
            if (ratio >= 100) {
              cursorRef.current!.style.left = `${(
                46 +
                (5 / 3) * (ctx.luckysheetfile[index].zoomRatio! - 1) * 10
              ).toFixed(1)}px`;
            } else {
              cursorRef.current!.style.left = `${(
                46 -
                (50 / 9) * (1 - ctx.luckysheetfile[index].zoomRatio!) * 10
              ).toFixed(1)}px`;
            }
            ctx.zoomRatio = ctx.luckysheetfile[index].zoomRatio!;
          },
          { noHistory: true }
        );
      },
      [setContextWithProduce]
    );

    const handleMenuMouseLeave = useCallback(() => {
      shortcutRef.current!.style.display = "none";
    }, []);

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
              initSheetData(draftCtx, sheet, index);
            });
          }
          if (mergedSettings.devicePixelRatio > 0) {
            draftCtx.devicePixelRatio = mergedSettings.devicePixelRatio;
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

          let { data } = sheet;
          // expand cell data
          if (_.isEmpty(data)) {
            const temp = initSheetData(draftCtx, sheet, sheetIdx);
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
      mergedSettings.devicePixelRatio,
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
        // handling undo and redo ahead because handleUndo and handleRedo
        // themselves are calling setContext, and should not be nested
        // in setContextWithProduce.
        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          e.stopPropagation();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "y") {
          handleRedo();
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        setContextWithProduce((draftCtx) => {
          handleGlobalKeyDown(
            draftCtx,
            cellInput.current!,
            fxInput.current!,
            nativeEvent,
            globalCache.current!,
            handleUndo, // still passing handleUndo and handleRedo here to satisfy API
            handleRedo,
            canvas.current!.getContext("2d")!
          );
        });
      },
      [handleRedo, handleUndo, setContextWithProduce]
    );

    const onPaste = useCallback(
      (e: ClipboardEvent) => {
        // deal with multi instance case, only the focused sheet handles the paste
        if (
          cellInput.current === document.activeElement ||
          document.activeElement?.className === "fortune-sheet-overlay"
        ) {
          let { clipboardData } = e;
          if (!clipboardData) {
            // @ts-ignore
            // for IE
            clipboardData = window.clipboardData;
          }
          const txtdata =
            clipboardData!.getData("text/html") ||
            clipboardData!.getData("text/plain");
          const ele = document.createElement("div");
          ele.innerHTML = txtdata;

          const trList = ele.querySelectorAll("table tr");
          const maxRow =
            trList.length + context.luckysheet_select_save![0].row[0];
          const rowToBeAdded =
            maxRow -
            context.luckysheetfile[
              getSheetIndex(
                context,
                context!.currentSheetId! as string
              ) as number
            ].data!.length;
          const range = context.luckysheet_select_save;
          if (rowToBeAdded > 0) {
            const insertRowColOp: SetContextOptions["insertRowColOp"] = {
              type: "row",
              index:
                context.luckysheetfile[
                  getSheetIndex(
                    context,
                    context!.currentSheetId! as string
                  ) as number
                ].data!.length - 1,
              count: rowToBeAdded,
              direction: "rightbottom",
              id: context.currentSheetId,
            };
            setContextWithProduce(
              (draftCtx) => {
                insertRowCol(draftCtx, insertRowColOp);
                draftCtx.luckysheet_select_save = range;
              },
              {
                insertRowColOp,
              }
            );
          }
          setContextWithProduce((draftCtx) => {
            try {
              handlePaste(draftCtx, e);
            } catch (err: any) {
              console.error(err);
            }
          });
        }
      },
      [context, setContextWithProduce]
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
          handleUndo,
          handleRedo,
          mergedSettings,
          cellInput.current,
          scrollbarX.current,
          scrollbarY.current
        ),
      [context, setContextWithProduce, handleUndo, handleRedo, mergedSettings]
    );

    const i = getSheetIndex(context, context.currentSheetId);
    if (i == null) {
      return null;
    }
    const sheet = context.luckysheetfile?.[i];
    if (!sheet) {
      return null;
    }

    const zoomRatioItems = [
      {
        text: "10%",
        value: 0.1,
      },
      {
        text: "30%",
        value: 0.3,
      },
      {
        text: "50%",
        value: 0.5,
      },
      {
        text: "70%",
        value: 0.7,
      },
      {
        text: "100%",
        value: 1,
      },
      {
        text: "150%",
        value: 1.5,
      },
      {
        text: "200%",
        value: 2,
      },
      {
        text: "300%",
        value: 3,
      },
      {
        text: "400%",
        value: 4,
      },
    ];

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
                    draftCtx.contextMenu = {};
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
            <div className="fortune-stat-area">
              <div className="luckysheet-sheet-selection-calInfo">
                {!!calInfo.count && (
                  <div style={{ width: "60px" }}>
                    {formula.count}: {calInfo.count}
                  </div>
                )}
                {!!calInfo.numberC && !!calInfo.sum && (
                  <div>
                    {formula.sum}: {calInfo.sum}
                  </div>
                )}
                {!!calInfo.numberC && !!calInfo.average && (
                  <div>
                    {formula.average}: {calInfo.average}
                  </div>
                )}
                {!!calInfo.numberC && !!calInfo.max && (
                  <div>
                    {formula.max}: {calInfo.max}
                  </div>
                )}
                {!!calInfo.numberC && !!calInfo.min && (
                  <div>
                    {formula.min}: {calInfo.min}
                  </div>
                )}
              </div>
              <div className="fortune-zoom-content">
                <div className="fortunesheet-zoom-content">
                  <div
                    className="fortunesheet-zoom-minus fortunesheet-zoom-color"
                    onClick={(e) => {
                      changeZoom("zoomOut");
                      e.stopPropagation();
                    }}
                  >
                    <SVGIcon name="minus" width={16} height={16} />
                  </div>
                  <div
                    ref={sliderRef}
                    className="fortunesheet-zoom-slider"
                    onClick={(e) => {
                      tapToZoom(e);
                      e.stopPropagation();
                    }}
                  >
                    <div className="fortunesheet-zoom-line" />
                    <div
                      className="fortunesheet-zoom-cursor"
                      style={{
                        left:
                          context.zoomRatio > 1
                            ? `${(
                                46 +
                                (5 / 3) * (context.zoomRatio! - 1) * 10
                              ).toFixed(1)}px`
                            : `${(
                                46 -
                                (50 / 9) * (1 - context.zoomRatio!) * 10
                              ).toFixed(1)}px`,
                      }}
                      ref={cursorRef}
                      onMouseDown={handleMouseDown}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                      onMouseMove={(e) => {
                        dragToScale(e);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                    <div className="fortunesheet-zoom-hundred" />
                  </div>
                  <div
                    className="fortunesheet-zoom-plus fortunesheet-zoom-color"
                    onClick={(e) => {
                      changeZoom("zoomIn");
                      e.stopPropagation();
                    }}
                  >
                    <SVGIcon name="plus" width={16} height={16} />
                  </div>
                </div>
              </div>
              <div className="fortunesheet-zoom-ratio">
                <div
                  className="fortunesheet-zoom-ratio-info fortunesheet-zoom-color"
                  onClick={showShortcut}
                >
                  {(context.zoomRatio * 100).toFixed(0)}%
                </div>
                <div
                  className="fortunesheet-zoom-ratio-menu"
                  style={{ display: "none" }}
                  ref={shortcutRef}
                  onMouseLeave={handleMenuMouseLeave}
                >
                  {zoomRatioItems.map((v) => (
                    <div
                      className="fortunesheet-zoom-ratio-item"
                      key={v.text}
                      onClick={(e) => {
                        shortcutZoom(v.text);
                        e.preventDefault();
                      }}
                    >
                      <div className="fortunesheet-zoom-ratio-line">
                        {v.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ModalProvider>
      </WorkbookContext.Provider>
    );
  }
);

export default Workbook;
