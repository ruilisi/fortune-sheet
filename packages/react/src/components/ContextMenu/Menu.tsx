import React, { useRef } from "react";

type Props = React.PropsWithChildren<{
  onClick?: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    container: HTMLDivElement
  ) => void;
  onMouseLeave?: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    container: HTMLDivElement
  ) => void;
  onMouseEnter?: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    container: HTMLDivElement
  ) => void;
}>;

const Menu: React.FC<Props> = ({
  onClick,
  onMouseLeave,
  onMouseEnter,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={containerRef}
      className="luckysheet-cols-menuitem luckysheet-mousedown-cancel"
      onClick={(e) => onClick?.(e, containerRef.current!)}
      onMouseLeave={(e) => onMouseLeave?.(e, containerRef.current!)}
      onMouseEnter={(e) => onMouseEnter?.(e, containerRef.current!)}
    >
      <div className="luckysheet-cols-menuitem-content luckysheet-mousedown-cancel">
        {children}
      </div>
    </div>
  );
};

export default Menu;
