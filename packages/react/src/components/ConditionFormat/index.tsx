import React, { useCallback, useContext } from "react";
import "./index.css";
import { locale, updateItem } from "@mritunjaygoutam12/core-mod";
import _ from "lodash";
import WorkbookContext from "../../context";
import Select, { Option } from "../Toolbar/Select";
import SVGIcon from "../SVGIcon";
import { useDialog } from "../../hooks/useDialog";
import ConditionRules from "./ConditionRules";
import { MenuDivider } from "../Toolbar/Divider";

const ConditionalFormat: React.FC<{
  items: string[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ items, setOpen }) => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const { showDialog } = useDialog();
  const { conditionformat } = locale(context);

  // 子菜单溢出屏幕时，重新定位子菜单位置
  // re-position the subMenu if it oveflows the window
  const showSubMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const target = e.target as HTMLDivElement;
      const menuItem =
        target.className === "fortune-toolbar-menu-line"
          ? target.parentElement!
          : target;
      const menuItemRect = menuItem.getBoundingClientRect();
      const workbookContainerRect =
        refs.workbookContainer.current!.getBoundingClientRect();
      const subMenu = menuItem.querySelector(
        ".condition-format-sub-menu"
      ) as HTMLDivElement;
      if (_.isNil(subMenu)) return;
      const menuItemStyle = window.getComputedStyle(menuItem);
      const menuItemPaddingRight = parseFloat(
        menuItemStyle.getPropertyValue("padding-right").replace("px", "")
      );

      if (
        workbookContainerRect.right - menuItemRect.right <
        parseFloat(subMenu.style.width.replace("px", ""))
      ) {
        subMenu.style.display = "block";
        subMenu.style.right = `${menuItemRect.width - menuItemPaddingRight}px`;
      } else {
        subMenu.style.display = "block";
        subMenu.style.right = `${-(
          parseFloat(subMenu.style.width.replace("px", "")) +
          menuItemPaddingRight
        )}px`;
      }
    },
    [refs.workbookContainer]
  );

  const hideSubMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const target = e.target as HTMLDivElement;

      if (target.className === "condition-format-sub-menu") {
        target.style.display = "none";
        return;
      }

      const subMenu = (
        target.className === "condition-format-item"
          ? target.parentElement
          : target.querySelector(".condition-format-sub-menu")
      ) as HTMLDivElement;
      if (_.isNil(subMenu)) return;
      subMenu.style.display = "none";
    },
    []
  );

  // 获得条件格式
  const getConditionFormatItem = useCallback(
    (name: string) => {
      if (name === "-") {
        return <MenuDivider key={name} />;
      }
      if (name === "highlightCellRules") {
        return (
          <Option
            key={name}
            onMouseEnter={showSubMenu}
            onMouseLeave={hideSubMenu}
          >
            <div className="fortune-toolbar-menu-line" key={`div${name}`}>
              {conditionformat[name]}
              <SVGIcon name="rightArrow" width={18} />
              <div
                className="condition-format-sub-menu"
                style={{
                  display: "none",
                  width: 150,
                }}
              >
                {[
                  { text: "greaterThan", value: ">" },
                  { text: "lessThan", value: "<" },
                  { text: "between", value: "[]" },
                  { text: "equal", value: "=" },
                  { text: "textContains", value: "()" },
                  {
                    text: "occurrenceDate",
                    value: conditionformat.yesterday,
                  },
                  { text: "duplicateValue", value: "##" },
                ].map((v) => (
                  <div
                    className="condition-format-item"
                    key={v.text}
                    onClick={() => {
                      setOpen(false);
                      showDialog(<ConditionRules type={v.text} />);
                    }}
                    tabIndex={0}
                  >
                    {(conditionformat as any)[v.text]}
                    <span>{v.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Option>
        );
      }
      if (name === "itemSelectionRules") {
        return (
          <Option
            key={name}
            onMouseEnter={showSubMenu}
            onMouseLeave={hideSubMenu}
          >
            <div className="fortune-toolbar-menu-line">
              {conditionformat[name]}
              <SVGIcon name="rightArrow" width={18} />
              <div
                className="condition-format-sub-menu"
                style={{
                  display: "none",
                  width: 180,
                }}
              >
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
                    tabIndex={0}
                  >
                    {(conditionformat as any)[v.text]}
                    <span>{v.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Option>
        );
      }
      if (name === "dataBar") {
        return (
          <div className="fortune-toolbar-menu-line" key={`div${name}`}>
            {conditionformat[name]}
            <SVGIcon name="rightArrow" width={18} />
          </div>
        );
      }
      if (name === "colorGradation") {
        return (
          <div className="fortune-toolbar-menu-line" key={`div${name}`}>
            {conditionformat[name]}
            <SVGIcon name="rightArrow" width={18} />
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
          <Option
            key={name}
            onMouseEnter={showSubMenu}
            onMouseLeave={hideSubMenu}
          >
            <div className="fortune-toolbar-menu-line">
              {conditionformat[name]}
              <SVGIcon name="rightArrow" width={18} />
              <div
                className="condition-format-sub-menu"
                style={{
                  display: "none",
                  width: 150,
                }}
              >
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
                    tabIndex={0}
                  >
                    {(conditionformat as any)[v]}
                  </div>
                ))}
              </div>
            </div>
          </Option>
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
    [conditionformat, hideSubMenu, setContext, setOpen, showDialog, showSubMenu]
  );

  return (
    <div className="condition-format">
      <Select style={{ overflow: "visible" }}>
        {items.map((v) => (
          <div key={`option${v}`}>{getConditionFormatItem(v)}</div>
        ))}
      </Select>
    </div>
  );
};

export default ConditionalFormat;
