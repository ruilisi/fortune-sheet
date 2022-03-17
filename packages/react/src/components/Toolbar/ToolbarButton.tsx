import React, { CSSProperties } from "react";

type Props = {
  tooltip: string;
  iconClassName: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};

const ToolbarButton: React.FC<Props> = ({
  tooltip,
  onClick,
  iconClassName,
}) => {
  const style: CSSProperties = { userSelect: "none" };
  return (
    <div
      className="luckysheet-toolbar-button luckysheet-inline-block"
      onClick={onClick}
      data-tips={tooltip}
      id="luckysheet-icon-paintformat"
      role="button"
      style={style}
    >
      <div
        className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
        style={style}
      >
        <div
          className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
          style={style}
        >
          <div
            className="luckysheet-icon luckysheet-inline-block "
            style={style}
          >
            <div
              aria-hidden="true"
              className={`luckysheet-icon-img-container luckysheet-icon-img iconfont ${iconClassName}`}
              style={style}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolbarButton;
