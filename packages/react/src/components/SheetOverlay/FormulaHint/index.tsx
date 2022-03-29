import { formulaCache } from "@fortune-sheet/core";
import React, { useContext } from "react";
import WorkbookContext from "../../../context";
import "./index.css";

const FormulaHint: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => {
  const { context } = useContext(WorkbookContext);
  if (!context.functionHint) return null;

  const fn = formulaCache.functionlistMap[context.functionHint];
  if (!fn) return null;

  return (
    <div
      {...props}
      id="luckysheet-formula-help-c"
      className="luckysheet-formula-help-c"
    >
      <div className="luckysheet-formula-help-close" title="关闭">
        <i className="fa fa-times" aria-hidden="true" />
      </div>
      <div className="luckysheet-formula-help-collapse" title="收起">
        <i className="fa fa-angle-up" aria-hidden="true" />
      </div>
      <div className="luckysheet-formula-help-title">
        <div className="luckysheet-formula-help-title-formula">
          <span className="luckysheet-arguments-help-function-name">
            {fn.n}
          </span>
          <span className="luckysheet-arguments-paren">(</span>
          <span className="luckysheet-arguments-parameter-holder">
            {fn.p.map((param: any, i: number) => {
              let { name } = param;
              if (param.repeat === "y") {
                name += ", ...";
              }
              if (param.require === "o") {
                name = `[${name}]`;
              }
              return (
                <span
                  className="luckysheet-arguments-help-parameter"
                  dir="auto"
                  key={name}
                >
                  {name}
                  {i !== fn.p.length - 1 && ", "}
                </span>
              );
            })}
          </span>
          <span className="luckysheet-arguments-paren">)</span>
        </div>
      </div>
      <div className="luckysheet-formula-help-content">
        <div className="luckysheet-formula-help-content-example">
          <div className="luckysheet-arguments-help-section-title">示例</div>
          <div className="luckysheet-arguments-help-formula">
            <span className="luckysheet-arguments-help-function-name">
              {fn.n}
            </span>
            <span className="luckysheet-arguments-paren">(</span>
            <span className="luckysheet-arguments-parameter-holder">
              {fn.p.map((param: any, i: number) => (
                <span
                  key={param.name}
                  className="luckysheet-arguments-help-parameter"
                  dir="auto"
                >
                  {param.example}
                  {i !== fn.p.length - 1 && ", "}
                </span>
              ))}
            </span>
            <span className="luckysheet-arguments-paren">)</span>
          </div>
        </div>
        <div className="luckysheet-formula-help-content-detail">
          <div className="luckysheet-arguments-help-section">
            <div className="luckysheet-arguments-help-section-title luckysheet-arguments-help-parameter-name">
              摘要
            </div>
            <span className="luckysheet-arguments-help-parameter-content">
              {fn.d}
            </span>
          </div>
        </div>
        <div className="luckysheet-formula-help-content-param">
          {fn.p.map((param: any) => (
            <div className="luckysheet-arguments-help-section" key={param.name}>
              <div className="luckysheet-arguments-help-section-title">
                {param.name}
                {param.repeat === "y" && (
                  <span className="luckysheet-arguments-help-argument-info">
                    ...-可重复
                  </span>
                )}
                {param.require === "o" && (
                  <span className="luckysheet-arguments-help-argument-info">
                    -[可选]
                  </span>
                )}
              </div>
              <span className="luckysheet-arguments-help-parameter-content">
                {param.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="luckysheet-formula-help-foot" />
    </div>
  );
};

export default FormulaHint;
