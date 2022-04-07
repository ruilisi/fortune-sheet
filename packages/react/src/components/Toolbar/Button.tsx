import React, { CSSProperties } from "react";
import SVGIcon from "../SVGIcon";

type Props = {
  tooltip: string;
  iconId: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  disabled?: boolean;
};

const Button: React.FC<Props> = ({ tooltip, onClick, iconId, disabled }) => {
  const style: CSSProperties = {
    userSelect: "none",
    opacity: disabled ? 0.3 : 1,
  };
  return (
    <div
      className="fortune-toolbar-button"
      onClick={onClick}
      data-tips={tooltip}
      role="button"
      style={style}
    >
      <SVGIcon name={iconId} />
    </div>
  );
};

export default Button;
