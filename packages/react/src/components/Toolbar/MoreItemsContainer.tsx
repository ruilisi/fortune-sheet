import React, { useRef } from "react";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const MoreItemsContaier: React.FC<{
  onClose?: () => void;
  children?: React.ReactNode;
}> = ({ onClose, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    containerRef as React.RefObject<HTMLDivElement>,
    () => {
      onClose?.();
    },
    [containerRef, onClose]
  );

  return (
    <div ref={containerRef} className="fortune-toolbar-more-container">
      {children}
    </div>
  );
};

export default MoreItemsContaier;
