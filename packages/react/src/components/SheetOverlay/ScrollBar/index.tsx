import React, { useContext } from "react";
import { useEffect } from "react";
import WorkbookContext from "../../../context";
import "./index.css";

type Props = {
  axis: "x" | "y";
};

const ScrollBar: React.FC<Props> = ({ axis }) => {
  const { context, refs } = useContext(WorkbookContext);

  useEffect(() => {
    if (axis === "x") {
      refs.scrollbarX.current!.scrollLeft = context.scrollLeft;
    } else {
      refs.scrollbarY.current!.scrollTop = context.scrollTop;
    }
  }, [axis === "x" ? context.scrollLeft : context.scrollTop]);

  return (
    <div
      ref={axis === "x" ? refs.scrollbarX : refs.scrollbarY}
      className={`luckysheet-scrollbars luckysheet-scrollbar-ltr luckysheet-scrollbar-${axis}`}
    >
      <div />
    </div>
  );
};

export default ScrollBar;
