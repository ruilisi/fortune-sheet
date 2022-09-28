import { Sheet, editSheetName } from "@fortune-sheet/core";
import _ from "lodash";
import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import WorkbookContext from "../../context";
import { useAlert } from "../../hooks/useAlert";

type Props = {
  sheet: Sheet;
  isDropPlaceholder?: boolean;
};

const SheetItem: React.FC<Props> = ({ sheet, isDropPlaceholder }) => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const [editing, setEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editable = useRef<HTMLSpanElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    setContext((draftCtx) => {
      const r = context.sheetScrollRecord[draftCtx?.currentSheetId];
      if (r) {
        draftCtx.scrollLeft = r.scrollLeft ?? 0;
        draftCtx.scrollTop = r.scrollTop ?? 0;
        draftCtx.luckysheet_select_status = r.luckysheet_select_status ?? false;
        draftCtx.luckysheet_select_save = r.luckysheet_select_save ?? undefined;
      } else {
        draftCtx.scrollLeft = 0;
        draftCtx.scrollTop = 0;
        draftCtx.luckysheet_select_status = false;
        draftCtx.luckysheet_select_save = undefined;
      }
      draftCtx.luckysheet_selection_range = [];
    });
  }, [context.currentSheetId, context.sheetScrollRecord, setContext]);

  useEffect(() => {
    if (!editable.current) return;
    if (editing) {
      // select all when enter editing mode
      if (window.getSelection) {
        const range = document.createRange();
        range.selectNodeContents(editable.current);
        if (
          range.startContainer &&
          document.body.contains(range.startContainer)
        ) {
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        // @ts-ignore
      } else if (document.selection) {
        // @ts-ignore
        const range = document.body.createTextRange();
        range.moveToElementText(editable.current);
        range.select();
      }
    }

    // store the current text
    editable.current.dataset.oldText = editable.current.innerText;
  }, [editing]);

  const onBlur = useCallback(() => {
    setContext((draftCtx) => {
      try {
        editSheetName(draftCtx, editable.current!);
      } catch (e: any) {
        showAlert(e.message);
      }
    });
    setEditing(false);
  }, [setContext, showAlert]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      editable.current?.blur();
    }
    e.stopPropagation();
  }, []);

  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("sheetId", `${sheet.id}`);
      e.stopPropagation();
    },
    [sheet.id]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const draggingId = e.dataTransfer.getData("sheetId");
      setContext((draftCtx) => {
        const droppingId = sheet.id;
        let draggingSheet: Sheet | undefined;
        let droppingSheet: Sheet | undefined;
        _.sortBy(draftCtx.luckysheetfile, ["order"]).forEach((f, i) => {
          f.order = i;
          if (f.id === draggingId) {
            draggingSheet = f;
          } else if (f.id === droppingId) {
            droppingSheet = f;
          }
        });
        if (draggingSheet && droppingSheet) {
          draggingSheet.order = droppingSheet.order! - 0.1;
          // re-order all sheets
          _.sortBy(draftCtx.luckysheetfile, ["order"]).forEach((f, i) => {
            f.order = i;
          });
        } else if (draggingSheet && isDropPlaceholder) {
          draggingSheet.order = draftCtx.luckysheetfile.length;
        }
      });
      setDragOver(false);
      e.stopPropagation();
    },
    [isDropPlaceholder, setContext, sheet.id]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragEnter={(e) => {
        setDragOver(true);
        e.stopPropagation();
      }}
      onDragLeave={(e) => {
        setDragOver(false);
        e.stopPropagation();
      }}
      onDragEnd={(e) => {
        setDragOver(false);
        e.stopPropagation();
      }}
      onDrop={onDrop}
      onDragStart={onDragStart}
      draggable
      key={sheet.id}
      ref={containerRef}
      className={
        isDropPlaceholder
          ? "fortune-sheettab-placeholder"
          : `luckysheet-sheets-item${
              context.currentSheetId === sheet.id
                ? " luckysheet-sheets-item-active"
                : ""
            }`
      }
      onClick={() => {
        if (isDropPlaceholder) return;
        setContext((draftCtx) => {
          draftCtx.sheetScrollRecord[draftCtx.currentSheetId] = {
            scrollLeft: draftCtx.scrollLeft,
            scrollTop: draftCtx.scrollTop,
            luckysheet_select_status: draftCtx.luckysheet_select_status,
            luckysheet_select_save: draftCtx.luckysheet_select_save,
            luckysheet_selection_range: draftCtx.luckysheet_selection_range,
          };
          draftCtx.currentSheetId = sheet.id!;
        });
      }}
      onContextMenu={(e) => {
        if (isDropPlaceholder) return;
        const rect = refs.workbookContainer.current!.getBoundingClientRect();
        const { pageX, pageY } = e;
        setContext((ctx) => {
          ctx.sheetTabContextMenu = {
            x: pageX - rect.left,
            y: pageY - rect.top,
            sheet,
            onRename: () => setEditing(true),
          };
        });
      }}
      style={dragOver ? { borderLeft: "2px solid #0188fb" } : {}}
    >
      <span
        className="luckysheet-sheets-item-name"
        spellCheck="false"
        contentEditable={isDropPlaceholder ? false : editing}
        onDoubleClick={() => setEditing(true)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        ref={editable}
        style={dragOver ? { pointerEvents: "none" } : {}}
      >
        {sheet.name}
      </span>
    </div>
  );
};

export default SheetItem;
