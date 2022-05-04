import { locale, deleteSheet } from "@fortune-sheet/core";
import React, {
  useContext,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import WorkbookContext from "../../context";
import { useAlert } from "../../hooks/useAlert";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import "./index.css";
import Menu from "./Menu";

const SheetTabContextMenu: React.FC = () => {
  const { context, setContext, settings } = useContext(WorkbookContext);
  const { x, y, sheet, onRename } = context.sheetTabContextMenu;
  const { sheetconfig } = locale(context);
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const { showAlert, hideAlert } = useAlert();
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setContext((ctx) => {
      ctx.sheetTabContextMenu = {};
    });
  }, [setContext]);

  useLayoutEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect && x != null && y != null) {
      setPosition({ x, y: y - rect.height });
    }
  }, [x, y]);

  useOutsideClick(containerRef, close, [close]);

  if (!sheet || x == null || y == null) return null;

  return (
    <div
      className="fortune-context-menu luckysheet-cols-menu"
      onContextMenu={(e) => e.stopPropagation()}
      style={{ left: position.x, top: position.y, overflow: "visible" }}
      ref={containerRef}
    >
      {settings.sheetTabContextMenu?.map((name) => {
        if (name === "delete") {
          return (
            <Menu
              onClick={() => {
                showAlert(sheetconfig.confirmDelete, "yesno", () => {
                  setContext(
                    (draftCtx) => {
                      deleteSheet(draftCtx, sheet.id!);
                    },
                    {
                      deleteSheetOp: {
                        id: sheet.id!,
                      },
                    }
                  );
                  hideAlert();
                });
                close();
              }}
            >
              {sheetconfig.delete}
            </Menu>
          );
        }
        if (name === "rename") {
          return (
            <Menu
              onClick={() => {
                onRename?.();
                close();
              }}
            >
              {sheetconfig.rename}
            </Menu>
          );
        }
        return null;
      })}
    </div>
  );
};

export default SheetTabContextMenu;
