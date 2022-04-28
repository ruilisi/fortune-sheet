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
      editSheetName(draftCtx, editable.current!);
    });
    setEditing(false);
  }, [setContext]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      editable.current?.blur();
    }
    e.stopPropagation();
  }, []);

  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("index", `${sheet.index}`);
      e.stopPropagation();
    },
    [sheet.index]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      setContext((draftCtx) => {
        const draggingIndex = e.dataTransfer.getData("index");
        const droppingIndex = sheet.index;
        let draggingSheet: Sheet | undefined;
        let droppingSheet: Sheet | undefined;
        _.sortBy(draftCtx.luckysheetfile, ["order"]).forEach((f, i) => {
          f.order = i;
          if (f.index === draggingIndex) {
            draggingSheet = f;
          } else if (f.index === droppingIndex) {
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
    [isDropPlaceholder, setContext, sheet.index]
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
      key={sheet.index}
      ref={containerRef}
      className={
        isDropPlaceholder
          ? "fortune-sheettab-placeholder"
          : `luckysheet-sheets-item${
              context.currentSheetIndex === sheet.index
                ? " luckysheet-sheets-item-active"
                : ""
            }`
      }
      onClick={() => {
        if (isDropPlaceholder) return;
        setContext((draftCtx) => {
          draftCtx.currentSheetIndex = sheet.index!;
        });
      }}
      onContextMenu={(e) => {
        if (isDropPlaceholder) return;
        const rect = refs.workbookContainer.current!.getBoundingClientRect();
        setContext((ctx) => {
          ctx.sheetTabContextMenu = {
            x: e.pageX - rect.left,
            y: e.pageY - rect.top,
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
