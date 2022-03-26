import React, { useContext, useCallback, useRef } from "react";
import produce from "immer";
import {
  getToolbarItemClickHandler,
  handleTextBackground,
  handleTextColor,
} from "@fortune-sheet/core/src/modules/toolbar";
import WorkbookContext from "../../context";
import "./index.css";
import Button from "./Button";
import Divider from "./Divider";
import Combo from "./Combo";
import ColorPicker from "./ColorPicker";

const Toolbar: React.FC = () => {
  const { setContext, refs, settings } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);

  const getToolbarItem = useCallback(
    (name: string, i: number) => {
      if (name === "|") {
        return <Divider key={i} />;
      }
      if (["text-color", "text-background"].includes(name)) {
        const pick = (color: string) => {
          setContext(
            produce((draftCtx) =>
              (name === "text-color" ? handleTextColor : handleTextBackground)(
                draftCtx,
                refs.cellInput.current!,
                color
              )
            )
          );
          if (name === "text-color") {
            refs.globalCache.recentTextColor = color;
          } else {
            refs.globalCache.recentBackgroundColor = color;
          }
        };
        return (
          <Combo
            iconId={name}
            key={name}
            tooltip={name}
            onClick={() => {
              const color =
                name === "text-color"
                  ? refs.globalCache.recentTextColor
                  : refs.globalCache.recentBackgroundColor;
              if (color) pick(color);
            }}
          >
            {(setOpen) => (
              <ColorPicker
                onPick={(color) => {
                  pick(color);
                  setOpen(false);
                }}
              />
            )}
          </Combo>
        );
      }
      return (
        <Button
          iconId={name}
          tooltip={name}
          key={name}
          onClick={() =>
            setContext(
              produce((draftCtx) => {
                getToolbarItemClickHandler(name)?.(
                  draftCtx,
                  refs.cellInput.current!
                );
              })
            )
          }
        />
      );
    },
    [refs.cellInput, refs.globalCache, setContext]
  );

  return (
    <div ref={containerRef} className="fortune-toolbar">
      <div className="luckysheet-toolbar-left-theme" />
      {settings.showtoolbarConfig.map((name, i) => getToolbarItem(name, i))}
    </div>
  );
};

export default Toolbar;
