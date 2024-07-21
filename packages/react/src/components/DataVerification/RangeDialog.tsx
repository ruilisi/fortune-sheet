import { getRangetxt, locale } from "@fortune-sheet/core";

import React, { useCallback, useContext, useEffect, useState } from "react";
import DataVerification from ".";
import WorkbookContext from "../../context";
import { useDialog } from "../../hooks/useDialog";
import ConditionRules from "../ConditionFormat/ConditionRules";
import "./index.css";

const RangeDialog: React.FC = () => {
  const { context, setContext } = useContext(WorkbookContext);
  const { showDialog } = useDialog();
  const { dataVerification, button } = locale(context);
  const [rangeTxt2, setRangeTxt2] = useState<string>(
    context.rangeDialog?.rangeTxt ?? ""
  );

  const close = useCallback(() => {
    setContext((ctx) => {
      // 开启选区
      // globalCache.doNotUpdateCell = false;
      // ctx.formulaCache.rangestart = false;
      // ctx.formulaCache.rangedrag_column_start = false;
      // ctx.formulaCache.rangedrag_row_start = false;
      // ctx.luckysheetCellUpdate = [];
      // ctx.formulaRangeSelect = undefined;
      ctx.rangeDialog!.show = false;
      ctx.rangeDialog!.singleSelect = false;
    });
    if (!context.rangeDialog) return;
    const rangeDialogType = context.rangeDialog.type;
    if (rangeDialogType.indexOf("between") >= 0) {
      showDialog(<ConditionRules type="between" />);
      return;
    }
    if (rangeDialogType.indexOf("conditionRules") >= 0) {
      const rulesType = rangeDialogType.substring(
        "conditionRules".length,
        rangeDialogType.length
      );
      showDialog(<ConditionRules type={rulesType} />);
      return;
    }
    showDialog(<DataVerification />);
  }, [context.rangeDialog, setContext, showDialog]);

  // 得到选区坐标
  useEffect(() => {
    setRangeTxt2((r) => {
      if (context.luckysheet_select_save) {
        const range =
          context.luckysheet_select_save[
            context.luckysheet_select_save.length - 1
          ];
        r = getRangetxt(
          context,
          context.currentSheetId,
          range,
          context.currentSheetId
        );
        return r;
      }
      return "";
    });
  }, [context, context.luckysheet_select_save]);

  return (
    <div
      id="range-dialog"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      tabIndex={0}
    >
      <div className="dialog-title">{dataVerification.selectCellRange}</div>
      <input
        readOnly
        placeholder={dataVerification.selectCellRange2}
        value={rangeTxt2}
      />
      <div
        className="button-basic button-primary"
        style={{ marginLeft: "6px" }}
        onClick={() => {
          setContext((ctx) => {
            ctx.rangeDialog!.rangeTxt = rangeTxt2;
          });
          close();
        }}
        tabIndex={0}
      >
        {button.confirm}
      </div>
      <div
        className="button-basic button-close"
        onClick={() => {
          close();
        }}
        tabIndex={0}
      >
        {button.close}
      </div>
    </div>
  );
};
export default RangeDialog;
