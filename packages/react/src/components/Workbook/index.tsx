import React, { useRef } from "react";
import "./index.css";
import { ContextManager } from "@fortune-sheet/core/src/context";
import Sheet from "../Sheet";

type Props = {
  data: any;
};

const Workbook: React.FC<Props> = ({ data }) => {
  const ctxManagerRef = useRef(new ContextManager());

  return (
    <div className="fortune-container">
      <div className="fortune-workarea">
        <div className="fortune-toolbar">toolbar</div>
        <div className="fortune-celldetail">celldetail</div>
      </div>
      <Sheet ctxManager={ctxManagerRef.current} data={data} />
    </div>
  );
};

export default Workbook;
