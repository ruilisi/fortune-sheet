import {
  applyLocation,
  getFlowdata,
  getOptionValue,
  getSelectRange,
  locale,
} from "@fileverse-dev/fortune-core";
import produce from "immer";
import _ from "lodash";
import React, { useContext, useState, useCallback } from "react";
import WorkbookContext from "../../context";
import { useDialog } from "../../hooks/useDialog";
import "./index.css";

export const LocationCondition: React.FC<{}> = () => {
  const { context, setContext } = useContext(WorkbookContext);
  const { showDialog, hideDialog } = useDialog();
  const { findAndReplace, button } = locale(context);
  const [conditionType, setConditionType] = useState("locationConstant");
  const [constants, setConstants] = useState<Record<string, boolean>>({
    locationDate: true,
    locationDigital: true,
    locationString: true,
    locationBool: true,
    locationError: true,
  });
  const [formulas, setFormulas] = useState<Record<string, boolean>>({
    locationDate: true,
    locationDigital: true,
    locationString: true,
    locationBool: true,
    locationError: true,
  });
  // 确定按钮
  const onConfirm = useCallback(() => {
    if (conditionType === "locationConstant") {
      const value = getOptionValue(constants);
      const selectRange = getSelectRange(context);
      setContext((ctx) => {
        const rangeArr = applyLocation(selectRange, conditionType, value, ctx);
        if (rangeArr.length === 0)
          showDialog(findAndReplace.locationTipNotFindCell, "ok");
      });
    } else if (conditionType === "locationFormula") {
      const value = getOptionValue(formulas);
      const selectRange = getSelectRange(context);
      setContext((ctx) => {
        const rangeArr = applyLocation(selectRange, conditionType, value, ctx);
        if (rangeArr.length === 0)
          showDialog(findAndReplace.locationTipNotFindCell, "ok");
      });
    } else if (conditionType === "locationRowSpan") {
      if (
        context.luckysheet_select_save?.length === 0 ||
        (context.luckysheet_select_save?.length === 1 &&
          context.luckysheet_select_save[0].row[0] ===
            context.luckysheet_select_save[0].row[1])
      ) {
        showDialog(findAndReplace.locationTiplessTwoRow, "ok");
        return;
      }
      const selectRange = _.assignIn([], context.luckysheet_select_save);
      setContext((ctx) => {
        const rangeArr = applyLocation(
          selectRange,
          conditionType,
          undefined,
          ctx
        );
        if (rangeArr.length === 0)
          showDialog(findAndReplace.locationTipNotFindCell, "ok");
      });
    } else if (conditionType === "locationColumnSpan") {
      if (
        context.luckysheet_select_save?.length === 0 ||
        (context.luckysheet_select_save?.length === 1 &&
          context.luckysheet_select_save[0].column[0] ===
            context.luckysheet_select_save[0].column[1])
      ) {
        showDialog(findAndReplace.locationTiplessTwoColumn, "ok");
        return;
      }
      const selectRange = _.assignIn([], context.luckysheet_select_save);
      setContext((ctx) => {
        const rangeArr = applyLocation(
          selectRange,
          conditionType,
          undefined,
          ctx
        );
        if (rangeArr.length === 0)
          showDialog(findAndReplace.locationTipNotFindCell, "ok");
      });
    } else {
      // 空值处理
      let selectRange: {
        row: (number | undefined)[];
        column: any[];
      }[];
      if (
        context.luckysheet_select_save?.length === 0 ||
        (context.luckysheet_select_save?.length === 1 &&
          context.luckysheet_select_save[0].row[0] ===
            context.luckysheet_select_save[0].row[1] &&
          context.luckysheet_select_save[0].column[0] ===
            context.luckysheet_select_save[0].column[1])
      ) {
        const flowdata = getFlowdata(context, context.currentSheetId);
        selectRange = [
          {
            row: [0, flowdata!.length - 1],
            column: [0, flowdata![0].length - 1],
          },
        ];
      } else {
        selectRange = _.assignIn([], context.luckysheet_select_save);
      }
      setContext((ctx) => {
        const rangeArr = applyLocation(
          selectRange,
          conditionType,
          undefined,
          ctx
        );
        if (rangeArr.length === 0)
          showDialog(findAndReplace.locationTipNotFindCell, "ok");
      });
    }
  }, [
    conditionType,
    constants,
    context,
    findAndReplace.locationTipNotFindCell,
    findAndReplace.locationTiplessTwoColumn,
    findAndReplace.locationTiplessTwoRow,
    formulas,
    setContext,
    showDialog,
  ]);

  // 选中事件处理
  const isSelect = useCallback(
    (currentType: string) => conditionType === currentType,
    [conditionType]
  );

  return (
    <div id="fortune-location-condition">
      <div className="title">{findAndReplace.location}</div>
      <div className="listbox">
        {/* 常量 */}
        <div className="listItem">
          <input
            type="radio"
            name="locationType"
            id="locationConstant"
            checked={isSelect("locationConstant")}
            onChange={() => {
              setConditionType("locationConstant");
            }}
          />
          <label htmlFor="locationConstant">
            {findAndReplace.locationConstant}
          </label>
          <div className="subbox">
            {[
              "locationDate",
              "locationDigital",
              "locationString",
              "locationBool",
              "locationError",
            ].map((v) => (
              <div className="subItem" key={v}>
                <input
                  type="checkbox"
                  disabled={!isSelect("locationConstant")}
                  checked={constants[v]}
                  onChange={() => {
                    setConstants(
                      produce((draft) => {
                        _.set(draft, v, !draft[v]);
                      })
                    );
                  }}
                />
                <label
                  htmlFor={v}
                  style={{
                    color: isSelect("locationConstant") ? "#000" : "#666",
                  }}
                >
                  {(findAndReplace as any)[v]}
                </label>
              </div>
            ))}
          </div>
        </div>
        {/* 公式 */}
        <div className="listItem">
          <input
            type="radio"
            name="locationType"
            id="locationFormula"
            checked={isSelect("locationFormula")}
            onChange={() => {
              setConditionType("locationFormula");
            }}
          />
          <label htmlFor="locationFormula">
            {findAndReplace.locationFormula}
          </label>
          <div className="subbox">
            {[
              "locationDate",
              "locationDigital",
              "locationString",
              "locationBool",
              "locationError",
            ].map((v) => (
              <div className="subItem" key={v}>
                <input
                  type="checkbox"
                  disabled={!isSelect("locationFormula")}
                  checked={formulas[v]}
                  onChange={() => {
                    setFormulas(
                      produce((draft) => {
                        _.set(draft, v, !draft[v]);
                      })
                    );
                  }}
                />
                <label
                  htmlFor={v}
                  style={{
                    color: isSelect("locationFormula") ? "#000" : "#666",
                  }}
                >
                  {(findAndReplace as any)[v]}
                </label>
              </div>
            ))}
          </div>
        </div>
        {/* TODO 条件格式 */}
        {["locationNull", "locationRowSpan", "locationColumnSpan"].map((v) => (
          <div className="listItem" key={v}>
            <input
              type="radio"
              name={v}
              checked={isSelect(v)}
              onChange={() => {
                setConditionType(v);
              }}
            />
            <label htmlFor={v}>{(findAndReplace as any)[v]}</label>
          </div>
        ))}
      </div>

      <div
        className="button-basic button-primary"
        onClick={() => {
          hideDialog();
          onConfirm();
        }}
        tabIndex={0}
      >
        {button.confirm}
      </div>
      <div
        className="button-basic button-close"
        onClick={() => {
          hideDialog();
        }}
        tabIndex={0}
      >
        {button.cancel}
      </div>
    </div>
  );
};
