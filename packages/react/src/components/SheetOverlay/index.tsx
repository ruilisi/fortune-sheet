import React, {
  useContext,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import "./index.css";
import {
  locale,
  drawArrow,
  getFlowdata,
  handleCellAreaDoubleClick,
  handleCellAreaMouseDown,
  handleContextMenu,
  handleOverlayMouseMove,
  handleOverlayMouseUp,
  onCommentBoxMoveStart,
  onCommentBoxResizeStart,
  setEditingComment,
  showComments,
  selectAll,
  getSelectionStyle,
  handleOverlayTouchEnd,
  handleOverlayTouchMove,
  handleOverlayTouchStart,
  createDropCellRange,
  expandRowsAndColumns,
  getCellRowColumn,
  getCellHyperlink,
  showLinkCard,
  Context,
  GlobalCache,
  onCellsMoveStart,
} from "@fortune-sheet/core";
import _ from "lodash";
import WorkbookContext from "../../context";
import ColumnHeader from "./ColumnHeader";
import RowHeader from "./RowHeader";
import InputBox from "./InputBox";
import ScrollBar from "./ScrollBar";
import ContentEditable from "./ContentEditable";
import SearchReplace from "../SearchReplace";
import LinkEditCard from "../LinkEidtCard";
import FilterOptions from "../FilterOption";
import { useAlert } from "../../hooks/useAlert";
import ImgBoxs from "../ImgBoxs";

const SheetOverlay: React.FC = () => {
  const { context, setContext, settings, refs } = useContext(WorkbookContext);
  const { info } = locale(context);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomAddRowInputRef = useRef<HTMLInputElement>(null);
  const flowdata = getFlowdata(context);
  const { showAlert } = useAlert();
  // const isMobile = browser.mobilecheck();
  const cellAreaMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleCellAreaMouseDown(
          draftCtx,
          refs.globalCache,
          nativeEvent,
          refs.cellInput.current!,
          refs.cellArea.current!,
          refs.fxInput.current!
        );
      });
    },
    [refs.cellArea, refs.cellInput, refs.globalCache, refs.fxInput, setContext]
  );

  const cellAreaContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleContextMenu(
          draftCtx,
          settings,
          nativeEvent,
          refs.workbookContainer.current!
        );
      });
    },
    [refs.workbookContainer, setContext, settings]
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
          containerRef.current!
        );
      });
    },
    [
      overShowLinkCard,
      refs.cellInput,
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
            containerRef.current!
          );
        } catch (e: any) {
          showAlert(e.message);
        }
      });
    },
    [
      refs.globalCache,
      refs.scrollbarX,
      refs.scrollbarY,
      setContext,
      settings,
      showAlert,
    ]
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
    let valueStr = bottomAddRowInputRef.current?.value || "";
    if (valueStr === "") {
      valueStr = "100";
    }
    const value = parseInt(valueStr, 10);

    if (Number.isNaN(value)) {
      return;
    }

    if (value < 1) {
      return;
    }

    setContext((draftCtx) => {
      const data = getFlowdata(draftCtx);
      try {
        expandRowsAndColumns(data!, value, 0);
      } catch (e: any) {
        showAlert(e.message);
      }
    });
  }, [setContext, showAlert]);

  useEffect(() => {
    refs.cellArea.current!.scrollLeft = context.scrollLeft;
    refs.cellArea.current!.scrollTop = context.scrollTop;
  }, [context.scrollLeft, context.scrollTop, refs.cellArea]);

  useEffect(() => {
    // ensure cell input is always focused to accept first key stroke on cell
    if (!context.editingCommentBox) {
      refs.cellInput.current?.focus({ preventScroll: true });
    }
  }, [
    context.editingCommentBox,
    context.luckysheet_select_save,
    refs.cellInput,
  ]);

  // TODO use patch to detect ps isShow change may be more effecient
  useEffect(() => {
    if (flowdata) {
      const psShownCells: { r: number; c: number }[] = [];
      for (let i = 0; i < flowdata.length; i += 1) {
        for (let j = 0; j < flowdata[i].length; j += 1) {
          const cell = flowdata[i][j];
          if (!cell) continue;
          if (cell.ps?.isShow) {
            psShownCells.push({ r: i, c: j });
          }
        }
      }
      setContext((ctx) => showComments(ctx, psShownCells));
    }
  }, [flowdata, setContext]);

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

  return (
    <div
      className="fortune-sheet-overlay"
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
          style={{
            width: context.rowHeaderWidth - 1.5,
            height: context.columnHeaderHeight - 1.5,
          }}
        />
        <ColumnHeader />
      </div>
      {context.showSearchReplace && (
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
              !context.luckysheet_rows_change_size
            }
          />
          <div
            className="luckysheet-cell-selected-focus"
            style={
              (context.luckysheet_select_save?.length ?? 0) > 0
                ? {
                    display: "block",
                    left: _.last(context.luckysheet_select_save)?.left,
                    width: _.last(context.luckysheet_select_save)?.width,
                    top: _.last(context.luckysheet_select_save)?.top,
                    height: _.last(context.luckysheet_select_save)?.height,
                  }
                : {}
            }
          />
          <div
            className="luckysheet-cell-selected-move"
            id="luckysheet-cell-selected-move"
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
          <div className="fortune-cell-selected-move" />
          {(context.luckysheet_select_save?.length ?? 0) > 0 && (
            <div id="luckysheet-cell-selected-boxs">
              {context.luckysheet_select_save!.map((selection, index) => (
                <div
                  key={index}
                  id="luckysheet-cell-selected"
                  className="luckysheet-cell-selected"
                  style={getSelectionStyle(
                    context,
                    selection,
                    refs.globalCache.freezen?.[context.currentSheetId]
                  )}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const { nativeEvent } = e;
                    setContext((draftCtx) => {
                      onCellsMoveStart(
                        draftCtx,
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
                  <div className="luckysheet-cs-draghandle-top luckysheet-cs-draghandle" />
                  <div className="luckysheet-cs-draghandle-bottom luckysheet-cs-draghandle" />
                  <div className="luckysheet-cs-draghandle-left luckysheet-cs-draghandle" />
                  <div className="luckysheet-cs-draghandle-right luckysheet-cs-draghandle" />
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
          <FilterOptions getContainer={() => containerRef.current!} />
          <InputBox />
          <div id="luckysheet-postil-showBoxs">
            {_.concat(
              context.commentBoxes?.filter(
                (v) => v?.rc !== context.editingCommentBox?.rc
              ),
              [context.editingCommentBox, context.hoveredCommentBox]
            ).map((commentBox) => {
              if (!commentBox) return null;
              const {
                r,
                c,
                rc,
                left,
                top,
                width,
                height,
                value,
                autoFocus,
                size,
              } = commentBox;
              const isEditing = context.editingCommentBox?.rc === rc;
              const commentId = `comment-box-${rc}`;
              return (
                <div key={rc}>
                  <canvas
                    id={`arrowCanvas-${rc}`}
                    className="arrowCanvas"
                    width={size.width}
                    height={size.height}
                    style={{
                      position: "absolute",
                      left: size.left,
                      top: size.top,
                      zIndex: 100,
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    id={commentId}
                    className="luckysheet-postil-show-main"
                    style={{
                      width,
                      height,
                      color: "#000",
                      padding: 5,
                      border: "1px solid #000",
                      backgroundColor: "rgb(255,255,225)",
                      position: "absolute",
                      left,
                      top,
                      boxSizing: "border-box",
                      zIndex: isEditing ? 200 : 100,
                    }}
                    onMouseDown={(e) => {
                      const { nativeEvent } = e;
                      setContext((draftContext) => {
                        if (flowdata) {
                          setEditingComment(draftContext, flowdata, r, c);
                        }
                      });
                      onCommentBoxMoveStart(
                        context,
                        refs.globalCache,
                        nativeEvent,
                        { r, c, rc },
                        commentId
                      );
                      e.stopPropagation();
                    }}
                  >
                    <div className="luckysheet-postil-dialog-move">
                      {["t", "r", "b", "l"].map((v) => (
                        <div
                          key={v}
                          className={`luckysheet-postil-dialog-move-item luckysheet-postil-dialog-move-item-${v}`}
                          data-type={v}
                        />
                      ))}
                    </div>
                    {isEditing && (
                      <div className="luckysheet-postil-dialog-resize">
                        {["lt", "mt", "lm", "rm", "rt", "lb", "mb", "rb"].map(
                          (v) => (
                            <div
                              key={v}
                              className={`luckysheet-postil-dialog-resize-item luckysheet-postil-dialog-resize-item-${v}`}
                              data-type={v}
                              onMouseDown={(e) => {
                                const { nativeEvent } = e;
                                onCommentBoxResizeStart(
                                  context,
                                  refs.globalCache,
                                  nativeEvent,
                                  { r, c, rc },
                                  commentId,
                                  v
                                );
                                e.stopPropagation();
                              }}
                            />
                          )
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                      }}
                    >
                      <ContentEditable
                        id={`comment-editor-${rc}`}
                        autoFocus={autoFocus}
                        style={{
                          width: "100%",
                          height: "100%",
                          lineHeight: "20px",
                          boxSizing: "border-box",
                          textAlign: "center",
                          wordBreak: "break-all",
                          outline: "none",
                        }}
                        spellCheck={false}
                        data-r={r}
                        data-c={c}
                        onKeyDown={(e) => e.stopPropagation()}
                        onFocus={(e) => {
                          refs.globalCache.editingCommentBoxEle =
                            e.target as HTMLDivElement;
                        }}
                        onMouseDown={(e) => {
                          setContext((draftContext) => {
                            if (flowdata) {
                              setEditingComment(draftContext, flowdata, r, c);
                            }
                          });
                          e.stopPropagation();
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                        }}
                        initialContent={value}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div id="luckysheet-multipleRange-show" />
          <div id="luckysheet-dynamicArray-hightShow" />
          <ImgBoxs/>
          <div id="luckysheet-dataVerification-dropdown-btn" />
          <div
            id="luckysheet-dataVerification-dropdown-List"
            className="luckysheet-mousedown-cancel"
          />
          <div
            id="luckysheet-dataVerification-showHintBox"
            className="luckysheet-mousedown-cancel"
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
                  onMouseMove={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  onKeyPress={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  style={{ left: context.scrollLeft }}
                >
                  <div
                    className="fortune-add-row-button"
                    onClick={() => {
                      handleBottomAddRow();
                    }}
                  >
                    {info.add}
                  </div>
                  <input
                    ref={bottomAddRowInputRef}
                    type="text"
                    style={{ width: 50 }}
                    placeholder="100"
                  />{" "}
                  <span style={{ fontSize: 14 }}>{info.row}</span>{" "}
                  <span style={{ fontSize: 14, color: "#9c9c9c" }}>
                    ({info.addLast})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetOverlay;
