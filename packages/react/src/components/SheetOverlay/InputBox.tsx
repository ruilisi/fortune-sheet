import { getCellValue } from "@fortune-sheet/core/src/modules/cell";
import { isInlineStringCell } from "@fortune-sheet/core/src/modules/inline-string";
import { moveToEnd } from "@fortune-sheet/core/src/modules/cursor";
import { escapeScriptTag } from "@fortune-sheet/core/src/utils";
import React, { useContext, useState, useEffect, useMemo, useRef } from "react";
import _ from "lodash";
import { getFlowdata } from "@fortune-sheet/core/src/context";
import WorkbookContext from "../../context";
import { getInlineStringHTML, getStyleByCell } from "./util";
import ContentEditable from "./ContentEditable";

const InputBox: React.FC = () => {
  const { context, refs } = useContext(WorkbookContext);
  const inputRef = useRef<HTMLDivElement>(null);
  const [inputHTML, setInputHTML] = useState<string>("");

  if (inputRef.current) {
    refs.cellInput.current = inputRef.current;
  }

  const inputBoxStyle = useMemo(() => {
    if (
      context.luckysheet_select_save.length > 0 &&
      context.luckysheetCellUpdate.length > 0
    ) {
      return getStyleByCell(
        getFlowdata(context),
        context.luckysheet_select_save[0].row_focus,
        context.luckysheet_select_save[0].column_focus
      );
    }
    return {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    context.luckysheetfile,
    context.currentSheetIndex,
    context.luckysheetCellUpdate,
    context.luckysheet_select_save,
  ]);

  useEffect(() => {
    if (
      context.luckysheet_select_save.length > 0 &&
      context.luckysheetCellUpdate.length > 0
    ) {
      const flowdata = getFlowdata(context);
      const row_index = context.luckysheet_select_save[0].row_focus;
      const col_index = context.luckysheet_select_save[0].column_focus;
      const cell = flowdata?.[row_index]?.[col_index];
      if (!cell) {
        return;
      }
      let value = "";
      if (isInlineStringCell(cell)) {
        value = getInlineStringHTML(row_index, col_index, flowdata);
      } else if (cell.f) {
        value = getCellValue(row_index, col_index, flowdata, "f");
      } else {
        value =
          getCellValue(row_index, col_index, flowdata, "m") ||
          getCellValue(row_index, col_index, flowdata, "v");
        // if (Number(cell.qp) === "1") {
        //   value = value ? "" + value : value;
        // }
      }
      setInputHTML(escapeScriptTag(value));
      setTimeout(() => {
        moveToEnd(inputRef.current!);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    context.luckysheetCellUpdate,
    context.luckysheetfile,
    context.currentSheetIndex,
    context.luckysheet_select_save,
  ]);

  useEffect(() => {
    if (_.isEmpty(context.luckysheetCellUpdate)) {
      setInputHTML("");
    }
  }, [context.luckysheetCellUpdate]);

  if (
    !(
      context.luckysheet_select_save.length > 0 &&
      context.luckysheetCellUpdate.length > 0
    )
  ) {
    return null;
  }

  return (
    <div
      className="luckysheet-input-box"
      style={{
        left: context.luckysheet_select_save[0].left_move,
        minWidth: context.luckysheet_select_save[0].width_move,
        top: context.luckysheet_select_save[0].top_move,
        height: context.luckysheet_select_save[0].height_move,
        ...inputBoxStyle,
      }}
    >
      <ContentEditable
        innerRef={inputRef}
        className="luckysheet-cell-input"
        id="luckysheet-rich-text-editor"
        aria-autocomplete="list"
        html={inputHTML}
        onChange={setInputHTML}
      />
    </div>
  );
};

export default InputBox;
