import _ from "lodash";
import React, { useContext, useRef, useCallback } from "react";
import WorkbookContext from "../../context";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import "./index.css";
import SheetListItem from "./SheetListItem";

const SheetList: React.FC = () => {
  const { context, setContext } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setContext((ctx) => {
      ctx.showSheetList = false;
    });
  }, [setContext]);
  useOutsideClick(containerRef, close, [close]);

  return (
    <div
      className="fortune-context-menu luckysheet-cols-menu fortune-sheet-list"
      ref={containerRef}
    >
      {_.sortBy(context.luckysheetfile, (s) => Number(s.order)).map(
        (singleSheet) => {
          return <SheetListItem sheet={singleSheet} key={singleSheet.id} />;
        }
      )}
    </div>
  );
};

export default SheetList;
