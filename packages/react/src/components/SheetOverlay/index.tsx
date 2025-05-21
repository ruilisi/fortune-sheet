import {
  api,
  Context,
  createDropCellRange,
  drawArrow,
  fixColumnStyleOverflowInFreeze,
  fixRowStyleOverflowInFreeze,
  getCellHyperlink,
  getCellRowColumn,
  getRangetxt,
  getSheetIndex,
  GlobalCache,
  handleCellAreaDoubleClick,
  handleCellAreaMouseDown,
  handleContextMenu,
  handleKeydownForZoom,
  handleOverlayMouseMove,
  handleOverlayMouseUp,
  handleOverlayTouchEnd,
  handleOverlayTouchMove,
  handleOverlayTouchStart,
  insertRowCol,
  locale,
  onCellsMoveStart,
  selectAll,
  showLinkCard,
} from "@jadinec/core-sheet";
import _ from "lodash";
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./index.css";
import WorkbookContext, { SetContextOptions } from "../../context";
import { useAlert } from "../../hooks/useAlert";
import { useDialog } from "../../hooks/useDialog";
import DropDownList from "../DataVerification/DropdownList";
import RangeDialog from "../DataVerification/RangeDialog";
import FilterOptions from "../FilterOption";
import ImgBoxs from "../ImgBoxs";
import LinkEditCard from "../LinkEidtCard";
import NotationBoxes from "../NotationBoxes";
import SearchReplace from "../SearchReplace";
import SVGIcon from "../SVGIcon";
import ColumnHeader from "./ColumnHeader";
import InputBox from "./InputBox";
import RowHeader from "./RowHeader";
import ScrollBar from "./ScrollBar";

