import {
  cancelNormalSelected,
  getCellValue,
  getInlineStringHTML,
  getStyleByCell,
  isInlineStringCell,
  moveToEnd,
  getFlowdata,
  handleFormulaInput,
  moveHighlightCell,
  escapeScriptTag,
  valueShowEs,
  updateCell,
  createRangeHightlight,
} from "@fortune-sheet/core";
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import _ from "lodash";
import WorkbookContext from "../../context";
import ContentEditable from "./ContentEditable";
import FormulaSearch from "./FormulaSearch";
import FormulaHint from "./FormulaHint";

const InputBox: React.FC = () => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const inputRef = useRef<HTMLDivElement>(null);
  const lastKeyDownEventRef = useRef<React.KeyboardEvent<HTMLDivElement>>();
  const firstSelection = context.luckysheet_select_save?.[0];

  const inputBoxStyle = useMemo(() => {
    if (firstSelection && context.luckysheetCellUpdate.length > 0) {
      const flowdata = getFlowdata(context);
      if (!flowdata) return {};
      return getStyleByCell(
        flowdata,
        firstSelection.row_focus!,
        firstSelection.column_focus!
      );
    }
    return {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    context.luckysheetfile,
    context.currentSheetIndex,
    context.luckysheetCellUpdate,
    firstSelection,
  ]);

  useLayoutEffect(() => {
    if (firstSelection && context.luckysheetCellUpdate.length > 0) {
      if (refs.globalCache.doNotUpdateCell) {
        delete refs.globalCache.doNotUpdateCell;
        return;
      }
      const flowdata = getFlowdata(context);
      const row_index = firstSelection.row_focus!;
      const col_index = firstSelection.column_focus!;
      const cell = flowdata?.[row_index]?.[col_index];
      let value = "";
      if (cell && !refs.globalCache.overwriteCell) {
        if (isInlineStringCell(cell)) {
          value = getInlineStringHTML(row_index, col_index, flowdata);
        } else if (cell.f) {
          value = getCellValue(row_index, col_index, flowdata, "f");
          setContext((ctx) => {
            createRangeHightlight(ctx, value);
          });
        } else {
          value = valueShowEs(row_index, col_index, flowdata);
          if (Number(cell.qp) === 1) {
            value = value ? `${value}` : value;
          }
        }
      }
      refs.globalCache.overwriteCell = false;
      inputRef.current!.innerHTML = escapeScriptTag(value);
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
    firstSelection,
  ]);

  useEffect(() => {
    if (_.isEmpty(context.luckysheetCellUpdate)) {
      if (inputRef.current) {
        inputRef.current.innerHTML = "";
      }
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

      if (e.key === "Escape" && context.luckysheetCellUpdate.length > 0) {
        setContext((draftCtx) => {
          cancelNormalSelected(draftCtx);
          moveHighlightCell(draftCtx, "down", 0, "rangeOfSelect");
        });
        e.preventDefault();
      } else if (e.key === "Enter" && context.luckysheetCellUpdate.length > 0) {
        if (e.altKey || e.metaKey) {
          // originally `enterKeyControll`
          document.execCommand("insertHTML", false, "\n");
          e.stopPropagation();
        }
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
      } else if (e.key === "Tab" && context.luckysheetCellUpdate.length > 0) {
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
        setContext((draftCtx) => {
          updateCell(
            draftCtx,
            draftCtx.luckysheetCellUpdate[0],
            draftCtx.luckysheetCellUpdate[1],
            refs.cellInput.current!
          );
          moveHighlightCell(draftCtx, "right", 1, "rangeOfSelect");
        });
        // }

        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === "F4" && context.luckysheetCellUpdate.length > 0) {
        // formula.setfreezonFuc(event);
        e.preventDefault();
      } /* else if (
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
          } */
    },
    [context.luckysheetCellUpdate.length, refs.cellInput, setContext]
  );

  const onChange = useCallback(() => {
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
      setContext((draftCtx) => {
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
      });
    }
  }, [refs.cellInput, refs.fxInput, setContext]);

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (_.isEmpty(context.luckysheetCellUpdate)) {
        e.preventDefault();
      }
    },
    [context.luckysheetCellUpdate]
  );

  return (
    <div
      className="luckysheet-input-box"
      style={
        firstSelection && !_.isEmpty(context.luckysheetCellUpdate)
          ? {
              left: firstSelection.left_move,
              top: firstSelection.top_move,
              display: "block",
            }
          : { left: -10000, top: -10000, display: "block" }
      }
    >
      <div
        className="luckysheet-input-box-inner"
        style={
          firstSelection
            ? {
                minWidth: firstSelection.width_move,
                ...inputBoxStyle,
              }
            : {}
        }
      >
        <ContentEditable
          innerRef={(e) => {
            // @ts-ignore
            inputRef.current = e;
            refs.cellInput.current = e;
          }}
          className="luckysheet-cell-input"
          id="luckysheet-rich-text-editor"
          aria-autocomplete="list"
          onChange={onChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
      </div>
      {document.activeElement === inputRef.current && (
        <>
          <FormulaSearch
            style={{
              top: (firstSelection?.height_move || 0) + 4,
            }}
          />
          <FormulaHint
            style={{
              top: (firstSelection?.height_move || 0) + 4,
            }}
          />
        </>
      )}
    </div>
  );
};

export default InputBox;
