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
  createRangeHightlight,
  isShowHidenCR,
  israngeseleciton,
  escapeHTMLTag,
  isAllowEdit,
  getrangeseleciton,
} from "@fileverse-dev/fortune-core";
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
  const lastKeyDownEventRef = useRef<KeyboardEvent>(null);
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

  const getActiveFormula = useCallback(
    () => document.querySelector(".luckysheet-formula-search-item-active"),
    []
  );

  const clearSearchItemActiveClass = useCallback(() => {
    const activeFormula = getActiveFormula();
    if (activeFormula) {
      activeFormula.classList.remove("luckysheet-formula-search-item-active");
    }
  }, [getActiveFormula]);

  const selectActiveFormula = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const activeFormula = getActiveFormula();
      const formulaNameDiv = activeFormula?.querySelector(
        ".luckysheet-formula-search-func"
      );
      if (formulaNameDiv) {
        const formulaName = formulaNameDiv.textContent;
        const textEditor = document.getElementById(
          "luckysheet-rich-text-editor"
        );
        if (textEditor) {
          // text for which suggestions have been listed
          const searchTxt = getrangeseleciton()?.textContent || "";
          const deleteCount = searchTxt.length;
          textEditor.focus();

          const selection = window.getSelection();
          if (selection?.rangeCount === 0) return;

          const range = selection?.getRangeAt(0);
          if (deleteCount !== 0 && range) {
            const startOffset = Math.max(range.startOffset - deleteCount, 0);
            const endOffset = range.startOffset;

            // remove searchTxt
            range.setStart(range.startContainer, startOffset);
            range.setEnd(range.startContainer, endOffset);
            range.deleteContents();
          }

          const functionStr = `<span dir="auto" class="luckysheet-formula-text-func">${formulaName}</span>`;
          const lParStr = `<span dir="auto" class="luckysheet-formula-text-lpar">(</span>`;

          const functionNode = new DOMParser().parseFromString(
            functionStr,
            "text/html"
          ).body.childNodes[0];

          const lParNode = new DOMParser().parseFromString(lParStr, "text/html")
            .body.childNodes[0];

          if (range?.startContainer.parentNode) {
            range?.setStart(range.startContainer.parentNode, 1);
          }

          range?.insertNode(lParNode);
          range?.insertNode(functionNode);

          // move the cursor to the end of the inserted text node
          range?.collapse();
          selection?.removeAllRanges();

          if (range) selection?.addRange(range);

          setContext((draftCtx) => {
            // clear functionCandidates and set functionHint
            draftCtx.functionCandidates = [];
            draftCtx.functionHint = formulaName;
          });
        }
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [getActiveFormula, setContext]
  );

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
        } else selectActiveFormula(e);
      } else if (e.key === "Tab" && context.luckysheetCellUpdate.length > 0) {
        selectActiveFormula(e);
        e.preventDefault();
      } else if (e.key === "F4" && context.luckysheetCellUpdate.length > 0) {
        // formula.setfreezonFuc(event);
        e.preventDefault();
      } else if (
        e.key === "ArrowUp" &&
        context.luckysheetCellUpdate.length > 0
      ) {
        if (document.getElementById("luckysheet-formula-search-c")) {
          const formulaSearchContainer = document.getElementById(
            "luckysheet-formula-search-c"
          );
          const activeItem = formulaSearchContainer?.querySelector(
            ".luckysheet-formula-search-item-active"
          );
          let previousItem = activeItem
            ? activeItem.previousElementSibling
            : null;
          if (!previousItem) {
            previousItem =
              formulaSearchContainer?.querySelector(
                ".luckysheet-formula-search-item:last-child"
              ) || null;
          }
          clearSearchItemActiveClass();
          if (previousItem) {
            previousItem.classList.add("luckysheet-formula-search-item-active");
          }
        }
        e.preventDefault();
      } else if (
        e.key === "ArrowDown" &&
        context.luckysheetCellUpdate.length > 0
      ) {
        if (document.getElementById("luckysheet-formula-search-c")) {
          const formulaSearchContainer = document.getElementById(
            "luckysheet-formula-search-c"
          );
          const activeItem = formulaSearchContainer?.querySelector(
            ".luckysheet-formula-search-item-active"
          );
          let nextItem = activeItem ? activeItem.nextElementSibling : null;
          if (!nextItem) {
            nextItem =
              formulaSearchContainer?.querySelector(
                ".luckysheet-formula-search-item:first-child"
              ) || null;
          }
          clearSearchItemActiveClass();
          if (nextItem) {
            nextItem.classList.add("luckysheet-formula-search-item-active");
          }
        }
        e.preventDefault();
      }
      // else if (
      //   e.key === "ArrowLeft" &&
      //   draftCtx.luckysheetCellUpdate.length > 0
      // ) {
      //   formulaMoveEvent("left", ctrlKey, shiftKey, event);
      // } else if (
      //   e.key === "ArrowRight" &&
      //   draftCtx.luckysheetCellUpdate.length > 0
      // ) {
      //   formulaMoveEvent("right", ctrlKey, shiftKey, event);
      // }
    },
    [
      clearSearchItemActiveClass,
      context.luckysheetCellUpdate.length,
      selectActiveFormula,
      setContext,
      firstSelection,
    ]
  );

  const onChange = useCallback(
    (__: any, isBlur?: boolean) => {
      // setInputHTML(html);
      // console.log("onChange", __);
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
          // clearSearchItemActiveClass();
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
