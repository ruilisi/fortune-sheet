import { handleCopy } from "@fortune-sheet/core/src/events/copy";
import locale from "@fortune-sheet/core/src/locale";
import _ from "lodash";
import React, { useContext, useMemo, useRef, useLayoutEffect } from "react";
import produce from "immer";
import { handlePasteByClick } from "@fortune-sheet/core/src/events/paste";
import {
  deleteRowCol,
  extendSheet,
} from "@fortune-sheet/core/src/modules/rowcol";
import WorkbookContext from "../../context";
import "./index.css";
import Menu from "./Menu";

const ContextMenu: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { context, setContext, settings } = useContext(WorkbookContext);
  const { contextMenu } = context;
  const { rightclick } = locale();
  const menuElements: Record<string, React.ReactNode> = useMemo(() => {
    const selection = context.luckysheet_select_save?.[0];
    return {
      copy: (
        <Menu
          key="copy"
          onClick={() => {
            setContext(
              produce((draftCtx) => {
                handleCopy(draftCtx);
                draftCtx.contextMenu = undefined;
              })
            );
          }}
        >
          {rightclick.copy}
        </Menu>
      ),
      paste: (
        <Menu
          key="paste"
          onClick={() => {
            setContext(
              produce((draftCtx) => {
                handlePasteByClick(draftCtx);
                draftCtx.contextMenu = undefined;
              })
            );
          }}
        >
          {rightclick.paste}
        </Menu>
      ),
      insertColumn: selection?.row_select
        ? null
        : ["left", "right"].map((dir) => (
            <Menu
              key={`add-col-${dir}`}
              onClick={(e) => {
                setContext(
                  produce((draftCtx) => {
                    const position =
                      draftCtx.luckysheet_select_save?.[0]?.column?.[0];
                    if (position == null) return;
                    const countStr = (e.target as HTMLDivElement).querySelector(
                      "input"
                    )?.value;
                    if (countStr == null) return;
                    const count = parseInt(countStr, 10);
                    if (count < 1) return;
                    extendSheet(
                      draftCtx,
                      "column",
                      position,
                      count,
                      dir === "left" ? "lefttop" : "rightbottom",
                      draftCtx.currentSheetIndex
                    );
                    draftCtx.contextMenu = undefined;
                  })
                );
              }}
            >
              <>
                {rightclick.to}
                <span className={`luckysheet-cols-rows-shift-${dir}`}>
                  {(rightclick as any)[dir]}
                </span>
                {rightclick.add}
                <input
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  type="text"
                  className="luckysheet-mousedown-cancel"
                  placeholder={rightclick.number}
                  defaultValue="1"
                />
                <span className="luckysheet-cols-rows-shift-word luckysheet-mousedown-cancel">
                  {rightclick.column}
                </span>
              </>
            </Menu>
          )),
      insertRow: selection?.column_select
        ? null
        : ["top", "bottom"].map((dir) => (
            <Menu
              key={`add-row-${dir}`}
              onClick={(e) => {
                setContext(
                  produce((draftCtx) => {
                    const position =
                      draftCtx.luckysheet_select_save?.[0]?.row?.[0];
                    if (position == null) return;
                    const countStr = (e.target as HTMLDivElement).querySelector(
                      "input"
                    )?.value;
                    if (countStr == null) return;
                    const count = parseInt(countStr, 10);
                    if (count < 1) return;
                    extendSheet(
                      draftCtx,
                      "row",
                      position,
                      count,
                      dir === "top" ? "lefttop" : "rightbottom",
                      draftCtx.currentSheetIndex
                    );
                    draftCtx.contextMenu = undefined;
                  })
                );
              }}
            >
              <>
                {rightclick.to}
                <span className={`luckysheet-cols-rows-shift-${dir}`}>
                  {(rightclick as any)[dir]}
                </span>
                {rightclick.add}
                <input
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  type="text"
                  className="luckysheet-mousedown-cancel"
                  placeholder={rightclick.number}
                  defaultValue="1"
                />
                <span className="luckysheet-cols-rows-shift-word luckysheet-mousedown-cancel">
                  {rightclick.row}
                </span>
              </>
            </Menu>
          )),
      deleteColumn: selection?.row_select ? null : (
        <Menu
          key="delete-col"
          onClick={() => {
            if (!selection) return;
            const [st_index, ed_index] = selection.column;
            setContext(
              produce((draftCtx) => {
                deleteRowCol(draftCtx, "column", st_index, ed_index);
                draftCtx.contextMenu = undefined;
              })
            );
          }}
        >
          {rightclick.deleteSelected}
          {rightclick.column}
        </Menu>
      ),
      deleteRow: selection?.column_select ? null : (
        <Menu
          key="delete-row"
          onClick={() => {
            if (!selection) return;
            const [st_index, ed_index] = selection.row;
            setContext(
              produce((draftCtx) => {
                deleteRowCol(draftCtx, "row", st_index, ed_index);
                draftCtx.contextMenu = undefined;
              })
            );
          }}
        >
          {rightclick.deleteSelected}
          {rightclick.row}
        </Menu>
      ),
    };
  }, [context.luckysheet_select_save, rightclick, setContext]);

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
      setContext(
        produce((draftCtx) => {
          draftCtx.contextMenu.x = left;
          draftCtx.contextMenu.y = top;
        })
      );
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
      {settings.cellRightClickConfig.map((menu) => menuElements[menu])}
    </div>
  );
};

export default ContextMenu;
