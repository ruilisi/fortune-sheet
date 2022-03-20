import React, { useContext } from "react";
import WorkbookContext from "../../context";
import "./index.css";

const SheetTab: React.FC = () => {
  const { context, setContextValue } = useContext(WorkbookContext);

  return (
    <div
      className="luckysheet-sheet-area luckysheet-noselected-text"
      id="luckysheet-sheet-area"
    >
      <div id="luckysheet-sheet-content">
        <div
          id="luckysheet-sheets-add"
          className="luckysheet-sheets-add lucky-button-custom"
        >
          <i className="iconfont luckysheet-iconfont-jia1" />
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
              return (
                <div
                  key={sheet.index}
                  className={`luckysheet-sheets-item${
                    context.currentSheetIndex === sheet.index
                      ? " luckysheet-sheets-item-active"
                      : ""
                  }`}
                  onClick={() => {
                    setContextValue("currentSheetIndex", sheet.index);
                  }}
                >
                  <span
                    className="luckysheet-sheets-item-name"
                    spellCheck="false"
                  >
                    {sheet.name}
                  </span>
                  <span className="luckysheet-sheets-item-menu luckysheet-mousedown-cancel">
                    <i className="fa fa-sort-desc luckysheet-mousedown-cancel" />
                  </span>
                </div>
              );
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
