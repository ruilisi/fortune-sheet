import { getFlowdata } from "@fortune-sheet/core/src/context";
import {
  cancelNormalSelected,
  getCellValue,
  updateCell,
} from "@fortune-sheet/core/src/modules/cell";
import {
  getInlineStringNoStyle,
  isInlineStringCell,
} from "@fortune-sheet/core/src/modules/inline-string";
import { escapeScriptTag } from "@fortune-sheet/core/src/utils";
import React, { useContext, useState, useCallback, useEffect } from "react";
import produce from "immer";
import "./index.css";
import { moveHighlightCell } from "@fortune-sheet/core/src/modules/selection";
import _ from "lodash";
import { rangeHightlightselected } from "@fortune-sheet/core/src/modules/formula";
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";

const FxEditor: React.FC = () => {
  const [fxInputHTML, setFxInputHTML] = useState<string>("");
  const { context, setContext, refs } = useContext(WorkbookContext);

  useEffect(() => {
    const d = getFlowdata(context);
    let value = "";
    if ((context.luckysheet_select_save?.length ?? 0) > 0) {
      const [firstSelection] = context.luckysheet_select_save!;
      const r = firstSelection.row_focus;
      const c = firstSelection.column_focus;
      if (_.isNil(r) || _.isNil(c)) return;

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

  const onFocus = useCallback(() => {
    if ((context.luckysheet_select_save?.length ?? 0) > 0) {
      setContext(
        produce((draftCtx) => {
          const last =
            draftCtx.luckysheet_select_save![
              draftCtx.luckysheet_select_save!.length - 1
            ];

          const row_index = last.row_focus;
          const col_index = last.column_focus;

          draftCtx.luckysheetCellUpdate = [row_index, col_index];
          refs.globalCache.doNotFocus = true;
          // formula.rangeResizeTo = $("#luckysheet-functionbox-cell");
        })
      );
    }
  }, [context.luckysheet_select_save, refs.globalCache, setContext]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // if (isEditMode()) {
      //   // 此模式下禁用公式栏
      //   return;
      // }
      setContext(
        produce((draftCtx) => {
          const kcode = e.keyCode;

          if (context.luckysheetCellUpdate.length > 0) {
            switch (e.key) {
              case "Enter": {
                // if (
                //   $("#luckysheet-formula-search-c").is(":visible") &&
                //   formula.searchFunctionCell != null
                // ) {
                //   formula.searchFunctionEnter(
                //     $("#luckysheet-formula-search-c").find(
                //       ".luckysheet-formula-search-item-active"
                //     )
                //   );
                // } else {
                const lastCellUpdate = _.clone(draftCtx.luckysheetCellUpdate);
                updateCell(
                  draftCtx,
                  draftCtx.luckysheetCellUpdate[0],
                  draftCtx.luckysheetCellUpdate[1],
                  refs.fxInput.current!
                );
                draftCtx.luckysheet_select_save = [
                  {
                    row: [lastCellUpdate[0], lastCellUpdate[0]],
                    column: [lastCellUpdate[1], lastCellUpdate[1]],
                    row_focus: lastCellUpdate[0],
                    column_focus: lastCellUpdate[1],
                  },
                ];
                moveHighlightCell(draftCtx, "down", 1, "rangeOfSelect");
                // $("#luckysheet-rich-text-editor").focus();
                // }
                e.preventDefault();
                e.stopPropagation();
                break;
              }
              case "Escape": {
                cancelNormalSelected(draftCtx);
                moveHighlightCell(draftCtx, "down", 0, "rangeOfSelect");
                // $("#luckysheet-functionbox-cell").blur();
                // $("#luckysheet-rich-text-editor").focus();
                e.preventDefault();
                e.stopPropagation();
                break;
              }
              case "F4": {
                formula.setfreezonFuc(event);
                e.preventDefault();
                e.stopPropagation();
                break;
              }
              case "ArrowUp": {
                if ($("#luckysheet-formula-search-c").is(":visible")) {
                  let $up = $("#luckysheet-formula-search-c")
                    .find(".luckysheet-formula-search-item-active")
                    .prev();
                  if ($up.length === 0) {
                    $up = $("#luckysheet-formula-search-c")
                      .find(".luckysheet-formula-search-item")
                      .last();
                  }
                  $("#luckysheet-formula-search-c")
                    .find(".luckysheet-formula-search-item")
                    .removeClass("luckysheet-formula-search-item-active");
                  $up.addClass("luckysheet-formula-search-item-active");
                }
                e.preventDefault();
                e.stopPropagation();
                break;
              }
              case "ArrowDown": {
                if ($("#luckysheet-formula-search-c").is(":visible")) {
                  let $up = $("#luckysheet-formula-search-c")
                    .find(".luckysheet-formula-search-item-active")
                    .next();
                  if ($up.length === 0) {
                    $up = $("#luckysheet-formula-search-c")
                      .find(".luckysheet-formula-search-item")
                      .first();
                  }
                  $("#luckysheet-formula-search-c")
                    .find(".luckysheet-formula-search-item")
                    .removeClass("luckysheet-formula-search-item-active");
                  $up.addClass("luckysheet-formula-search-item-active");
                }
                e.preventDefault();
                e.stopPropagation();
                break;
              }
              case "ArrowLeft": {
                rangeHightlightselected(draftCtx, refs.fxInput.current!);
                break;
              }
              case "ArrowRight": {
                rangeHightlightselected(draftCtx, refs.fxInput.current!);
                break;
              }
              default:
                break;
            }
          } else {
            if (
              !(
                (kcode >= 112 && kcode <= 123) ||
                kcode <= 46 ||
                kcode === 144 ||
                kcode === 108 ||
                e.ctrlKey ||
                e.altKey ||
                (e.shiftKey &&
                  (kcode === 37 ||
                    kcode === 38 ||
                    kcode === 39 ||
                    kcode === 40))
              ) ||
              kcode === 8 ||
              kcode === 32 ||
              kcode === 46 ||
              (e.ctrlKey && kcode === 86)
            ) {
              // formula.functionInputHanddler(
              //   $("#luckysheet-rich-text-editor"),
              //   $("#luckysheet-functionbox-cell"),
              //   kcode
              // );
            }
          }
        })
      );
    },
    [context.luckysheetCellUpdate, refs.fxInput, setContext]
  );

  return (
    <div className="fortune-fx-editor">
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
      <div className="fortune-fx-icon">
        <SVGIcon name="fx" width={18} height={18} />
      </div>
      <div className="fortune-fx-input-container">
        <div
          ref={refs.fxInput}
          id="luckysheet-functionbox-cell"
          onFocus={onFocus}
          onKeyDown={onKeyDown}
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
  );
};

export default FxEditor;
