import React, { CSSProperties } from "react";
import SVGIcon from "../SVGIcon";

type Props = {
  tooltip: string;
  iconId: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  disabled?: boolean;
};

const Button: React.FC<Props> = ({ tooltip, onClick, iconId, disabled }) => {
  const style: CSSProperties = { userSelect: "none" };
  return (
    <div
      className="fortune-toolbar-button"
      onClick={onClick}
      data-tips={tooltip}
      role="button"
      style={style}
    >
      <SVGIcon name={iconId} style={disabled ? { opacity: 0.3 } : {}} />
      {tooltip && <div className="fortune-tooltip">{tooltip}</div>}
    </div>
  );
};

export default Button;
