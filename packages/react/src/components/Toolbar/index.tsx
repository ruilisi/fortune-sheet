import React, { useContext, useCallback, useRef } from "react";
import {
  getToolbarItemClickHandler,
  handleTextBackground,
  handleTextColor,
  handleTextSize,
  normalizedCellAttr,
  getFlowdata,
} from "@fortune-sheet/core";
import WorkbookContext from "../../context";
import "./index.css";
import Button from "./Button";
import Divider from "./Divider";
import Combo from "./Combo";
import ColorPicker from "./ColorPicker";
import Select, { Option } from "./Select";

const Toolbar: React.FC = () => {
  const { context, setContext, refs, settings, handleUndo, handleRedo } =
    useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstSelection = context.luckysheet_select_save?.[0];
  const flowdata = getFlowdata(context);
  const row = firstSelection?.row_focus;
  const col = firstSelection?.column_focus;
  const cell = flowdata && row && col ? flowdata?.[row]?.[col] : undefined;

  const getToolbarItem = useCallback(
    (name: string, i: number) => {
      if (name === "|") {
        return <Divider key={i} />;
      }
      if (["text-color", "text-background"].includes(name)) {
        const pick = (color: string) => {
          setContext((draftCtx) =>
            (name === "text-color" ? handleTextColor : handleTextBackground)(
              draftCtx,
              refs.cellInput.current!,
              color
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
      if (name === "format") {
        return (
          <Combo text="自动" key={name} tooltip={name}>
            {(setOpen) => (
              <Select>
                <Option
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  自动
                </Option>
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "text-size") {
        return (
          <Combo
            text={cell ? normalizedCellAttr(cell, "fs") : "10"}
            key={name}
            tooltip={name}
          >
            {(setOpen) => (
              <Select>
                {[
                  9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
                ].map((num) => (
                  <Option
                    key={num}
                    onClick={() => {
                      setContext((draftContext) =>
                        handleTextSize(
                          draftContext,
                          refs.cellInput.current!,
                          num
                        )
                      );
                      setOpen(false);
                    }}
                  >
                    {num}
                  </Option>
                ))}
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "undo") {
        return (
          <Button
            iconId={name}
            tooltip={name}
            key={name}
            disabled={refs.globalCache.undoList.length === 0}
            onClick={() => handleUndo()}
          />
        );
      }
      if (name === "redo") {
        return (
          <Button
            iconId={name}
            tooltip={name}
            key={name}
            disabled={refs.globalCache.redoList.length === 0}
            onClick={() => handleRedo()}
          />
        );
      }
      return (
        <Button
          iconId={name}
          tooltip={name}
          key={name}
          onClick={() =>
            setContext((draftCtx) => {
              getToolbarItemClickHandler(name)?.(
                draftCtx,
                refs.cellInput.current!
              );
            })
          }
        />
      );
    },
    [cell, handleRedo, handleUndo, refs.cellInput, refs.globalCache, setContext]
  );

  return (
    <div ref={containerRef} className="fortune-toolbar">
      <div className="luckysheet-toolbar-left-theme" />
      {settings.showtoolbarConfig.map((name, i) => getToolbarItem(name, i))}
    </div>
  );
};

export default Toolbar;
