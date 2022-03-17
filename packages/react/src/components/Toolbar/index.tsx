import React, { useContext, useCallback, useRef } from "react";
import produce from "immer";
import { getToolbarItemClickHandler } from "@fortune-sheet/core/src/modules/toolbar";
import WorkbookContext from "../../context";
import "./index.css";
import ToolbarButton from "./ToolbarButton";

const Toolbar: React.FC = () => {
  const { context, setContext, refs, settings } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);

  const getToolbarItem = useCallback(
    (name: string) => {
      return (
        <ToolbarButton
          iconClassName={name}
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
    [refs.cellInput, setContext]
  );

  return (
    <div ref={containerRef} className="fortune-toolbar">
      <div className="luckysheet-toolbar-left-theme" />
      {settings.showtoolbarConfig.map((name) => getToolbarItem(name))}
    </div>
  );
};

export default Toolbar;
