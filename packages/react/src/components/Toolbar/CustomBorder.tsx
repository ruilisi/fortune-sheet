import React, { useCallback, useContext, useRef, useState } from "react";
import "./index.css";
import { locale } from "@online-sheet/core";
import _ from "lodash";
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";
import { CustomColor } from "./CustomColor";

const size = [
  {
    Text: "1",
    value: "Thin",
    strokeDasharray: "1,0",
    strokeWidth: "1",
  },
  {
    Text: "2",
    value: "Hair",
    strokeDasharray: "1,5",
    strokeWidth: "1",
  },
  {
    Text: "3",
    value: "Dotted",
    strokeDasharray: "2,5",
    strokeWidth: "2",
  },
  {
    Text: "4",
    value: "Dashed",
    strokeDasharray: "5,5",
    strokeWidth: "2",
  },
  {
    Text: "5",
    value: "DashDot",
    strokeDasharray: "20,5,5,10,5,5",
    strokeWidth: "2",
  },
  {
    Text: "6",
    value: "DashDotDot",
    strokeDasharray: "20,5,5,5,5,10,5,5,5,5",
    strokeWidth: "2",
  },
  // {
  //   Text: "7",
  //   value: "Double",
  // },
  {
    Text: "8",
    value: "Medium",
    strokeDasharray: "2,0",
    strokeWidth: "2",
  },
  {
    Text: "9",
    value: "MediumDashed",
    strokeDasharray: "3,5",
    strokeWidth: "3",
  },
  {
    Text: "10",
    value: "MediumDashDot",
    strokeDasharray: "20,5,5,10,5,5",
    strokeWidth: "3",
  },
  {
    Text: "11",
    value: "MediumDashDotDot",
    strokeDasharray: "5,5,5,5,20,5,5,5,5,10",
    strokeWidth: "3",
  },
  // {
  //   Text: "12",
  //   value: "SlantedDashDot",
  // },
  {
    Text: "13",
    value: "Thick",
    strokeDasharray: "2,0",
    strokeWidth: "3",
  },
];

type Props = {
  onPick: (changeColor?: string, changeStyle?: string) => void;
};

const CustomBorder: React.FC<Props> = ({ onPick }) => {
  const { context, refs } = useContext(WorkbookContext);
  const { border } = locale(context);
  const [changeColor, setchangeColor] = useState("#000000");
  const [changeStyle, setchangeStyle] = useState("1");
  const colorRef = useRef<HTMLDivElement | null>(null);
  const styleRef = useRef<HTMLDivElement | null>(null);
  const colorPreviewRef = useRef<HTMLDivElement | null>(null);
  const [previewWith, setPreviewWith] = useState<string | undefined>("");
  const [previewdasharry, setPreviewdasharray] = useState<string | undefined>(
    ""
  );

  const showBorderSubMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const target = e.target as HTMLDivElement;
      const menuItemRect = target.getBoundingClientRect();
      const subMenuItem = target.querySelector(
        ".fortune-border-select-menu"
      ) as HTMLDivElement;
      if (_.isNil(subMenuItem)) return;
      subMenuItem.style.display = "block";
      const workbookContainerRect =
        refs.workbookContainer.current!.getBoundingClientRect();
      if (
        workbookContainerRect.width - menuItemRect!.right >
        parseFloat(subMenuItem.style.width.replace("px", ""))
      ) {
        subMenuItem.style.left = `${menuItemRect?.width}px`;
      } else {
        subMenuItem.style.left = `-${subMenuItem.style.width}`;
      }
    },
    [refs.workbookContainer]
  );

  const hideBorderSubMenu = useCallback(() => {
    styleRef.current!.style.display = "none";
    colorRef.current!.style.display = "none";
  }, []);

  const changePreviewStyle = useCallback(
    (width: string | undefined, dasharray: string | undefined) => {
      setPreviewWith(width);
      setPreviewdasharray(dasharray);
    },
    []
  );

  return (
    <div>
      {/* 边框颜色 */}
      <div
        className="fortune-border-select-option"
        key="borderColor"
        onMouseEnter={(e) => {
          showBorderSubMenu(e);
        }}
        onMouseLeave={() => {
          hideBorderSubMenu();
        }}
      >
        <div className="fortune-toolbar-menu-line">
          {border.borderColor}
          <SVGIcon name="rightArrow" style={{ width: "14px" }} />
        </div>
        <div
          ref={colorPreviewRef}
          className="fortune-border-color-preview"
          style={{ backgroundColor: changeColor }}
        />
        <div
          ref={colorRef}
          className="fortune-border-select-menu"
          style={{ display: "none", width: "166px" }}
        >
          <CustomColor
            onCustomPick={(color) => {
              onPick(color, changeStyle);
              colorPreviewRef.current!.style.backgroundColor = changeColor;
              setchangeColor(color as string);
            }}
            onColorPick={(color) => {
              onPick(color, changeStyle);
              setchangeColor(color as string);
            }}
          />
        </div>
      </div>
      {/* 边框样式 */}
      <div
        className="fortune-border-select-option"
        key="borderStyle"
        onMouseEnter={(e) => {
          showBorderSubMenu(e);
        }}
        onMouseLeave={() => {
          hideBorderSubMenu();
        }}
      >
        <div className="fortune-toolbar-menu-line">
          {border.borderStyle}
          <SVGIcon name="rightArrow" style={{ width: "14px" }} />
        </div>
        <div className="fortune-border-style-preview">
          <svg width="90">
            <g fill="none" stroke="black" strokeWidth={previewWith}>
              <path strokeDasharray={previewdasharry} d="M0 0 l90 0" />
            </g>
          </svg>
        </div>
        <div
          ref={styleRef}
          className="fortune-border-select-menu fortune-toolbar-select"
          style={{ display: "none", width: "110px" }}
        >
          <div
            className="fortune-border-style-picker-menu fortune-border-style-reset"
            onClick={() => {
              onPick(changeColor, "1");
              changePreviewStyle("1", "1,0");
            }}
            tabIndex={0}
          >
            {border.borderDefault}
          </div>
          <div className="fortune-boder-style-picker">
            {size.map((items, i) => (
              <div
                key={i}
                className="fortune-border-style-picker-menu"
                onClick={() => {
                  onPick(changeColor, items.Text);
                  setchangeStyle(items.Text);
                  changePreviewStyle(items.strokeWidth, items.strokeDasharray);
                }}
                tabIndex={0}
              >
                <svg height="10" width="90">
                  <g fill="none" stroke="black" strokeWidth={items.strokeWidth}>
                    <path
                      strokeDasharray={items.strokeDasharray}
                      d="M0 5 l85 0"
                    />
                  </g>
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomBorder;
