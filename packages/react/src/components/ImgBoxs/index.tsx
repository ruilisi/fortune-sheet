import _ from "lodash";
import { onImageMoveStart, onImageResizeStart } from "@online-sheet/core";
import React, { useContext, useMemo } from "react";
import WorkbookContext from "../../context";

const ImgBoxs: React.FC = () => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const activeImg = useMemo(() => {
    return _.find(context.insertedImgs, { id: context.activeImg });
  }, [context.activeImg, context.insertedImgs]);

  return (
    <div id="luckysheet-image-showBoxs">
      {activeImg && (
        <div
          id="luckysheet-modal-dialog-activeImage"
          className="luckysheet-modal-dialog"
          style={{
            padding: 0,
            position: "absolute",
            zIndex: 300,
            width: activeImg.width * context.zoomRatio,
            height: activeImg.height * context.zoomRatio,
            left: activeImg.left * context.zoomRatio,
            top: activeImg.top * context.zoomRatio,
          }}
        >
          <div
            className="luckysheet-modal-dialog-border"
            style={{ position: "absolute" }}
          />
          <div
            className="luckysheet-modal-dialog-content"
            style={{
              width: activeImg.width * context.zoomRatio,
              height: activeImg.height * context.zoomRatio,
              backgroundImage: `url(${activeImg.src})`,
              backgroundSize: `${activeImg.width * context.zoomRatio}px ${
                activeImg.height * context.zoomRatio
              }px`,
              backgroundRepeat: "no-repeat",
              // context.activeImg.width * context.zoomRatio +
              // context.activeImg.height * context.zoomRatio,
            }}
            onMouseDown={(e) => {
              const { nativeEvent } = e;
              onImageMoveStart(context, refs.globalCache, nativeEvent);
              e.stopPropagation();
            }}
          />
          <div className="luckysheet-modal-dialog-resize">
            {["lt", "mt", "lm", "rm", "rt", "lb", "mb", "rb"].map((v) => (
              <div
                key={v}
                className={`luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-${v}`}
                data-type={v}
                onMouseDown={(e) => {
                  const { nativeEvent } = e;
                  onImageResizeStart(refs.globalCache, nativeEvent, v);
                  e.stopPropagation();
                }}
              />
            ))}
          </div>
          <div className="luckysheet-modal-dialog-controll">
            <span
              className="luckysheet-modal-controll-btn luckysheet-modal-controll-crop"
              role="button"
              tabIndex={0}
              aria-label="裁剪"
              title="裁剪"
            >
              <i className="fa fa-pencil" aria-hidden="true" />
            </span>
            <span
              className="luckysheet-modal-controll-btn luckysheet-modal-controll-restore"
              role="button"
              tabIndex={0}
              aria-label="恢复原图"
              title="恢复原图"
            >
              <i className="fa fa-window-maximize" aria-hidden="true" />
            </span>
            <span
              className="luckysheet-modal-controll-btn luckysheet-modal-controll-del"
              role="button"
              tabIndex={0}
              aria-label="删除"
              title="删除"
            >
              <i className="fa fa-trash" aria-hidden="true" />
            </span>
          </div>
        </div>
      )}
      <div className="img-list">
        {context.insertedImgs?.map((v: any) => {
          const { id, left, top, width, height, src } = v;
          if (v.id === context.activeImg) return null;
          return (
            <div
              id={id}
              key={id}
              className="luckysheet-modal-dialog luckysheet-modal-dialog-image"
              style={{
                width: width * context.zoomRatio,
                height: height * context.zoomRatio,
                padding: 0,
                position: "absolute",
                left: left * context.zoomRatio,
                top: top * context.zoomRatio,
                zIndex: 200,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                setContext((ctx) => {
                  ctx.activeImg = id;
                });
                e.stopPropagation();
              }}
              tabIndex={0}
            >
              <div
                className="luckysheet-modal-dialog-content"
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <img
                  src={src}
                  alt=""
                  style={{
                    width: width * context.zoomRatio,
                    height: height * context.zoomRatio,
                  }}
                />
              </div>
              <div className="luckysheet-modal-dialog-border" />
            </div>
          );
        })}
      </div>
      <div
        id="luckysheet-modal-dialog-cropping"
        className="luckysheet-modal-dialog"
        style={{
          display: "none",
          padding: 0,
          position: "absolute",
          zIndex: 300,
        }}
      >
        <div className="cropping-mask" />
        <div className="cropping-content" />
        <div
          className="luckysheet-modal-dialog-border"
          style={{ position: "absolute" }}
        />
        <div className="luckysheet-modal-dialog-resize">
          <div className="resize-item lt" data-type="lt" />
          <div className="resize-item mt" data-type="mt" />
          <div className="resize-item lm" data-type="lm" />
          <div className="resize-item rm" data-type="rm" />
          <div className="resize-item rt" data-type="rt" />
          <div className="resize-item lb" data-type="lb" />
          <div className="resize-item mb" data-type="mb" />
          <div className="resize-item rb" data-type="rb" />
        </div>
        <div className="luckysheet-modal-dialog-controll">
          <span
            className="luckysheet-modal-controll-btn luckysheet-modal-controll-crop"
            role="button"
            tabIndex={0}
            aria-label="裁剪"
            title="裁剪"
          >
            <i className="fa fa-pencil" aria-hidden="true" />
          </span>
          <span
            className="luckysheet-modal-controll-btn luckysheet-modal-controll-restore"
            role="button"
            tabIndex={0}
            aria-label="恢复原图"
            title="恢复原图"
          >
            <i className="fa fa-window-maximize" aria-hidden="true" />
          </span>
          <span
            className="luckysheet-modal-controll-btn luckysheet-modal-controll-del"
            role="button"
            tabIndex={0}
            aria-label="删除"
            title="删除"
          >
            <i className="fa fa-trash" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="cell-date-picker" />
    </div>
  );
};

export default ImgBoxs;
