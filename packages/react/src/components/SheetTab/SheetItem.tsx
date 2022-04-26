import { Sheet, editSheetName } from "@fortune-sheet/core";
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
};

const SheetItem: React.FC<Props> = ({ sheet }) => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const [editing, setEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editable = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (editing) {
      // select all when enter editing mode
      if (window.getSelection) {
        const range = document.createRange();
        range.selectNodeContents(editable.current!);
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
        range.moveToElementText(editable.current!);
        range.select();
      }
    }

    // store the current text
    editable.current!.dataset.oldText = editable.current!.innerText;
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

  return (
    <div
      key={sheet.index}
      ref={containerRef}
      className={`luckysheet-sheets-item${
        context.currentSheetIndex === sheet.index
          ? " luckysheet-sheets-item-active"
          : ""
      }`}
      onClick={() => {
        setContext((draftCtx) => {
          draftCtx.currentSheetIndex = sheet.index!;
        });
      }}
      onContextMenu={(e) => {
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
    >
      <span
        className="luckysheet-sheets-item-name"
        spellCheck="false"
        contentEditable={editing}
        onDoubleClick={() => setEditing(true)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        ref={editable}
      >
        {sheet.name}
      </span>
      <span className="luckysheet-sheets-item-menu luckysheet-mousedown-cancel">
        <i className="fa fa-sort-desc luckysheet-mousedown-cancel" />
      </span>
    </div>
  );
};

export default SheetItem;
