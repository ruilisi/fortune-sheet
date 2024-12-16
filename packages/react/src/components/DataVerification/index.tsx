import _ from "lodash";
import {
  getDropdownList,
  getFlowdata,
  getRangeByTxt,
  getRangetxt,
  getSheetIndex,
  locale,
  setCellValue,
  confirmMessage,
} from "@fortune-sheet/core";
import React, { useCallback, useContext, useEffect, useState } from "react";
import WorkbookContext from "../../context";
import { useDialog } from "../../hooks/useDialog";
import SVGIcon from "../SVGIcon";
import "./index.css";

const DataVerification: React.FC = () => {
  const { context, setContext } = useContext(WorkbookContext);
  const { showDialog, hideDialog } = useDialog();
  const { dataVerification, toolbar, button, generalDialog } = locale(context);
  const [numberCondition] = useState<string[]>([
    "between",
    "notBetween",
    "equal",
    "notEqualTo",
    "moreThanThe",
    "lessThan",
    "greaterOrEqualTo",
    "lessThanOrEqualTo",
  ]);

  const [dateCondition] = useState<string[]>([
    "between",
    "notBetween",
    "equal",
    "notEqualTo",
    "earlierThan",
    "noEarlierThan",
    "laterThan",
    "noLaterThan",
  ]);

  // 开启鼠标选区
  const dataSelectRange = useCallback(
    (type: string, value: string) => {
      hideDialog();
      setContext((ctx) => {
        ctx.rangeDialog!.show = true;
        ctx.rangeDialog!.type = type;
        ctx.rangeDialog!.rangeTxt = value;
      });
    },
    [hideDialog, setContext]
  );

  // 确定和取消按钮
  const btn = useCallback(
    (type: string) => {
      if (type === "confirm") {
        setContext((ctx) => {
          const isPass = confirmMessage(ctx, generalDialog, dataVerification);
          if (isPass) {
            const range = getRangeByTxt(
              ctx,
              ctx.dataVerification?.dataRegulation?.rangeTxt as string
            );
            if (range.length === 0) {
              return;
            }
            const regulation = ctx.dataVerification!.dataRegulation!;
            const verifacationT = regulation?.type;
            const { value1 } = regulation;
            const item = {
              ...regulation,
              checked: false, // checkbox默认在单元格中false为未选中，true为选中
            };
            if (verifacationT === "dropdown") {
              const list = getDropdownList(ctx, value1);
              item.value1 = list.join(",");
            }
            const currentDataVerification =
              ctx.luckysheetfile[
                getSheetIndex(ctx, ctx.currentSheetId) as number
              ].dataVerification ?? {};

            const str = range?.[range.length - 1]?.row[0];
            const edr = range?.[range.length - 1]?.row[1];
            const stc = range?.[range.length - 1]?.column[0];
            const edc = range?.[range.length - 1]?.column[1];
            const d = getFlowdata(ctx);
            if (
              !d ||
              _.isNil(str) ||
              _.isNil(stc) ||
              _.isNil(edr) ||
              _.isNil(edc)
            )
              return;
            for (let r = str; r <= edr; r += 1) {
              for (let c = stc; c <= edc; c += 1) {
                const key = `${r}_${c}`;
                currentDataVerification[key] = item;
                if (regulation.type === "checkbox") {
                  setCellValue(ctx, r, c, d, item.value2);
                }
              }
            }
            ctx.luckysheetfile[
              getSheetIndex(ctx, ctx.currentSheetId) as number
            ].dataVerification = currentDataVerification;
          }
        });
      } else if (type === "delete") {
        setContext((ctx) => {
          const range = getRangeByTxt(
            ctx,
            ctx.dataVerification?.dataRegulation?.rangeTxt as string
          );
          if (range.length === 0) {
            showDialog(generalDialog.noSeletionError, "ok");
            return;
          }
          const currentDataVerification =
            ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId) as number]
              .dataVerification ?? {};
          const str = range?.[range.length - 1]?.row[0];
          const edr = range?.[range.length - 1]?.row[1];
          const stc = range?.[range.length - 1]?.column[0];
          const edc = range?.[range.length - 1]?.column[1];
          if (_.isNil(str) || _.isNil(stc) || _.isNil(edr) || _.isNil(edc))
            return;
          for (let r = str; r <= edr; r += 1) {
            for (let c = stc; c <= edc; c += 1) {
              delete currentDataVerification[`${r}_${c}`];
            }
          }
        });
      }
      hideDialog();
    },
    [dataVerification, generalDialog, hideDialog, setContext, showDialog]
  );

  // 初始化
  useEffect(() => {
    setContext((ctx) => {
      let rangeT = "";

      // 如果有选区得把选区转为字符形式然后进行显示
      if (ctx.luckysheet_select_save) {
        const range =
          ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1];
        rangeT = getRangetxt(
          context,
          context.currentSheetId,
          range,
          context.currentSheetId
        );
      }

      // 初始化值
      const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
      const ctxDataVerification =
        ctx.luckysheetfile[index].dataVerification || {};
      if (!ctx.luckysheet_select_save) return;
      const last =
        ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1];
      const rowIndex = last.row_focus;
      const colIndex = last.column_focus;
      if (rowIndex == null || colIndex == null) return;
      const item = ctxDataVerification[`${rowIndex}_${colIndex}`];
      const defaultItem = item ?? {};
      let rangValue = defaultItem.value1 ?? "";
      // 选区赋值相关
      if (
        ctx.rangeDialog?.type === "dropDown" &&
        ctx.dataVerification &&
        ctx.dataVerification.dataRegulation &&
        ctx.dataVerification.dataRegulation.rangeTxt
      ) {
        // 当是下拉列表选区的时候，则下拉选区赋值，范围保持不变
        rangeT = ctx.dataVerification.dataRegulation.rangeTxt;
        rangValue = ctx.rangeDialog.rangeTxt;
      } else if (
        ctx.rangeDialog?.type === "rangeTxt" &&
        ctx.dataVerification &&
        ctx.dataVerification.dataRegulation &&
        ctx.dataVerification.dataRegulation.value1
      ) {
        // 当是选区范围的时候，则范围赋值，下拉选区不变
        rangValue = ctx.dataVerification.dataRegulation.value1;
        rangeT = ctx.rangeDialog.rangeTxt;
      }
      ctx.rangeDialog!.type = "";

      if (item) {
        ctx.dataVerification!.dataRegulation = {
          ...item,
          value1: rangValue,
          rangeTxt: rangeT,
        };
      } else {
        ctx.dataVerification!.dataRegulation! = {
          type: "dropdown",
          type2: "",
          rangeTxt: rangeT,
          value1: rangValue,
          value2: "",
          validity: "",
          remote: false,
          prohibitInput: false,
          hintShow: false,
          hintValue: "",
        };
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="fortune-data-verification">
      <div className="title">{toolbar.dataVerification}</div>
      <div className="box">
        <div className="box-item" style={{ borderTop: "1px solid #E1E4E8" }}>
          <div className="box-item-title">{dataVerification.cellRange}</div>
          <div className="data-verification-range">
            <input
              className="formulaInputFocus"
              spellCheck="false"
              value={context.dataVerification!.dataRegulation?.rangeTxt}
              onChange={(e) => {
                const { value } = e.target;
                setContext((ctx) => {
                  ctx.dataVerification!.dataRegulation!.rangeTxt = value;
                });
              }}
            />
            <i
              className="icon"
              aria-hidden="true"
              onClick={() => {
                hideDialog();
                dataSelectRange(
                  "rangeTxt",
                  context.dataVerification!.dataRegulation!.value1
                );
              }}
              tabIndex={0}
            >
              <SVGIcon name="tab" width={18} />
            </i>
          </div>
        </div>
        <div className="box-item">
          <div className="box-item-title">
            {dataVerification.verificationCondition}
          </div>
          <select
            className="data-verification-type-select"
            value={context.dataVerification!.dataRegulation!.type}
            onChange={(e) => {
              const { value } = e.target;
              setContext((ctx) => {
                ctx.dataVerification!.dataRegulation!.type = value;
                if (value === "dropdown" || value === "checkbox") {
                  ctx.dataVerification!.dataRegulation!.type2 = "";
                } else if (
                  value === "number" ||
                  value === "number_integer" ||
                  value === "number_decimal" ||
                  value === "text_length" ||
                  value === "date"
                ) {
                  ctx.dataVerification!.dataRegulation!.type2 = "between";
                } else if (value === "text_content") {
                  ctx.dataVerification!.dataRegulation!.type2 = "include";
                } else if (value === "validity") {
                  ctx.dataVerification!.dataRegulation!.type2 =
                    "identificationNumber";
                }
                ctx.dataVerification!.dataRegulation!.value1 = "";
                ctx.dataVerification!.dataRegulation!.value2 = "";
              });
            }}
          >
            {[
              "dropdown",
              "checkbox",
              "number",
              "number_integer",
              "number_decimal",
              "text_content",
              "text_length",
              "date",
              "validity",
            ].map((v) => (
              <option value={v} key={v}>
                {(dataVerification as any)[v]}
              </option>
            ))}
          </select>

          {context.dataVerification?.dataRegulation?.type === "dropdown" && (
            <div className="show-box-item">
              <div className="data-verification-range">
                <input
                  className="formulaInputFocus"
                  spellCheck="false"
                  value={context.dataVerification!.dataRegulation!.value1}
                  placeholder={dataVerification.placeholder1}
                  onChange={(e) => {
                    const { value } = e.target;
                    setContext((ctx) => {
                      ctx.dataVerification!.dataRegulation!.value1 = value;
                    });
                  }}
                />
                <i
                  className="icon"
                  aria-hidden="true"
                  onClick={() =>
                    dataSelectRange(
                      "dropDown",
                      context.dataVerification!.dataRegulation!.value1
                    )
                  }
                  tabIndex={0}
                >
                  <SVGIcon name="tab" width={18} />
                </i>
              </div>
              <div className="check">
                <input
                  type="checkbox"
                  checked={
                    context.dataVerification!.dataRegulation!.type2 === "true"
                  }
                  id="mul"
                  onChange={(e) => {
                    const { checked } = e.target;
                    setContext((ctx) => {
                      ctx.dataVerification!.dataRegulation!.type2 = `${checked}`;
                    });
                  }}
                />
                <label htmlFor="mul">{dataVerification.allowMultiSelect}</label>
              </div>
            </div>
          )}

          {context.dataVerification?.dataRegulation?.type === "checkbox" && (
            <div className="show-box-item">
              <div className="check-box">
                <span>{dataVerification.selected} —— </span>
                <input
                  type="text"
                  className="data-verification-value1"
                  placeholder={dataVerification.placeholder2}
                  value={context.dataVerification?.dataRegulation?.value1}
                  onChange={(e) => {
                    const { value } = e.target;
                    setContext((ctx) => {
                      ctx.dataVerification!.dataRegulation!.value1 = value;
                    });
                  }}
                />
              </div>
              <div className="check-box">
                <span>{dataVerification.notSelected} —— </span>
                <input
                  type="text"
                  className="data-verification-value2"
                  placeholder={dataVerification.placeholder2}
                  value={context.dataVerification?.dataRegulation?.value2}
                  onChange={(e) => {
                    const { value } = e.target;
                    setContext((ctx) => {
                      ctx.dataVerification!.dataRegulation!.value2 = value;
                    });
                  }}
                />
              </div>
            </div>
          )}

          {(context.dataVerification?.dataRegulation?.type === "number" ||
            context.dataVerification?.dataRegulation?.type ===
              "number_integer" ||
            context.dataVerification?.dataRegulation?.type ===
              "number_decimal" ||
            context.dataVerification?.dataRegulation?.type ===
              "text_length") && (
            <div className="show-box-item">
              <select
                className="data-verification-type-select"
                value={context.dataVerification.dataRegulation.type2}
                onChange={(e) => {
                  const { value } = e.target;
                  setContext((ctx) => {
                    ctx.dataVerification!.dataRegulation!.type2 = value;
                    ctx.dataVerification!.dataRegulation!.value1 = "";
                    ctx.dataVerification!.dataRegulation!.value2 = "";
                  });
                }}
              >
                {numberCondition.map((v) => (
                  <option value={v} key={v}>
                    {(dataVerification as any)[v]}
                  </option>
                ))}
              </select>
              {context.dataVerification.dataRegulation.type2 === "between" ||
              context.dataVerification.dataRegulation.type2 === "notBetween" ? (
                <div className="input-box">
                  <input
                    type="number"
                    placeholder="1"
                    value={context.dataVerification.dataRegulation.value1}
                    onChange={(e) => {
                      const { value } = e.target;
                      setContext((ctx) => {
                        ctx.dataVerification!.dataRegulation!.value1 = value;
                      });
                    }}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="100"
                    value={context.dataVerification.dataRegulation.value2}
                    onChange={(e) => {
                      const { value } = e.target;
                      setContext((ctx) => {
                        ctx.dataVerification!.dataRegulation!.value2 = value;
                      });
                    }}
                  />
                </div>
              ) : (
                <div className="input-box">
                  <input
                    type="number"
                    style={{ width: "100%" }}
                    placeholder={dataVerification.placeholder3}
                    value={context.dataVerification.dataRegulation.value1}
                    onChange={(e) => {
                      const { value } = e.target;
                      setContext((ctx) => {
                        ctx.dataVerification!.dataRegulation!.value1 = value;
                      });
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {context.dataVerification?.dataRegulation?.type ===
            "text_content" && (
            <div className="show-box-item">
              <select
                className="data-verification-type-select"
                value={context.dataVerification.dataRegulation.type2}
                onChange={(e) => {
                  const { value } = e.target;
                  setContext((ctx) => {
                    ctx.dataVerification!.dataRegulation!.type2 = value;
                    ctx.dataVerification!.dataRegulation!.value1 = "";
                    ctx.dataVerification!.dataRegulation!.value2 = "";
                  });
                }}
              >
                {["include", "exclude", "equal"].map((v) => (
                  <option value={v} key={v}>
                    {(dataVerification as any)[v]}
                  </option>
                ))}
              </select>
              <div className="input-box">
                <input
                  type="text"
                  style={{ width: "100%" }}
                  placeholder={dataVerification.placeholder4}
                  value={context.dataVerification.dataRegulation.value1}
                  onChange={(e) => {
                    const { value } = e.target;
                    setContext((ctx) => {
                      ctx.dataVerification!.dataRegulation!.value1 = value;
                    });
                  }}
                />
              </div>
            </div>
          )}

          {context.dataVerification?.dataRegulation?.type === "date" && (
            <div className="show-box-item">
              <select
                className="data-verification-type-select"
                value={context.dataVerification.dataRegulation.type2}
                onChange={(e) => {
                  const { value } = e.target;
                  setContext((ctx) => {
                    ctx.dataVerification!.dataRegulation!.type2 = value;
                    ctx.dataVerification!.dataRegulation!.value1 = "";
                    ctx.dataVerification!.dataRegulation!.value2 = "";
                  });
                }}
              >
                {dateCondition.map((v) => (
                  <option value={v} key={v}>
                    {(dataVerification as any)[v]}
                  </option>
                ))}
              </select>
              {context.dataVerification.dataRegulation.type2 === "between" ||
              context.dataVerification.dataRegulation.type2 === "notBetween" ? (
                <div className="input-box">
                  <input
                    type="date"
                    placeholder="1"
                    value={context.dataVerification.dataRegulation.value1}
                    onChange={(e) => {
                      const { value } = e.target;
                      setContext((ctx) => {
                        ctx.dataVerification!.dataRegulation!.value1 = value;
                      });
                    }}
                  />
                  <span>-</span>
                  <input
                    type="date"
                    placeholder="100"
                    value={context.dataVerification.dataRegulation.value2}
                    onChange={(e) => {
                      const { value } = e.target;
                      setContext((ctx) => {
                        ctx.dataVerification!.dataRegulation!.value2 = value;
                      });
                    }}
                  />
                </div>
              ) : (
                <div className="input-box">
                  <input
                    type="date"
                    style={{ width: "100%" }}
                    placeholder={dataVerification.placeholder3}
                    value={context.dataVerification.dataRegulation.value1}
                    onChange={(e) => {
                      const { value } = e.target;
                      setContext((ctx) => {
                        ctx.dataVerification!.dataRegulation!.value1 = value;
                      });
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {context.dataVerification?.dataRegulation?.type === "validity" && (
            <div className="show-box-item">
              <select
                className="data-verification-type-select"
                value={context.dataVerification.dataRegulation.type2}
                onChange={(e) => {
                  const { value } = e.target;
                  setContext((ctx) => {
                    ctx.dataVerification!.dataRegulation!.type2 = value;
                    ctx.dataVerification!.dataRegulation!.value1 = "";
                    ctx.dataVerification!.dataRegulation!.value2 = "";
                  });
                }}
              >
                {["identificationNumber", "phoneNumber"].map((v) => (
                  <option value={v} key={v}>
                    {(dataVerification as any)[v]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="box-item">
          {
            // (["remote", "prohibitInput", "hintShow"] as const)
            (["prohibitInput", "hintShow"] as const).map((v) => (
              <div className="check" key={`div${v}`}>
                <input
                  type="checkbox"
                  id={v}
                  key={`input${v}`}
                  checked={context.dataVerification!.dataRegulation![v]}
                  onChange={() => {
                    setContext((ctx) => {
                      const dataRegulation =
                        ctx.dataVerification?.dataRegulation;
                      // if (v === "remote") {
                      //   dataRegulation!.remote = !dataRegulation!.remote;
                      // } else
                      if (v === "prohibitInput") {
                        dataRegulation!.prohibitInput =
                          !dataRegulation!.prohibitInput;
                      } else if (v === "hintShow") {
                        dataRegulation!.hintShow = !dataRegulation!.hintShow;
                      }
                    });
                  }}
                />
                <label htmlFor={v} key={`label${v}`}>
                  {(dataVerification as any)[v]}
                </label>
              </div>
            ))
          }
          {context.dataVerification?.dataRegulation?.hintShow && (
            <div className="input-box">
              <input
                type="text"
                style={{ width: "100%" }}
                placeholder={dataVerification.placeholder5}
                value={context.dataVerification!.dataRegulation!.hintValue}
                onChange={(e) => {
                  const { value } = e.target;
                  setContext((ctx) => {
                    ctx.dataVerification!.dataRegulation!.hintValue = value;
                  });
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div
        className="button-basic button-primary"
        onClick={() => {
          // hideDialog();
          btn("confirm");
        }}
        tabIndex={0}
      >
        {button.confirm}
      </div>
      <div
        className="button-basic button-close"
        onClick={() => {
          btn("delete");
        }}
        tabIndex={0}
      >
        {dataVerification.deleteVerification}
      </div>
      <div
        className="button-basic button-close"
        onClick={() => {
          btn("close");
        }}
        tabIndex={0}
      >
        {button.cancel}
      </div>
    </div>
  );
};

export default DataVerification;
