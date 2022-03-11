import React, { useMemo, useState, useCallback } from "react";
import "./index.css";
import defaultContext, { Context } from "@fortune-sheet/core/src/context";
import produce from "immer";
import Sheet from "../Sheet";
import WorkbookContext from "../../context";

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
          <div className="fortune-toolbar">toolbar</div>
          <div className="fortune-celldetail">celldetail</div>
        </div>
        <Sheet data={data} />
      </div>
    </WorkbookContext.Provider>
  );
};

export default Workbook;
