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
  showImgChooser, handleLink
} from "@fortune-sheet/core";
import _ from "lodash";
import React, { useContext, useRef, useLayoutEffect, useCallback } from "react";
import WorkbookContext, { SetContextOptions } from "../../context";
import { useAlert } from "../../hooks/useAlert";
import Divider from "./Divider";
import "./index.css";
import Menu from "./Menu";

const ContextMenu: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { context, setContext, settings } = useContext(WorkbookContext);
  const { contextMenu } = context;
  const { showAlert } = useAlert();
  const { rightclick } = locale(context);
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
                  deleteSelectedCellText(draftCtx);
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
      rightclick,
      setContext,
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
    let top = contextMenu.pageY;
    let left = contextMenu.pageX;

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
        draftCtx.contextMenu.y = top;
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
      {settings.cellContextMenu.map((menu, i) => getMenuElement(menu, i))}
    </div>
  );
};

export default ContextMenu;
