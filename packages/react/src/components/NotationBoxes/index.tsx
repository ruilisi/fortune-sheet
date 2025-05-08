import React, { useContext, useEffect } from "react";
import {
  getFlowdata,
  onCommentBoxMoveStart,
  onCommentBoxResizeStart,
  setEditingComment,
  showComments,
} from "@fileverse-dev/fortune-core";
import _ from "lodash";
import ContentEditable from "../SheetOverlay/ContentEditable";
import WorkbookContext from "../../context";

const NotationBoxes: React.FC = () => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const flowdata = getFlowdata(context);

  // TODO use patch to detect ps isShow change may be more effecient
  useEffect(() => {
    if (flowdata) {
      const psShownCells: { r: number; c: number }[] = [];
      for (let i = 0; i < flowdata.length; i += 1) {
        for (let j = 0; j < flowdata[i].length; j += 1) {
          const cell = flowdata[i][j];
          if (!cell) continue;
          if (cell.ps?.isShow) {
            psShownCells.push({ r: i, c: j });
          }
        }
      }
      setContext((ctx) => showComments(ctx, psShownCells));
    }
  }, [flowdata, setContext]);
  return (
    <div id="luckysheet-postil-showBoxs">
      {_.concat(
        context.commentBoxes?.filter(
          (v) => v?.rc !== context.editingCommentBox?.rc
        ),
        [context.editingCommentBox, context.hoveredCommentBox]
      ).map((commentBox) => {
        if (!commentBox) return null;
        const { r, c, rc, left, top, width, height, value, autoFocus, size } =
          commentBox;
        const isEditing = context.editingCommentBox?.rc === rc;
        const commentId = `comment-box-${rc}`;
        return (
          <div key={rc}>
            <canvas
              id={`arrowCanvas-${rc}`}
              className="arrowCanvas"
              width={size.width}
              height={size.height}
              style={{
                position: "absolute",
                left: size.left,
                top: size.top,
                zIndex: 100,
                pointerEvents: "none",
              }}
            />
            <div
              id={commentId}
              className="luckysheet-postil-show-main"
              style={{
                width,
                height,
                color: "#000",
                padding: 5,
                border: "1px solid #000",
                backgroundColor: "rgb(255,255,225)",
                position: "absolute",
                left,
                top,
                boxSizing: "border-box",
                zIndex: isEditing ? 200 : 100,
              }}
              onMouseDown={(e) => {
                const { nativeEvent } = e;
                // @ts-ignore
                setContext((draftContext) => {
                  if (flowdata) {
                    setEditingComment(draftContext, flowdata, r, c);
                  }
                });
                onCommentBoxMoveStart(
                  context,
                  refs.globalCache,
                  nativeEvent,
                  { r, c, rc },
                  commentId
                );
                e.stopPropagation();
              }}
            >
              <div className="luckysheet-postil-dialog-move">
                {["t", "r", "b", "l"].map((v) => (
                  <div
                    key={v}
                    className={`luckysheet-postil-dialog-move-item luckysheet-postil-dialog-move-item-${v}`}
                    data-type={v}
                  />
                ))}
              </div>
              {isEditing && (
                <div className="luckysheet-postil-dialog-resize">
                  {["lt", "mt", "lm", "rm", "rt", "lb", "mb", "rb"].map((v) => (
                    <div
                      key={v}
                      className={`luckysheet-postil-dialog-resize-item luckysheet-postil-dialog-resize-item-${v}`}
                      data-type={v}
                      onMouseDown={(e) => {
                        const { nativeEvent } = e;
                        onCommentBoxResizeStart(
                          context,
                          refs.globalCache,
                          nativeEvent,
                          { r, c, rc },
                          commentId,
                          v
                        );
                        e.stopPropagation();
                      }}
                    />
                  ))}
                </div>
              )}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                <ContentEditable
                  id={`comment-editor-${rc}`}
                  autoFocus={autoFocus}
                  style={{
                    width: "100%",
                    height: "100%",
                    lineHeight: "20px",
                    boxSizing: "border-box",
                    textAlign: "center",
                    wordBreak: "break-all",
                    outline: "none",
                  }}
                  allowEdit={context.allowEdit}
                  spellCheck={false}
                  data-r={r}
                  data-c={c}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => {
                    if (context.allowEdit === false) return;
                    refs.globalCache.editingCommentBoxEle =
                      e.target as HTMLDivElement;
                  }}
                  onMouseDown={(e) => {
                    setContext((draftContext) => {
                      if (flowdata) {
                        setEditingComment(draftContext, flowdata, r, c);
                      }
                    });
                    e.stopPropagation();
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                  }}
                  initialContent={value}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotationBoxes;
