import React, { useContext, useMemo } from "react";
import WorkbookContext from "../../context";
import { computePrintPage, getCellRange } from "./divider";
import "./PagePrintLine.css";

const RowSplit: React.FC<{ top: number }> = ({ top }) => {
  return (
    <div
      className="fortune-print-row-line"
      style={{
        top: `${top - 2}px`,
      }}
    />
  );
};
const ColumnSplit: React.FC<{ left: number }> = ({ left }) => {
  return (
    <div
      className="fortune-print-col-line"
      style={{
        left: `${left - 1}px`,
      }}
    />
  );
};

export const PageLine = () => {
  const { context } = useContext(WorkbookContext);
  const { divider } = useMemo(() => {
    const range = getCellRange(context, context.currentSheetId, {
      type: "all",
    });
    return computePrintPage(context, range);
  }, [context]);

  return (
    <div>
      {divider.row.map((top) => {
        return <RowSplit top={top} />;
      })}
      {divider.column.map((left) => {
        return <ColumnSplit left={left} />;
      })}
    </div>
  );
};
