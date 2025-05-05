import React, { useCallback, useContext, useRef, useState } from "react";
import {
  Context,
  MAX_ZOOM_RATIO,
  MIN_ZOOM_RATIO,
  getSheetIndex,
} from "@mritunjaygoutam12/core-mod";
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";
import { useOutsideClick } from "../../hooks/useOutsideClick";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [radioMenuOpen, setRadioMenuOpen] = useState(false);

  useOutsideClick(
    menuRef,
    () => {
      setRadioMenuOpen(false);
    },
    []
  );

  const zoomTo = useCallback(
    (val: number) => {
      val = parseFloat(val.toFixed(1));
      if (val > MAX_ZOOM_RATIO || val < MIN_ZOOM_RATIO) {
        return;
      }
      setContext(
        (ctx: Context) => {
          const index = getSheetIndex(ctx, ctx.currentSheetId);
          if (index == null) {
            return;
          }
          ctx.luckysheetfile[index].zoomRatio = val;
          ctx.zoomRatio = val;
        },
        { noHistory: true }
      );
    },
    [setContext]
  );

  return (
    <div className="fortune-zoom-container">
      <div
        className="fortune-zoom-button"
        onClick={(e) => {
          zoomTo(context.zoomRatio - 0.1);
          e.stopPropagation();
        }}
        tabIndex={0}
      >
        <SVGIcon name="minus" width={16} height={16} />
      </div>
      <div className="fortune-zoom-ratio">
        <div
          className="fortune-zoom-ratio-current fortune-zoom-button"
          onClick={() => setRadioMenuOpen(true)}
          tabIndex={0}
        >
          {(context.zoomRatio * 100).toFixed(0)}%
        </div>
        {radioMenuOpen && (
          <div className="fortune-zoom-ratio-menu" ref={menuRef}>
            {presets.map((v) => (
              <div
                className="fortune-zoom-ratio-item"
                key={v.text}
                onClick={(e) => {
                  zoomTo(v.value);
                  e.preventDefault();
                }}
                tabIndex={0}
              >
                <div className="fortune-zoom-ratio-text">{v.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        className="fortune-zoom-button"
        onClick={(e) => {
          zoomTo(context.zoomRatio + 0.1);
          e.stopPropagation();
        }}
        tabIndex={0}
      >
        <SVGIcon name="plus" width={16} height={16} />
      </div>
    </div>
  );
};

export default ZoomControl;
