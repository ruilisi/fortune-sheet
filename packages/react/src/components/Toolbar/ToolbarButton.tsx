import React, { CSSProperties } from "react";
import SVGIcon from "../SVGIcon";

type Props = {
  tooltip: string;
  iconId: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};

const ToolbarButton: React.FC<Props> = ({ tooltip, onClick, iconId }) => {
  const style: CSSProperties = { userSelect: "none" };
  return (
    <div
      className="luckysheet-toolbar-button"
      onClick={onClick}
      data-tips={tooltip}
      role="button"
      style={style}
    >
      <SVGIcon name={iconId} />
    </div>
  );
};

export default ToolbarButton;
