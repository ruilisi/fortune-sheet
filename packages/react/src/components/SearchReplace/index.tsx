import {
  locale,
  searchAll,
  searchNext,
  SearchResult,
  normalizeSelection,
  onSearchDialogMoveStart,
  replace,
  replaceAll,
  scrollToHighlightCell,
} from "@fortune-sheet/core";
import produce from "immer";
import React, { useContext, useState, useCallback } from "react";
import _ from "lodash";
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";
import { useAlert } from "../../hooks/useAlert";
import "./index.css";

const SearchReplace: React.FC<{
  getContainer: () => HTMLDivElement;
}> = ({ getContainer }) => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const { findAndReplace, button } = locale(context);
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number }>();
  const { showAlert } = useAlert();
  const [checkMode, checkModeReplace] = useState({
    regCheck: false,
    wordCheck: false,
    caseCheck: false,
  });

  const closeDialog = useCallback(() => {
    _.set(refs.globalCache, "searchDialog.mouseEnter", false);
    setContext((draftCtx) => {
      draftCtx.showSearchReplace = false;
    });
  }, [refs.globalCache, setContext]);

  const setCheckMode = useCallback(
    (mode: string, value: boolean) =>
      checkModeReplace(
        produce((draft) => {
          _.set(draft, mode, value);
        })
      ),
    []
  );

  const getInitialPosition = useCallback((container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    return {
      left: (rect.width - 500) / 2,
      top: (rect.height - 200) / 3,
    };
  }, []);

  return (
    <div
      id="fortunesheet-search-replace"
      className="fortunesheet-search-replace fortune-dialog"
      style={getInitialPosition(getContainer())}
      onMouseEnter={() => {
        _.set(refs.globalCache, "searchDialog.mouseEnter", true);
      }}
      onMouseLeave={() => {
        _.set(refs.globalCache, "searchDialog.mouseEnter", false);
      }}
      onMouseDown={(e) => {
        const { nativeEvent } = e;
        onSearchDialogMoveStart(refs.globalCache, nativeEvent, getContainer());
        e.stopPropagation();
      }}
    >
      <div className="container" onMouseDown={(e) => e.stopPropagation()}>
        <div
          className="icon-close fortune-modal-dialog-icon-close"
          onClick={closeDialog}
        >
          <SVGIcon name="close" style={{ padding: 7, cursor: "pointer" }} />
        </div>
        <div className="tabBox">
          <span
            id="searchTab"
            className={showReplace ? "" : "on"}
            onClick={() => setShowReplace(false)}
          >
            {findAndReplace.find}
          </span>
          <span
            id="replaceTab"
            className={showReplace ? "on" : ""}
            onClick={() => setShowReplace(true)}
          >
            {findAndReplace.replace}
          </span>
        </div>
        <div className="ctBox">
          <div className="row">
            <div className="inputBox">
              <div className="textboxs" id="searchInput">
                {findAndReplace.findTextbox}：
                <input
                  className="formulaInputFocus"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  spellCheck="false"
                  onKeyDown={(e) => e.stopPropagation()}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              {showReplace && (
                <div className="textboxs" id="replaceInput">
                  {findAndReplace.replaceTextbox}：
                  <input
                    className="formulaInputFocus"
                    spellCheck="false"
                    onKeyDown={(e) => e.stopPropagation()}
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="checkboxs">
              <div id="regCheck">
                <input
                  type="checkbox"
                  onChange={(e) => setCheckMode("regCheck", e.target.checked)}
                />
                <span>{findAndReplace.regexTextbox}</span>
              </div>
              <div id="wordCheck">
                <input
                  type="checkbox"
                  onChange={(e) => setCheckMode("wordCheck", e.target.checked)}
                />
                <span>{findAndReplace.wholeTextbox}</span>
              </div>
              <div id="caseCheck">
                <input
                  type="checkbox"
                  onChange={(e) => setCheckMode("caseCheck", e.target.checked)}
                />
                <span>{findAndReplace.distinguishTextbox}</span>
              </div>
            </div>
          </div>
          <div className="btnBox">
            {showReplace && (
              <>
                <div
                  id="replaceAllBtn"
                  className="fortune-message-box-button button-default"
                  onClick={() => {
                    setContext((draftCtx) => {
                      setSelectedCell(undefined);
                      const alertMsg = replaceAll(
                        draftCtx,
                        searchText,
                        replaceText,
                        checkMode
                      );
                      showAlert(alertMsg);
                    });
                  }}
                >
                  {findAndReplace.allReplaceBtn}
                </div>
                <div
                  id="replaceBtn"
                  className="fortune-message-box-button button-default"
                  onClick={() =>
                    setContext((draftCtx) => {
                      setSelectedCell(undefined);
                      const alertMsg = replace(
                        draftCtx,
                        searchText,
                        replaceText,
                        checkMode
                      );
                      if (alertMsg != null) {
                        showAlert(alertMsg);
                      }
                    })
                  }
                >
                  {findAndReplace.replaceBtn}
                </div>
              </>
            )}
            <div
              id="searchAllBtn"
              className="fortune-message-box-button button-default"
              onClick={() =>
                setContext((draftCtx) => {
                  setSelectedCell(undefined);
                  if (!searchText) return;
                  const res = searchAll(draftCtx, searchText, checkMode);
                  setSearchResult(res);
                  if (_.isEmpty(res)) showAlert(findAndReplace.noFindTip);
                })
              }
            >
              {findAndReplace.allFindBtn}
            </div>
            <div
              id="searchNextBtn"
              className="fortune-message-box-button button-default"
              onClick={() =>
                setContext((draftCtx) => {
                  setSearchResult([]);
                  const alertMsg = searchNext(draftCtx, searchText, checkMode);
                  if (alertMsg != null) showAlert(alertMsg);
                })
              }
            >
              {findAndReplace.findBtn}
            </div>
          </div>
        </div>
        <div
          className="close-button fortune-message-box-button button-default"
          onClick={closeDialog}
        >
          {button.close}
        </div>
        {searchResult.length > 0 && (
          <div id="searchAllbox">
            <div className="boxTitle">
              <span>{findAndReplace.searchTargetSheet}</span>
              <span>{findAndReplace.searchTargetCell}</span>
              <span>{findAndReplace.searchTargetValue}</span>
            </div>
            <div className="boxMain">
              {searchResult.map((v) => {
                return (
                  <div
                    className={`boxItem ${
                      _.isEqual(selectedCell, { r: v.r, c: v.c }) ? "on" : ""
                    }`}
                    key={v.cellPosition}
                    onClick={() => {
                      setContext((draftCtx) => {
                        draftCtx.luckysheet_select_save = normalizeSelection(
                          draftCtx,
                          [
                            {
                              row: [v.r, v.r],
                              column: [v.c, v.c],
                            },
                          ]
                        );
                        scrollToHighlightCell(draftCtx, v.r, v.c);
                      });
                      setSelectedCell({ r: v.r, c: v.c });
                    }}
                  >
                    <span>{v.sheetName}</span>
                    <span>{v.cellPosition}</span>
                    <span>{v.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchReplace;
