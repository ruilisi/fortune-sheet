import { getCellValue } from "@fortune-sheet/core/src/modules/cell";
import { isInlineStringCell } from "@fortune-sheet/core/src/modules/inline-string";
import { escapeScriptTag } from "@fortune-sheet/core/src/utils";
import React, { useContext, useState, useEffect, useMemo } from "react";
import WorkbookContext from "../../context";
import { getInlineStringHTML, getStyleByCell } from "./util";

const InputBox: React.FC = () => {
  const { context } = useContext(WorkbookContext);
  const [inputHTML, setInputHTML] = useState<string>("");

  const inputBoxStyle = useMemo(() => {
    if (context.luckysheet_select_save.length > 0 && context.cellUpdating) {
      return getStyleByCell(
        context.flowdata,
        context.luckysheet_select_save[0].row_focus,
        context.luckysheet_select_save[0].column_focus
      );
    }
    return {};
  }, [context.cellUpdating, context.flowdata, context.luckysheet_select_save]);

  useEffect(() => {
    if (context.luckysheet_select_save.length > 0 && context.cellUpdating) {
      const row_index = context.luckysheet_select_save[0].row_focus;
      const col_index = context.luckysheet_select_save[0].column_focus;
      const cell = context.flowdata?.[row_index]?.[col_index];
      if (!cell) {
        return;
      }
      let value = "";
      if (isInlineStringCell(cell)) {
        value = getInlineStringHTML(row_index, col_index, context.flowdata);
      } else if (cell.f) {
        value = getCellValue(row_index, col_index, context.flowdata, "f");
      } else {
        value =
          getCellValue(row_index, col_index, context.flowdata, "m") ||
          getCellValue(row_index, col_index, context.flowdata, "v");
        // if (Number(cell.qp) === "1") {
        //   value = value ? "" + value : value;
        // }
      }
      setInputHTML(escapeScriptTag(value));
    }
  }, [context.cellUpdating, context.flowdata, context.luckysheet_select_save]);

  if (!(context.luckysheet_select_save.length > 0 && context.cellUpdating)) {
    return null;
  }

  return (
    <div
      className="luckysheet-input-box"
      style={{
        left: context.luckysheet_select_save[0].left_move,
        width: context.luckysheet_select_save[0].width_move,
        top: context.luckysheet_select_save[0].top_move,
        height: context.luckysheet_select_save[0].height_move,
        ...inputBoxStyle,
      }}
    >
      <div
        className="luckysheet-cell-input"
        contentEditable="true"
        id="luckysheet-rich-text-editor"
        dir="ltr"
        aria-autocomplete="list"
        dangerouslySetInnerHTML={{ __html: inputHTML }}
      />
    </div>
  );
};

export default InputBox;
