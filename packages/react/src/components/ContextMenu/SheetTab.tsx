import { locale, deleteSheet } from "@fortune-sheet/core";
import React, {
  useContext,
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import WorkbookContext from "../../context";
import "./index.css";
import Menu from "./Menu";

const SheetTabContextMenu: React.FC = () => {
  const { context, setContext } = useContext(WorkbookContext);
  const { x, y, sheet, onRename } = context.sheetTabContextMenu;
  const { sheetconfig } = locale(context);
  const [position, setPosition] = useState({ x: -1, y: -1 });
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as HTMLElement)
      ) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [close]);

  if (!sheet || x == null || y == null) return null;

  return (
    <div
      className="fortune-context-menu luckysheet-cols-menu"
      onContextMenu={(e) => e.stopPropagation()}
      style={{ left: position.x, top: position.y, overflow: "visible" }}
      ref={containerRef}
    >
      <Menu
        onClick={() => {
          setContext(
            (draftCtx) => {
              deleteSheet(draftCtx, sheet.index!);
            },
            {
              deleteSheetOp: {
                index: sheet.index!,
              },
            }
          );
          close();
        }}
      >
        {sheetconfig.delete}
      </Menu>
      <Menu
        onClick={() => {
          onRename?.();
          close();
        }}
      >
        {sheetconfig.rename}
      </Menu>
    </div>
  );
};

export default SheetTabContextMenu;
