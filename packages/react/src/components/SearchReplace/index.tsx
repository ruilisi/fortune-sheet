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
} from "@fileverse-dev/fortune-core";
import {
  Button,
  Checkbox,
  cn,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextField,
} from "@fileverse/ui";
import produce from "immer";
import React, { useContext, useState, useCallback, useRef } from "react";
import _ from "lodash";
import WorkbookContext from "../../context";
import { useAlert } from "../../hooks/useAlert";
import "./index.css";

const SearchReplace: React.FC<{
  getContainer: () => HTMLDivElement;
}> = ({ getContainer }) => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const { findAndReplace } = locale(context);
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number }>();
  const { showAlert } = useAlert();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [checkMode, checkModeReplace] = useState({
    regCheck: false,
    wordCheck: false,
    caseCheck: false,
  });

  const closeDialog = useCallback(() => {
    _.set(refs.globalCache, "searchDialog.mouseEnter", false);
    setContext((draftCtx) => {
      draftCtx.showSearch = false;
      draftCtx.showReplace = false;
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
      id="fortune-search-replace"
      className="fortune-search-replace fortune-dialog"
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
      <div>
        <div className="flex items-center justify-between border-b color-border-default py-3 px-6">
          <h3 className="text-heading-sm">Find and replace</h3>
          <IconButton
            icon="X"
            variant="ghost"
            onClick={closeDialog}
            tabIndex={0}
          />
        </div>
        <div className="px-6 pb-6 pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <div
                id="searchInput"
                className="flex flex-row gap-2 items-center"
              >
                <span className="find-replace-label text-heading-xsm">
                  {findAndReplace.findTextbox}：
                </span>
                <TextField
                  ref={searchInputRef}
                  className="formulaInputFocus"
                  autoFocus
                  spellCheck="false"
                  onKeyDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => {
                    if (
                      e.target === searchInputRef.current ||
                      searchInputRef.current?.contains(e.target as Node)
                    ) {
                      e.stopPropagation();
                    }
                  }}
                  value={searchText}
                  onChange={(e) => {
                    if (e.target.value.length === 0) {
                      setSearchResult([]);
                    }
                    setSearchText(e.target.value);
                  }}
                />
              </div>
              <div
                id="replaceInput"
                className="flex flex-row gap-2 items-center"
              >
                <span className="find-replace-label text-heading-xsm">
                  {findAndReplace.replaceTextbox}：
                </span>
                <TextField
                  ref={replaceInputRef}
                  className="formulaInputFocus"
                  spellCheck="false"
                  onKeyDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => {
                    if (
                      e.target === replaceInputRef.current ||
                      replaceInputRef.current?.contains(e.target as Node)
                    ) {
                      e.stopPropagation();
                    }
                  }}
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <div className="find-replace-label" />
              <div className="flex flex-col gap-2 text-body-sm">
                <div id="regCheck" className="flex flex-row gap-2 items-center">
                  <Checkbox
                    className="border-2"
                    checked={checkMode.regCheck}
                    onCheckedChange={(e) =>
                      setCheckMode("regCheck", e.target.checked)
                    }
                  />
                  <span>{findAndReplace.regexTextbox}</span>
                </div>
                <div
                  id="caseCheck"
                  className="flex flex-row gap-2 items-center"
                >
                  <Checkbox
                    className="border-2"
                    checked={checkMode.caseCheck}
                    onCheckedChange={(e) =>
                      setCheckMode("caseCheck", e.target.checked)
                    }
                  />
                  <span>{findAndReplace.distinguishTextbox}</span>
                </div>
                <div
                  id="wordCheck"
                  className="flex flex-row gap-2 items-center"
                >
                  <Checkbox
                    className="border-2"
                    checked={checkMode.wordCheck}
                    onCheckedChange={(e) =>
                      setCheckMode("wordCheck", e.target.checked)
                    }
                  />
                  <span>{findAndReplace.wholeTextbox}</span>
                </div>
              </div>
            </div>
            <Divider className="w-full border-t-[1px]" />
            <div className="flex flex-row gap-2 justify-center items-center mb-4">
              {/* <Button
                variant="secondary"
                className="min-w-fit"
                onClick={closeDialog}
                tabIndex={0}
              >
                {button.close}
              </Button> */}
              <Button
                id="replaceAllBtn"
                variant="secondary"
                className="min-w-fit"
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
                tabIndex={0}
                disabled={searchText.length === 0 || replaceText.length === 0}
              >
                {findAndReplace.allReplaceBtn}
              </Button>
              <Button
                id="replaceBtn"
                variant="secondary"
                className="min-w-fit"
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
                tabIndex={0}
                disabled={searchText.length === 0 || replaceText.length === 0}
              >
                {findAndReplace.replaceBtn}
              </Button>
              <Button
                id="searchAllBtn"
                variant="secondary"
                className="min-w-fit"
                onClick={() =>
                  setContext((draftCtx) => {
                    setSelectedCell(undefined);
                    if (!searchText) return;
                    const res = searchAll(draftCtx, searchText, checkMode);
                    setSearchResult(res);
                    if (_.isEmpty(res)) showAlert(findAndReplace.noFindTip);
                  })
                }
                tabIndex={0}
                disabled={searchText.length === 0}
              >
                {findAndReplace.allFindBtn}
              </Button>
              <Button
                id="searchNextBtn"
                variant="default"
                className="min-w-fit"
                onClick={() =>
                  setContext((draftCtx) => {
                    setSearchResult([]);
                    const alertMsg = searchNext(
                      draftCtx,
                      searchText,
                      checkMode
                    );
                    if (alertMsg != null) showAlert(alertMsg);
                  })
                }
                tabIndex={0}
                disabled={searchText.length === 0}
              >
                {findAndReplace.findBtn}
              </Button>
            </div>
          </div>

          {searchResult.length > 0 && (
            <>
              <Divider className="w-full border-t-[1px] mb-4" />
              <div
                ref={tableContainerRef}
                className="mb-6 table-container max-h-[300px] overflow-y-auto"
                onMouseDown={(e) => {
                  if (
                    e.target === tableContainerRef.current ||
                    tableContainerRef.current?.contains(e.target as Node)
                  ) {
                    e.stopPropagation();
                    tableContainerRef.current?.focus();
                  }
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (tableContainerRef.current) {
                    tableContainerRef.current.scrollTop += e.deltaY;
                  }
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                onTouchMove={(e) => {
                  e.stopPropagation();
                }}
                tabIndex={0}
              >
                <Table id="searchAllbox">
                  <TableHeader className="color-bg-secondary">
                    <TableRow>
                      <TableHead>{findAndReplace.searchTargetSheet}</TableHead>
                      <TableHead>{findAndReplace.searchTargetCell}</TableHead>
                      <TableHead>{findAndReplace.searchTargetValue}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResult.map((v) => {
                      return (
                        <TableRow
                          className={cn(
                            _.isEqual(selectedCell, { r: v.r, c: v.c })
                              ? "color-bg-default-selected"
                              : ""
                          )}
                          key={v.cellPosition}
                          onClick={() => {
                            setContext((draftCtx) => {
                              draftCtx.luckysheet_select_save =
                                normalizeSelection(draftCtx, [
                                  {
                                    row: [v.r, v.r],
                                    column: [v.c, v.c],
                                  },
                                ]);
                              scrollToHighlightCell(draftCtx, v.r, v.c);
                            });
                            setSelectedCell({ r: v.r, c: v.c });
                          }}
                          tabIndex={0}
                        >
                          <TableCell className="find-replace-table-cell">
                            {v.sheetName}
                          </TableCell>
                          <TableCell className="find-replace-table-cell">
                            {v.cellPosition}
                          </TableCell>
                          <TableCell className="find-replace-table-cell">
                            {v.value}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchReplace;
