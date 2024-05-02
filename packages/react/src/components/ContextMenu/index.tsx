import {
  locale,
  handleCopy,
  handlePasteByClick,
  deleteRowCol,
  insertRowCol,
  removeActiveImage,
  deleteSelectedCellText,
  sortSelection,
  createFilter,
  showImgChooser,
  handleLink,
  hideSelected,
  showSelected,
  getSheetIndex,
  api,
  isAllowEdit,
  jfrefreshgrid,
} from "@tomerkakou/fortune-sheet-core";
import _ from "lodash";
import React, { useContext, useRef, useCallback, useLayoutEffect } from "react";
import WorkbookContext, { SetContextOptions } from "../../context";
import { useAlert } from "../../hooks/useAlert";
import { useDialog } from "../../hooks/useDialog";
import Divider from "./Divider";
import "./index.css";
import Menu from "./Menu";
import CustomSort from "../CustomSort";
import SVGIcon from "../SVGIcon";

const ContextMenu: React.FC = () => {
  const { showDialog } = useDialog();
  const containerRef = useRef<HTMLDivElement>(null);
  const { context, setContext, settings, refs } = useContext(WorkbookContext);
  const { contextMenu } = context;
  const { showAlert } = useAlert();
  const { rightclick, drag, generalDialog, info } = locale(context);
  const getMenuElement = useCallback(
    (name: string, i: number) => {
      const selection = context.luckysheet_select_save?.[0];
      if (name === "|" && context.allowEdit) {
        return <Divider key={`divider-${i}`} />;
      }
      if (name === "copy" && context.allowEdit) {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                if (draftCtx.luckysheet_select_save?.length! > 1) {
                  showAlert(rightclick.noMulti, "ok");
                  draftCtx.contextMenu = {};
                  return;
                }
                handleCopy(draftCtx);
                draftCtx.contextMenu = {};
              });
            }}
          >
            {rightclick.copy}
          </Menu>
        );
      }
      if (name === "paste" && context.allowEdit) {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                handlePasteByClick(draftCtx);
                draftCtx.contextMenu = {};
              });
            }}
          >
            {rightclick.paste}
          </Menu>
        );
      }
      if (name === "insert-column" && context.allowEdit) {
        return selection?.row_select
          ? null
          : ["left", "right"].map((dir) => (
              <Menu
                key={`add-col-${dir}`}
                onClick={(e) => {
                  const position =
                    context.luckysheet_select_save?.[0]?.column?.[0];
                  if (position == null) return;
                  const countStr = (e.target as HTMLDivElement).querySelector(
                    "input"
                  )?.value;
                  if (countStr == null) return;
                  const count = parseInt(countStr, 10);
                  if (count < 1) return;
                  const direction = dir === "left" ? "lefttop" : "rightbottom";
                  const insertRowColOp: SetContextOptions["insertRowColOp"] = {
                    type: "column",
                    index: position,
                    count,
                    direction,
                    id: context.currentSheetId,
                  };
                  setContext(
                    (draftCtx) => {
                      try {
                        insertRowCol(draftCtx, insertRowColOp);
                        draftCtx.contextMenu = {};
                      } catch (err: any) {
                        if (err.message === "maxExceeded")
                          showAlert(rightclick.columnOverLimit, "ok");
                        else if (err.message === "readOnly")
                          showAlert(
                            rightclick.cannotInsertOnColumnReadOnly,
                            "ok"
                          );
                        draftCtx.contextMenu = {};
                      }
                    },
                    {
                      insertRowColOp,
                    }
                  );
                }}
              >
                <>
                  {_.startsWith(context.lang ?? "", "zh") && (
                    <>
                      {rightclick.to}
                      <span className={`luckysheet-cols-rows-shift-${dir}`}>
                        {(rightclick as any)[dir]}
                      </span>
                    </>
                  )}
                  {`${rightclick.insert}  `}
                  <input
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    type="text"
                    className="luckysheet-mousedown-cancel"
                    placeholder={rightclick.number}
                    defaultValue="1"
                  />
                  <span className="luckysheet-cols-rows-shift-word luckysheet-mousedown-cancel">
                    {`${rightclick.column}  `}
                  </span>
                  {!_.startsWith(context.lang ?? "", "zh") && (
                    <span className={`luckysheet-cols-rows-shift-${dir}`}>
                      {(rightclick as any)[dir]}
                    </span>
                  )}
                </>
              </Menu>
            ));
      }
      if (name === "insert-row" && context.allowEdit) {
        return selection?.column_select
          ? null
          : ["top", "bottom"].map((dir) => (
              <Menu
                key={`add-row-${dir}`}
                onClick={(e, container) => {
                  const position =
                    context.luckysheet_select_save?.[0]?.row?.[0];
                  if (position == null) return;
                  const countStr = container.querySelector("input")?.value;
                  if (countStr == null) return;
                  const count = parseInt(countStr, 10);
                  if (count < 1) return;
                  const direction = dir === "top" ? "lefttop" : "rightbottom";
                  const insertRowColOp: SetContextOptions["insertRowColOp"] = {
                    type: "row",
                    index: position,
                    count,
                    direction,
                    id: context.currentSheetId,
                  };
                  setContext(
                    (draftCtx) => {
                      try {
                        insertRowCol(draftCtx, insertRowColOp);
                        draftCtx.contextMenu = {};
                      } catch (err: any) {
                        if (err.message === "maxExceeded")
                          showAlert(rightclick.rowOverLimit, "ok");
                        else if (err.message === "readOnly")
                          showAlert(rightclick.cannotInsertOnRowReadOnly, "ok");
                        draftCtx.contextMenu = {};
                      }
                    },
                    { insertRowColOp }
                  );
                }}
              >
                <>
                  {_.startsWith(context.lang ?? "", "zh") && (
                    <>
                      {rightclick.to}
                      <span className={`luckysheet-cols-rows-shift-${dir}`}>
                        {(rightclick as any)[dir]}
                      </span>
                    </>
                  )}
                  {`${rightclick.insert}  `}
                  <input
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    type="text"
                    className="luckysheet-mousedown-cancel"
                    placeholder={rightclick.number}
                    defaultValue="1"
                  />
                  <span className="luckysheet-cols-rows-shift-word luckysheet-mousedown-cancel">
                    {`${rightclick.row}  `}
                  </span>
                  {!_.startsWith(context.lang ?? "", "zh") && (
                    <span className={`luckysheet-cols-rows-shift-${dir}`}>
                      {(rightclick as any)[dir]}
                    </span>
                  )}
                </>
              </Menu>
            ));
      }
      if (name === "delete-column" && context.allowEdit) {
        return (
          selection?.column_select && (
            <Menu
              key="delete-col"
              onClick={() => {
                if (!selection) return;
                const [st_index, ed_index] = selection.column;
                const deleteRowColOp: SetContextOptions["deleteRowColOp"] = {
                  type: "column",
                  start: st_index,
                  end: ed_index,
                  id: context.currentSheetId,
                };
                setContext(
                  (draftCtx) => {
                    if (draftCtx.luckysheet_select_save?.length! > 1) {
                      showAlert(rightclick.noMulti, "ok");
                      draftCtx.contextMenu = {};
                      draftCtx.dataVerificationDropDownList = false;
                      return;
                    }
                    const slen = ed_index - st_index + 1;
                    const index = getSheetIndex(
                      draftCtx,
                      context.currentSheetId
                    ) as number;
                    if (
                      draftCtx.luckysheetfile[index].data?.[0]?.length! <= slen
                    ) {
                      showAlert(rightclick.cannotDeleteAllColumn, "ok");
                      draftCtx.contextMenu = {};
                      return;
                    }
                    try {
                      deleteRowCol(draftCtx, deleteRowColOp);
                    } catch (e: any) {
                      if (e.message === "readOnly") {
                        showAlert(rightclick.cannotDeleteColumnReadOnly, "ok");
                      }
                    }
                    draftCtx.contextMenu = {};
                  },
                  { deleteRowColOp }
                );
              }}
            >
              {rightclick.deleteSelected}
              {rightclick.column}
            </Menu>
          )
        );
      }
      if (name === "delete-row" && context.allowEdit) {
        return (
          selection?.row_select && (
            <Menu
              key="delete-row"
              onClick={() => {
                if (!selection) return;
                const [st_index, ed_index] = selection.row;
                const deleteRowColOp: SetContextOptions["deleteRowColOp"] = {
                  type: "row",
                  start: st_index,
                  end: ed_index,
                  id: context.currentSheetId,
                };
                setContext(
                  (draftCtx) => {
                    if (draftCtx.luckysheet_select_save?.length! > 1) {
                      showAlert(rightclick.noMulti, "ok");
                      draftCtx.contextMenu = {};
                      return;
                    }
                    const slen = ed_index - st_index + 1;
                    const index = getSheetIndex(
                      draftCtx,
                      context.currentSheetId
                    ) as number;
                    if (draftCtx.luckysheetfile[index].data?.length! <= slen) {
                      showAlert(rightclick.cannotDeleteAllRow, "ok");
                      draftCtx.contextMenu = {};
                      return;
                    }
                    try {
                      deleteRowCol(draftCtx, deleteRowColOp);
                    } catch (e: any) {
                      if (e.message === "readOnly") {
                        showAlert(rightclick.cannotDeleteRowReadOnly, "ok");
                      }
                    }
                    draftCtx.contextMenu = {};
                  },
                  { deleteRowColOp }
                );
              }}
            >
              {rightclick.deleteSelected}
              {rightclick.row}
            </Menu>
          )
        );
      }
      if (name === "hide-row" && context.allowEdit) {
        return (
          selection?.row_select === true &&
          ["hideSelected", "showHide"].map((item) => (
            <Menu
              key={item}
              onClick={() => {
                setContext((draftCtx) => {
                  let msg = "";
                  if (item === "hideSelected") {
                    msg = hideSelected(draftCtx, "row");
                  } else if (item === "showHide") {
                    showSelected(draftCtx, "row");
                  }
                  if (msg === "noMulti") {
                    showDialog(drag.noMulti);
                  }
                  draftCtx.contextMenu = {};
                });
              }}
            >
              {(rightclick as any)[item] + rightclick.row}
            </Menu>
          ))
        );
      }
      if (name === "hide-column" && context.allowEdit) {
        return (
          selection?.column_select === true &&
          ["hideSelected", "showHide"].map((item) => (
            <Menu
              key={item}
              onClick={() => {
                setContext((draftCtx) => {
                  let msg = "";
                  if (item === "hideSelected") {
                    msg = hideSelected(draftCtx, "column");
                  } else if (item === "showHide") {
                    showSelected(draftCtx, "column");
                  }
                  if (msg === "noMulti") {
                    showDialog(drag.noMulti);
                  }
                  draftCtx.contextMenu = {};
                });
              }}
            >
              {(rightclick as any)[item] + rightclick.column}
            </Menu>
          ))
        );
      }
      if (name === "set-row-height" && context.allowEdit) {
        const rowHeight = selection?.height || context.defaultrowlen;
        const shownRowHeight = context.luckysheet_select_save?.some(
          (section) =>
            section.height_move !==
            (rowHeight + 1) * (section.row[1] - section.row[0] + 1) - 1
        )
          ? ""
          : rowHeight;
        return context.luckysheet_select_save?.some(
          (section) => section.row_select
        ) ? (
          <Menu
            key="set-row-height"
            onClick={(e, container) => {
              const targetRowHeight = container.querySelector("input")?.value;
              setContext((draftCtx) => {
                if (
                  _.isUndefined(targetRowHeight) ||
                  targetRowHeight === "" ||
                  parseInt(targetRowHeight, 10) <= 0 ||
                  parseInt(targetRowHeight, 10) > 545
                ) {
                  showAlert(info.tipRowHeightLimit, "ok");
                  draftCtx.contextMenu = {};
                  return;
                }
                const numRowHeight = parseInt(targetRowHeight, 10);
                const rowHeightList: Record<string, number> = {};
                _.forEach(draftCtx.luckysheet_select_save, (section) => {
                  for (
                    let rowNum = section.row[0];
                    rowNum <= section.row[1];
                    rowNum += 1
                  ) {
                    rowHeightList[rowNum] = numRowHeight;
                  }
                });
                api.setRowHeight(draftCtx, rowHeightList, {}, true);
                draftCtx.contextMenu = {};
              });
            }}
          >
            {rightclick.row}
            {rightclick.height}
            <input
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              type="number"
              min={1}
              max={545}
              className="luckysheet-mousedown-cancel"
              placeholder={rightclick.number}
              defaultValue={shownRowHeight}
              style={{ width: "40px" }}
            />
            px
          </Menu>
        ) : null;
      }
      if (name === "set-column-width" && context.allowEdit) {
        const colWidth = selection?.width || context.defaultcollen;
        const shownColWidth = context.luckysheet_select_save?.some(
          (section) =>
            section.width_move !==
            (colWidth + 1) * (section.column[1] - section.column[0] + 1) - 1
        )
          ? ""
          : colWidth;
        return context.luckysheet_select_save?.some(
          (section) => section.column_select
        ) ? (
          <Menu
            key="set-column-width"
            onClick={(e, container) => {
              const targetColWidth = container.querySelector("input")?.value;
              setContext((draftCtx) => {
                if (
                  _.isUndefined(targetColWidth) ||
                  targetColWidth === "" ||
                  parseInt(targetColWidth, 10) <= 0 ||
                  parseInt(targetColWidth, 10) > 2038
                ) {
                  showAlert(info.tipColumnWidthLimit, "ok");
                  draftCtx.contextMenu = {};
                  return;
                }
                const numColWidth = parseInt(targetColWidth, 10);
                const colWidthList: Record<string, number> = {};
                _.forEach(draftCtx.luckysheet_select_save, (section) => {
                  for (
                    let colNum = section.column[0];
                    colNum <= section.column[1];
                    colNum += 1
                  ) {
                    colWidthList[colNum] = numColWidth;
                  }
                });
                api.setColumnWidth(draftCtx, colWidthList, {}, true);
                draftCtx.contextMenu = {};
              });
            }}
          >
            {rightclick.column}
            {rightclick.width}
            <input
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              type="number"
              min={1}
              max={545}
              className="luckysheet-mousedown-cancel"
              placeholder={rightclick.number}
              defaultValue={shownColWidth}
              style={{ width: "40px" }}
            />
            px
          </Menu>
        ) : null;
      }
      if (name === "clear" && context.allowEdit) {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                const allowEdit = isAllowEdit(draftCtx);
                if (!allowEdit) return;
                if (draftCtx.activeImg != null) {
                  removeActiveImage(draftCtx);
                } else {
                  const msg = deleteSelectedCellText(draftCtx);
                  if (msg === "partMC") {
                    showDialog(generalDialog.partiallyError, "ok");
                  } else if (msg === "allowEdit") {
                    showDialog(generalDialog.readOnlyError, "ok");
                  } else if (msg === "dataNullError") {
                    showDialog(generalDialog.dataNullError, "ok");
                  }
                }
                draftCtx.contextMenu = {};
                jfrefreshgrid(draftCtx, null, undefined);
              });
            }}
          >
            {rightclick.clearContent}
          </Menu>
        );
      }
      if (name === "orderAZ" && context.allowEdit) {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                sortSelection(draftCtx, true);
                draftCtx.contextMenu = {};
              });
            }}
          >
            {rightclick.orderAZ}
          </Menu>
        );
      }
      if (name === "orderZA" && context.allowEdit) {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                sortSelection(draftCtx, false);
                draftCtx.contextMenu = {};
              });
            }}
          >
            {rightclick.orderZA}
          </Menu>
        );
      }
      if (name === "sort" && context.allowEdit) {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                showDialog(<CustomSort />);
                draftCtx.contextMenu = {};
              });
            }}
          >
            {rightclick.sortSelection}
          </Menu>
        );
      }
      if (name === "filter" && context.allowEdit) {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                createFilter(draftCtx);
                draftCtx.contextMenu = {};
              });
            }}
          >
            {rightclick.filterSelection}
          </Menu>
        );
      }
      if (name === "image" && context.allowEdit) {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                showImgChooser();
                draftCtx.contextMenu = {};
              });
            }}
          >
            {rightclick.image}
          </Menu>
        );
      }
      if (name === "link" && context.allowEdit) {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                handleLink(draftCtx);
                draftCtx.contextMenu = {};
              });
            }}
          >
            {rightclick.link}
          </Menu>
        );
      }
      if(name === "updateEntity" && settings.onUpdate){
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                const selection=api.getSelection(draftCtx);
                if(!selection || selection.length>1){
                  showAlert(rightclick.cannotUpdateOrAddEntity,"ok");
                }
                else{
                  const {row:[r,re],column:[c,ce]}=selection[0];
                  const sheet=api.getSheet(draftCtx,{id:draftCtx.currentSheetId})
                  const sheetIndex=getSheetIndex(draftCtx,draftCtx.currentSheetId)
                  const coordinate=api.getSelectionCoordinates(draftCtx)[0]
                  if(sheetIndex === null){
                    throw new Error("no sheet index")
                  }
                  settings.updateEntity(sheetIndex,sheet.name,{r,re,c,ce},coordinate);
                }
                draftCtx.contextMenu = {};
              });
            }}
          >
            <span className="pre-context-item">
                <SVGIcon name="check" width={16} height={16} />
            </span>
            {rightclick.updateEntity}
          </Menu>
        );
      }
      if(name === "revertChanges" && settings.onUpdate){
        return (
          <Menu
            key={name}
            onClick={() => {
              settings.revertChanges();
              setContext((draftCtx)=>{
                draftCtx.contextMenu = {};
              })
            }}
          >
            <span className="pre-context-item">
                <SVGIcon name="undo" width={16} height={16} />
            </span>
            {rightclick.revertChanges}
          </Menu>
        );
      }
      if(name === "addEntity" && !(settings.onUpdate)){
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                const selection=api.getSelection(draftCtx);
                if(!selection || selection.length>1){
                  showAlert(rightclick.cannotUpdateOrAddEntity,"ok");
                }
                else{
                  const {row:[r,re],column:[c,ce]}=selection[0];
                  const sheet=api.getSheet(draftCtx,{id:draftCtx.currentSheetId})
                  const sheetIndex=getSheetIndex(draftCtx,draftCtx.currentSheetId)
                  const coordinate=api.getSelectionCoordinates(draftCtx)[0]
                  if(sheetIndex === null){
                    throw new Error("no sheet index")
                  }
                  settings.addEntity(sheetIndex,sheet.name,{r,re,c,ce},coordinate);
                }
                draftCtx.contextMenu = {};
              });
              
            }}
          >
            <span className="pre-context-item">
                <SVGIcon name="plus" width={16} height={16} style={{fill:"#74E291"}}/>
              </span>
            {rightclick.addEntity}
          </Menu>
        );
      }
      return null;
    },
    [
      context.currentSheetId,
      context.lang,
      context.luckysheet_select_save,
      context.defaultrowlen,
      context.defaultcollen,
      rightclick,
      info,
      setContext,
      showAlert,
      showDialog,
      drag,
      generalDialog,
    ]
  );

  useLayoutEffect(() => {
    // re-position the context menu if it overflows the window
    if (!containerRef.current) {
      return;
    }
    const winH = window.innerHeight;
    const winW = window.innerWidth;
    const rect = containerRef.current.getBoundingClientRect();
    const workbookRect =
      refs.workbookContainer.current?.getBoundingClientRect();
    if (!workbookRect) {
      return;
    }
    const menuW = rect.width;
    const menuH = rect.height;
    let top = contextMenu.y || 0;
    let left = contextMenu.x || 0;

    let hasOverflow = false;
    if (workbookRect.left + left + menuW > winW) {
      left -= menuW;
      hasOverflow = true;
    }
    if (workbookRect.top + top + menuH > winH) {
      top -= menuH;
      hasOverflow = true;
    }
    if (top < 0) {
      top = 0;
      hasOverflow = true;
    }
    if (hasOverflow) {
      setContext((draftCtx) => {
        draftCtx.contextMenu.x = left;
        draftCtx.contextMenu.y = top;
      });
    }
  }, [contextMenu.x, contextMenu.y, setContext]);

  if (_.isEmpty(context.contextMenu)) return null;

  return (
    <div
      className="fortune-context-menu luckysheet-cols-menu"
      ref={containerRef}
      onContextMenu={(e) => e.stopPropagation()}
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {context.contextMenu.headerMenu === true
        ? settings.headerContextMenu.map((menu, i) => getMenuElement(menu, i))
        : settings.cellContextMenu.map((menu, i) => getMenuElement(menu, i))} 
    </div>
  );
};

export default ContextMenu;
