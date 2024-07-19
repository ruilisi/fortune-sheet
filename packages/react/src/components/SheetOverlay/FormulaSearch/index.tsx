import _ from "lodash";
import React, { useContext } from "react";
import WorkbookContext from "../../../context";
import "./index.css";

const FormulaSearch: React.FC<React.HTMLAttributes<HTMLDivElement>> = (
  props
) => {
  const { context } = useContext(WorkbookContext);
  if (_.isEmpty(context.functionCandidates)) return null;

  return (
    <div
      {...props}
      id="luckysheet-formula-search-c"
      className="luckysheet-formula-search-c"
    >
      {context.functionCandidates.map((v, index) => (
        <div
          key={v.n}
          data-func={v.n}
          className={`luckysheet-formula-search-item ${
            index === 0 ? "luckysheet-formula-search-item-active" : ""
          }`}
        >
          <div className="luckysheet-formula-search-func">{v.n}</div>
          <div className="luckysheet-formula-search-detail">{v.d}</div>
        </div>
      ))}
    </div>
  );
};

export default FormulaSearch;
