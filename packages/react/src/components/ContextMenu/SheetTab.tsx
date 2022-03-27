import locale from "@fortune-sheet/core/src/locale";
import { Sheet } from "@fortune-sheet/core/src/types";
import { deleteSheet } from "@fortune-sheet/core/src/modules/sheet";
import React, { useContext, useRef, useEffect, useState } from "react";
import produce from "immer";
import WorkbookContext from "../../context";
import "./index.css";
import Menu from "./Menu";

type Props = {
  x: number;
  y: number;
  sheet?: Sheet;
  onClose?: () => void;
  onRename?: () => void;
};

const SheetTabContextMenu: React.FC<Props> = ({
  x,
  y,
  sheet,
  onClose,
  onRename,
}) => {
  const { setContext } = useContext(WorkbookContext);
  const { sheetconfig } = locale();
  const [position, setPosition] = useState({ x: -10000, y: -10000 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({ x, y: y - rect.height });
    }
  }, [x, y]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as HTMLElement)
      ) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!sheet) return null;

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
            produce((draftCtx) => {
              deleteSheet(draftCtx, sheet.index);
              onClose?.();
            })
          );
        }}
      >
        {sheetconfig.delete}
      </Menu>
      <Menu
        onClick={() => {
          onRename?.();
          onClose?.();
        }}
      >
        {sheetconfig.rename}
      </Menu>
    </div>
  );
};

export default SheetTabContextMenu;
