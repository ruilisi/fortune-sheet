import React, { useMemo, useState, useCallback } from "react";
import "./index.css";
import defaultContext, { Context } from "@fortune-sheet/core/src/context";
import produce from "immer";
import Sheet from "../Sheet";
import WorkbookContext from "../../context";
import Toolbar from "../Toolbar";
import FxEditor from "../FxEditor";

type Props = {
  data: any;
};

const Workbook: React.FC<Props> = ({ data }) => {
  const [context, setContext] = useState(defaultContext());
  const setContextValue = useCallback(
    <K extends keyof Context>(key: K, value: Context[K]) => {
      setContext(
        produce((draftCtx) => {
          draftCtx[key] = value;
        })
      );
    },
    []
  );
  const providerValue = useMemo(
    () => ({ context, setContext, setContextValue }),
    [context, setContextValue]
  );

  return (
    <WorkbookContext.Provider value={providerValue}>
      <div className="fortune-container">
        <div className="fortune-workarea">
          <Toolbar />
          <FxEditor />
        </div>
        <Sheet data={data} />
      </div>
    </WorkbookContext.Provider>
  );
};

export default Workbook;
