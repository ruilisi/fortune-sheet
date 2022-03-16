import { getFlowdata } from "@fortune-sheet/core/src/context";
import { getCellValue } from "@fortune-sheet/core/src/modules/cell";
import {
  getInlineStringNoStyle,
  isInlineStringCell,
} from "@fortune-sheet/core/src/modules/inline-string";
import { escapeScriptTag } from "@fortune-sheet/core/src/utils";
import React, {
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import WorkbookContext from "../../context";
import "./index.css";

const FxEditor: React.FC = () => {
  const [fxInputHTML, setFxInputHTML] = useState<string>("");
  const { context } = useContext(WorkbookContext);
  useEffect(() => {
    const d = getFlowdata(context);
    let value = "";
    if (context.luckysheet_select_save?.length > 0) {
      const [firstSelection] = context.luckysheet_select_save;
      const r = firstSelection.row_focus;
      const c = firstSelection.column_focus;
      const cell = d?.[r]?.[c];
      if (cell) {
        if (isInlineStringCell(cell)) {
          value = getInlineStringNoStyle(r, c, d);
        } else if (cell.f) {
          value = getCellValue(r, c, d, "f");
        } else {
          value = getCellValue(r, c, d, "m") || getCellValue(r, c, d, "v");
        }
      }
      setFxInputHTML(escapeScriptTag(value));
    } else {
      setFxInputHTML("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    context.luckysheetfile,
    context.currentSheetIndex,
    context.luckysheet_select_save,
  ]);

  return (
    <div id="luckysheet-wa-calculate" className="luckysheet-wa-calculate">
      <div
        className="luckysheet-wa-calculate-size"
        id="luckysheet-wa-calculate-size"
      />
      <div className="luckysheet-wa-calculate-help">
        <div className="luckysheet-wa-calculate-help-box">
          <div spellCheck={false} aria-hidden="false" id="luckysheet-helpbox">
            <div
              id="luckysheet-helpbox-cell"
              className="luckysheet-helpbox-cell-input luckysheet-mousedown-cancel"
              tabIndex={0}
              contentEditable="true"
              dir="ltr"
              aria-autocomplete="list"
            />
          </div>
        </div>
        <div className="luckysheet-wa-calculate-help-tool">
          <i className="fa fa-caret-down" aria-hidden="true" />
        </div>
      </div>
      <div
        id="luckysheet-wa-functionbox-cancel"
        className="luckysheet-wa-functionbox"
      >
        <span>
          <i
            className="iconfont luckysheet-iconfont-qingchu"
            aria-hidden="true"
          />
        </span>
      </div>
      <div
        id="luckysheet-wa-functionbox-confirm"
        className="luckysheet-wa-functionbox"
      >
        <span>
          <i
            className="iconfont luckysheet-iconfont-yunhang"
            aria-hidden="true"
          />
        </span>
      </div>
      <div
        id="luckysheet-wa-functionbox-fx"
        className="luckysheet-wa-functionbox"
      >
        <span>
          <i
            className="iconfont luckysheet-iconfont-hanshu"
            aria-hidden="true"
            style={{ color: "#333" }}
          />
        </span>
      </div>
      <div
        id="luckysheet-functionbox-container"
        className="luckysheet-mousedown-cancel"
      >
        <div className="luckysheet-mousedown-cancel" dir="ltr">
          <div
            spellCheck="false"
            aria-hidden="false"
            id="luckysheet-functionbox"
          >
            <div
              id="luckysheet-functionbox-cell"
              className="luckysheet-functionbox-cell-input luckysheet-mousedown-cancel"
              tabIndex={0}
              contentEditable="true"
              dir="ltr"
              aria-autocomplete="list"
              aria-label="D4"
              dangerouslySetInnerHTML={{ __html: fxInputHTML }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FxEditor;
