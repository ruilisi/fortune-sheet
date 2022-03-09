import React, { useMemo, useState } from "react";
import "./index.css";
import defaultContext from "@fortune-sheet/core/src/context";
import Sheet from "../Sheet";
import WorkbookContext from "../../context";

type Props = {
  data: any;
};

const Workbook: React.FC<Props> = ({ data }) => {
  const [context, setContext] = useState(defaultContext());
  const providerValue = useMemo(() => ({ context, setContext }), [context]);

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
