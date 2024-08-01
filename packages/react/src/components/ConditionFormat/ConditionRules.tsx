import React, { useCallback, useContext, useEffect, useState } from "react";
import "./index.css";
import { locale, setConditionRules } from "@tomerkakou/fortune-sheet-core";
import produce from "immer";
import WorkbookContext from "../../context";
import { useDialog } from "../../hooks/useDialog";

const ConditionRules: React.FC<{ type: string }> = ({ type }) => {
  const { context, setContext } = useContext(WorkbookContext);
  const { hideDialog } = useDialog();
  const { conditionformat, button, protection, generalDialog } =
    locale(context);
  const [colorRules, setColorRules] = useState<{
    textColor: string;
    cellColor: string;
  }>({ textColor: "#000000", cellColor: "#000000" });

  // 开启鼠标选区
  // const dataSelectRange = useCallback(
  //   (selectType: string) => {
  //     hideDialog();
  //     setContext((ctx) => {
  //       ctx.conditionRules.textColor.color = colorRules.textColor;
  //       ctx.conditionRules.cellColor.color = colorRules.cellColor;

  //       ctx.rangeDialog!.show = true;
  //       ctx.rangeDialog!.type = selectType;
  //       ctx.rangeDialog!.rangeTxt = ctx.conditionRules.rulesValue;
  //       ctx.rangeDialog!.singleSelect = true;
  //     });
  //   },
  //   [colorRules.cellColor, colorRules.textColor, hideDialog, setContext]
  // );

  const close = useCallback(
    (closeType: string) => {
      if (closeType === "confirm") {
        setContext((ctx) => {
          ctx.conditionRules.textColor.color = colorRules.textColor;
          ctx.conditionRules.cellColor.color = colorRules.cellColor;
          setConditionRules(
            ctx,
            protection,
            generalDialog,
            conditionformat,
            ctx.conditionRules
          );
        });
      }
      setContext((ctx) => {
        ctx.conditionRules = {
          rulesType: "",
          rulesValue: "",
          textColor: { check: true, color: "#000000" },
          cellColor: { check: true, color: "#000000" },
          betweenValue: { value1: "", value2: "" },
          dateValue: "",
          repeatValue: "0",
          projectValue: "10",
        };
      });
      hideDialog();
    },
    [
      colorRules,
      conditionformat,
      generalDialog,
      hideDialog,
      protection,
      setContext,
    ]
  );

  // rulesValue初始化
  useEffect(() => {
    setContext((ctx) => {
      ctx.conditionRules.rulesType = type;

      if (!ctx.rangeDialog) return;
      const rangeDialogType = ctx.rangeDialog.type;
      const rangeT = ctx.rangeDialog!.rangeTxt;
      if (rangeDialogType === "conditionRulesbetween1") {
        ctx.conditionRules.betweenValue.value1 = rangeT;
      } else if (rangeDialogType === "conditionRulesbetween2") {
        ctx.conditionRules.betweenValue.value2 = rangeT;
      } else if (rangeDialogType.indexOf("conditionRules") >= 0) {
        ctx.conditionRules.rulesValue = rangeT;
      } else if (rangeDialogType === "") {
        ctx.conditionRules = {
          rulesType: type,
          rulesValue: "",
          textColor: { check: true, color: "#000000" },
          cellColor: { check: true, color: "#000000" },
          betweenValue: { value1: "", value2: "" },
          dateValue: "",
          repeatValue: "0",
          projectValue: "10",
        };
      }
      ctx.rangeDialog.type = "";
      ctx.rangeDialog.rangeTxt = "";
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="condition-rules">
      <div className="condition-rules-title">
        {(conditionformat as any)[`conditionformat_${type}`]}
      </div>

      <div className="conditin-rules-value">
        {(conditionformat as any)[`conditionformat_${type}_title`]}
      </div>

      {(type === "greaterThan" ||
        type === "lessThan" ||
        type === "equal" ||
        type === "textContains") && (
        <div className="condition-rules-inpbox">
          <input
            className="condition-rules-input"
            type="text"
            value={context.conditionRules.rulesValue}
            onChange={(e) => {
              const { value } = e.target;
              setContext((ctx) => {
                ctx.conditionRules.rulesValue = value;
              });
            }}
          />
          {/* <i
            className="condition-relues-inputicon"
            aria-hidden="true"
            onClick={() => {
              dataSelectRange(`conditionRules${type}`);
            }}
          >
            <SVGIcon name="tab" width={18} />
          </i> */}
        </div>
      )}

      {type === "between" && (
        <div className="condition-rules-between-box">
          <div className="condition-rules-between-inpbox">
            <input
              className="condition-rules-between-input"
              type="text"
              value={context.conditionRules.betweenValue.value1}
              onChange={(e) => {
                const { value } = e.target;
                setContext((ctx) => {
                  ctx.conditionRules.betweenValue.value1 = value;
                });
              }}
            />
            {/* <i
              className="condition-relues-inputicon"
              aria-hidden="true"
              onClick={() => {
                dataSelectRange(`conditionRules${type}1`);
              }}
            >
              <SVGIcon name="tab" width={18} />
            </i> */}
          </div>
          <span style={{ margin: "0px 4px" }}>{conditionformat.to}</span>
          <div className="condition-rules-between-inpbox">
            <input
              className="condition-rules-between-input"
              type="text"
              value={context.conditionRules.betweenValue.value2}
              onChange={(e) => {
                const { value } = e.target;
                setContext((ctx) => {
                  ctx.conditionRules.betweenValue.value2 = value;
                });
              }}
            />
            {/* <i
              className="condition-relues-inputicon"
              aria-hidden="true"
              onClick={() => {
                dataSelectRange(`conditionRules${type}2`);
              }}
            >
              <SVGIcon name="tab" width={18} />
            </i> */}
          </div>
        </div>
      )}
      {type === "occurrenceDate" && (
        <div className="condition-rules-inpbox">
          <input
            type="date"
            className="condition-rules-date"
            value={context.conditionRules.dateValue}
            onChange={(e) => {
              const { value } = e.target;
              setContext((ctx) => {
                ctx.conditionRules.dateValue = value;
              });
            }}
          />
        </div>
      )}
      {type === "duplicateValue" && (
        <select
          className="condition-rules-select"
          onChange={(e) => {
            const { value } = e.target;
            setContext((ctx) => {
              ctx.conditionRules.repeatValue = value;
            });
          }}
        >
          <option value="0">{conditionformat.duplicateValue}</option>
          <option value="1">{conditionformat.uniqueValue}</option>
        </select>
      )}

      {(type === "top10" ||
        type === "top10_percent" ||
        type === "last10" ||
        type === "last10_percent") && (
        <div className="condition-rules-project-box">
          {type === "top10" || type === "top10_percent"
            ? conditionformat.top
            : conditionformat.last}

          <input
            className="condition-rules-project-input"
            type="number"
            value={context.conditionRules.projectValue}
            onChange={(e) => {
              const { value } = e.target;
              setContext((ctx) => {
                ctx.conditionRules.projectValue = value;
              });
            }}
          />

          {type === "top10" || type === "last10"
            ? conditionformat.oneself
            : "%"}
        </div>
      )}

      <div className="condition-rules-set-title">
        {`${conditionformat.setAs}：`}
      </div>

      <div className="condition-rules-setbox">
        <div className="condition-rules-set">
          <div className="condition-rules-color">
            <input
              id="checkTextColor"
              type="checkbox"
              className="condition-rules-check"
              checked={context.conditionRules.textColor.check}
              onChange={(e) => {
                const { checked } = e.target;
                setContext((ctx) => {
                  ctx.conditionRules.textColor.check = checked;
                });
              }}
            />
            <label htmlFor="checkTextColor" className="condition-rules-label">
              {conditionformat.textColor}
            </label>
            <input
              type="color"
              className="condition-rules-select-color"
              value={colorRules.textColor}
              onChange={(e) => {
                const { value } = e.target;
                setColorRules(
                  produce((draft) => {
                    draft.textColor = value;
                  })
                );
              }}
            />
          </div>
        </div>
        <div className="condition-rules-set">
          <div className="condition-rules-color">
            <input
              id="checkCellColor"
              type="checkbox"
              className="condition-rules-check"
              checked={context.conditionRules.cellColor.check}
              onChange={(e) => {
                const { checked } = e.target;
                setContext((ctx) => {
                  ctx.conditionRules.cellColor.check = checked;
                });
              }}
            />
            <label htmlFor="checkCellColor" className="condition-rules-label">
              {conditionformat.cellColor}
            </label>
            <input
              type="color"
              className="condition-rules-select-color"
              value={colorRules.cellColor}
              onChange={(e) => {
                const { value } = e.target;
                setColorRules(
                  produce((draft) => {
                    draft.cellColor = value;
                  })
                );
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="button-basic button-primary"
        onClick={() => {
          // hideDialog();
          close("confirm");
        }}
        tabIndex={0}
      >
        {button.confirm}
      </div>
      <div
        className="button-basic button-close"
        onClick={() => {
          // hideDialog();
          close("close");
        }}
        tabIndex={0}
      >
        {button.cancel}
      </div>
    </div>
  );
};

export default ConditionRules;
