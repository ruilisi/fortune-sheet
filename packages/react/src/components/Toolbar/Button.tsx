import React from "react";
import SVGIcon from "../SVGIcon";

type Props = {
  tooltip: string;
  iconId: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  disabled?: boolean;
  selected?: boolean;
};

const Button: React.FC<Props> = ({
  tooltip,
  onClick,
  iconId,
  disabled,
  selected,
  children,
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
      <SVGIcon name={iconId} style={disabled ? { opacity: 0.3 } : {}} />
      {tooltip && <div className="fortune-tooltip">{tooltip}</div>}
      {children}
    </div>
  );
};

export default Button;
