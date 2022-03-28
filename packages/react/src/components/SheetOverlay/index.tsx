import React, { useContext, useCallback, useRef, useEffect } from "react";
import "./index.css";
import produce from "immer";
import {
  handleCellAreaDoubleClick,
  handleCellAreaMouseDown,
  handleContextMenu,
  handleOverlayMouseMove,
  handleOverlayMouseUp,
} from "@fortune-sheet/core/src/events/mouse";
import WorkbookContext from "../../context";
import ColumnHeader from "./ColumnHeader";
import RowHeader from "./RowHeader";
import InputBox from "./InputBox";
import ScrollBar from "./ScrollBar";

const SheetOverlay: React.FC = () => {
  const { context, setContext, settings, refs } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);

  const cellAreaMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setContext(
        produce((draftCtx) => {
          handleCellAreaMouseDown(
            draftCtx,
            e.nativeEvent,
            refs.cellInput.current!,
            refs.cellArea.current!
          );
        })
      );
    },
    [refs.cellArea, refs.cellInput, setContext]
  );

  const cellAreaContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setContext(
        produce((draftCtx) => {
          handleContextMenu(
            draftCtx,
            settings,
            e.nativeEvent,
            refs.workbookContainer.current!
          );
        })
      );
    },
    [refs.workbookContainer, setContext, settings]
  );

  const cellAreaDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setContext(
        produce((draftCtx) => {
          handleCellAreaDoubleClick(
            draftCtx,
            settings,
            e.nativeEvent,
            refs.cellArea.current!
          );
        })
      );
    },
    [refs.cellArea, setContext, settings]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setContext(
        produce((draftCtx) => {
          handleOverlayMouseMove(
            draftCtx,
            e.nativeEvent,
            refs.scrollbarX.current!,
            refs.scrollbarY.current!,
            containerRef.current!
          );
        })
      );
    },
    [refs.scrollbarX, refs.scrollbarY, setContext]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setContext(
        produce((draftCtx) => {
          handleOverlayMouseUp(
            draftCtx,
            settings,
            e.nativeEvent,
            containerRef.current!
          );
        })
      );
    },
    [setContext, settings]
  );

  useEffect(() => {
    refs.cellArea.current!.scrollLeft = context.scrollLeft;
    refs.cellArea.current!.scrollTop = context.scrollTop;
  }, [context.scrollLeft, context.scrollTop, refs.cellArea]);

  useEffect(() => {
    // ensure keyboard events takes effect when selection changes
    containerRef.current?.focus();
  }, [context.luckysheet_select_save]);

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
          {/* <div
            id="luckysheet-formula-functionrange-select"
            className="luckysheet-selection-copy luckysheet-formula-functionrange-select"
          >
            <div className="luckysheet-selection-copy-top luckysheet-copy" />
            <div className="luckysheet-selection-copy-right luckysheet-copy" />
            <div className="luckysheet-selection-copy-bottom luckysheet-copy" />
            <div className="luckysheet-selection-copy-left luckysheet-copy" />
            <div className="luckysheet-selection-copy-hc" />
          </div> */}
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
                    left: selection.left_move,
                    width: selection.width_move,
                    top: selection.top_move,
                    height: selection.height_move,
                    display: "block",
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
          <div id="luckysheet-postil-showBoxs" />
          <div id="luckysheet-multipleRange-show" />
          <div id="luckysheet-dynamicArray-hightShow" />
          <div id="luckysheet-image-showBoxs">
            <div
              id="luckysheet-modal-dialog-activeImage"
              className="luckysheet-modal-dialog"
              style={{
                display: "none",
                padding: 0,
                position: "absolute",
                zIndex: 300,
              }}
            >
              <div
                className="luckysheet-modal-dialog-border"
                style={{ position: "absolute" }}
              />
              <div className="luckysheet-modal-dialog-content" />
              <div className="luckysheet-modal-dialog-resize">
                <div
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
                />
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
            <div className="img-list" />
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
