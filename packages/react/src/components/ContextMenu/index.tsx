import {
  locale,
  handleCopy,
  handlePasteByClick,
  deleteRowCol,
  insertRowCol,
  removeActiveImage,
  deleteSelectedCellText,
  sortSelection,
  createFilter,
  showImgChooser,
  handleLink,
  hideSelected,
  showSelected,
} from "@fortune-sheet/core";
import _ from "lodash";
import React, { useContext, useRef, useLayoutEffect, useCallback } from "react";
import { setColumnWidth, setRowHeight } from "../../../../core/src/api";
import WorkbookContext, { SetContextOptions } from "../../context";
import { useAlert } from "../../hooks/useAlert";
import { useDialog } from "../../hooks/useDialog";
import Divider from "./Divider";
import "./index.css";
import Menu from "./Menu";

const ContextMenu: React.FC = () => {
  const { showDialog } = useDialog();
  const containerRef = useRef<HTMLDivElement>(null);
  const { context, setContext, settings } = useContext(WorkbookContext);
  const { contextMenu } = context;
  const { showAlert } = useAlert();
  const { rightclick, drag, generalDialog, info } = locale(context);
  const getMenuElement = useCallback(
    (name: string, i: number) => {
      const selection = context.luckysheet_select_save?.[0];
      if (name === "|") {
        return <Divider key={`divider-${i}`} />;
      }
      if (name === "copy") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                if (draftCtx.luckysheet_select_save?.length! > 1) {
                  showAlert(rightclick.noMulti, "ok");
                  draftCtx.contextMenu = undefined;
                  return;
                }
                handleCopy(draftCtx);
                draftCtx.contextMenu = undefined;
              });
            }}
          >
            {rightclick.copy}
          </Menu>
        );
      }
      if (name === "paste") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                handlePasteByClick(draftCtx);
                draftCtx.contextMenu = undefined;
              });
            }}
          >
            {rightclick.paste}
          </Menu>
        );
      }
      if (name === "insert-column") {
        return selection?.row_select
          ? null
          : ["left", "right"].map((dir) => (
              <Menu
                key={`add-col-${dir}`}
                onClick={(e) => {
                  const position =
                    context.luckysheet_select_save?.[0]?.column?.[0];
                  if (position == null) return;
                  const countStr = (e.target as HTMLDivElement).querySelector(
                    "input"
                  )?.value;
                  if (countStr == null) return;
                  const count = parseInt(countStr, 10);
                  if (count < 1) return;
                  const direction = dir === "left" ? "lefttop" : "rightbottom";
                  const insertRowColOp: SetContextOptions["insertRowColOp"] = {
                    type: "column",
                    index: position,
                    count,
                    direction,
                    id: context.currentSheetId,
                  };
                  setContext(
                    (draftCtx) => {
                      try {
                        insertRowCol(draftCtx, insertRowColOp);
                        draftCtx.contextMenu = undefined;
                      } catch (err: any) {
                        showAlert(err.message);
                      }
                    },
                    {
                      insertRowColOp,
                    }
                  );
                }}
              >
                <>
                  {context.lang?.startsWith("zh") && (
                    <>
                      {rightclick.to}
                      <span className={`luckysheet-cols-rows-shift-${dir}`}>
                        {(rightclick as any)[dir]}
                      </span>
                    </>
                  )}
                  {`${rightclick.insert}  `}
                  <input
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    type="text"
                    className="luckysheet-mousedown-cancel"
                    placeholder={rightclick.number}
                    defaultValue="1"
                  />
                  <span className="luckysheet-cols-rows-shift-word luckysheet-mousedown-cancel">
                    {`${rightclick.column}  `}
                  </span>
                  {!context.lang?.startsWith("zh") && (
                    <span className={`luckysheet-cols-rows-shift-${dir}`}>
                      {(rightclick as any)[dir]}
                    </span>
                  )}
                </>
              </Menu>
            ));
      }
      if (name === "insert-row") {
        return selection?.column_select
          ? null
          : ["top", "bottom"].map((dir) => (
              <Menu
                key={`add-row-${dir}`}
                onClick={(e, container) => {
                  const position =
                    context.luckysheet_select_save?.[0]?.row?.[0];
                  if (position == null) return;
                  const countStr = container.querySelector("input")?.value;
                  if (countStr == null) return;
                  const count = parseInt(countStr, 10);
                  if (count < 1) return;
                  const direction = dir === "top" ? "lefttop" : "rightbottom";
                  const insertRowColOp: SetContextOptions["insertRowColOp"] = {
                    type: "row",
                    index: position,
                    count,
                    direction,
                    id: context.currentSheetId,
                  };
                  setContext(
                    (draftCtx) => {
                      try {
                        insertRowCol(draftCtx, insertRowColOp);
                        draftCtx.contextMenu = undefined;
                      } catch (err: any) {
                        showAlert(err.message);
                      }
                    },
                    { insertRowColOp }
                  );
                }}
              >
                <>
                  {context.lang?.startsWith("zh") && (
                    <>
                      {rightclick.to}
                      <span className={`luckysheet-cols-rows-shift-${dir}`}>
                        {(rightclick as any)[dir]}
                      </span>
                    </>
                  )}
                  {`${rightclick.insert}  `}
                  <input
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    type="text"
                    className="luckysheet-mousedown-cancel"
                    placeholder={rightclick.number}
                    defaultValue="1"
                  />
                  <span className="luckysheet-cols-rows-shift-word luckysheet-mousedown-cancel">
                    {`${rightclick.row}  `}
                  </span>
                  {!context.lang?.startsWith("zh") && (
                    <span className={`luckysheet-cols-rows-shift-${dir}`}>
                      {(rightclick as any)[dir]}
                    </span>
                  )}
                </>
              </Menu>
            ));
      }
      if (name === "delete-column") {
        return selection?.row_select ? null : (
          <Menu
            key="delete-col"
            onClick={() => {
              if (!selection) return;
              const [st_index, ed_index] = selection.column;
              const deleteRowColOp: SetContextOptions["deleteRowColOp"] = {
                type: "column",
                start: st_index,
                end: ed_index,
                id: context.currentSheetId,
              };
              setContext(
                (draftCtx) => {
                  if (draftCtx.luckysheet_select_save?.length! > 1) {
                    showAlert(rightclick.noMulti, "ok");
                    draftCtx.contextMenu = undefined;
                    return;
                  }
                  deleteRowCol(draftCtx, deleteRowColOp);
                  draftCtx.contextMenu = undefined;
                },
                { deleteRowColOp }
              );
            }}
          >
            {rightclick.deleteSelected}
            {rightclick.column}
          </Menu>
        );
      }
      if (name === "delete-row") {
        return selection?.column_select ? null : (
          <Menu
            key="delete-row"
            onClick={() => {
              if (!selection) return;
              const [st_index, ed_index] = selection.row;
              const deleteRowColOp: SetContextOptions["deleteRowColOp"] = {
                type: "row",
                start: st_index,
                end: ed_index,
                id: context.currentSheetId,
              };
              setContext(
                (draftCtx) => {
                  if (draftCtx.luckysheet_select_save?.length! > 1) {
                    showAlert(rightclick.noMulti, "ok");
                    draftCtx.contextMenu = undefined;
                    return;
                  }
                  deleteRowCol(draftCtx, deleteRowColOp);
                  draftCtx.contextMenu = undefined;
                },
                { deleteRowColOp }
              );
            }}
          >
            {rightclick.deleteSelected}
            {rightclick.row}
          </Menu>
        );
      }
      if (name === "hide-row") {
        return (
          selection?.row_select === true &&
          ["hideSelected", "showHide"].map((item) => (
            <Menu
              key={item}
              onClick={() => {
                setContext((draftCtx) => {
                  let msg = "";
                  if (item === "hideSelected") {
                    msg = hideSelected(draftCtx, "row");
                  } else if (item === "showHide") {
                    showSelected(draftCtx, "row");
                  }
                  if (msg === "noMulti") {
                    showDialog(drag.noMulti);
                  }
                  draftCtx.contextMenu = undefined;
                });
              }}
            >
              {(rightclick as any)[item] + rightclick.row}
            </Menu>
          ))
        );
      }
      if (name === "hide-column") {
        return (
          selection?.column_select === true &&
          ["hideSelected", "showHide"].map((item) => (
            <Menu
              key={item}
              onClick={() => {
                setContext((draftCtx) => {
                  let msg = "";
                  if (item === "hideSelected") {
                    msg = hideSelected(draftCtx, "column");
                  } else if (item === "showHide") {
                    showSelected(draftCtx, "column");
                  }
                  if (msg === "noMulti") {
                    showDialog(drag.noMulti);
                  }
                  draftCtx.contextMenu = undefined;
                });
              }}
            >
              {(rightclick as any)[item] + rightclick.column}
            </Menu>
          ))
        );
      }
      if (name === "set-row-height") {
        const rowHeight = selection?.height || context.defaultrowlen;
        const shownRowHeight = context.luckysheet_select_save?.some(
          (section) =>
            section.height_move !==
            (rowHeight + 1) * (section.row[1] - section.row[0] + 1) - 1
        )
          ? ""
          : rowHeight;
        return context.luckysheet_select_save?.some(
          (section) => section.row_select
        ) ? (
          <Menu
            key="set-row-height"
            onClick={(e, container) => {
              const targetRowHeight = container.querySelector("input")?.value;
              setContext((draftCtx) => {
                if (
                  _.isUndefined(targetRowHeight) ||
                  targetRowHeight === "" ||
                  parseInt(targetRowHeight, 10) <= 0 ||
                  parseInt(targetRowHeight, 10) > 545
                ) {
                  showAlert(info.tipRowHeightLimit, "ok");
                  draftCtx.contextMenu = undefined;
                  return;
                }
                const numRowHeight = parseInt(targetRowHeight, 10);
                const rowHeightList: Record<string, number> = {};
                _.forEach(draftCtx.luckysheet_select_save, (section) => {
                  for (
                    let rowNum = section.row[0];
                    rowNum <= section.row[1];
                    rowNum += 1
                  ) {
                    rowHeightList[rowNum] = numRowHeight;
                  }
                });
                setRowHeight(draftCtx, rowHeightList);
                draftCtx.contextMenu = undefined;
              });
            }}
          >
            {rightclick.row}
            {rightclick.height}
            <input
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              type="number"
              min={1}
              max={545}
              className="luckysheet-mousedown-cancel"
              placeholder={rightclick.number}
              defaultValue={shownRowHeight}
              style={{ width: "40px" }}
            />
            px
          </Menu>
        ) : null;
      }
      if (name === "set-column-width") {
        const colWidth = selection?.width || context.defaultcollen;
        const shownColWidth = context.luckysheet_select_save?.some(
          (section) =>
            section.width_move !==
            (colWidth + 1) * (section.column[1] - section.column[0] + 1) - 1
        )
          ? ""
          : colWidth;
        return context.luckysheet_select_save?.some(
          (section) => section.column_select
        ) ? (
          <Menu
            key="set-column-width"
            onClick={(e, container) => {
              const targetColWidth = container.querySelector("input")?.value;
              setContext((draftCtx) => {
                if (
                  _.isUndefined(targetColWidth) ||
                  targetColWidth === "" ||
                  parseInt(targetColWidth, 10) <= 0 ||
                  parseInt(targetColWidth, 10) > 2038
                ) {
                  showAlert(info.tipColumnWidthLimit, "ok");
                  draftCtx.contextMenu = undefined;
                  return;
                }
                const numColWidth = parseInt(targetColWidth, 10);
                const colWidthList: Record<string, number> = {};
                _.forEach(draftCtx.luckysheet_select_save, (section) => {
                  for (
                    let colNum = section.column[0];
                    colNum <= section.column[1];
                    colNum += 1
                  ) {
                    colWidthList[colNum] = numColWidth;
                  }
                });
                setColumnWidth(draftCtx, colWidthList);
                draftCtx.contextMenu = undefined;
              });
            }}
          >
            {rightclick.column}
            {rightclick.width}
            <input
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              type="number"
              min={1}
              max={545}
              className="luckysheet-mousedown-cancel"
              placeholder={rightclick.number}
              defaultValue={shownColWidth}
              style={{ width: "40px" }}
            />
            px
          </Menu>
        ) : null;
      }
      if (name === "clear") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                if (!draftCtx.allowEdit) return;
                if (draftCtx.activeImg?.id != null) {
                  removeActiveImage(draftCtx);
                } else {
                  const msg = deleteSelectedCellText(draftCtx);
                  if (msg === "partMC") {
                    showDialog(generalDialog.partiallyError, "ok");
                  } else if (msg === "allowEdit") {
                    showDialog(generalDialog.readOnlyError, "ok");
                  } else if (msg === "dataNullError") {
                    showDialog(generalDialog.dataNullError, "ok");
                  }
                }
                draftCtx.contextMenu = undefined;
              });
            }}
          >
            {rightclick.clearContent}
          </Menu>
        );
      }
      if (name === "orderAZ") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                sortSelection(draftCtx, true);
                draftCtx.contextMenu = undefined;
              });
            }}
          >
            {rightclick.orderAZ}
          </Menu>
        );
      }
      if (name === "orderZA") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                sortSelection(draftCtx, false);
                draftCtx.contextMenu = undefined;
              });
            }}
          >
            {rightclick.orderZA}
          </Menu>
        );
      }
      if (name === "orderZA") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                sortSelection(draftCtx, false);
                draftCtx.contextMenu = undefined;
              });
            }}
          >
            {rightclick.orderZA}
          </Menu>
        );
      }
      if (name === "filter") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                createFilter(draftCtx);
                draftCtx.contextMenu = undefined;
              });
            }}
          >
            {rightclick.filterSelection}
          </Menu>
        );
      }
      if (name === "image") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                showImgChooser();
                draftCtx.contextMenu = undefined;
              });
            }}
          >
            {rightclick.image}
          </Menu>
        );
      }
      if (name === "link") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                handleLink(draftCtx);
                draftCtx.contextMenu = undefined;
              });
            }}
          >
            {rightclick.link}
          </Menu>
        );
      }
      return null;
    },
    [
      context.currentSheetId,
      context.lang,
      context.luckysheet_select_save,
      context.defaultrowlen,
      context.defaultcollen,
      rightclick,
      info,
      setContext,
      showAlert,
      showDialog,
      drag,
      generalDialog,
    ]
  );

  useLayoutEffect(() => {
    // re-position the context menu if it overflows the window
    if (!containerRef.current || !contextMenu) {
      return;
    }
    const winH = window.innerHeight;
    const winW = window.innerWidth;
    const rect = containerRef.current.getBoundingClientRect();
    const menuW = rect.width;
    const menuH = rect.height;
    let top = contextMenu.y;
    let left = contextMenu.x;

    let hasOverflow = false;
    if (left + menuW > winW) {
      left -= menuW;
      hasOverflow = true;
    }
    if (top + menuH > winH) {
      top -= menuH;
      hasOverflow = true;
    }
    if (top < 0) {
      top = 0;
      hasOverflow = true;
    }
    if (hasOverflow) {
      setContext((draftCtx) => {
        draftCtx.contextMenu.x = left;
        if (draftCtx.contextMenu.headerMenu === true) {
          draftCtx.contextMenu.y = 90;
        } else {
          draftCtx.contextMenu.y = top;
        }
      });
    }
  }, [contextMenu, setContext]);

  if (_.isEmpty(context.contextMenu)) return null;

  return (
    <div
      className="fortune-context-menu luckysheet-cols-menu"
      ref={containerRef}
      onContextMenu={(e) => e.stopPropagation()}
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {context.contextMenu.headerMenu === true
        ? settings.colContextMenu.map((menu, i) => getMenuElement(menu, i))
        : settings.cellContextMenu.map((menu, i) => getMenuElement(menu, i))}
    </div>
  );
};

export default ContextMenu;
