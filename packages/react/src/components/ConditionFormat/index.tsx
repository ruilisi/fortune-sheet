import React, { useCallback, useContext, useState } from "react";
import "./index.css";
import { locale, updateItem } from "@fortune-sheet/core";
import WorkbookContext from "../../context";
import Select, { Option } from "../Toolbar/Select";
import SVGIcon from "../SVGIcon";
import { useDialog } from "../../hooks/useDialog";
import ConditionRules from "./ConditionRules";

const ConditionalFormat: React.FC<{
  items: string[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ items, setOpen }) => {
  const { context, setContext } = useContext(WorkbookContext);
  const { showDialog } = useDialog();
  const [showHightlightRules, setShowHightlightRules] =
    useState<boolean>(false);
  const [showItemRules, setShowItemRules] = useState<boolean>(false);
  const [showDeleteRules, setShowDeleteRules] = useState<boolean>(false);

  const { conditionformat } = locale(context);

  // 获得条件格式
  const getConditionFormatItem = useCallback(
    (name: string) => {
      if (name === "-") {
        return <div className="horizontal-line" />;
      }
      if (name === "highlightCellRules") {
        return (
          <div
            className="fortune-toolbar-menu-line"
            key={`div${name}`}
            onMouseEnter={() => {
              setShowHightlightRules(true);
            }}
            onMouseLeave={() => {
              setShowHightlightRules(false);
            }}
          >
            {conditionformat[name]}
            <span className="right-arrow" key={`span${name}`}>
              <SVGIcon name="rightArrow" width={18} />
            </span>
            {showHightlightRules && (
              <div className="condition-format-sub-menu">
                {[
                  { text: "greaterThan", value: ">" },
                  { text: "lessThan", value: "<" },
                  { text: "between", value: "[]" },
                  { text: "equal", value: "=" },
                  { text: "textContains", value: "()" },
                  { text: "occurrenceDate", value: conditionformat.yesterday },
                  { text: "duplicateValue", value: "##" },
                ].map((v) => (
                  <div
                    className="condition-format-item"
                    key={v.text}
                    onClick={() => {
                      setOpen(false);
                      showDialog(<ConditionRules type={v.text} />);
                    }}
                  >
                    {(conditionformat as any)[v.text]}
                    <span>{v.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      if (name === "itemSelectionRules") {
        return (
          <div
            className="fortune-toolbar-menu-line"
            key={`div${name}`}
            onMouseEnter={() => {
              setShowItemRules(true);
            }}
            onMouseLeave={() => {
              setShowItemRules(false);
            }}
          >
            {conditionformat[name]}
            <span className="right-arrow" key={`span${name}`}>
              <SVGIcon name="rightArrow" width={18} />
            </span>
            {showItemRules && (
              <div className="condition-format-sub-menu">
                {[
                  { text: "top10", value: conditionformat.top10 },
                  {
                    text: "top10_percent",
                    value: conditionformat.top10_percent,
                  },
                  { text: "last10", value: conditionformat.last10 },
                  {
                    text: "last10_percent",
                    value: conditionformat.last10_percent,
                  },
                  { text: "aboveAverage", value: conditionformat.above },
                  { text: "belowAverage", value: conditionformat.below },
                ].map((v) => (
                  <div
                    className="condition-format-item"
                    key={v.text}
                    onClick={() => {
                      setOpen(false);
                      showDialog(<ConditionRules type={v.text} />);
                    }}
                  >
                    {(conditionformat as any)[v.text]}
                    <span>{v.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      if (name === "dataBar") {
        return (
          <div className="fortune-toolbar-menu-line" key={`div${name}`}>
            {conditionformat[name]}
            <span className="right-arrow" key={`span${name}`}>
              <SVGIcon name="rightArrow" width={18} />
            </span>
          </div>
        );
      }
      if (name === "colorGradation") {
        return (
          <div className="fortune-toolbar-menu-line" key={`div${name}`}>
            {conditionformat[name]}
            <span className="right-arrow" key={`span${name}`}>
              <SVGIcon name="rightArrow" width={18} />
            </span>
          </div>
        );
      }
      if (name === "icons") {
        return (
          <div className="fortune-toolbar-menu-line" key={`div${name}`}>
            {conditionformat[name]}
          </div>
        );
      }
      if (name === "newFormatRule") {
        return (
          <div className="fortune-toolbar-menu-line" key={`div${name}`}>
            {conditionformat[name]}
          </div>
        );
      }
      if (name === "deleteRule") {
        return (
          <div
            className="fortune-toolbar-menu-line"
            key={`div${name}`}
            onMouseEnter={() => {
              setShowDeleteRules(true);
            }}
            onMouseLeave={() => {
              setShowDeleteRules(false);
            }}
          >
            {conditionformat[name]}
            <span className="right-arrow" key={`span${name}`}>
              <SVGIcon name="rightArrow" width={18} />
            </span>
            {showDeleteRules && (
              <div className="condition-format-sub-menu">
                {["deleteSheetRule"].map((v) => (
                  <div
                    className="condition-format-item"
                    key={v}
                    style={{ padding: "6px 10px" }}
                    onClick={() => {
                      setContext((ctx) => {
                        updateItem(ctx, "delSheet");
                      });
                    }}
                  >
                    {(conditionformat as any)[v]}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      if (name === "manageRules") {
        return (
          <div className="fortune-toolbar-menu-line" key={`div${name}`}>
            {conditionformat[name]}
          </div>
        );
      }

      return <div />;
    },
    [
      conditionformat,
      setContext,
      setOpen,
      showDeleteRules,
      showDialog,
      showHightlightRules,
      showItemRules,
    ]
  );

  return (
    <div className="condition-format">
      <Select>
        {items.map((v) => (
          <Option key={`option${v}`}>{getConditionFormatItem(v)}</Option>
        ))}
      </Select>
    </div>
  );
};

export default ConditionalFormat;
