import React, { CSSProperties } from "react";
import SVGIcon from "../SVGIcon";

const Select: React.FC<{
  children?: React.ReactNode;
  style?: CSSProperties;
}> = ({ children, style }) => {
  return (
    <div className="fortune-toolbar-select" style={style}>
      {children}
    </div>
  );
};

type OptionProps = {
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  iconId?: string;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};

const Option: React.FC<React.PropsWithChildren<OptionProps>> = ({
  iconId,
  onClick,
  children,
  onMouseLeave,
  onMouseEnter,
}) => {
  return (
    <div
      onClick={onClick}
      tabIndex={0}
      className="fortune-toolbar-select-option"
      onMouseLeave={(e) => onMouseLeave?.(e)}
      onMouseEnter={(e) => onMouseEnter?.(e)}
    >
      {iconId && <SVGIcon name={iconId} />}
      <div className="fortuen-toolbar-text">{children}</div>
    </div>
  );
};

export { Option };

export default Select;
