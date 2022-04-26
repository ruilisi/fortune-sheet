import React, {
  useContext,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import "./index.css";
import {
  drawArrow,
  getFlowdata,
  handleCellAreaDoubleClick,
  handleCellAreaMouseDown,
  handleContextMenu,
  handleOverlayMouseMove,
  handleOverlayMouseUp,
  onImageMoveStart,
  onImageResizeStart,
  onCommentBoxMoveStart,
  onCommentBoxResizeStart,
  setEditingComment,
  showComments,
  selectAll,
  getSelectionStyle,
} from "@fortune-sheet/core";
import _ from "lodash";
import WorkbookContext from "../../context";
import ColumnHeader from "./ColumnHeader";
import RowHeader from "./RowHeader";
import InputBox from "./InputBox";
import ScrollBar from "./ScrollBar";
import ContentEditable from "./ContentEditable";

const SheetOverlay: React.FC = () => {
  const { context, setContext, settings, refs } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const flowdata = getFlowdata(context);

  const cellAreaMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setContext((draftCtx) => {
        handleCellAreaMouseDown(
          draftCtx,
          refs.globalCache,
          e.nativeEvent,
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
      setContext((draftCtx) => {
        handleContextMenu(
          draftCtx,
          settings,
          e.nativeEvent,
          refs.workbookContainer.current!
        );
      });
    },
    [refs.workbookContainer, setContext, settings]
  );

  const cellAreaDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setContext((draftCtx) => {
        handleCellAreaDoubleClick(
          draftCtx,
          refs.globalCache,
          settings,
          e.nativeEvent,
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

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setContext((draftCtx) => {
        handleOverlayMouseMove(
          draftCtx,
          refs.globalCache,
          e.nativeEvent,
          refs.cellInput.current!,
          refs.scrollbarX.current!,
          refs.scrollbarY.current!,
          containerRef.current!
        );
      });
    },
    [
      refs.cellInput,
      refs.globalCache,
      refs.scrollbarX,
      refs.scrollbarY,
      setContext,
    ]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setContext((draftCtx) => {
        handleOverlayMouseUp(
          draftCtx,
          refs.globalCache,
          settings,
          e.nativeEvent,
          containerRef.current!
        );
      });
    },
    [refs.globalCache, setContext, settings]
  );

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

  return (
    <div
      className="fortune-sheet-overlay"
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
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
          }}
        >
          <div id="luckysheet-formula-functionrange" />
          {context.formulaRangeSelect && (
            <div
              id="luckysheet-formula-functionrange-select"
              className="luckysheet-selection-copy luckysheet-formula-functionrange-select"
              style={context.formulaRangeSelect}
            >
              <div className="luckysheet-selection-copy-top luckysheet-copy" />
              <div className="luckysheet-selection-copy-right luckysheet-copy" />
              <div className="luckysheet-selection-copy-bottom luckysheet-copy" />
              <div className="luckysheet-selection-copy-left luckysheet-copy" />
              <div className="luckysheet-selection-copy-hc" />
            </div>
          )}
          {context.formulaRangeHighlight.map((v) => {
            const { rangeIndex, backgroundColor } = v;
            return (
              <div
                key={rangeIndex}
                id="luckysheet-formula-functionrange-highlight"
                className="luckysheet-selection-highlight luckysheet-formula-functionrange-highlight"
                style={_.omit(v, "backgroundColor")}
              >
                {["top", "right", "bottom", "left"].map((d) => (
                  <div
                    key={d}
                    data-type={d}
                    className={`luckysheet-selection-copy-${d} luckysheet-copy`}
                    style={{ backgroundColor }}
                  />
                ))}
                <div
                  className="luckysheet-selection-copy-hc"
                  style={{ backgroundColor }}
                />
                {["lt", "rt", "lb", "rb"].map((d) => (
                  <div
                    key={d}
                    data-type={d}
                    className={`luckysheet-selection-highlight-${d} luckysheet-highlight`}
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
            className="luckysheet-change-size-line"
            id="luckysheet-change-size-line"
            hidden={
              !context.luckysheet_cols_change_size &&
              !context.luckysheet_rows_change_size
            }
          />
          <div
            className="luckysheet-cell-selected-focus"
            id="luckysheet-cell-selected-focus"
          />
          {(context.luckysheet_selection_range?.length ?? 0) > 0 && (
            <div id="luckysheet-selection-copy">
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
                    className="luckysheet-selection-copy"
                    key={`${r1}-${r2}-${c1}-${c2}`}
                    style={{
                      left: col_pre,
                      width: col - col_pre - 1,
                      top: row_pre,
                      height: row - row_pre - 1,
                    }}
                  >
                    <div className="luckysheet-selection-copy-top luckysheet-copy" />
                    <div className="luckysheet-selection-copy-right luckysheet-copy" />
                    <div className="luckysheet-selection-copy-bottom luckysheet-copy" />
                    <div className="luckysheet-selection-copy-left luckysheet-copy" />
                    <div className="luckysheet-selection-copy-hc" />
                  </div>
                );
              })}
            </div>
          )}
          <div id="luckysheet-chart-rangeShow" />
          <div
            className="luckysheet-cell-selected-extend"
            id="luckysheet-cell-selected-extend"
          />
          <div
            className="luckysheet-cell-selected-move"
            id="luckysheet-cell-selected-move"
          />
          {(context.luckysheet_select_save?.length ?? 0) > 0 && (
            <div id="luckysheet-cell-selected-boxs">
              {context.luckysheet_select_save!.map((selection, index) => (
                <div
                  key={index}
                  id="luckysheet-cell-selected"
                  className="luckysheet-cell-selected"
                  style={{
                    ...getSelectionStyle(
                      context,
                      selection,
                      refs.globalCache.freezen?.[context.currentSheetIndex]
                    ),
                    border: "1px solid #0188fb",
                  }}
                >
                  <div className="luckysheet-cs-inner-border" />
                  <div className="luckysheet-cs-fillhandle" />
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
                      setContext((draftContext) => {
                        if (flowdata) {
                          setEditingComment(draftContext, flowdata, r, c);
                        }
                      });
                      onCommentBoxMoveStart(
                        context,
                        refs.globalCache,
                        e.nativeEvent,
                        containerRef.current!,
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
                                onCommentBoxResizeStart(
                                  context,
                                  refs.globalCache,
                                  e.nativeEvent,
                                  containerRef.current!,
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
          <div id="luckysheet-image-showBoxs">
            {context.activeImg && (
              <div
                id="luckysheet-modal-dialog-activeImage"
                className="luckysheet-modal-dialog"
                style={{
                  padding: 0,
                  position: "absolute",
                  zIndex: 300,
                  // width: 100,
                  // height: 100,
                  // left: 100,
                  // top: 100,
                  // backgroundColor: "red",
                  // backgroundImage: `url(${context.activeImg.src})`,
                  ..._.omit(context.activeImg, "src"),
                }}
              >
                <div
                  className="luckysheet-modal-dialog-border"
                  style={{ position: "absolute" }}
                />
                <div
                  className="luckysheet-modal-dialog-content"
                  style={{
                    ..._.omit(context.activeImg, "src, left,top"),
                    // height: 200,
                    // width: 200,
                    backgroundImage: `url(${context.activeImg.src})`,
                    backgroundSize: `${context.activeImg.width}px ${context.activeImg.height}px`,
                    backgroundRepeat: "no-repeat",
                    // context.activeImg.width * context.zoomRatio +
                    // context.activeImg.height * context.zoomRatio,
                  }}
                  onMouseDown={(e) => {
                    onImageMoveStart(
                      context,
                      refs.globalCache,
                      e.nativeEvent,
                      containerRef.current!
                    );
                    e.stopPropagation();
                  }}
                />
                <div className="luckysheet-modal-dialog-resize">
                  {["lt", "mt", "lm", "rm", "rt", "lb", "mb", "rb"].map((v) => (
                    <div
                      key={v}
                      className={`luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-${v}`}
                      data-type={v}
                      onMouseDown={(e) => {
                        onImageResizeStart(
                          context,
                          refs.globalCache,
                          e.nativeEvent,
                          containerRef.current!,
                          v
                        );
                        e.stopPropagation();
                      }}
                    />
                  ))}
                  {/* <div
                    className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-lt"
                    data-type="lt"
                  />
                  <div
                    className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-mt"
                    data-type="mt"
                  />
                  <div
                    className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-lm"
                    data-type="lm"
                  />
                  <div
                    className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-rm"
                    data-type="rm"
                  />
                  <div
                    className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-rt"
                    data-type="rt"
                  />
                  <div
                    className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-lb"
                    data-type="lb"
                  />
                  <div
                    className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-mb"
                    data-type="mb"
                  />
                  <div
                    className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-rb"
                    data-type="rb"
                  /> */}
                </div>
                <div className="luckysheet-modal-dialog-controll">
                  <span
                    className="luckysheet-modal-controll-btn luckysheet-modal-controll-crop"
                    role="button"
                    tabIndex={0}
                    aria-label="裁剪"
                    title="裁剪"
                  >
                    <i className="fa fa-pencil" aria-hidden="true" />
                  </span>
                  <span
                    className="luckysheet-modal-controll-btn luckysheet-modal-controll-restore"
                    role="button"
                    tabIndex={0}
                    aria-label="恢复原图"
                    title="恢复原图"
                  >
                    <i className="fa fa-window-maximize" aria-hidden="true" />
                  </span>
                  <span
                    className="luckysheet-modal-controll-btn luckysheet-modal-controll-del"
                    role="button"
                    tabIndex={0}
                    aria-label="删除"
                    title="删除"
                  >
                    <i className="fa fa-trash" aria-hidden="true" />
                  </span>
                </div>
              </div>
            )}
            <div className="img-list">
              {context.insertedImgs?.map((v: any) => {
                const { id, left, top, width, height, src } = v;
                if (v.id === context.activeImg?.id) return null;
                return (
                  <div
                    id={id}
                    className="luckysheet-modal-dialog luckysheet-modal-dialog-image"
                    style={{
                      width,
                      height,
                      padding: 0,
                      position: "absolute",
                      left,
                      top,
                      zIndex: 200,
                    }}
                    onClick={(e) => {
                      setContext((ctx) => {
                        ctx.activeImg = v;
                      });
                      e.stopPropagation();
                    }}
                  >
                    <div
                      className="luckysheet-modal-dialog-content"
                      style={{
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <img
                        src={src}
                        alt=""
                        style={{
                          width,
                          height,
                          padding: 0,
                          position: "absolute",
                        }}
                      />
                    </div>
                    <div className="luckysheet-modal-dialog-border" />
                  </div>
                );
              })}
            </div>
            <div
              id="luckysheet-modal-dialog-cropping"
              className="luckysheet-modal-dialog"
              style={{
                display: "none",
                padding: 0,
                position: "absolute",
                zIndex: 300,
              }}
            >
              <div className="cropping-mask" />
              <div className="cropping-content" />
              <div
                className="luckysheet-modal-dialog-border"
                style={{ position: "absolute" }}
              />
              <div className="luckysheet-modal-dialog-resize">
                <div className="resize-item lt" data-type="lt" />
                <div className="resize-item mt" data-type="mt" />
                <div className="resize-item lm" data-type="lm" />
                <div className="resize-item rm" data-type="rm" />
                <div className="resize-item rt" data-type="rt" />
                <div className="resize-item lb" data-type="lb" />
                <div className="resize-item mb" data-type="mb" />
                <div className="resize-item rb" data-type="rb" />
              </div>
              <div className="luckysheet-modal-dialog-controll">
                <span
                  className="luckysheet-modal-controll-btn luckysheet-modal-controll-crop"
                  role="button"
                  tabIndex={0}
                  aria-label="裁剪"
                  title="裁剪"
                >
                  <i className="fa fa-pencil" aria-hidden="true" />
                </span>
                <span
                  className="luckysheet-modal-controll-btn luckysheet-modal-controll-restore"
                  role="button"
                  tabIndex={0}
                  aria-label="恢复原图"
                  title="恢复原图"
                >
                  <i className="fa fa-window-maximize" aria-hidden="true" />
                </span>
                <span
                  className="luckysheet-modal-controll-btn luckysheet-modal-controll-del"
                  role="button"
                  tabIndex={0}
                  aria-label="删除"
                  title="删除"
                >
                  <i className="fa fa-trash" aria-hidden="true" />
                </span>
              </div>
            </div>

            <div className="cell-date-picker">
              {/* <input
            id="cellDatePickerBtn"
            className="formulaInputFocus"
            readOnly
          /> */}
            </div>
          </div>
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
                  style={{ height: context.rh_height, width: context.ch_width }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetOverlay;
