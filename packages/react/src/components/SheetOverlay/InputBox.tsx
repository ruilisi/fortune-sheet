import {
  cancelNormalSelected,
  getCellValue,
  updateCell,
  getInlineStringHTML,
  getStyleByCell,
} from "@fortune-sheet/core/src/modules/cell";
import { isInlineStringCell } from "@fortune-sheet/core/src/modules/inline-string";
import { moveToEnd } from "@fortune-sheet/core/src/modules/cursor";
import { escapeScriptTag } from "@fortune-sheet/core/src/utils";
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import _ from "lodash";
import produce from "immer";
import { getFlowdata } from "@fortune-sheet/core/src/context";
import { handleFormulaInput } from "@fortune-sheet/core/src/modules/formula";
import { moveHighlightCell } from "@fortune-sheet/core/src/modules/selection";
import WorkbookContext from "../../context";
import ContentEditable from "./ContentEditable";
import FormulaSearch from "./FormulaSearch";
import FormulaHint from "./FormulaHint";

const InputBox: React.FC = () => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const inputRef = useRef<HTMLDivElement>(null);
  const lastKeyDownEventRef = useRef<React.KeyboardEvent<HTMLDivElement>>();

  const inputBoxStyle = useMemo(() => {
    if (
      (context.luckysheet_select_save?.length ?? 0) > 0 &&
      context.luckysheetCellUpdate.length > 0
    ) {
      return getStyleByCell(
        getFlowdata(context),
        context.luckysheet_select_save![0].row_focus!,
        context.luckysheet_select_save![0].column_focus!
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
      (context.luckysheet_select_save?.length ?? 0) > 0 &&
      context.luckysheetCellUpdate.length > 0
    ) {
      const flowdata = getFlowdata(context);
      const row_index = context.luckysheet_select_save![0].row_focus!;
      const col_index = context.luckysheet_select_save![0].column_focus!;
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
      inputRef.current!.innerHTML = escapeScriptTag(value);
      // setInputHTML();
      if (!refs.globalCache.doNotFocus) {
        setTimeout(() => {
          moveToEnd(inputRef.current!);
        });
      }
      delete refs.globalCache.doNotFocus;
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
      if (inputRef.current) {
        inputRef.current.innerHTML = "";
      }
      // setInputHTML("");
    }
  }, [context.luckysheetCellUpdate]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      lastKeyDownEventRef.current = e;
      // if (
      //   $("#luckysheet-modal-dialog-mask").is(":visible") ||
      //   $(event.target).hasClass("luckysheet-mousedown-cancel") ||
      //   $(event.target).hasClass("formulaInputFocus")
      // ) {
      //   return;
      // }

      const { ctrlKey, shiftKey } = e;

      setContext(
        produce((draftCtx) => {
          if (e.key === "Escape" && draftCtx.luckysheetCellUpdate.length > 0) {
            cancelNormalSelected(draftCtx);
            moveHighlightCell(draftCtx, "down", 0, "rangeOfSelect");
            e.preventDefault();
          } else if (
            e.key === "Enter" &&
            draftCtx.luckysheetCellUpdate.length > 0
          ) {
            // if (
            //   $("#luckysheet-formula-search-c").is(":visible") &&
            //   formula.searchFunctionCell != null
            // ) {
            //   formula.searchFunctionEnter(
            //     $("#luckysheet-formula-search-c").find(
            //       ".luckysheet-formula-search-item-active"
            //     )
            //   );
            //   event.preventDefault();
            // }
          } else if (
            e.key === "Tab" &&
            draftCtx.luckysheetCellUpdate.length > 0
          ) {
            if (
              $("#luckysheet-formula-search-c").is(":visible") &&
              formula.searchFunctionCell != null
            ) {
              formula.searchFunctionEnter(
                $("#luckysheet-formula-search-c").find(
                  ".luckysheet-formula-search-item-active"
                )
              );
            } else {
              updateCell(
                draftCtx,
                draftCtx.luckysheetCellUpdate[0],
                draftCtx.luckysheetCellUpdate[1],
                refs.cellInput.current!
              );
              moveHighlightCell(draftCtx, "right", 1, "rangeOfSelect");
            }

            e.preventDefault();
          } else if (
            e.key === "F4" &&
            draftCtx.luckysheetCellUpdate.length > 0
          ) {
            // formula.setfreezonFuc(event);
            e.preventDefault();
          } else if (
            e.key === "ArrowUp" &&
            draftCtx.luckysheetCellUpdate.length > 0
          ) {
            formulaMoveEvent("up", ctrlKey, shiftKey, event);
          } else if (
            e.key === "ArrowDown" &&
            draftCtx.luckysheetCellUpdate.length > 0
          ) {
            formulaMoveEvent("down", ctrlKey, shiftKey, event);
          } else if (
            e.key === "ArrowLeft" &&
            draftCtx.luckysheetCellUpdate.length > 0
          ) {
            formulaMoveEvent("left", ctrlKey, shiftKey, event);
          } else if (
            e.key === "ArrowRight" &&
            draftCtx.luckysheetCellUpdate.length > 0
          ) {
            formulaMoveEvent("right", ctrlKey, shiftKey, event);
          }
        })
      );
    },
    [refs.cellInput, setContext]
  );

  const onChange = useCallback(
    (html: string) => {
      // setInputHTML(html);
      const e = lastKeyDownEventRef.current;
      if (!e) return;
      const kcode = e.keyCode;
      if (!kcode) return;

      if (
        !(
          (
            (kcode >= 112 && kcode <= 123) ||
            kcode <= 46 ||
            kcode === 144 ||
            kcode === 108 ||
            e.ctrlKey ||
            e.altKey ||
            (e.shiftKey &&
              (kcode === 37 || kcode === 38 || kcode === 39 || kcode === 40))
          )
          // kcode === keycode.WIN ||
          // kcode === keycode.WIN_R ||
          // kcode === keycode.MENU))
        ) ||
        kcode === 8 ||
        kcode === 32 ||
        kcode === 46 ||
        (e.ctrlKey && kcode === 86)
      ) {
        setContext(
          produce((draftCtx) => {
            // if(event.target.id!="luckysheet-input-box" && event.target.id!="luckysheet-rich-text-editor"){
            handleFormulaInput(
              draftCtx,
              refs.fxInput.current!,
              refs.cellInput.current!,
              kcode
            );
            // formula.functionInputHanddler(
            //   $("#luckysheet-functionbox-cell"),
            //   $("#luckysheet-rich-text-editor"),
            //   kcode
            // );
            // setCenterInputPosition(
            //   draftCtx.luckysheetCellUpdate[0],
            //   draftCtx.luckysheetCellUpdate[1],
            //   draftCtx.flowdata
            // );
            // }
          })
        );
      }
    },
    [refs.cellInput, refs.fxInput, setContext]
  );

  if (
    !(
      (context.luckysheet_select_save?.length ?? 0) > 0 &&
      context.luckysheetCellUpdate.length > 0
    )
  ) {
    return null;
  }

  return (
    <div
      className="luckysheet-input-box"
      style={{
        left: context.luckysheet_select_save![0].left_move,
        top: context.luckysheet_select_save![0].top_move,
      }}
    >
      <div
        className="luckysheet-input-box-inner"
        style={{
          minWidth: context.luckysheet_select_save![0].width_move,
          height: context.luckysheet_select_save![0].height_move,
          ...inputBoxStyle,
        }}
      >
        <ContentEditable
          innerRef={(e) => {
            inputRef.current = e;
            refs.cellInput.current = e;
          }}
          className="luckysheet-cell-input"
          id="luckysheet-rich-text-editor"
          aria-autocomplete="list"
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      </div>
      <FormulaSearch
        style={{
          top: (context.luckysheet_select_save?.[0]?.height_move || 0) + 4,
        }}
      />
      <FormulaHint
        style={{
          top: (context.luckysheet_select_save?.[0]?.height_move || 0) + 4,
        }}
      />
    </div>
  );
};

export default InputBox;
