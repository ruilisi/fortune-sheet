import { Sheet } from "@fortune-sheet/core/src/types";
import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import produce from "immer";
import { handleSheetTabOnBlur } from "@fortune-sheet/core/src/modules/sheet";
import WorkbookContext from "../../context";

type Props = {
  sheet: Sheet;
};

const SheetItem: React.FC<Props> = ({ sheet }) => {
  const { context, setContext, setContextValue } = useContext(WorkbookContext);
  const [editing, setEditing] = useState(false);
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
    setContext(
      produce((draftCtx) => {
        handleSheetTabOnBlur(draftCtx, editable.current!);
      })
    );
    setEditing(false);
  }, [setContext]);

  return (
    <div
      key={sheet.index}
      className={`luckysheet-sheets-item${
        context.currentSheetIndex === sheet.index
          ? " luckysheet-sheets-item-active"
          : ""
      }`}
      onClick={() => {
        setContextValue("currentSheetIndex", sheet.index);
      }}
    >
      <span
        className="luckysheet-sheets-item-name"
        spellCheck="false"
        contentEditable={editing}
        onDoubleClick={() => setEditing(true)}
        onBlur={onBlur}
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
