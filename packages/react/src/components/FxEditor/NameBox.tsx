import React, { useContext, useMemo } from "react";
import _ from "lodash";
import { getRangetxt } from "@jadinec/core-sheet";
import WorkbookContext from "../../context";

const LocationBox: React.FC = () => {
  const { context } = useContext(WorkbookContext);

  const rangeText = useMemo(() => {
    const lastSelection = _.last(context.luckysheet_select_save);
    if (
      !(
        lastSelection &&
        lastSelection.row_focus != null &&
        lastSelection.column_focus != null
      )
    )
      return "";
    const rf = lastSelection.row_focus;
    const cf = lastSelection.column_focus;
    if (context.config.merge != null && `${rf}_${cf}` in context.config.merge) {
      return getRangetxt(context, context.currentSheetId, {
        column: [cf, cf],
        row: [rf, rf],
      });
    }
    return getRangetxt(context, context.currentSheetId, lastSelection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.currentSheetId, context.luckysheet_select_save]);

  return (
    <div className="fortune-name-box-container">
      <div className="fortune-name-box" tabIndex={0} dir="ltr">
        {rangeText}
      </div>
    </div>
  );
};

export default LocationBox;
