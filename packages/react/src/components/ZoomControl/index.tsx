import React, { useCallback, useContext, useRef } from "react";
import { Context, getSheetIndex } from "@fortune-sheet/core";
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";
import "./index.css";

const presets = [
  {
    text: "10%",
    value: 0.1,
  },
  {
    text: "30%",
    value: 0.3,
  },
  {
    text: "50%",
    value: 0.5,
  },
  {
    text: "70%",
    value: 0.7,
  },
  {
    text: "100%",
    value: 1,
  },
  {
    text: "150%",
    value: 1.5,
  },
  {
    text: "200%",
    value: 2,
  },
  {
    text: "300%",
    value: 3,
  },
  {
    text: "400%",
    value: 4,
  },
];

const ZoomControl: React.FC = () => {
  const { context, setContext } = useContext(WorkbookContext);

  const cursorRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragRef = useRef(false);
  const shortcutRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    isDragRef.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragRef.current = false;
  }, []);

  const showShortcut = useCallback(() => {
    shortcutRef.current!.style.display = "block";
  }, []);

  // 缩放快捷栏
  const shortcutZoom = useCallback(
    (ratioInfo: string) => {
      setContext(
        (ctx: Context) => {
          const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
          // 更改信息显示
          const ratio = parseInt(ratioInfo.replace(/%/g, ""), 10);

          // 更改缩放倍率
          ctx.luckysheetfile[index].zoomRatio = ratio / 100;

          // 更改小球位置
          if (ratio >= 100) {
            cursorRef.current!.style.left = `${(
              46 +
              (5 / 3) * (ctx.luckysheetfile[index].zoomRatio! - 1) * 10
            ).toFixed(1)}px`;
          } else {
            cursorRef.current!.style.left = `${(
              46 -
              (50 / 9) * (1 - ctx.luckysheetfile[index].zoomRatio!) * 10
            ).toFixed(1)}px`;
          }
          ctx.zoomRatio = ctx.luckysheetfile[index].zoomRatio!;
        },
        { noHistory: true }
      );
    },
    [setContext]
  );

  const handleMenuMouseLeave = useCallback(() => {
    shortcutRef.current!.style.display = "none";
  }, []);

  // 更改页面缩放
  const changeZoom = useCallback(
    (operate: string) => {
      setContext(
        (ctx: Context) => {
          const index = getSheetIndex(ctx, ctx.currentSheetId) as number;

          if (!ctx.luckysheetfile[index].zoomRatio) {
            ctx.luckysheetfile[index].zoomRatio = 1;
          }

          if (
            operate === "zoomIn" &&
            ctx.luckysheetfile[index].zoomRatio! < 4
          ) {
            ctx.luckysheetfile[index].zoomRatio! = parseFloat(
              (ctx.luckysheetfile[index].zoomRatio! + 0.1).toFixed(1)
            );
          }
          if (
            operate === "zoomOut" &&
            ctx.luckysheetfile[index].zoomRatio! > 0.1
          ) {
            ctx.luckysheetfile[index].zoomRatio! = parseFloat(
              (ctx.luckysheetfile[index].zoomRatio! - 0.1).toFixed(1)
            );
          }

          if (ctx.luckysheetfile[index].zoomRatio! > 1) {
            cursorRef.current!.style.left = `${(
              46 +
              (5 / 3) * (ctx.luckysheetfile[index].zoomRatio! - 1) * 10
            ).toFixed(1)}px`;
          } else {
            cursorRef.current!.style.left = `${(
              46 -
              (50 / 9) * (1 - ctx.luckysheetfile[index].zoomRatio!) * 10
            ).toFixed(1)}px`;
          }

          return ctx;
        },
        { noHistory: true }
      );
    },
    [setContext]
  );

  // 点击缩放条缩放
  const tapToZoom = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setContext(
        (ctx: Context) => {
          const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
          const sliderRect = sliderRef.current!.getBoundingClientRect();
          const left = e.pageX - sliderRect.left;

          cursorRef.current!.style.left = `${left}px`;
          if (left > 46 && left <= 96) {
            ctx.luckysheetfile[index].zoomRatio! = (left - 46) * 0.06 + 1;
          } else {
            ctx.luckysheetfile[index].zoomRatio! = 1 - (46 - left) * 0.1 * 0.18;
          }
          ctx.zoomRatio = ctx.luckysheetfile[index].zoomRatio!;
        },
        { noHistory: true }
      );
    },
    [setContext]
  );

  // 滑动小球缩放
  const dragToScale = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setContext(
        (ctx: Context) => {
          if (isDragRef.current) {
            const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
            const sliderRect = sliderRef.current!.getBoundingClientRect();
            const left = e.pageX - sliderRect.left - 4;
            // 防止小球滑出缩放条
            if (left <= 96 && left >= -4) {
              cursorRef.current!.style.left = `${left}px`;
              if (left > 46 && left <= 96) {
                ctx.luckysheetfile[index].zoomRatio! = (left - 46) * 0.06 + 1;
              } else {
                ctx.luckysheetfile[index].zoomRatio! =
                  1 - (46 - left) * 0.1 * 0.18;
              }
            }
            ctx.zoomRatio = ctx.luckysheetfile[index].zoomRatio!;
          }
        },
        { noHistory: true }
      );
    },
    [setContext]
  );

  return (
    <>
      <div className="fortune-zoom-content">
        <div className="fortune-zoom-content">
          <div
            className="fortune-zoom-minus fortune-zoom-color"
            onClick={(e) => {
              changeZoom("zoomOut");
              e.stopPropagation();
            }}
          >
            <SVGIcon name="minus" width={16} height={16} />
          </div>
          <div
            ref={sliderRef}
            className="fortune-zoom-slider"
            onClick={(e) => {
              tapToZoom(e);
              e.stopPropagation();
            }}
          >
            <div className="fortune-zoom-line" />
            <div
              className="fortune-zoom-cursor"
              style={{
                left:
                  context.zoomRatio > 1
                    ? `${(46 + (5 / 3) * (context.zoomRatio! - 1) * 10).toFixed(
                        1
                      )}px`
                    : `${(
                        46 -
                        (50 / 9) * (1 - context.zoomRatio!) * 10
                      ).toFixed(1)}px`,
              }}
              ref={cursorRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onMouseMove={(e) => {
                dragToScale(e);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
            <div className="fortune-zoom-hundred" />
          </div>
          <div
            className="fortune-zoom-plus fortune-zoom-color"
            onClick={(e) => {
              changeZoom("zoomIn");
              e.stopPropagation();
            }}
          >
            <SVGIcon name="plus" width={16} height={16} />
          </div>
        </div>
      </div>
      <div className="fortune-zoom-ratio">
        <div
          className="fortune-zoom-ratio-info fortune-zoom-color"
          onClick={showShortcut}
        >
          {(context.zoomRatio * 100).toFixed(0)}%
        </div>
        <div
          className="fortune-zoom-ratio-menu"
          style={{ display: "none" }}
          ref={shortcutRef}
          onMouseLeave={handleMenuMouseLeave}
        >
          {presets.map((v) => (
            <div
              className="fortune-zoom-ratio-item"
              key={v.text}
              onClick={(e) => {
                shortcutZoom(v.text);
                e.preventDefault();
              }}
            >
              <div className="fortune-zoom-ratio-line">{v.text}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ZoomControl;
