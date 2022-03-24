import React from "react";

type Props = React.PropsWithChildren<{
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}>;

const Menu: React.FC<Props> = ({ onClick, children }) => {
  return (
    <div
      className="luckysheet-cols-menuitem luckysheet-mousedown-cancel"
      onClick={onClick}
    >
      <div className="luckysheet-cols-menuitem-content luckysheet-mousedown-cancel">
        {children}
      </div>
    </div>
  );
};

export default Menu;
