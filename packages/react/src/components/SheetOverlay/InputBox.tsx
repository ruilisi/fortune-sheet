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
  isShowHidenCR,
  israngeseleciton,
  escapeHTMLTag,
  isAllowEdit,
} from "@fortune-sheet/core";
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
  useState,
} from "react";
import _ from "lodash";
import WorkbookContext from "../../context";
import ContentEditable from "./ContentEditable";
import FormulaSearch from "./FormulaSearch";
import FormulaHint from "./FormulaHint";
import usePrevious from "../../hooks/usePrevious";

const InputBox: React.FC = () => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const inputRef = useRef<HTMLDivElement>(null);
  const lastKeyDownEventRef = useRef<KeyboardEvent>();
  const prevCellUpdate = usePrevious<any[]>(context.luckysheetCellUpdate);
  const prevSheetId = usePrevious<string>(context.currentSheetId);
  const [isHidenRC, setIsHidenRC] = useState<boolean>(false);
  const firstSelection = context.luckysheet_select_save?.[0];
  const row_index = firstSelection?.row_focus!;
  const col_index = firstSelection?.column_focus!;
  const preText = useRef("");

  const inputBoxStyle = useMemo(() => {
    if (firstSelection && context.luckysheetCellUpdate.length > 0) {
      const flowdata = getFlowdata(context);
      if (!flowdata) return {};
      return getStyleByCell(
        context,
        flowdata,
        firstSelection.row_focus!,
        firstSelection.column_focus!
      );
    }
    return {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    context.luckysheetfile,
    context.currentSheetId,
    context.luckysheetCellUpdate,
    firstSelection,
  ]);

  useLayoutEffect(() => {
    if (!context.allowEdit) {
      setContext((ctx) => {
        const flowdata = getFlowdata(ctx);
        if (!_.isNil(flowdata) && ctx.forceFormulaRef) {
          const value = getCellValue(row_index, col_index, flowdata, "f");
          createRangeHightlight(ctx, value);
        }
      });
    }
    if (firstSelection && context.luckysheetCellUpdate.length > 0) {
      if (refs.globalCache.doNotUpdateCell) {
        delete refs.globalCache.doNotUpdateCell;
        return;
      }
      if (
        _.isEqual(prevCellUpdate, context.luckysheetCellUpdate) &&
        prevSheetId === context.currentSheetId
      ) {
        // data change by a collabrative update should not trigger this effect
        return;
      }
      const flowdata = getFlowdata(context);
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
      if (!refs.globalCache.ignoreWriteCell)
        inputRef.current!.innerHTML = escapeHTMLTag(escapeScriptTag(value));
      refs.globalCache.ignoreWriteCell = false;
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
    context.currentSheetId,
    firstSelection,
  ]);

  useEffect(() => {
    if (_.isEmpty(context.luckysheetCellUpdate)) {
      if (inputRef.current) {
        inputRef.current.innerHTML = "";
      }
    }
  }, [context.luckysheetCellUpdate]);

  // 当选中行列是处于隐藏状态的话则不允许编辑
  useEffect(() => {
    setIsHidenRC(isShowHidenCR(context));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.luckysheet_select_save]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      lastKeyDownEventRef.current = new KeyboardEvent(e.type, e.nativeEvent);
      preText.current = inputRef.current!.innerText;
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
          document.execCommand("insertHTML", false, "\n "); // 换行符后面的空白符是为了强制让他换行，在下一步的delete中会删掉
          document.execCommand("delete", false);
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

  const onChange = useCallback(
    (__: any, isBlur?: boolean) => {
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
          if (
            (draftCtx.formulaCache.rangestart ||
              draftCtx.formulaCache.rangedrag_column_start ||
              draftCtx.formulaCache.rangedrag_row_start ||
              israngeseleciton(draftCtx)) &&
            isBlur
          )
            return;
          if (!isAllowEdit(draftCtx, draftCtx.luckysheet_select_save)) {
            return;
          }
          // if(event.target.id!="luckysheet-input-box" && event.target.id!="luckysheet-rich-text-editor"){
          handleFormulaInput(
            draftCtx,
            refs.fxInput.current,
            refs.cellInput.current!,
            kcode,
            preText.current
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
    },
    [refs.cellInput, refs.fxInput, setContext]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (_.isEmpty(context.luckysheetCellUpdate)) {
        e.preventDefault();
      }
    },
    [context.luckysheetCellUpdate]
  );

  const cfg = context.config || {};
  const rowReadOnly: Record<number, number> = cfg.rowReadOnly || {};
  const colReadOnly: Record<number, number> = cfg.colReadOnly || {};

  const edit = !(
    (colReadOnly[col_index] || rowReadOnly[row_index]) &&
    context.allowEdit === true
  );

  return (
    <div
      className="luckysheet-input-box"
      style={
        firstSelection && !context.rangeDialog?.show
          ? {
              left: firstSelection.left,
              top: firstSelection.top,
              zIndex: _.isEmpty(context.luckysheetCellUpdate) ? -1 : 19,
              display: "block",
            }
          : { left: -10000, top: -10000, display: "block" }
      }
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div
        className="luckysheet-input-box-inner"
        style={
          firstSelection
            ? {
                minWidth: firstSelection.width,
                minHeight: firstSelection.height,
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
          style={{
            transform: `scale(${context.zoomRatio})`,
            transformOrigin: "left top",
            width: `${100 / context.zoomRatio}%`,
            height: `${100 / context.zoomRatio}%`,
          }}
          aria-autocomplete="list"
          onChange={onChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          allowEdit={edit ? !isHidenRC : edit}
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
