import React, { useContext, useEffect } from "react";
import WorkbookContext from "../../../context";
import "./index.css";

type Props = {
  axis: "x" | "y";
};

const ScrollBar: React.FC<Props> = ({ axis }) => {
  const { context, refs, setContext } = useContext(WorkbookContext);

  useEffect(() => {
    if (axis === "x") {
      refs.scrollbarX.current!.scrollLeft = context.scrollLeft;
    } else {
      refs.scrollbarY.current!.scrollTop = context.scrollTop;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axis === "x" ? context.scrollLeft : context.scrollTop]);

  return (
    <div
      ref={axis === "x" ? refs.scrollbarX : refs.scrollbarY}
      style={axis === "x" ? { width: "100%" } : { height: "100%" }}
      className={`luckysheet-scrollbars luckysheet-scrollbar-ltr luckysheet-scrollbar-${axis}`}
      onScroll={() => {
        if (axis === "x") {
          setContext((draftCtx) => {
            draftCtx.scrollLeft = refs.scrollbarX.current!.scrollLeft;
          });
        } else {
          setContext((draftCtx) => {
            draftCtx.scrollTop = refs.scrollbarY.current!.scrollTop;
          });
        }
      }}
    >
      <div
        style={
          axis === "x"
            ? { width: context.ch_width, height: 10 }
            : { width: 10, height: context.rh_height }
        }
      />
    </div>
  );
};

export default ScrollBar;
