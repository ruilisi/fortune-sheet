import React, { useContext, useRef } from "react";
import { updateCell, addSheet } from "@fortune-sheet/core";
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";
import "./index.css";
import SheetItem from "./SheetItem";

const SheetTab: React.FC = () => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="luckysheet-sheet-area luckysheet-noselected-text"
      onContextMenu={(e) => e.preventDefault()}
      ref={containerRef}
      id="luckysheet-sheet-area"
    >
      <div id="luckysheet-sheet-content">
        <div
          className="fortune-sheettab-button"
          onClick={() => {
            setContext(
              (draftCtx) => {
                if (draftCtx.luckysheetCellUpdate.length > 0) {
                  updateCell(
                    draftCtx,
                    draftCtx.luckysheetCellUpdate[0],
                    draftCtx.luckysheetCellUpdate[1],
                    refs.cellInput.current!
                  );
                }
                addSheet(draftCtx);
              },
              { addSheetOp: true }
            );
          }}
        >
          <SVGIcon name="plus" width={16} height={16} />
        </div>
        <div
          id="luckysheet-sheets-m"
          className="luckysheet-sheets-m lucky-button-custom"
        >
          <i className="iconfont luckysheet-iconfont-caidan2" />
        </div>
        <div
          className="luckysheet-sheet-container"
          id="luckysheet-sheet-container"
        >
          <div
            className="docs-sheet-fade docs-sheet-fade-left"
            style={{ display: "none" }}
          >
            <div className="docs-sheet-fade3" />
            <div className="docs-sheet-fade2" />
            <div className="docs-sheet-fade1" />
          </div>
          <div className="docs-sheet-fade docs-sheet-fade-right">
            <div className="docs-sheet-fade1" />
            <div className="docs-sheet-fade2" />
            <div className="docs-sheet-fade3" />
          </div>
          <div
            className="luckysheet-sheet-container-c"
            id="luckysheet-sheet-container-c"
          >
            {context.luckysheetfile.map((sheet) => {
              return <SheetItem key={sheet.index} sheet={sheet} />;
            })}
          </div>
        </div>
        <div
          id="luckysheet-sheets-leftscroll"
          className="luckysheet-sheets-scroll lucky-button-custom"
          style={{ display: "inline-block" }}
        >
          <i className="fa fa-caret-left" />
        </div>
        <div
          id="luckysheet-sheets-rightscroll"
          className="luckysheet-sheets-scroll lucky-button-custom"
          style={{ display: "inline-block" }}
        >
          <i className="fa fa-caret-right" />
        </div>
      </div>
    </div>
  );
};

export default SheetTab;
