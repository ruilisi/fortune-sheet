import React from "react";
import CustomIcon from "./CustomIcon";

type Props = {
  tooltip?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  selected?: boolean;
  children?: React.ReactNode;
  iconName?: string;
  icon?: React.ReactNode;
};

const CustomButton: React.FC<Props> = ({
  tooltip,
  onClick,
  selected,
  children,
  iconName,
  icon,
}) => {
  // const style: CSSProperties = { userSelect: "none" };
  return (
    <div
      className="fortune-toolbar-button fortune-toolbar-item"
      onClick={onClick}
      data-tips={tooltip}
      role="button"
      style={selected ? { backgroundColor: "#E7E5EB" } : {}}
    >
      <CustomIcon iconName={iconName} content={icon} />
      {tooltip && <div className="fortune-tooltip">{tooltip}</div>}
      {children}
    </div>
  );
};

export default CustomButton;
