import _ from "lodash";
import React, { useContext, useRef } from "react";
import { updateCell, addSheet } from "@fortune-sheet/core";
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";
import "./index.css";
import SheetItem from "./SheetItem";

const SheetTab: React.FC = () => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="luckysheet-sheet-area luckysheet-noselected-text"
      onContextMenu={(e) => e.preventDefault()}
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
          className="fortune-sheettab-container"
          id="fortune-sheettab-container"
        >
          <div
            className="fortune-sheettab-container-c"
            id="fortune-sheettab-container-c"
            ref={tabContainerRef}
          >
            {_.sortBy(context.luckysheetfile, (s) => Number(s.order)).map(
              (sheet) => {
                return <SheetItem key={sheet.index} sheet={sheet} />;
              }
            )}
            <SheetItem
              isDropPlaceholder
              sheet={{ name: "", index: "drop-placeholder" }}
            />
          </div>
        </div>
        <div
          id="fortune-sheettab-leftscroll"
          className="fortune-sheettab-scroll"
          ref={leftScrollRef}
          onClick={() => {
            tabContainerRef.current!.scrollLeft -= 150;
          }}
        >
          <SVGIcon name="arrow-doubleleft" width={12} height={12} />
        </div>
        <div
          id="fortune-sheettab-rightscroll"
          className="fortune-sheettab-scroll"
          ref={rightScrollRef}
          onClick={() => {
            tabContainerRef.current!.scrollLeft += 150;
          }}
        >
          <SVGIcon name="arrow-doubleright" width={12} height={12} />
        </div>
      </div>
    </div>
  );
};

export default SheetTab;
