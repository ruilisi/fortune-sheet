import React from "react";
import SVGIcon from "../SVGIcon";

const Select: React.FC = ({ children }) => {
  return <div className="fortune-toolbar-select">{children}</div>;
};

type OptionProps = {
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  iconId?: string;
};

const Option: React.FC<React.PropsWithChildren<OptionProps>> = ({
  iconId,
  onClick,
  children,
}) => {
  return (
    <div onClick={onClick} className="fortune-toolbar-select-option">
      {iconId && <SVGIcon name={iconId} />}
      <div className="fortuen-toolbar-text">{children}</div>
    </div>
  );
};

export { Option };

export default Select;