const SheetOverlay: React.FC = () => {
  const { context, setContext, settings, refs } = useContext(WorkbookContext);
  const { info, rightclick } = locale(context);
  const { showDialog } = useDialog();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomAddRowInputRef = useRef<HTMLInputElement>(null);
  const dataVerificationHintBoxRef = useRef<HTMLDivElement>(null);
  const [lastRangeText, setLastRangeText] = useState("");
  const [lastCellValue, setLastCellValue] = useState("");
  const [listWidth, setListWidth] = useState<number | undefined>();
  const { showAlert } = useAlert();
  // const isMobile = browser.mobilecheck();
  const cellAreaMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      if (e.button !== 2) {
        // onContextMenu event will not call onMouseDown
        setContext((draftCtx) => {
          handleCellAreaMouseDown(
            draftCtx,
            refs.globalCache,
            nativeEvent,
            refs.cellInput.current!,
            refs.cellArea.current!,
            refs.fxInput.current!,
            refs.canvas.current!.getContext("2d")!
          );

          if (
            !_.isEmpty(draftCtx.luckysheet_select_save?.[0]) &&
            refs.cellInput.current
          ) {
            setTimeout(() => {
              refs.cellInput.current?.focus();
            });
          }
        });
      }
    },
    [
      setContext,
      refs.globalCache,
      refs.cellInput,
      refs.cellArea,
      refs.fxInput,
      refs.canvas,
    ]
  );

  const cellAreaContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleContextMenu(
          draftCtx,
          settings,
          nativeEvent,
          refs.workbookContainer.current!,
          refs.cellArea.current!,
          "cell"
        );
      });
    },
    [refs.workbookContainer, setContext, settings, refs.cellArea]
  );

  const cellAreaDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleCellAreaDoubleClick(
          draftCtx,
          refs.globalCache,
          settings,
          nativeEvent,
          refs.cellArea.current!
        );
      });
    },
    [refs.cellArea, refs.globalCache, setContext, settings]
  );

  const onLeftTopClick = useCallback(() => {
    setContext((draftCtx) => {
      selectAll(draftCtx);
    });
  }, [setContext]);

  const debouncedShowLinkCard = useMemo(
    () =>
      _.debounce(
        (
          globalCache: GlobalCache,
          r: number,
          c: number,
          isEditing: boolean,
          skip = false
        ) => {
          if (skip || globalCache.linkCard?.mouseEnter) return;
          setContext((draftCtx) => {
            showLinkCard(draftCtx, r, c, isEditing);
          });
        },
        800
      ),
    [setContext]
  );

  const overShowLinkCard = useCallback(
    (
      ctx: Context,
      globalCache: GlobalCache,
      e: MouseEvent,
      container: HTMLDivElement,
      scrollX: HTMLDivElement,
      scrollY: HTMLDivElement
    ) => {
      const rc = getCellRowColumn(ctx, e, container, scrollX, scrollY);
      if (rc == null) return;
      const link = getCellHyperlink(ctx, rc.r, rc.c);
      if (link == null) {
        debouncedShowLinkCard(globalCache, rc.r, rc.c, false);
      } else {
        showLinkCard(ctx, rc.r, rc.c, false);
        debouncedShowLinkCard(globalCache, rc.r, rc.c, false, true);
      }
    },
    [debouncedShowLinkCard]
  );

  const onMouseMove = useCallback(
    (nativeEvent: MouseEvent) => {
      setContext((draftCtx) => {
        overShowLinkCard(
          draftCtx,
          refs.globalCache,
          nativeEvent,
          containerRef.current!,
          refs.scrollbarX.current!,
          refs.scrollbarY.current!
        );
        handleOverlayMouseMove(
          draftCtx,
          refs.globalCache,
          nativeEvent,
          refs.cellInput.current!,
          refs.scrollbarX.current!,
          refs.scrollbarY.current!,
          containerRef.current!,
          refs.fxInput.current
        );
      });
    },
    [
      overShowLinkCard,
      refs.cellInput,
      refs.fxInput,
      refs.globalCache,
      refs.scrollbarX,
      refs.scrollbarY,
      setContext,
    ]
  );

  const onMouseUp = useCallback(
    (nativeEvent: MouseEvent) => {
      setContext((draftCtx) => {
        try {
          handleOverlayMouseUp(
            draftCtx,
            refs.globalCache,
            settings,
            nativeEvent,
            refs.scrollbarX.current!,
            refs.scrollbarY.current!,
            containerRef.current!,
            refs.cellInput.current,
            refs.fxInput.current
          );
        } catch (e: any) {
          showAlert(e.message);
        }
      });
    },
    [
      refs.cellInput,
      refs.fxInput,
      refs.globalCache,
      refs.scrollbarX,
      refs.scrollbarY,
      setContext,
      settings,
      showAlert,
    ]
  );

  const onKeyDownForZoom = useCallback(
    (ev: KeyboardEvent) => {
      const newZoom = handleKeydownForZoom(ev, context.zoomRatio);
      if (newZoom !== context.zoomRatio) {
        setContext((ctx) => {
          ctx.zoomRatio = newZoom;
          ctx.luckysheetfile[
            getSheetIndex(ctx, ctx.currentSheetId)!
          ].zoomRatio = newZoom;
        });
      }
    },
    [context.zoomRatio, setContext]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const { nativeEvent } = e;
      setContext((draftContext) => {
        handleOverlayTouchStart(draftContext, nativeEvent, refs.globalCache);
      });
      e.stopPropagation();
    },
    [refs.globalCache, setContext]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleOverlayTouchMove(
          draftCtx,
          nativeEvent,
          refs.globalCache,
          refs.scrollbarX.current!,
          refs.scrollbarY.current!
        );
      });
      // e.stopPropagation();
    },
    [refs.globalCache, refs.scrollbarX, refs.scrollbarY, setContext]
  );

  const onTouchEnd = useCallback(() => {
    handleOverlayTouchEnd(refs.globalCache);
  }, [refs.globalCache]);

  const handleBottomAddRow = useCallback(() => {
    const valueStr =
      bottomAddRowInputRef.current?.value || context.addDefaultRows.toString();
    const value = parseInt(valueStr, 10);
    if (Number.isNaN(value)) {
      return;
    }
    if (value < 1) {
      return;
    }
    const insertRowColOp: SetContextOptions["insertRowColOp"] = {
      type: "row",
      index:
        context.luckysheetfile[
          getSheetIndex(context, context!.currentSheetId! as string) as number
        ].data!.length - 1,
      count: value,
      direction: "rightbottom",
      id: context.currentSheetId,
    };
    setContext(
      (draftCtx) => {
        try {
          insertRowCol(draftCtx, insertRowColOp, false);
        } catch (err: any) {
          if (err.message === "maxExceeded") showAlert(rightclick.rowOverLimit);
        }
      },
      { insertRowColOp }
    );
  }, [context, rightclick.rowOverLimit, setContext, showAlert]);

  useEffect(() => {
    setContext((draftCtx) => {
      const sheetIndex = getSheetIndex(draftCtx, draftCtx.currentSheetId);
      if (sheetIndex === undefined || sheetIndex === null) return;

      const currentSheet = draftCtx.luckysheetfile[sheetIndex];

      // Only reset selection if there's no existing selection
      if (!currentSheet.luckysheet_select_save?.length) {
        api.setSelection(draftCtx, [{ row: [0], column: [0] }], {});
      }
    });
  }, [context.currentSheetId, setContext]);

  // 提醒弹窗
  useEffect(() => {
    if (context.warnDialog) {
      setTimeout(() => {
        showDialog(context.warnDialog, "ok");
      }, 240);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.warnDialog]);

  useEffect(() => {
    refs.cellArea.current!.scrollLeft = context.scrollLeft;
    refs.cellArea.current!.scrollTop = context.scrollTop;
  }, [
    context.scrollLeft,
    context.scrollTop,
    refs.cellArea,
    refs.cellArea.current?.scrollLeft,
    refs.cellArea.current?.scrollTop,
  ]);

  // useEffect(() => {
  //   // ensure cell input is always focused to accept first key stroke on cell
  //   if (!context.editingCommentBox) {
  //     refs.cellInput.current?.focus({ preventScroll: true });
  //   }
  // }, [
  //   context.editingCommentBox,
  //   context.luckysheet_select_save,
  //   refs.cellInput,
  // ]);

  useLayoutEffect(() => {
    if (
      context.commentBoxes ||
      context.hoveredCommentBox ||
      context.editingCommentBox
    ) {
      _.concat(
        context.commentBoxes?.filter(
          (v) => v.rc !== context.editingCommentBox?.rc
        ),
        [context.hoveredCommentBox, context.editingCommentBox]
      ).forEach((box) => {
        if (box) {
          drawArrow(box.rc, box.size);
        }
      });
    }
  }, [
    context.commentBoxes,
    context.hoveredCommentBox,
    context.editingCommentBox,
  ]);

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [onMouseMove]);

  useEffect(() => {
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseUp]);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDownForZoom);
    return () => {
      document.removeEventListener("keydown", onKeyDownForZoom);
    };
  }, [onKeyDownForZoom]);

  const rangeText = useMemo(() => {
    const lastSelection = _.last(context.luckysheet_select_save);
    if (
      !(
        lastSelection &&
        lastSelection.row_focus != null &&
        lastSelection.column_focus != null
      )
    )
      return "";
    const rf = lastSelection.row_focus;
    const cf = lastSelection.column_focus;
    if (context.config.merge != null && `${rf}_${cf}` in context.config.merge) {
      return getRangetxt(context, context.currentSheetId, {
        column: [cf, cf],
        row: [rf, rf],
      });
    }

    const rawRangeTxt = getRangetxt(
      context,
      context.currentSheetId,
      lastSelection
    );
    // Return with formatting for better screen reading
    // Format single-cell selections (e.g., "AA12" → "AA. 12")
    // Format range selections (e.g., "A1:BB100" → "A. 1: BB. 100")
    return rawRangeTxt.replace(/([A-Z]+)(\d+)/g, "$1. $2");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.currentSheetId, context.luckysheet_select_save]);

  const cellValue = () => {
    if ((context.luckysheet_select_save?.length ?? 0) > 0) {
      const selection =
        context.luckysheet_select_save?.[
          context.luckysheet_select_save.length - 1
        ];
      if (!selection) return "";
      const sheetIndex = getSheetIndex(context, context.currentSheetId);
      if (sheetIndex === undefined || sheetIndex === null) return "";
      const rowFocus = selection.row_focus ?? 0;
      const columnFocus = selection.column_focus ?? 0;
      const cellVal =
        context.luckysheetfile[sheetIndex]?.data?.[rowFocus]?.[columnFocus]
          ?.m || "";
      return cellVal;
    }
    return "";
  };

  const computedCellValue = cellValue();

  useEffect(() => {
    if (context.sheetFocused) {
      setLastRangeText(String(rangeText));
      setLastCellValue(String(cellValue()));
    }
  }, [context.sheetFocused]); // Runs only when sheet focus toggles

  return (
    <main
      className="online-sheet-overlay"
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      tabIndex={-1}
      style={{
        width: context.luckysheetTableContentHW[0],
        height: context.luckysheetTableContentHW[1],
      }}
    >
      <div className="fortune-col-header-wrap">
        <div
          className="fortune-left-top"
          onClick={onLeftTopClick}
          tabIndex={0}
          style={{
            width: context.rowHeaderWidth - 1.5,
            height: context.columnHeaderHeight - 1.5,
          }}
        />
        <ColumnHeader />
      </div>
      {(context.showSearch || context.showReplace) && (
        <SearchReplace getContainer={() => containerRef.current!} />
      )}
      <div className="fortune-row-body">
        <RowHeader />
        <ScrollBar axis="x" />
        <ScrollBar axis="y" />
        <div
          ref={refs.cellArea}
          className="fortune-cell-area"
          onMouseDown={cellAreaMouseDown}
          onDoubleClick={cellAreaDoubleClick}
          onContextMenu={cellAreaContextMenu}
          style={{
            width: context.cellmainWidth,
            height: context.cellmainHeight,
            cursor: context.luckysheet_cell_selected_extend
              ? "crosshair"
              : "default",
          }}
        >
          <div id="fortune-formula-functionrange" />
          {context.formulaRangeSelect && (
            <div
              className="fortune-selection-copy fortune-formula-functionrange-select"
              style={context.formulaRangeSelect}
            >
              <div className="fortune-selection-copy-top fortune-copy" />
              <div className="fortune-selection-copy-right fortune-copy" />
              <div className="fortune-selection-copy-bottom fortune-copy" />
              <div className="fortune-selection-copy-left fortune-copy" />
              <div className="fortune-selection-copy-hc" />
            </div>
          )}
          {context.formulaRangeHighlight.map((v) => {
            const { rangeIndex, backgroundColor } = v;
            return (
              <div
                key={rangeIndex}
                id="fortune-formula-functionrange-highlight"
                className="fortune-selection-highlight fortune-formula-functionrange-highlight"
                style={_.omit(v, "backgroundColor")}
              >
                {["top", "right", "bottom", "left"].map((d) => (
                  <div
                    key={d}
                    data-type={d}
                    className={`fortune-selection-copy-${d} fortune-copy`}
                    style={{ backgroundColor }}
                  />
                ))}
                <div
                  className="fortune-selection-copy-hc"
                  style={{ backgroundColor }}
                />
                {["lt", "rt", "lb", "rb"].map((d) => (
                  <div
                    key={d}
                    data-type={d}
                    className={`fortune-selection-highlight-${d} luckysheet-highlight`}
                    style={{ backgroundColor }}
                  />
                ))}
              </div>
            );
          })}
          <div
            className="luckysheet-row-count-show luckysheet-count-show"
            id="luckysheet-row-count-show"
          />
          <div
            className="luckysheet-column-count-show luckysheet-count-show"
            id="luckysheet-column-count-show"
          />
          <div
            className="fortune-change-size-line"
            hidden={
              !context.luckysheet_cols_change_size &&
              !context.luckysheet_rows_change_size &&
              !context.luckysheet_cols_freeze_drag &&
              !context.luckysheet_rows_freeze_drag
            }
          />
          <div
            className="fortune-freeze-drag-line"
            hidden={
              !context.luckysheet_cols_freeze_drag &&
              !context.luckysheet_rows_freeze_drag
            }
          />
          <div
            className="luckysheet-cell-selected-focus"
            style={
              (context.luckysheet_select_save?.length ?? 0) > 0
                ? (() => {
                    const selection = _.last(context.luckysheet_select_save)!;
                    return _.assign(
                      {
                        left: selection.left,
                        top: selection.top,
                        width: selection?.width || 0,
                        height: selection?.height || 0,
                        display: "block",
                      },
                      fixRowStyleOverflowInFreeze(
                        context,
                        selection.row_focus || 0,
                        selection.row_focus || 0,
                        refs.globalCache.freezen?.[context.currentSheetId]
                      ),
                      fixColumnStyleOverflowInFreeze(
                        context,
                        selection.column_focus || 0,
                        selection.column_focus || 0,
                        refs.globalCache.freezen?.[context.currentSheetId]
                      )
                    );
                  })()
                : {}
            }
            onMouseDown={(e) => e.preventDefault()}
          />
          {(context.luckysheet_selection_range?.length ?? 0) > 0 && (
            <div id="fortune-selection-copy">
              {context.luckysheet_selection_range!.map((range) => {
                const r1 = range.row[0];
                const r2 = range.row[1];
                const c1 = range.column[0];
                const c2 = range.column[1];

                const row = context.visibledatarow[r2];
                const row_pre =
                  r1 - 1 === -1 ? 0 : context.visibledatarow[r1 - 1];
                const col = context.visibledatacolumn[c2];
                const col_pre =
                  c1 - 1 === -1 ? 0 : context.visibledatacolumn[c1 - 1];

                return (
                  <div
                    className="fortune-selection-copy"
                    key={`${r1}-${r2}-${c1}-${c2}`}
                    style={{
                      left: col_pre,
                      width: col - col_pre - 1,
                      top: row_pre,
                      height: row - row_pre - 1,
                    }}
                  >
                    <div className="fortune-selection-copy-top fortune-copy" />
                    <div className="fortune-selection-copy-right fortune-copy" />
                    <div className="fortune-selection-copy-bottom fortune-copy" />
                    <div className="fortune-selection-copy-left fortune-copy" />
                    <div className="fortune-selection-copy-hc" />
                  </div>
                );
              })}
            </div>
          )}
          <div id="luckysheet-chart-rangeShow" />
          <div className="fortune-cell-selected-extend" />
          <div
            className="fortune-cell-selected-move"
            id="fortune-cell-selected-move"
            onMouseDown={(e) => e.preventDefault()}
          />
          {(context.luckysheet_select_save?.length ?? 0) > 0 && (
            <div id="luckysheet-cell-selected-boxs">
              {context.luckysheet_select_save!.map((selection, index) => (
                <div
                  key={index}
                  id="luckysheet-cell-selected"
                  className="luckysheet-cell-selected"
                  style={_.assign(
                    {
                      left: selection.left_move,
                      top: selection.top_move,
                      width: selection?.width_move || 0,
                      height: selection?.height_move || 0,
                      display: "block",
                    },
                    fixRowStyleOverflowInFreeze(
                      context,
                      selection.row[0],
                      selection.row[1],
                      refs.globalCache.freezen?.[context.currentSheetId]
                    ),
                    fixColumnStyleOverflowInFreeze(
                      context,
                      selection.column[0],
                      selection.column[1],
                      refs.globalCache.freezen?.[context.currentSheetId]
                    )
                  )}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const { nativeEvent } = e;
                    setContext((draftCtx) => {
                      onCellsMoveStart(
                        draftCtx,
                        refs.globalCache,
                        nativeEvent,
                        refs.scrollbarX.current!,
                        refs.scrollbarY.current!,
                        containerRef.current!
                      );
                    });
                  }}
                >
                  <div className="luckysheet-cs-inner-border" />
                  <div
                    className="luckysheet-cs-fillhandle"
                    onMouseDown={(e) => {
                      const { nativeEvent } = e;
                      setContext((draftContext) => {
                        createDropCellRange(
                          draftContext,
                          nativeEvent,
                          containerRef.current!
                        );
                      });
                      e.stopPropagation();
                    }}
                  />
                  <div className="luckysheet-cs-inner-border" />
                  <div
                    className="luckysheet-cs-draghandle-top luckysheet-cs-draghandle"
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <div
                    className="luckysheet-cs-draghandle-bottom luckysheet-cs-draghandle"
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <div
                    className="luckysheet-cs-draghandle-left luckysheet-cs-draghandle"
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <div
                    className="luckysheet-cs-draghandle-right luckysheet-cs-draghandle"
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <div className="luckysheet-cs-touchhandle luckysheet-cs-touchhandle-lt">
                    <div className="luckysheet-cs-touchhandle-btn" />
                  </div>
                  <div className="luckysheet-cs-touchhandle luckysheet-cs-touchhandle-rb">
                    <div className="luckysheet-cs-touchhandle-btn" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {(context.presences?.length ?? 0) > 0 &&
            context.presences!.map((presence, index) => {
              if (presence.sheetId !== context.currentSheetId) {
                return null;
              }
              const {
                selection: { r, c },
                color,
              } = presence;
              const row_pre = r - 1 === -1 ? 0 : context.visibledatarow[r - 1];
              const col_pre =
                c - 1 === -1 ? 0 : context.visibledatacolumn[c - 1];
              const row = context.visibledatarow[r];
              const col = context.visibledatacolumn[c];
              const width = col - col_pre - 1;
              const height = row - row_pre - 1;
              const usernameStyle = {
                maxWidth: width + 1,
                backgroundColor: color,
              };
              _.set(usernameStyle, r === 0 ? "top" : "bottom", height);

              return (
                <div
                  key={presence?.userId || index}
                  className="fortune-presence-selection"
                  style={{
                    left: col_pre,
                    top: row_pre - 2,
                    width,
                    height,
                    borderColor: color,
                    borderWidth: 1,
                  }}
                >
                  <div
                    className="fortune-presence-username"
                    style={usernameStyle}
                  >
                    {presence.username}
                  </div>
                </div>
              );
            })}
          {context.linkCard?.sheetId === context.currentSheetId && (
            <LinkEditCard {...context.linkCard} />
          )}
          {context.rangeDialog?.show && <RangeDialog />}
          <FilterOptions getContainer={() => containerRef.current!} />
          <InputBox />
          <NotationBoxes />
          <div id="luckysheet-multipleRange-show" />
          <div id="luckysheet-dynamicArray-hightShow" />
          <ImgBoxs />
          <div
            id="luckysheet-dataVerification-dropdown-btn"
            onClick={async () => {
              if (!context.luckysheet_select_save) return;
              // 获取当前选中的单元格的宽度,下拉列表要跟单元格保持一致
              const last =
                context.luckysheet_select_save[
                  context.luckysheet_select_save.length - 1
                ];
              const {
                width,
                row_focus: rowIndex,
                column_focus: colIndex,
              } = last;
              setListWidth(width);
              // 获取当前选中的单元格的行列索引
              console.log("rowIndex, colIndex", rowIndex, colIndex);
              if (
                !context.selectClick ||
                rowIndex === undefined ||
                colIndex === undefined
              ) {
                setContext((ctx) => {
                  ctx.dataVerificationDropDownList = true;
                  dataVerificationHintBoxRef.current!.style.display = "none";
                });
                return;
              }
              // 判断该单元格是否有下拉列表
              const index = getSheetIndex(
                context,
                context.currentSheetId
              ) as number;
              const { dataVerification } = context.luckysheetfile[index];
              const item = dataVerification[`${rowIndex}_${colIndex}`];

              if (item.type !== "dropdown") {
                setContext((ctx) => {
                  ctx.dataVerificationDropDownList = true;
                  dataVerificationHintBoxRef.current!.style.display = "none";
                });
                return;
              }
              // 实时获取下拉列表数据
              const list = await context.selectClick(rowIndex, colIndex);
              // 如果没有数据, 显示默认列表
              if (!list || list.length === 0) {
                setContext((ctx) => {
                  ctx.dataVerificationDropDownList = true;
                  dataVerificationHintBoxRef.current!.style.display = "none";
                });
                return;
              }
              setContext(async (ctx) => {
                // 获取原来的下拉列表
                const i = getSheetIndex(ctx, ctx.currentSheetId) as number;
                const { dataVerification: verification } =
                  ctx.luckysheetfile[i];
                const cellItem = verification[`${rowIndex}_${colIndex}`];
                cellItem.value1 = list.map((child) => child.label).join(",");
                try {
                  cellItem.value2 = JSON.stringify(list);
                } catch (e) {
                  console.error("JSON.stringify error", e);
                  cellItem.value2 = "[]";
                }
                ctx.dataVerificationDropDownList = true;
                dataVerificationHintBoxRef.current!.style.display = "none";
              });
            }}
            tabIndex={0}
            style={{ display: "none" }}
          >
            <SVGIcon name="combo-arrow" width={16} />
          </div>
          {context.dataVerificationDropDownList && (
            <DropDownList width={listWidth} />
          )}
          {/* <div
            id="luckysheet-dataVerification-dropdown-List"
            className="luckysheet-mousedown-cancel"
          /> */}
          <div
            id="luckysheet-dataVerification-showHintBox"
            className="luckysheet-mousedown-cancel"
            ref={dataVerificationHintBoxRef}
          />
          <div className="luckysheet-cell-copy" />
          <div className="luckysheet-grdblkflowpush" />
          <div
            id="luckysheet-cell-flow_0"
            className="luckysheet-cell-flow luckysheetsheetchange"
          >
            <div className="luckysheet-cell-flow-clip">
              <div className="luckysheet-grdblkpush" />
              <div
                id="luckysheetcoltable_0"
                className="luckysheet-cell-flow-col"
              >
                <div
                  id="luckysheet-sheettable_0"
                  className="luckysheet-cell-sheettable"
                  style={{
                    height: context.rh_height,
                    width: context.ch_width,
                  }}
                />
                <div
                  id="luckysheet-bottom-controll-row"
                  className="luckysheet-bottom-controll-row"
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  // onMouseMove={(e) => {
                  //   e.stopPropagation();
                  //   e.preventDefault();
                  // }}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  onKeyPress={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  tabIndex={0}
                  style={{
                    left: context.scrollLeft,
                    display: context.allowEdit ? "block" : "none",
                  }}
                >
                  <div
                    className="fortune-add-row-button"
                    onClick={() => {
                      handleBottomAddRow();
                    }}
                    tabIndex={0}
                  >
                    {info.add}
                  </div>
                  <input
                    ref={bottomAddRowInputRef}
                    type="text"
                    style={{ width: 50 }}
                    placeholder={context.addDefaultRows.toString()}
                  />{" "}
                  <span style={{ fontSize: 14 }}>{info.row}</span>{" "}
                  <span style={{ fontSize: 14, color: "#9c9c9c" }}>
                    ({info.addLast})
                  </span>
                  <span
                    className="fortune-add-row-button"
                    onClick={() => {
                      setContext((ctx) => {
                        ctx.scrollTop = 0;
                      });
                    }}
                    tabIndex={0}
                  >
                    {info.backTop}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="sr-selection" className="sr-only" role="alert">
        {!rangeText.includes("NaN")
          ? `${rangeText} ${computedCellValue}`
          : `A1. ${info.sheetSrIntro}`}
      </div>
      <div id="sr-sheetFocus" className="sr-only" role="alert">
        {context.sheetFocused
          ? `${lastRangeText} ${lastCellValue ? `${lastCellValue}.` : ""} ${
              info.sheetIsFocused
            }`
          : `Toolbar. ${info.sheetNotFocused}`}
      </div>
    </main>
  );
};

export default SheetOverlay;
